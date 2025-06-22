/**
 * 日誌表單組件
 * 
 * 提供新增和編輯日誌條目的功能，包括：
 * - 日誌標題和內容
 * - 分類和優先級
 * - 標籤管理
 * - 照片上傳
 * - 進度更新
 * - 天氣資訊
 * - 出工人數
 */

'use client';

import { useState, useEffect, type ReactElement } from 'react';
import Image from 'next/image';

import { projectStyles } from '@/app/modules/projects/styles';
import type { BaseWithId, WorkPackage, SubWorkPackage, PhotoType } from '@/app/modules/projects/types';
import { JournalService } from '@/app/modules/projects/services';

// 日誌條目介面
interface JournalEntry extends BaseWithId {
  title: string;
  content?: string;
  date: string | Date | { toDate: () => Date };
  author?: string;
  category?: string;
  priority?: number;
  tags?: string[];
  attachments?: Array<{
    name: string;
    url: string;
  }>;
  relatedWorkPackages?: Array<{
    name: string;
    status?: string;
  }>;
  followUpActions?: Array<{
    description: string;
    completed: boolean;
    assignedTo?: string;
  }>;
}

// 天氣資料介面
interface WeatherData {
  weather: string;
  temperature: number;
  rainfall: number;
}

interface JournalFormProps {
  projectId: string;
  projectData: any; // 專案資料
  weatherData?: WeatherData | null;
  journalEntry?: JournalEntry;
  onSubmit: (data: Partial<JournalEntry>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function JournalForm({
  projectId,
  projectData,
  weatherData,
  journalEntry,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: JournalFormProps): ReactElement {
  const [formData, setFormData] = useState({
    title: journalEntry?.title || '',
    content: journalEntry?.content || '',
    category: journalEntry?.category || 'general',
    priority: journalEntry?.priority || 5,
    tags: journalEntry?.tags || [],
    newTag: '',
    followUpActions: journalEntry?.followUpActions || [],
    newAction: '',
    newActionAssignee: '',
    // 新增欄位
    workforceCount: 0,
    weather: weatherData?.weather || '',
    temperature: weatherData?.temperature || 0,
    rainfall: weatherData?.rainfall || 0,
    issues: '',
  });

  // 照片上傳相關狀態
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([]);
  const [photoDescriptions, setPhotoDescriptions] = useState<string[]>([]);
  const [photoTypes, setPhotoTypes] = useState<PhotoType[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // 進度更新相關狀態
  const [progressInputs, setProgressInputs] = useState([
    { workPackageId: '', subWorkPackageId: '', actualQuantity: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const workPackages = projectData?.workPackages || [];

  useEffect(() => {
    if (journalEntry) {
      setFormData({
        title: journalEntry.title || '',
        content: journalEntry.content || '',
        category: journalEntry.category || 'general',
        priority: journalEntry.priority || 5,
        tags: journalEntry.tags || [],
        newTag: '',
        followUpActions: journalEntry.followUpActions || [],
        newAction: '',
        newActionAssignee: '',
        workforceCount: 0,
        weather: weatherData?.weather || '',
        temperature: weatherData?.temperature || 0,
        rainfall: weatherData?.rainfall || 0,
        issues: '',
      });
    }
  }, [journalEntry, weatherData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '日誌標題為必填項目';
    }

    if (formData.priority < 1 || formData.priority > 10) {
      newErrors.priority = '優先級必須在 1-10 之間';
    }

    if (formData.workforceCount < 0) {
      newErrors.workforceCount = '出工人數不能為負數';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUploading(true);

    try {
      // 準備照片檔案資料
      const photoFilesData = photoFiles
        .map((file, index) => {
          if (!file) return null;
          return {
            file,
            type: (photoTypes[index] || 'progress') as string,
            description: photoDescriptions[index] || '',
          };
        })
        .filter((item): item is { file: File; type: string; description: string } => item !== null);

      // 準備進度更新資料
      const progressUpdatesData = progressInputs
        .filter(input => input.workPackageId && input.subWorkPackageId && input.actualQuantity > 0)
        .map(input => ({
          workPackageId: input.workPackageId,
          subWorkPackageId: input.subWorkPackageId,
          actualQuantity: input.actualQuantity,
        }));

      // 建立日誌記錄
      const reportId = await JournalService.createDailyReport({
        projectId,
        date: new Date(),
        weather: formData.weather,
        temperature: formData.temperature,
        rainfall: formData.rainfall,
        workforceCount: formData.workforceCount,
        description: formData.content || formData.title,
        issues: formData.issues,
        photoFiles: photoFilesData,
        progressUpdates: progressUpdatesData,
        projectData,
      });

      // 提交成功後的回調
      const submitData: Partial<JournalEntry> = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        priority: formData.priority,
        tags: formData.tags,
        followUpActions: formData.followUpActions,
        date: new Date(),
        attachments: journalEntry?.attachments || [],
        relatedWorkPackages: journalEntry?.relatedWorkPackages || [],
      };

      onSubmit(submitData);
    } catch (error) {
      console.error('提交日誌失敗:', error);
      setErrors({ submit: '提交失敗，請重試' });
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // 照片上傳相關函數
  const handleAddPhotoField = () => {
    setPhotoFiles([...photoFiles, null]);
    setPhotoDescriptions([...photoDescriptions, '']);
    setPhotoTypes([...photoTypes, 'progress']);
  };

  const handlePhotoChange = (index: number, file: File) => {
    const newFiles = [...photoFiles];
    newFiles[index] = file;
    setPhotoFiles(newFiles);
  };

  const handleDescriptionChange = (index: number, description: string) => {
    const newDescriptions = [...photoDescriptions];
    newDescriptions[index] = description;
    setPhotoDescriptions(newDescriptions);
  };

  const handleTypeChange = (index: number, type: PhotoType) => {
    const newTypes = [...photoTypes];
    newTypes[index] = type;
    setPhotoTypes(newTypes);
  };

  const handleRemovePhotoField = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
    setPhotoDescriptions(photoDescriptions.filter((_, i) => i !== index));
    setPhotoTypes(photoTypes.filter((_, i) => i !== index));
  };

  // 進度更新相關函數
  const handleAddProgressField = () => {
    setProgressInputs([
      ...progressInputs,
      { workPackageId: '', subWorkPackageId: '', actualQuantity: 0 },
    ]);
  };

  const handleProgressChange = (index: number, field: string, value: string | number) => {
    const newInputs = [...progressInputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setProgressInputs(newInputs);
  };

  const handleRemoveProgressField = (index: number) => {
    setProgressInputs(progressInputs.filter((_, i) => i !== index));
  };

  // 標籤管理函數
  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, formData.newTag.trim()],
        newTag: '',
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  // 後續行動函數
  const addFollowUpAction = () => {
    if (formData.newAction.trim()) {
      setFormData(prev => ({
        ...prev,
        followUpActions: [
          ...prev.followUpActions,
          {
            description: formData.newAction.trim(),
            completed: false,
            assignedTo: formData.newActionAssignee.trim() || undefined,
          },
        ],
        newAction: '',
        newActionAssignee: '',
      }));
    }
  };

  const removeFollowUpAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      followUpActions: prev.followUpActions.filter((_, i) => i !== index),
    }));
  };

  const toggleFollowUpAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      followUpActions: prev.followUpActions.map((action, i) =>
        i === index ? { ...action, completed: !action.completed } : action
      ),
    }));
  };

