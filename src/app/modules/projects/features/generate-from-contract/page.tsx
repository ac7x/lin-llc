/**
 * 從合約生成專案頁面
 * 
 * 提供從現有合約和模板生成新專案的功能
 */

'use client';

import { nanoid } from 'nanoid';
import { useState, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRouter } from 'next/navigation';

import { PageContainer, PageHeader } from '@/app/modules/projects/components/common';
import { projectStyles } from '@/app/modules/projects/styles';
import { ProjectService, TemplateService } from '@/app/modules/projects/services';
import { useAuth } from '@/hooks/useAuth';
import { db, collection, Timestamp } from '@/lib/firebase-client';
import type { Project, Template, WorkPackage } from '@/app/modules/projects/types';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

// 定義合約列型別
interface ContractRow {
  idx: number;
  id: string;
  name: string;
  contractNumber: string;
  clientName: string;
  contractValue: number;
  startDate: Date | null;
  endDate: Date | null;
  description: string;
  createdAt: Date | null;
  raw: Record<string, unknown>;
}

// 定義合約項目型別
interface ContractItem {
  contractItemId: string;
  contractItemName: string;
  contractItemPrice: number;
  contractItemQuantity: number;
  contractItemUnit: string;
}

export default function GenerateFromContractPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // 取得所有已建立專案的 contractId 清單，避免重複建立
  const [projectsSnapshot] = useCollection(collection(db, 'projects'));
  
  // 取得模板資料
  const [templatesSnapshot] = useCollection(collection(db, 'templates'));
  
  const [importingId, setImportingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // 取得已建立專案的 contractId Set
  const existingContractIds = useMemo(() => {
    if (!projectsSnapshot) return new Set<string>();
    return new Set(
      projectsSnapshot.docs.map(doc => doc.data()?.contractId).filter((id): id is string => !!id)
    );
  }, [projectsSnapshot]);

  // 取得合約資料
  const [contractsSnapshot] = useCollection(collection(db, 'finance', 'default', 'contracts'));

  // 僅顯示尚未建立專案的合約
  const contractRows: ContractRow[] = useMemo(() => {
    if (!contractsSnapshot) return [];
    return contractsSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        const contractId = (data.contractId as string) || doc.id;
        return !existingContractIds.has(contractId);
      })
      .map((doc, idx) => {
        const data = doc.data();
        return {
          idx: idx + 1,
          id: (data.contractId as string) || doc.id,
          name: (data.contractName as string) || (data.contractId as string) || doc.id,
          contractNumber: (data.contractNumber as string) || '',
          clientName: (data.clientName as string) || '',
          contractValue: (data.contractValue as number) || 0,
          startDate: data.startDate?.toDate ? data.startDate.toDate() : 
                   data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate?.toDate ? data.endDate.toDate() : 
                 data.endDate ? new Date(data.endDate) : null,
          description: (data.description as string) || '',
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt
              ? new Date(data.createdAt)
              : null,
          raw: data,
        };
      });
  }, [contractsSnapshot, existingContractIds]);

  // 取得模板資料
  const templates: Template[] = useMemo(() => {
    if (!templatesSnapshot) return [];
    return templatesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Template[];
  }, [templatesSnapshot]);

  // 將合約項目轉換為工作包
  const convertContractItemsToWorkPackages = (contractItems: ContractItem[]): WorkPackage[] => {
    if (!contractItems || !Array.isArray(contractItems) || contractItems.length === 0) {
      return [];
    }

    // 將合約項目轉換為工作包
    return contractItems.map(item => {
      const id = nanoid(8); // 使用 nanoid 生成唯一 ID

      const workPackage: WorkPackage = {
        id,
        name: String(item.contractItemId),
        description: `合約項目 ${item.contractItemId}`,
        status: 'planned',
        progress: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        budget: item.contractItemPrice,
        quantity: item.contractItemQuantity,
        category: '合約項目',
        priority: 'medium',
        subPackages: [],
      };

      return workPackage;
    });
  };

  // 從模板創建工作包
  const createWorkPackagesFromTemplate = async (template: Template, projectId: string): Promise<void> => {
    if (!template.subWorkPackages || template.subWorkPackages.length === 0) {
      return;
    }

    // 這裡可以實作從模板創建工作包的邏輯
    // 暫時留空，因為需要實作 WorkPackageService
    console.log('從模板創建工作包:', template.name, projectId);
  };

  // 匯入合約建立專案
  const handleImport = async (row: ContractRow) => {
    if (!user) {
      setMessage('請先登入');
      return;
    }

    setImportingId(row.id);
    setMessage('');
    
    await safeAsync(async () => {
      // 取得合約項目並轉換為工作包
      const contractItems = (row.raw.contractItems as ContractItem[]) || [];
      const workPackages = convertContractItemsToWorkPackages(contractItems);

      // 計算專案時程
      const startDate = row.startDate || new Date();
      const endDate = row.endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 預設30天
      const estimatedDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // 創建專案資料
      const projectData: Omit<Project, 'createdAt' | 'updatedAt'> = {
        id: `temp-${Date.now()}`, // 臨時 ID，會在 Firestore 中被替換
        projectName: row.name,
        name: row.name,
        serialNumber: `PRJ-${Date.now()}`,
        contractId: row.id,
        status: 'planning',
        progress: 0,
        manager: '',
        inspector: '',
        safety: '',
        supervisor: '',
        safetyOfficer: '',
        costController: '',
        area: '',
        address: '',
        region: '',
        startDate: startDate,
        estimatedEndDate: endDate,
        estimatedBudget: row.contractValue,
        estimatedDuration: estimatedDuration,
        workPackages: workPackages,
        projectType: 'system',
        priority: 'medium',
        riskLevel: 'medium',
        phase: 'initiation',
        healthLevel: 'good',
        owner: user.uid,
        managers: [],
        supervisors: [],
        safetyOfficers: [],
        issues: [],
        logs: [],
        type: ['system'],
        quality: 'good',
        risk: 'medium',
        estimated: { start: startDate, end: endDate, elapsedDays: 0, remainingDays: estimatedDuration },
        planned: { start: startDate, end: endDate, elapsedDays: 0, remainingDays: estimatedDuration },
        actual: { start: null, end: null, elapsedDays: 0, remainingDays: 0 },
        required: { start: startDate, end: endDate, elapsedDays: 0, remainingDays: estimatedDuration },
      };

      // 創建專案
      const projectId = await ProjectService.createProject(projectData);

      // 如果選擇了模板，從模板創建工作包
      if (selectedTemplate) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          await createWorkPackagesFromTemplate(template, projectId);
        }
      }

      setMessage(`已成功由合約建立專案，合約ID: ${row.id}`);
      
      // 導航到新創建的專案
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1500);
    }, (error) => {
      setMessage(`建立失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'import_project', contractId: row.id });
    });
    
    setImportingId(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title='從合約生成專案'
        subtitle='選擇現有合約和模板，自動生成專案結構'
      />

      {message && (
        <div className='mb-6 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 p-4 rounded-lg relative'>
          {message}
          <button
            className='absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200'
            onClick={() => setMessage('')}
            aria-label='關閉'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      )}

      {/* 模板選擇 */}
      {templates.length > 0 && (
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            選擇模板（可選）
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {templates.map(template => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedTemplate(selectedTemplate === template.id ? '' : template.id)}
              >
                <div className='flex justify-between items-start mb-2'>
                  <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                    {template.name}
                  </h4>
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'>
                    {template.category}
                  </span>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                  {template.description}
                </p>
                <div className='text-xs text-gray-500 dark:text-gray-400'>
                  子工作包: {template.subWorkPackages?.length || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 合約列表 */}
      <div className={projectStyles.card.base}>
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
          可用的合約
        </h3>
        
        <div className='overflow-x-auto'>
          <table className={projectStyles.table.table}>
            <thead className={projectStyles.table.thead}>
              <tr>
                <th className={projectStyles.table.th}>序號</th>
                <th className={projectStyles.table.th}>合約名稱</th>
                <th className={projectStyles.table.th}>合約編號</th>
                <th className={projectStyles.table.th}>客戶</th>
                <th className={projectStyles.table.th}>合約金額</th>
                <th className={projectStyles.table.th}>期間</th>
                <th className={projectStyles.table.th}>建立日期</th>
                <th className={projectStyles.table.th}>操作</th>
              </tr>
            </thead>
            <tbody className={projectStyles.table.tbody}>
              {contractRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className='px-6 py-8 text-center text-gray-500 dark:text-gray-400'
                  >
                    <div className='flex flex-col items-center justify-center'>
                      <svg
                        className='w-12 h-12 text-gray-400 dark:text-gray-500 mb-4'
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
                      尚無可用的合約
                    </div>
                  </td>
                </tr>
              ) : (
                contractRows.map(row => (
                  <tr
                    key={row.id}
                    className={projectStyles.table.rowHover}
                  >
                    <td className={projectStyles.table.td}>{row.idx}</td>
                    <td className={projectStyles.table.td}>
                      <div>
                        <div className='font-medium text-gray-900 dark:text-gray-100'>
                          {row.name}
                        </div>
                        {row.description && (
                          <div className='text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                            {row.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={projectStyles.table.td}>
                      {row.contractNumber || '-'}
                    </td>
                    <td className={projectStyles.table.td}>
                      {row.clientName || '-'}
                    </td>
                    <td className={projectStyles.table.td}>
                      <span className='font-medium text-gray-900 dark:text-gray-100'>
                        NT$ {row.contractValue.toLocaleString()}
                      </span>
                    </td>
                    <td className={projectStyles.table.td}>
                      <div className='text-sm'>
                        {row.startDate ? row.startDate.toLocaleDateString() : '-'}
                        <br />
                        {row.endDate ? row.endDate.toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className={projectStyles.table.td}>
                      {row.createdAt ? row.createdAt.toLocaleDateString() : '-'}
                    </td>
                    <td className={projectStyles.table.td}>
                      <button
                        className={projectStyles.button.primary}
                        disabled={!!importingId}
                        onClick={() => handleImport(row)}
                      >
                        {importingId === row.id ? (
                          <span className='flex items-center'>
                            <svg
                              className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                              fill='none'
                              viewBox='0 0 24 24'
                            >
                              <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                              ></circle>
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              ></path>
                            </svg>
                            建立中...
                          </span>
                        ) : (
                          <span className='flex items-center'>
                            <svg
                              className='w-5 h-5 mr-2'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 4v16m8-8H4'
                              />
                            </svg>
                            建立專案
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
