'use client';

import type { User } from 'firebase/auth';
import Image from 'next/image';
import { useState, useEffect, useCallback, type ReactElement } from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  db,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  getDocs,
} from '@/lib/firebase-client';


// 定義留言訊息的結構
interface FeedbackMessage {
  id: string;
  userId: string;
  userName: string | null;
  userPhotoURL: string | null;
  message: string;
  createdAt: Timestamp;
  isDeveloperNote?: boolean;
  version?: string;
}

// 定義開發者日誌的結構
interface DeveloperNote {
  message: string;
  version: string;
  timestamp: string;
}

export default function HomePage(): ReactElement {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [canPost, setCanPost] = useState(false);
  const [developerNote, setDeveloperNote] = useState<DeveloperNote | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [version, setVersion] = useState('');

  // 檢查目前使用者是否為開發者
  useEffect(() => {
    if (user) {
      const developerRoles = ['admin', 'developer'];
      setIsDeveloper(developerRoles.includes(user.currentRole || ''));
    } else {
      setIsDeveloper(false);
    }
  }, [user]);

  // 取得留言和開發者日誌
  useEffect(() => {
    const messagesQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      messagesQuery,
      snapshot => {
        const fetchedMessages: FeedbackMessage[] = [];
        let foundDeveloperNote: DeveloperNote | null = null;

        snapshot.forEach(doc => {
          const data = doc.data();
          const message: FeedbackMessage = {
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            userPhotoURL: data.userPhotoURL,
            message: data.message,
            createdAt: data.createdAt,
            isDeveloperNote: data.isDeveloperNote,
            version: data.version,
          };

          if (message.isDeveloperNote && !foundDeveloperNote) {
            foundDeveloperNote = {
              message: message.message,
              version: message.version || 'N/A',
              timestamp: message.createdAt?.toDate().toLocaleString() || 'N/A',
            };
          }
          fetchedMessages.push(message);
        });

        setDeveloperNote(foundDeveloperNote);
        setMessages(fetchedMessages);
      },
      err => {
        console.error('Error fetching messages:', err);
        setError('無法載入留言，請稍後再試。');
      }
    );

    return () => unsubscribe();
  }, []);

  // 檢查使用者是否可以發文
  const checkCanPost = useCallback(async (currentUser: User) => {
    const postQuery = query(
      collection(db, 'feedback'),
      where('userId', '==', currentUser.uid),
      limit(50)
    );

    try {
      const snapshot = await getDocs(postQuery);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // 在客戶端過濾開發者日誌和時間
      const recentUserMessages = snapshot.docs.filter(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        return !data.isDeveloperNote && createdAt && createdAt >= twentyFourHoursAgo;
      });

      setCanPost(recentUserMessages.length === 0);
    } catch (err) {
      console.error('Error checking post status:', err);
      setCanPost(true);
    }
  }, []);

  useEffect(() => {
    if (user && !isDeveloper) {
      checkCanPost(user);
    } else {
      setCanPost(isDeveloper);
    }
  }, [user, isDeveloper, messages, checkCanPost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('請先登入再留言。');
      return;
    }

    const isDevSubmission = isDeveloper && version.trim() !== '';

    if (!isDevSubmission && !canPost) {
      setError('您今天已經留過言了，請明天再來！');
      return;
    }

    if (newMessage.trim() === '') {
      setError('留言內容不可為空。');
      return;
    }

    if (isDevSubmission && version.trim() === '') {
      setError('版本號為必填欄位。');
      return;
    }

    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        message: newMessage,
        createdAt: serverTimestamp(),
        ...(isDevSubmission && { isDeveloperNote: true, version: version.trim() }),
      });
      setNewMessage('');
      if (isDevSubmission) setVersion('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('發送失敗，請稍後再試。');
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900'>
        載入中...
      </div>
    );
  }

  return (
    <div className='container mx-auto p-4 max-w-4xl'>
      <h1 className='text-3xl font-bold mb-4 text-gray-900 dark:text-white'>開發者留言板</h1>
      <p className='mb-6 text-gray-600 dark:text-gray-400'>
        歡迎回報問題或提出功能建議。每個帳號每日僅限留言一次。
      </p>

      {developerNote && (
        <div className='mb-8 p-4 border-l-4 border-indigo-500 bg-indigo-50 dark:bg-gray-800 rounded-r-lg shadow'>
          <h2 className='text-xl font-semibold text-indigo-800 dark:text-indigo-300'>
            開發者日誌 (版本: {developerNote.version})
          </h2>
          <p className='mt-2 text-gray-700 dark:text-gray-300'>{developerNote.message}</p>
          <p className='text-sm text-gray-500 mt-2'>{developerNote.timestamp}</p>
        </div>
      )}

      {user && (
        <form
          onSubmit={handleSubmit}
          className='mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md'
        >
          {isDeveloper && (
            <input
              type='text'
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder='版本號 (e.g., v1.0.2)'
              className='w-full p-2 mb-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600'
            />
          )}
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={
              isDeveloper
                ? '輸入開發者日誌...'
                : canPost
                  ? '請輸入您的留言...'
                  : '您今天已經留過言了，請明天再來！'
            }
            rows={4}
            className='w-full p-3 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
            disabled={!isDeveloper && !canPost}
          />
          <button
            type='submit'
            disabled={!isDeveloper && !canPost}
            className='mt-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            {isDeveloper ? '發布日誌' : '送出留言'}
          </button>
        </form>
      )}

      {error && <p className='text-red-500 mb-4'>{error}</p>}

      <div className='space-y-4'>
        <h2 className='text-2xl font-bold mt-8 mb-4 border-b pb-2 text-gray-900 dark:text-white'>
          所有留言
        </h2>
        {messages
          .filter(msg => !msg.isDeveloperNote)
          .map(msg => (
            <div
              key={msg.id}
              className='p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-start space-x-4'
            >
              {msg.userPhotoURL ? (
                <Image
                  src={msg.userPhotoURL}
                  alt={msg.userName || 'user avatar'}
                  width={40}
                  height={40}
                  className='w-10 h-10 rounded-full'
                />
              ) : (
                <div className='w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300'>
                  {msg.userName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className='flex-1'>
                <div className='flex justify-between items-center'>
                  <span className='font-semibold text-gray-800 dark:text-gray-200'>
                    {msg.userName}
                  </span>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    {msg.createdAt?.toDate().toLocaleString()}
                  </span>
                </div>
                <p className='mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
        {messages.filter(msg => !msg.isDeveloperNote).length === 0 && (
          <p className='text-gray-500 dark:text-gray-400'>目前沒有任何留言。</p>
        )}
      </div>
    </div>
  );
}