  return (
    <div className={projectStyles.card.base}>
      <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>
        {journalEntry ? '編輯日誌' : '新增工作日誌'}
      </h2>

      <form onSubmit={handleSubmit} className={projectStyles.form.container}>
        {/* 基本資訊 */}
        <div className={projectStyles.form.group}>
          <div>
            <label className={projectStyles.form.label}>
              標題 <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`${projectStyles.form.input} ${errors.title ? 'border-red-500' : ''}`}
              placeholder='請輸入日誌標題'
            />
            {errors.title && (
              <p className='text-red-500 text-sm mt-1'>{errors.title}</p>
            )}
          </div>

          <div>
            <label className={projectStyles.form.label}>
              工作內容
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className={projectStyles.form.textarea}
              placeholder='請輸入今日工作內容'
              rows={4}
            />
          </div>
        </div>

        {/* 天氣和出工資訊 */}
        <div className={projectStyles.form.group}>
          <div>
            <label className={projectStyles.form.label}>
              出工人數
            </label>
            <input
              type='number'
              value={formData.workforceCount}
              onChange={(e) => handleInputChange('workforceCount', Number(e.target.value))}
              className={`${projectStyles.form.input} ${errors.workforceCount ? 'border-red-500' : ''}`}
              placeholder='0'
              min='0'
            />
            {errors.workforceCount && (
              <p className='text-red-500 text-sm mt-1'>{errors.workforceCount}</p>
            )}
          </div>

