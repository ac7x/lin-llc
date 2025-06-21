/**
 * JournalForm.tsx
 *
 * 新增專案工作日誌的表單組件。
 */
'use client';

import { UpdateData } from 'firebase/firestore';
import { useState } from 'react';

// import Image from 'next/image';
import {
  Project,
  ActivityLog,
  PhotoRecord,
  PhotoType,
  Workpackage,
  IssueRecord,
} from '@/app/projects/types/project';
import {
  db,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  updateDoc,
  arrayUnion,
  doc,
  Timestamp,
} from '@/lib/firebase-client';
import { toTimestamp } from '@/utils/dateUtils';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';
import { calculateProjectProgress } from '../../../utils/progressUtils';

import { WeatherData } from './WeatherDisplay';

interface JournalFormProps {
  projectId: string;
  projectData: Project;
  weatherData: WeatherData | null;
}

export default function JournalForm({ projectId, projectData, weatherData }: JournalFormProps) {
  const [newReport, setNewReport] = useState<{
    workforceCount: number;
    description: string;
    issues: string;
  }>({ workforceCount: 0, description: '', issues: '' });
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([]);
  const [photoDescriptions, setPhotoDescriptions] = useState<string[]>([]);
  const [photoTypes, setPhotoTypes] = useState<PhotoType[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [progressInputs, setProgressInputs] = useState([
    { workpackageId: '', subWorkpackageId: '', actualQuantity: 0 },
  ]);

  const workpackages = projectData.workpackages || [];

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

  const uploadPhotos = async (reportId: string) => {
    setUploading(true);
    const now = new Date();
    const nowTimestamp = toTimestamp(now);

    const uploadPromises = photoFiles.map((file, i) => {
      if (!file) return Promise.resolve(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `projects/${projectId}/photos/${Date.now()}_${i}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<PhotoRecord | null>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          snapshot => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(progress);
          },
          error => {
            logError(error, { operation: 'upload_photo', fileName, index: i });
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                id: `${Date.now()}_${i}`,
                url: downloadURL,
                type: photoTypes[i],
                description: photoDescriptions[i],
                reportId,
                createdAt: nowTimestamp,
                updatedAt: nowTimestamp,
                createdBy: 'current-user', // TODO: Replace with actual user
              });
            } catch (error) {
              logError(error, { operation: 'get_download_url', fileName, index: i });
              reject(error);
            }
          }
        );
      });
    });

    try {
      const results = await Promise.all(uploadPromises);
      setUploading(false);
      return results.filter((record): record is PhotoRecord => record !== null);
    } catch (error) {
      setUploading(false);
      logError(error, { operation: 'upload_photos_batch', projectId, reportId });
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading) return;
    setSaving(true);

    const weather = weatherData?.weather || '';
    const temperature = weatherData?.temperature || 0;

    await safeAsync(async () => {
      const now = new Date();
      const nowTimestamp = toTimestamp(now);
      const reportId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

      let photoRecords: PhotoRecord[] = [];
      if (photoFiles.some(file => file !== null)) {
        photoRecords = await uploadPhotos(reportId);
      }

      const activities: ActivityLog[] = [];
      const updatedWorkpackages: Workpackage[] = JSON.parse(JSON.stringify(workpackages));

      for (const input of progressInputs) {
        if (input.workpackageId && input.subWorkpackageId && input.actualQuantity > 0) {
          const wp = updatedWorkpackages.find(w => w.id === input.workpackageId);
          if (wp) {
            const sw = wp.subWorkpackages.find(s => s.id === input.subWorkpackageId);
            if (sw) {
              const newActualQuantity = (sw.actualQuantity || 0) + input.actualQuantity;
              const percent = sw.estimatedQuantity
                ? Math.round((newActualQuantity / sw.estimatedQuantity) * 100)
                : 0;
              sw.progress = percent;
              sw.actualQuantity = newActualQuantity;

              activities.push({
                id: `${input.workpackageId}_${input.subWorkpackageId}_${now.getTime()}`,
                workpackageId: input.workpackageId,
                description: `${wp?.name || ''} / ${sw?.name || ''}`,
                startTime: nowTimestamp,
                endTime: nowTimestamp,
                workforce: newReport.workforceCount || 0,
                progress: sw.progress,
                notes: `本日完成 ${input.actualQuantity} ${sw.unit || ''}`,
                createdAt: nowTimestamp,
                updatedAt: nowTimestamp,
              });
            }
          }
        }
      }

      const updatedProjectData = { ...projectData, workpackages: updatedWorkpackages };
      const projectProgress = calculateProjectProgress(updatedProjectData);

      const projectRef = doc(db, 'projects', projectId);

      const reportPayload = {
        id: reportId,
        date: nowTimestamp,
        weather,
        temperature,
        workforceCount: newReport.workforceCount,
        description: newReport.description,
        activities,
        projectProgress,
        photos: photoRecords,
        createdBy: 'current-user', // TODO: Replace with actual user
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
      };

      const updatePayload: UpdateData<Project> = {
        workpackages: updatedWorkpackages,
        reports: arrayUnion(reportPayload),
        progress: projectProgress,
      };

      if (newReport.issues.trim()) {
        const issueRecord: Omit<IssueRecord, 'dueDate'> & { dueDate: Timestamp | null } = {
          id: Date.now().toString(),
          description: newReport.issues.trim(),
          type: 'progress',
          severity: 'medium',
          status: 'open',
          createdAt: nowTimestamp,
          updatedAt: nowTimestamp,
          assignedTo: '',
          dueDate: null,
          resolved: false,
        };
        updatePayload.issues = arrayUnion(issueRecord);
      }

      await retry(() => updateDoc(projectRef, updatePayload), 3, 1000);

      // Reset form
      setNewReport({ workforceCount: 0, description: '', issues: '' });
      setPhotoFiles([]);
      setPhotoDescriptions([]);
      setPhotoTypes([]);
      setProgressInputs([{ workpackageId: '', subWorkpackageId: '', actualQuantity: 0 }]);
      alert('工作日誌已成功提交！');
    }, (error) => {
      alert(`保存工作日誌時出錯：${getErrorMessage(error)}`);
      logError(error, { operation: 'submit_journal', projectId });
    });
    setSaving(false);
    setUploadProgress(0);
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
      <h2 className='text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
        新增工作日誌
      </h2>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              出工人數
            </label>
            <input
              type='number'
              className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
              value={newReport.workforceCount}
              onChange={e =>
                setNewReport({ ...newReport, workforceCount: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            工作描述
          </label>
          <textarea
            className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 h-24'
            value={newReport.description}
            onChange={e => setNewReport({ ...newReport, description: e.target.value })}
            placeholder='記錄今日施工項目、進度、機具使用等...'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            問題與障礙
          </label>
          <textarea
            className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 h-24'
            value={newReport.issues}
            onChange={e => setNewReport({ ...newReport, issues: e.target.value })}
            placeholder='記錄任何影響進度的問題、安全事項或需要協調的工作...'
          />
        </div>

        <div className='space-y-4'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>照片記錄</h3>
            <button
              type='button'
              onClick={handleAddPhotoField}
              className='inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200'
            >
              <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
              新增照片
            </button>
          </div>
          {photoFiles.map((file, index) => (
            <div key={index} className='p-4 border rounded-lg bg-gray-50 dark:bg-gray-700'>
              <div className='flex justify-between items-start mb-2'>
                <h4 className='font-medium text-gray-900 dark:text-gray-100'>照片 #{index + 1}</h4>
                <button
                  type='button'
                  onClick={() => handleRemovePhotoField(index)}
                  className='text-red-500 hover:text-red-700 transition-colors duration-200'
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
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    選擇照片
                  </label>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={e => e.target.files && handlePhotoChange(index, e.target.files[0])}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    照片類型
                  </label>
                  <select
                    value={photoTypes[index] || 'progress'}
                    onChange={e => handleTypeChange(index, e.target.value as PhotoType)}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    disabled={saving}
                  >
                    <option value='progress'>進度記錄</option>
                    <option value='issue'>問題記錄</option>
                    <option value='material'>材料記錄</option>
                    <option value='safety'>安全記錄</option>
                    <option value='other'>其他</option>
                  </select>
                </div>
              </div>
              <div className='mt-2'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  照片描述
                </label>
                <textarea
                  value={photoDescriptions[index] || ''}
                  onChange={e => handleDescriptionChange(index, e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                  rows={2}
                  placeholder='請描述照片內容...'
                  disabled={saving}
                />
              </div>
            </div>
          ))}
          {uploading && (
            <div className='mt-2'>
              <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2'>
                <div
                  className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className='text-sm text-center text-gray-600 dark:text-gray-400'>
                {uploadProgress}% 已上傳
              </p>
            </div>
          )}
        </div>

        <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-2'>
          <h3 className='font-bold mb-4 text-gray-900 dark:text-gray-100'>進度填報</h3>
          {progressInputs.map((input, idx) => {
            const selectedWp = workpackages.find(wp => wp.id === input.workpackageId);
            const subWorkpackages = selectedWp?.subWorkpackages || [];
            const selectedSubWp = subWorkpackages.find(sw => sw.id === input.subWorkpackageId);
            return (
              <div key={idx} className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    選擇工作包
                  </label>
                  <select
                    className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    value={input.workpackageId}
                    onChange={e => {
                      const v = e.target.value;
                      setProgressInputs(arr =>
                        arr.map((item, i) =>
                          i === idx
                            ? { workpackageId: v, subWorkpackageId: '', actualQuantity: 0 }
                            : item
                        )
                      );
                    }}
                  >
                    <option value=''>請選擇</option>
                    {workpackages.map(wp => (
                      <option key={wp.id} value={wp.id}>
                        {wp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    選擇子工作包
                  </label>
                  <select
                    className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    value={input.subWorkpackageId}
                    onChange={e => {
                      const v = e.target.value;
                      setProgressInputs(arr =>
                        arr.map((item, i) =>
                          i === idx ? { ...item, subWorkpackageId: v, actualQuantity: 0 } : item
                        )
                      );
                    }}
                    disabled={!input.workpackageId}
                  >
                    <option value=''>請選擇</option>
                    {subWorkpackages.map(sw => (
                      <option key={sw.id} value={sw.id}>
                        {sw.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='flex-grow'>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    本日實際數量
                  </label>
                  <input
                    type='number'
                    className='w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
                    value={input.actualQuantity}
                    min={0}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setProgressInputs(arr =>
                        arr.map((item, i) => (i === idx ? { ...item, actualQuantity: v } : item))
                      );
                    }}
                    disabled={!input.subWorkpackageId}
                  />
                  {input.subWorkpackageId && selectedSubWp && (
                    <div className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                      <span>
                        累計: {selectedSubWp.actualQuantity || 0} / 應完成:{' '}
                        {selectedSubWp.estimatedQuantity ?? '-'}
                      </span>
                    </div>
                  )}
                </div>
                <div className='col-span-3 flex gap-2 mt-2'>
                  {progressInputs.length > 1 && (
                    <button
                      type='button'
                      className='text-red-500 hover:text-red-700 text-sm transition-colors duration-200'
                      onClick={() => setProgressInputs(arr => arr.filter((_, i) => i !== idx))}
                    >
                      移除
                    </button>
                  )}
                  {idx === progressInputs.length - 1 && (
                    <button
                      type='button'
                      className='text-blue-500 hover:text-blue-700 text-sm transition-colors duration-200'
                      onClick={() =>
                        setProgressInputs(arr => [
                          ...arr,
                          { workpackageId: '', subWorkpackageId: '', actualQuantity: 0 },
                        ])
                      }
                    >
                      新增一筆
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type='submit'
          className='w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={saving || uploading}
        >
          {saving ? (
            <span className='flex items-center justify-center'>
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
              保存中...
            </span>
          ) : (
            '提交工作日誌'
          )}
        </button>
      </form>
    </div>
  );
}
