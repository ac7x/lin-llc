'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, storage, auth } from '@/app/(system)';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, Plus, Calendar, User } from 'lucide-react';
import { JournalEntry, JournalFormData, ProjectJournalProps } from './types';

/**
 * 專案日誌組件 - 管理專案的含照片日誌系統
 */
export default function ProjectJournal({ 
  projectId, 
  disabled = false, 
  maxPhotos = 5 
}: ProjectJournalProps) {
  const [user] = useAuthState(auth);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<JournalFormData>({
    title: '',
    content: '',
    photos: []
  });

  // 載入日誌條目
  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, 'projects', projectId, 'journal'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const journalEntries: JournalEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        journalEntries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as JournalEntry);
      });
      setEntries(journalEntries);
    });

    return () => unsubscribe();
  }, [projectId]);

  // 處理照片選擇
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files).slice(0, maxPhotos);
    setFormData(prev => ({ ...prev, photos: selectedFiles }));
  };

  // 上傳照片到 Storage
  const uploadPhotos = async (photos: File[]): Promise<string[]> => {
    const uploadPromises = photos.map(async (photo) => {
      const fileName = `${Date.now()}_${photo.name}`;
      const photoRef = ref(storage, `projects/${projectId}/journal/${fileName}`);
      const snapshot = await uploadBytes(photoRef, photo);
      return getDownloadURL(snapshot.ref);
    });

    return Promise.all(uploadPromises);
  };

  // 提交新日誌
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!user || !formData.title.trim() || !formData.content.trim()) return;

    try {
      setLoading(true);

      // 上傳照片
      const photoUrls = formData.photos.length > 0 
        ? await uploadPhotos(formData.photos)
        : [];

      // 儲存日誌條目
      const now = new Date().toISOString();
      const journalEntry: Omit<JournalEntry, 'id'> = {
        projectId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        photos: photoUrls,
        createdAt: now,
        createdBy: user.uid
      };

      await addDoc(collection(db, 'projects', projectId, 'journal'), journalEntry);

      // 重置表單
      setFormData({ title: '', content: '', photos: [] });
      setShowAddForm(false);
    } catch (error) {
      console.error('新增日誌失敗:', error);
      alert('新增日誌失敗');
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">請先登入以查看專案日誌</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 標題與新增按鈕 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          專案日誌
        </h3>
        {!disabled && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            新增日誌
          </Button>
        )}
      </div>

      {/* 新增日誌表單 */}
      {showAddForm && !disabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">新增日誌條目</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="日誌標題"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="記錄專案進展、問題或心得..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  required
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4" />
                  <span className="text-sm font-medium">附加照片 (最多 {maxPhotos} 張)</span>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100"
                />
                {formData.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.photos.map((photo, index) => (
                      <Badge key={index} variant="secondary">
                        {photo.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? '儲存中...' : '儲存'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 日誌列表 */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">尚無日誌條目</p>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{entry.title}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>{formatDate(entry.createdAt)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {entry.content}
                </p>
                
                {/* 照片展示 */}
                {entry.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {entry.photos.map((photoUrl, index) => (
                      <div 
                        key={index} 
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => window.open(photoUrl, '_blank')}
                      >
                        <img
                          src={photoUrl}
                          alt={`${entry.title} - 照片 ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 