          <div>
            <label className={projectStyles.form.label}>
              天氣狀況
            </label>
            <input
              type='text'
              value={formData.weather}
              onChange={(e) => handleInputChange('weather', e.target.value)}
              className={projectStyles.form.input}
              placeholder='晴天、陰天、雨天等'
            />
          </div>

          <div>
            <label className={projectStyles.form.label}>
              溫度 (°C)
            </label>
            <input
              type='number'
              value={formData.temperature}
              onChange={(e) => handleInputChange('temperature', Number(e.target.value))}
              className={projectStyles.form.input}
              placeholder='25'
            />
          </div>

          <div>
            <label className={projectStyles.form.label}>
              降雨量 (mm)
            </label>
            <input
              type='number'
              value={formData.rainfall}
              onChange={(e) => handleInputChange('rainfall', Number(e.target.value))}
              className={projectStyles.form.input}
              placeholder='0'
              min='0'
            />
          </div>
        </div>

        {/* 問題記錄 */}
        <div className={projectStyles.form.group}>
          <div>
            <label className={projectStyles.form.label}>
              問題記錄
            </label>
            <textarea
              value={formData.issues}
              onChange={(e) => handleInputChange('issues', e.target.value)}
              className={projectStyles.form.textarea}
              placeholder='記錄今日遇到的問題或注意事項'
              rows={3}
            />
          </div>
        </div>

        {/* 進度更新 */}
        <div className={projectStyles.form.group}>
          <div className='flex justify-between items-center mb-4'>
            <label className={projectStyles.form.label}>
              進度更新
            </label>
            <button
              type='button'
              onClick={handleAddProgressField}
              className={projectStyles.button.outline}
            >
              新增進度
            </button>
          </div>
          
