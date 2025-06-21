/**
 * 工作包詳細頁面
 *
 * 顯示單一工作包的詳細資訊，提供以下功能：
 * - 工作包資訊管理
 * - 子工作包管理
 * - 範本應用
 * - 進度追蹤
 * - 任務管理
 */

'use client';

import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';

import { useAuth } from '@/hooks/useAuth';
import { db, doc, updateDoc } from '@/lib/firebase-client';
import type { AppUser } from '@/types/auth';
import { Project , SubWorkpackage, Workpackage ,
  Template,
  SubWorkpackageTemplateItem,
  TemplateToSubWorkpackageOptions,
} from '@/types/project';
import { formatLocalDate, formatDateForInput } from '@/utils/dateUtils';
import { logError, safeAsync, retry } from '@/utils/errorUtils';

// Template helper functions
/**
 * 將範本項目轉換為子工作包
 * @param templateItem 範本項目
 * @param options 轉換選項
 * @returns 子工作包實例
 */
function templateItemToSubWorkpackage(
  templateItem: SubWorkpackageTemplateItem,
  options?: TemplateToSubWorkpackageOptions
): SubWorkpackage {
  const now = Timestamp.now();
  const { estimatedStartDate, estimatedEndDate, assignedTo } = options || {};

  // 建立子工作包物件，日期欄位可為 undefined
  return {
    id: nanoid(8),
    name: templateItem.name,
    description: templateItem.description || '',
    estimatedQuantity: templateItem.estimatedQuantity,
    actualQuantity: 0,
    unit: templateItem.unit,
    progress: 0,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    // 日期欄位為選填，可為 undefined
    estimatedStartDate: estimatedStartDate || undefined,
    estimatedEndDate: estimatedEndDate || undefined,
    assignedTo: assignedTo || null, // 新增負責人欄位
    priority: 0,
  };
}

/**
 * 將整個範本轉換為一系列子工作包
 * @param template 範本
 * @param options 轉換選項
 * @returns 子工作包陣列
 */
function templateToSubWorkpackages(
  template: Template,
  options?: TemplateToSubWorkpackageOptions
): SubWorkpackage[] {
  return template.subWorkpackages.map(item => templateItemToSubWorkpackage(item, options));
}

/**
 * 從 LocalStorage 取得使用者選擇的範本
 * @returns 範本或 null
 */
const getSelectedTemplateFromStorage = (): Template | null => {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('selectedTemplate');
  if (!stored) return null;

  try {
    return JSON.parse(stored) as Template;
  } catch (_e) {
    return null;
  }
};

/**
 * 清除 LocalStorage 中的範本選擇
 */
const clearSelectedTemplate = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('selectedTemplate');
};