          {progressInputs.map((input, index) => (
            <div key={index} className='grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-3 bg-gray-50 dark:bg-gray-700 rounded'>
              <select
                value={input.workPackageId}
                onChange={(e) => handleProgressChange(index, 'workPackageId', e.target.value)}
                className={projectStyles.form.select}
              >
                <option value=''>選擇工作包</option>
                {workPackages.map((wp: WorkPackage) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.name}
                  </option>
                ))}
              </select>
              
              <select
                value={input.subWorkPackageId}
                onChange={(e) => handleProgressChange(index, 'subWorkPackageId', e.target.value)}
                className={projectStyles.form.select}
                disabled={!input.workPackageId}
              >
                <option value=''>選擇子工作包</option>
                {input.workPackageId && workPackages
                  .find((wp: WorkPackage) => wp.id === input.workPackageId)
                  ?.subPackages?.map((sw: SubWorkPackage) => (
                    <option key={sw.id} value={sw.id}>
                      {sw.name}
                    </option>
                  ))}
              </select>
              
              <input
                type='number'
                value={input.actualQuantity}
                onChange={(e) => handleProgressChange(index, 'actualQuantity', Number(e.target.value))}
                className={projectStyles.form.input}
                placeholder='完成數量'
                min='0'
              />
              
              <button
                type='button'
                onClick={() => handleRemoveProgressField(index)}
                className='text-red-500 hover:text-red-700'
              >
                刪除
              </button>
            </div>
          ))}
        </div>

        {/* 照片上傳 */}
        <div className={projectStyles.form.group}>
          <div className='flex justify-between items-center mb-4'>
            <label className={projectStyles.form.label}>
              照片記錄
            </label>
            <button
              type='button'
              onClick={handleAddPhotoField}
              className={projectStyles.button.outline}
            >
              新增照片
            </button>
          </div>
          
          {photoFiles.map((file, index) => (
            <div key={index} className='mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-2 mb-2'>
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      handlePhotoChange(index, selectedFile);
                    }
                  }}
                  className={projectStyles.form.input}
                />
                
                <select
                  value={photoTypes[index] || 'progress'}
                  onChange={(e) => handleTypeChange(index, e.target.value as PhotoType)}
                  className={projectStyles.form.select}
                >
                  <option value='progress'>進度照片</option>
                  <option value='issue'>問題照片</option>
                  <option value='material'>材料照片</option>
                  <option value='safety'>安全照片</option>
                  <option value='other'>其他</option>
                </select>
                
                <input
                  type='text'
                  value={photoDescriptions[index] || ''}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='照片描述'
                />
                
                <button
                  type='button'
                  onClick={() => handleRemovePhotoField(index)}
                  className='text-red-500 hover:text-red-700'
                >
                  刪除
                </button>
              </div>
              
              {file && (
                <div className='mt-2'>
                  <Image
                    src={URL.createObjectURL(file)}
                    alt='預覽'
                    width={200}
                    height={150}
                    className='rounded border'
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 分類和優先級 */}
        <div className={projectStyles.form.group}>
          <div>
            <label className={projectStyles.form.label}>
              分類
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={projectStyles.form.select}
            >
              <option value='general'>一般記錄</option>
              <option value='progress'>進度更新</option>
              <option value='issue'>問題記錄</option>
              <option value='milestone'>里程碑</option>
              <option value='decision'>決策記錄</option>
              <option value='meeting'>會議記錄</option>
            </select>
          </div>

          <div>
            <label className={projectStyles.form.label}>
              優先級 (1-10)
            </label>
            <input
              type='number'
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', Number(e.target.value))}
              className={`${projectStyles.form.input} ${errors.priority ? 'border-red-500' : ''}`}
              placeholder='5'
              min='1'
              max='10'
            />
            {errors.priority && (
              <p className='text-red-500 text-sm mt-1'>{errors.priority}</p>
            )}
          </div>
        </div>

        {/* 標籤管理 */}
        <div className={projectStyles.form.group}>
          <div>
            <label className={projectStyles.form.label}>
              標籤
            </label>
            <div className='flex gap-2'>
              <input
                type='text'
                value={formData.newTag}
                onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                className={projectStyles.form.input}
                placeholder='新增標籤'
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type='button'
                onClick={addTag}
                className={projectStyles.button.outline}
              >
                新增
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className='px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full flex items-center gap-1'
                  >
                    {tag}
                    <button
                      type='button'
                      onClick={() => removeTag(tag)}
                      className='text-blue-600 hover:text-blue-800'
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 後續行動 */}
        <div className={projectStyles.form.group}>
          <div>
            <label className={projectStyles.form.label}>
              後續行動
            </label>
            <div className='space-y-2'>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={formData.newAction}
                  onChange={(e) => setFormData(prev => ({ ...prev, newAction: e.target.value }))}
                  className={projectStyles.form.input}
                  placeholder='新增後續行動'
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFollowUpAction())}
                />
                <input
                  type='text'
                  value={formData.newActionAssignee}
                  onChange={(e) => setFormData(prev => ({ ...prev, newActionAssignee: e.target.value }))}
                  className={projectStyles.form.input}
                  placeholder='負責人'
                />
                <button
                  type='button'
                  onClick={addFollowUpAction}
                  className={projectStyles.button.outline}
                >
                  新增
                </button>
              </div>
              {formData.followUpActions.length > 0 && (
                <div className='space-y-2 mt-2'>
                  {formData.followUpActions.map((action, index) => (
                    <div key={index} className='flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded'>
                      <input
                        type='checkbox'
                        checked={action.completed}
                        onChange={() => toggleFollowUpAction(index)}
                        className='mr-2'
                      />
                      <span className={`flex-1 ${action.completed ? 'line-through text-gray-400' : ''}`}>
                        {action.description}
                      </span>
                      {action.assignedTo && (
                        <span className='text-sm text-gray-500'>→ {action.assignedTo}</span>
                      )}
                      <button
                        type='button'
                        onClick={() => removeFollowUpAction(index)}
                        className='text-red-500 hover:text-red-700'
                      >
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 錯誤訊息 */}
        {errors.submit && (
          <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <p className='text-red-600 dark:text-red-400'>{errors.submit}</p>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isSubmitting || uploading}
            className={`${projectStyles.button.outline} disabled:opacity-50`}
          >
            取消
          </button>
          <button
            type='submit'
            disabled={isSubmitting || uploading}
            className={`${projectStyles.button.primary} disabled:opacity-50 flex items-center`}
          >
            {isSubmitting || uploading ? (
              <>
                <div className={`${projectStyles.loading.spinnerSmall} mr-2`}></div>
                {uploading ? '上傳中...' : '儲存中...'}
              </>
            ) : (
              journalEntry ? '更新日誌' : '新增日誌'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}