export default function WorkpackageDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = params?.project as string;
  const workpackageId = params?.workpackage as string;
  const [projectDoc, loading, error] = useDocument(doc(db, 'projects', projectId));
  const [usersSnapshot] = useCollection(collection(db, 'members'));
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSubWP, setIsAddingSubWP] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSubWorkpackage, setNewSubWorkpackage] = useState({
    name: '',
    description: '',
    estimatedQuantity: 0,
    unit: '項',
    budget: 0,
    estimatedStartDate: '', // string
    estimatedEndDate: '', // string
    assignedTo: '', // 新增負責人欄位
  });
  const [subSaving, setSubSaving] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateQuantities, setTemplateQuantities] = useState<{ [id: string]: number }>({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubWorkpackage, setSelectedSubWorkpackage] = useState<SubWorkpackage | null>(null);
  const [assigningUser, setAssigningUser] = useState('');

  // 新增：檢查預算權限的函數
  const canViewBudget = (project: Project, currentUser: AppUser | null): boolean => {
    if (!currentUser?.uid) return false;

    // 檢查是否為專案的 manager 或 costController
    return project.manager === currentUser.uid || project.costController === currentUser.uid;
  };

  // 新增：檢查是否為子工作包負責人的函數
  const canManageSubWorkpackage = (subWp: SubWorkpackage, currentUser: AppUser | null): boolean => {
    if (!currentUser?.uid) return false;
    return subWp.assignedTo === currentUser.uid;
  };

  // 新增：計算耗時的函數
  const calculateDuration = (startDate: Timestamp, endDate: Timestamp): string => {
    const start = startDate.toDate();
    const end = endDate.toDate();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '1天';
    } else if (diffDays < 30) {
      return `${diffDays}天`;
    } else {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      if (remainingDays === 0) {
        return `${months}個月`;
      } else {
        return `${months}個月${remainingDays}天`;
      }
    }
  };

  // 新增：取得用戶清單
  const users =
    (usersSnapshot?.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id,
    })) as AppUser[]) || [];

  useEffect(() => {
    const selected = getSelectedTemplateFromStorage();
    if (selected) {
      setSelectedTemplate(selected);
      setShowTemplateModal(true);
      clearSelectedTemplate();
    }
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      await safeAsync(async () => {
        const templatesRef = collection(db, 'templates');
        const templatesSnapshot = await getDocs(templatesRef);
        const templatesData = templatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Template[];
        setTemplates(templatesData);
      }, (error) => {
        logError(error, { operation: 'load_templates' });
      });
      setLoadingTemplates(false);
    };
    if (showTemplateModal && templates.length === 0) loadTemplates();
  }, [showTemplateModal, templates.length]);

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤: {error.message}</div>;
  if (!projectDoc?.exists()) return <div>找不到專案</div>;

  const project = projectDoc.data() as Project;
  const workpackage = project.workpackages?.find(wp => wp.id === workpackageId);
  if (!workpackage) return <div>找不到此工作包</div>;

  // 檢查預算權限
  const hasBudgetPermission = canViewBudget(project, user);

  let calculatedProgress = workpackage.progress ?? 0;
  if (
    (!workpackage.progress || workpackage.progress === 0) &&
    workpackage.subWorkpackages &&
    workpackage.subWorkpackages.length > 0
  ) {
    let done = 0,
      total = 0;
    for (const sw of workpackage.subWorkpackages) {
      if (typeof sw.estimatedQuantity === 'number' && sw.estimatedQuantity > 0) {
        total += sw.estimatedQuantity;
        if (typeof sw.actualQuantity === 'number') {
          done += Math.min(sw.actualQuantity, sw.estimatedQuantity);
        }
      }
    }
    calculatedProgress = total > 0 ? Math.round((done / total) * 100) : 0;
  }

  const handleSave = async (updates: Partial<Workpackage>) => {
    setSaving(true);
    await safeAsync(async () => {
      // 過濾掉 undefined 值
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      );

      const updatedWorkpackages = project.workpackages.map(wp =>
        wp.id === workpackageId
          ? {
              ...wp,
              ...filteredUpdates,
            }
          : wp
      );
      await retry(() => updateDoc(doc(db, 'projects', projectId), { workpackages: updatedWorkpackages }), 3, 1000);
      router.refresh();
    }, (error) => {
      logError(error, { operation: 'save_workpackage', workpackageId, projectId });
    });
    setSaving(false);
  };

  const handleAddSubWorkpackage = async () => {
    if (!newSubWorkpackage.name.trim() || subSaving) return;
    setSubSaving(true);
    await safeAsync(async () => {
      // 先建立物件，後續用展開運算子動態加入日期欄位
      const dateFields: Partial<Pick<SubWorkpackage, 'estimatedStartDate' | 'estimatedEndDate'>> =
        {};
      if (newSubWorkpackage.estimatedStartDate) {
        dateFields.estimatedStartDate = Timestamp.fromDate(
          new Date(newSubWorkpackage.estimatedStartDate)
        );
      }
      if (newSubWorkpackage.estimatedEndDate) {
        dateFields.estimatedEndDate = Timestamp.fromDate(
          new Date(newSubWorkpackage.estimatedEndDate)
        );
      }
      const newSubWp: SubWorkpackage = {
        id: Date.now().toString(),
        name: newSubWorkpackage.name.trim(),
        description: newSubWorkpackage.description,
        estimatedQuantity: newSubWorkpackage.estimatedQuantity,
        unit: newSubWorkpackage.unit,
        budget: newSubWorkpackage.budget,
        status: '新建立',
        progress: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        assignedTo: newSubWorkpackage.assignedTo || null, // 新增負責人
        ...dateFields,
      };
      const updatedWorkpackages = project.workpackages.map(wp =>
        wp.id === workpackageId
          ? { ...wp, subWorkpackages: [...(wp.subWorkpackages || []), newSubWp] }
          : wp
      );
      await retry(() => updateDoc(doc(db, 'projects', projectId), { workpackages: updatedWorkpackages }), 3, 1000);
      setNewSubWorkpackage({
        name: '',
        description: '',
        estimatedQuantity: 0,
        unit: '項',
        budget: 0,
        estimatedStartDate: '',
        estimatedEndDate: '',
        assignedTo: '', // 重置負責人欄位
      });
    }, (error) => {
      logError(error, { operation: 'add_sub_workpackage', workpackageId, projectId });
    });
    setSubSaving(false);
  };

  const handleAddFromTemplate = async (template: Template) => {
    setSubSaving(true);
    await safeAsync(async () => {
      // 只有在工作包已有預計日期時才傳遞預設日期
      const templateOptions: TemplateToSubWorkpackageOptions = {
        workpackageId,
        // 確保只有在有日期的情況下傳遞日期參數，否則為 undefined
        estimatedStartDate: workpackage.estimatedStartDate || undefined,
        estimatedEndDate: workpackage.estimatedEndDate || undefined,
        assignedTo: workpackage.assignedTo || null, // 傳遞工作包的負責人作為預設值
      };

      const subWorkpackages = templateToSubWorkpackages(template, templateOptions).map(subWp => ({
        ...subWp,
        estimatedQuantity: templateQuantities[subWp.id] ?? 0,
      }));

      const updatedWorkpackages = project.workpackages.map(wp =>
        wp.id === workpackageId
          ? { ...wp, subWorkpackages: [...(wp.subWorkpackages || []), ...subWorkpackages] }
          : wp
      );
      await retry(() => updateDoc(doc(db, 'projects', projectId), { workpackages: updatedWorkpackages }), 3, 1000);
      setShowTemplateModal(false);
      setSelectedTemplate(null);
      setTemplateQuantities({});
    }, (error) => {
      logError(error, { operation: 'add_from_template', workpackageId, projectId, templateId: template.id });
    });
    setSubSaving(false);
  };

  // 新增：指派子工作包負責人的函數
  const handleAssignSubWorkpackage = async (subWpId: string, assignedTo: string) => {
    setSubSaving(true);
    await safeAsync(async () => {
      const updatedSubWps = workpackage.subWorkpackages.map(wp =>
        wp.id === subWpId ? { ...wp, assignedTo: assignedTo || null } : wp
      );
      const updatedWorkpackages = project.workpackages.map(wp =>
        wp.id === workpackageId ? { ...wp, subWorkpackages: updatedSubWps } : wp
      );
      await retry(() => updateDoc(doc(db, 'projects', projectId), { workpackages: updatedWorkpackages }), 3, 1000);
      setShowAssignModal(false);
      setSelectedSubWorkpackage(null);
      setAssigningUser('');
    }, (error) => {
      logError(error, { operation: 'assign_sub_workpackage', subWpId, workpackageId, projectId });
    });
    setSubSaving(false);
  };

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex justify-between items-start mb-6'>
          <div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
              {workpackage.name}
            </h1>
            <div className='text-gray-500 dark:text-gray-400 mt-1'>工作包 ID: {workpackage.id}</div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
          >
            <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            編輯
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                描述
              </label>
              <div className='text-gray-900 dark:text-gray-100'>
                {workpackage.description || '-'}
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                類別
              </label>
              <div className='text-gray-900 dark:text-gray-100'>{workpackage.category || '-'}</div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                優先級
              </label>
              <div className='text-gray-900 dark:text-gray-100'>
                {workpackage.priority === 'high' && '高'}
                {workpackage.priority === 'medium' && '中'}
                {workpackage.priority === 'low' && '低'}
                {!workpackage.priority && '-'}
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                負責人
              </label>
              <div className='text-gray-900 dark:text-gray-100'>
                {workpackage.assignedTo
                  ? users.find(u => u.uid === workpackage.assignedTo)?.displayName ||
                    workpackage.assignedTo
                  : '-'}
              </div>
            </div>
          </div>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                預計開始日期
              </label>
              <div className='text-gray-900 dark:text-gray-100'>
                {workpackage.estimatedStartDate
                  ? formatLocalDate(workpackage.estimatedStartDate)
                  : '-'}
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                預計結束日期
              </label>
              <div className='text-gray-900 dark:text-gray-100'>
                {workpackage.estimatedEndDate ? formatLocalDate(workpackage.estimatedEndDate) : '-'}
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                進度
              </label>
              <div className='flex items-center'>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2'>
                  <div
                    className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
                    style={{ width: `${calculatedProgress}%` }}
                  ></div>
                </div>
                <span className='text-gray-900 dark:text-gray-100'>{calculatedProgress}%</span>
              </div>
            </div>
            {hasBudgetPermission && (
              <div>
                <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                  預算
                </label>
                <div className='text-gray-900 dark:text-gray-100'>
                  {workpackage.budget ? `$${workpackage.budget.toLocaleString()}` : '-'}
                </div>
              </div>
            )}
            <div>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                子工作包數量
              </label>
              <div className='text-gray-900 dark:text-gray-100'>
                {workpackage.subWorkpackages?.length || 0}個
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                建立日期
              </label>
              <div className='text-gray-900 dark:text-gray-100'>
                {workpackage.createdAt ? formatLocalDate(workpackage.createdAt) : '-'}
              </div>
            </div>
          </div>
        </div>

        <div className='mt-8'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
              子工作包列表
            </h2>
            <div className='flex gap-3'>
              <button
                onClick={() => setShowTemplateModal(true)}
                className='inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200'
              >
                <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                使用範本
              </button>
              <button
                onClick={() => setIsAddingSubWP(true)}
                className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
              >
                <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                新增子工作包
              </button>
            </div>
          </div>

          {workpackage.subWorkpackages && workpackage.subWorkpackages.length > 0 ? (
            <div className='space-y-4'>
              {workpackage.subWorkpackages.map(subWp => {
                const canManage = canManageSubWorkpackage(subWp, user);
                const duration =
                  subWp.actualStartDate && subWp.actualEndDate
                    ? calculateDuration(subWp.actualStartDate, subWp.actualEndDate)
                    : null;

                return (
                  <div
                    key={subWp.id}
                    className='bg-white dark:bg-gray-700 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200'
                  >
                    <div className='flex justify-between items-start'>
                      <div>
                        <div className='font-medium text-gray-900 dark:text-gray-100'>
                          {subWp.name}
                        </div>
                        {subWp.description && (
                          <div className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                            {subWp.description}
                          </div>
                        )}
                        {subWp.assignedTo && (
                          <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                            負責人:{' '}
                            {users.find(u => u.uid === subWp.assignedTo)?.displayName ||
                              subWp.assignedTo}
                          </div>
                        )}
                      </div>
                      <div className='flex gap-2'>
                        <button
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            subWp.actualStartDate
                              ? 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed'
                              : !canManage
                                ? 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                          disabled={!!subWp.actualStartDate || !canManage}
                          onClick={async () => {
                            if (subWp.actualStartDate || !canManage) return;
                            const updatedSubWps = workpackage.subWorkpackages.map(wp =>
                              wp.id === subWp.id ? { ...wp, actualStartDate: Timestamp.now() } : wp
                            );
                            const updatedWorkpackages = project.workpackages.map(wp =>
                              wp.id === workpackageId
                                ? { ...wp, subWorkpackages: updatedSubWps }
                                : wp
                            );
                            await updateDoc(doc(db, 'projects', projectId), {
                              workpackages: updatedWorkpackages,
                            });
                          }}
                          title={!canManage ? '只有負責人才能開工' : ''}
                        >
                          {subWp.actualStartDate ? (
                            <>
                              <svg
                                className='w-4 h-4 mr-1'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M5 13l4 4L19 7'
                                />
                              </svg>
                              已開工 ({subWp.actualStartDate.toDate().toLocaleDateString()})
                            </>
                          ) : (
                            <>
                              <svg
                                className='w-4 h-4 mr-1'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
                                />
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                              </svg>
                              開工
                            </>
                          )}
                        </button>
                        <button
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            subWp.actualEndDate || !subWp.actualStartDate
                              ? 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed'
                              : !canManage
                                ? 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          disabled={!!subWp.actualEndDate || !subWp.actualStartDate || !canManage}
                          onClick={async () => {
                            if (subWp.actualEndDate || !subWp.actualStartDate || !canManage) return;
                            const updatedSubWps = workpackage.subWorkpackages.map(wp =>
                              wp.id === subWp.id ? { ...wp, actualEndDate: Timestamp.now() } : wp
                            );
                            const updatedWorkpackages = project.workpackages.map(wp =>
                              wp.id === workpackageId
                                ? { ...wp, subWorkpackages: updatedSubWps }
                                : wp
                            );
                            await updateDoc(doc(db, 'projects', projectId), {
                              workpackages: updatedWorkpackages,
                            });
                          }}
                          title={
                            !canManage
                              ? '只有負責人才能完工'
                              : !subWp.actualStartDate
                                ? '需要先開工'
                                : ''
                          }
                        >
                          {subWp.actualEndDate ? (
                            <>
                              <svg
                                className='w-4 h-4 mr-1'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M5 13l4 4L19 7'
                                />
                              </svg>
                              已完工 ({subWp.actualEndDate.toDate().toLocaleDateString()})
                            </>
                          ) : (
                            <>
                              <svg
                                className='w-4 h-4 mr-1'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M5 13l4 4L19 7'
                                />
                              </svg>
                              完工
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubWorkpackage(subWp);
                            setAssigningUser(subWp.assignedTo || '');
                            setShowAssignModal(true);
                          }}
                          className='inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200'
                          title='指派負責人'
                        >
                          <svg
                            className='w-4 h-4 mr-1'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                            />
                          </svg>
                          指派
                        </button>
                      </div>
                    </div>
                    <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                      <div>
                        <span className='text-gray-500 dark:text-gray-400'>狀態：</span>
                        <span className='text-gray-900 dark:text-gray-100'>
                          {subWp.status || '新建立'}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500 dark:text-gray-400'>進度：</span>
                        <span className='text-gray-900 dark:text-gray-100'>
                          {subWp.progress ?? 0}%
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500 dark:text-gray-400'>數量：</span>
                        <span className='text-gray-900 dark:text-gray-100'>
                          {subWp.estimatedQuantity ?? '-'} {subWp.unit ?? ''}
                        </span>
                      </div>
                      {hasBudgetPermission && (
                        <div>
                          <span className='text-gray-500 dark:text-gray-400'>預算：</span>
                          <span className='text-gray-900 dark:text-gray-100'>
                            {subWp.budget ?? '-'}
                          </span>
                        </div>
                      )}
                    </div>
                    {duration && (
                      <div className='mt-2 text-sm'>
                        <span className='text-gray-500 dark:text-gray-400'>耗時：</span>
                        <span className='text-green-600 dark:text-green-400 font-medium'>
                          {duration}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg'>
              <svg
                className='w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              <p className='text-gray-500 dark:text-gray-400'>目前沒有子工作包</p>
            </div>
          )}
        </div>

        {isAddingSubWP && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md'>
              <h2 className='text-xl font-bold mb-4 text-gray-900 dark:text-gray-100'>
                新增子工作包
              </h2>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  await handleAddSubWorkpackage();
                  setIsAddingSubWP(false);
                }}
                className='space-y-4'
              >
                <div>
                  <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                    名稱
                  </label>
                  <input
                    type='text'
                    className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    value={newSubWorkpackage.name}
                    onChange={e =>
                      setNewSubWorkpackage(prev => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                    描述
                  </label>
                  <textarea
                    className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    value={newSubWorkpackage.description}
                    onChange={e =>
                      setNewSubWorkpackage(prev => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      預計開始日期 (選填)
                    </label>
                    <input
                      type='date'
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                      value={newSubWorkpackage.estimatedStartDate}
                      onChange={e =>
                        setNewSubWorkpackage(prev => ({
                          ...prev,
                          estimatedStartDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      預計結束日期 (選填)
                    </label>
                    <input
                      type='date'
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                      value={newSubWorkpackage.estimatedEndDate}
                      onChange={e =>
                        setNewSubWorkpackage(prev => ({
                          ...prev,
                          estimatedEndDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      預計數量
                    </label>
                    <input
                      type='number'
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                      value={newSubWorkpackage.estimatedQuantity}
                      min={0}
                      onChange={e =>
                        setNewSubWorkpackage(prev => ({
                          ...prev,
                          estimatedQuantity: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      單位
                    </label>
                    <input
                      type='text'
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                      value={newSubWorkpackage.unit}
                      onChange={e =>
                        setNewSubWorkpackage(prev => ({ ...prev, unit: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      負責人 (選填)
                    </label>
                    <select
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                      value={newSubWorkpackage.assignedTo}
                      onChange={e =>
                        setNewSubWorkpackage(prev => ({ ...prev, assignedTo: e.target.value }))
                      }
                    >
                      <option value=''>請選擇負責人</option>
                      {users.map(userItem => (
                        <option key={userItem.uid} value={userItem.uid}>
                          {userItem.displayName || userItem.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  {hasBudgetPermission && (
                    <div>
                      <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                        預算
                      </label>
                      <input
                        type='number'
                        className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                        value={newSubWorkpackage.budget}
                        min={0}
                        onChange={e =>
                          setNewSubWorkpackage(prev => ({
                            ...prev,
                            budget: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
                <div className='flex justify-end space-x-2'>
                  <button
                    type='button'
                    onClick={() => setIsAddingSubWP(false)}
                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200'
                  >
                    取消
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200'
                    disabled={subSaving || !newSubWorkpackage.name.trim()}
                  >
                    {subSaving ? '建立中...' : '確認新增'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showTemplateModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100'>選擇範本</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className='text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                >
                  關閉
                </button>
              </div>
              {loadingTemplates ? (
                <div className='py-20 text-center text-gray-600 dark:text-gray-300'>
                  正在載入範本...
                </div>
              ) : templates.length > 0 ? (
                <div>
                  {selectedTemplate ? (
                    <div className='mb-6'>
                      <div className='bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4'>
                        <h3 className='font-bold text-lg mb-2 text-gray-900 dark:text-gray-100'>
                          {selectedTemplate.name}
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-300 mb-2'>
                          {selectedTemplate.description}
                        </p>
                        <div className='text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 mb-4'>
                          <p className='font-medium mb-1 text-gray-900 dark:text-gray-100'>
                            請輸入每個子工作包的數量：
                          </p>
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              handleAddFromTemplate(selectedTemplate);
                            }}
                          >
                            <ul className='list-disc pl-6 space-y-2'>
                              {selectedTemplate.subWorkpackages.map(item => (
                                <li key={item.id} className='flex items-center gap-2'>
                                  <span className='flex-1 text-gray-900 dark:text-gray-100'>
                                    {item.name}（單位：{item.unit}）
                                  </span>
                                  <input
                                    type='number'
                                    min={0}
                                    required
                                    className='border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                                    value={templateQuantities[item.id] ?? ''}
                                    onChange={e =>
                                      setTemplateQuantities(q => ({
                                        ...q,
                                        [item.id]: Number(e.target.value),
                                      }))
                                    }
                                  />
                                </li>
                              ))}
                            </ul>
                            <div className='flex justify-end gap-3 mt-4'>
                              <button
                                type='button'
                                onClick={() => setSelectedTemplate(null)}
                                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200'
                              >
                                返回選擇
                              </button>
                              <button
                                type='submit'
                                disabled={
                                  subSaving ||
                                  selectedTemplate.subWorkpackages.some(
                                    item =>
                                      !templateQuantities[item.id] &&
                                      templateQuantities[item.id] !== 0
                                  )
                                }
                                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors duration-200'
                              >
                                {subSaving ? '新增中...' : '確認使用此範本'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
                      {templates.map(template => (
                        <div
                          key={template.id}
                          className='border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition'
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <h3 className='font-bold mb-1 text-gray-900 dark:text-gray-100'>
                            {template.name}
                          </h3>
                          <span className='text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300'>
                            {template.category}
                          </span>
                          <p className='text-sm mt-2 text-gray-600 dark:text-gray-400'>
                            {template.description}
                          </p>
                          <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                            包含 {template.subWorkpackages.length} 個子工作包項目
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className='py-10 text-center'>
                  <p className='text-gray-500 dark:text-gray-400 mb-4'>尚未建立任何範本</p>
                  <button
                    onClick={() => {
                      setShowTemplateModal(false);
                      router.push('/templates');
                    }}
                    className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200'
                  >
                    前往建立範本
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {showAssignModal && selectedSubWorkpackage && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md'>
              <h2 className='text-xl font-bold mb-4 text-gray-900 dark:text-gray-100'>
                指派負責人
              </h2>
              <div className='mb-4'>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>子工作包：</p>
                <p className='font-medium text-gray-900 dark:text-gray-100'>
                  {selectedSubWorkpackage.name}
                </p>
              </div>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  await handleAssignSubWorkpackage(selectedSubWorkpackage.id, assigningUser);
                }}
                className='space-y-4'
              >
                <div>
                  <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                    選擇負責人
                  </label>
                  <select
                    className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    value={assigningUser}
                    onChange={e => setAssigningUser(e.target.value)}
                  >
                    <option value=''>請選擇負責人</option>
                    {users.map(userItem => (
                      <option key={userItem.uid} value={userItem.uid}>
                        {userItem.displayName || userItem.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='flex justify-end space-x-2 pt-4'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedSubWorkpackage(null);
                      setAssigningUser('');
                    }}
                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200'
                  >
                    取消
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-purple-500 text-white rounded shadow hover:bg-purple-600 transition-colors duration-200'
                    disabled={subSaving}
                  >
                    {subSaving ? '指派中...' : '確認指派'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isEditing && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl'>
              <h2 className='text-xl font-bold mb-4 text-gray-900 dark:text-gray-100'>
                編輯工作包資訊
              </h2>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  // 這裡將 input string 轉为 Timestamp
                  const estimatedStartDateStr = formData.get('estimatedStartDate') as string;
                  const estimatedEndDateStr = formData.get('estimatedEndDate') as string;
                  await handleSave({
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    estimatedStartDate: estimatedStartDateStr
                      ? Timestamp.fromDate(new Date(estimatedStartDateStr))
                      : undefined,
                    estimatedEndDate: estimatedEndDateStr
                      ? Timestamp.fromDate(new Date(estimatedEndDateStr))
                      : undefined,
                    status: formData.get('status') as string,
                    assignedTo: formData.get('assignedTo') as string,
                    budget: Number(formData.get('budget')),
                    category: formData.get('category') as string,
                    priority: formData.get('priority') as 'low' | 'medium' | 'high',
                  });
                  setIsEditing(false);
                }}
                className='space-y-4'
              >
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      工作包名稱
                    </label>
                    <input
                      name='name'
                      defaultValue={workpackage.name}
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      類別
                    </label>
                    <input
                      name='category'
                      defaultValue={workpackage.category}
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      狀態
                    </label>
                    <select
                      name='status'
                      defaultValue={workpackage.status}
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    >
                      <option value='未開始'>未開始</option>
                      <option value='待開始'>待開始</option>
                      <option value='進行中'>進行中</option>
                      <option value='已完成'>已完成</option>
                      <option value='已暫停'>已暫停</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      優先級
                    </label>
                    <select
                      name='priority'
                      defaultValue={workpackage.priority || 'medium'}
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    >
                      <option value='low'>低</option>
                      <option value='medium'>中</option>
                      <option value='high'>高</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      負責人
                    </label>
                    <select
                      name='assignedTo'
                      defaultValue={workpackage.assignedTo || ''}
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    >
                      <option value=''>請選擇負責人</option>
                      {users.map(userItem => (
                        <option key={userItem.uid} value={userItem.uid}>
                          {userItem.displayName || userItem.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  {hasBudgetPermission && (
                    <div>
                      <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                        預算
                      </label>
                      <input
                        type='number'
                        name='budget'
                        defaultValue={workpackage.budget}
                        className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                      />
                    </div>
                  )}
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      預計開始日期
                    </label>
                    <input
                      type='date'
                      name='estimatedStartDate'
                      defaultValue={
                        workpackage.estimatedStartDate
                          ? formatDateForInput(workpackage.estimatedStartDate)
                          : ''
                      }
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                      預計結束日期
                    </label>
                    <input
                      type='date'
                      name='estimatedEndDate'
                      defaultValue={
                        workpackage.estimatedEndDate
                          ? formatDateForInput(workpackage.estimatedEndDate)
                          : ''
                      }
                      className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300'>
                    描述
                  </label>
                  <textarea
                    name='description'
                    defaultValue={workpackage.description}
                    rows={3}
                    className='border border-gray-300 dark:border-gray-600 rounded w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  />
                </div>
                <div className='flex justify-end space-x-2 pt-4'>
                  <button
                    type='button'
                    onClick={() => setIsEditing(false)}
                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200'
                  >
                    取消
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition-colors duration-200'
                    disabled={saving}
                  >
                    {saving ? '儲存中...' : '確認儲存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
