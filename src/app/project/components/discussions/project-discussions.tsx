'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Discussion {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  replies?: Discussion[];
}

interface ProjectDiscussionsProps {
  projectId: string;
}

export default function ProjectDiscussions({ projectId }: ProjectDiscussionsProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newContent, setNewContent] = useState('');
  const [author, setAuthor] = useState('');

  useEffect(() => {
    // 模擬資料
    setDiscussions([
      {
        id: '1',
        author: '張三',
        content: '這個專案的進度如何？需要我協助什麼嗎？',
        timestamp: '2024-01-15 14:30',
        replies: []
      },
      {
        id: '2', 
        author: '李四',
        content: '建議我們調整一下時程安排，預計可以提前一周完成。',
        timestamp: '2024-01-15 15:45',
        replies: []
      }
    ]);
  }, [projectId]);

  const handleSubmit = () => {
    if (!newContent.trim() || !author.trim()) return;
    
    const newDiscussion: Discussion = {
      id: Date.now().toString(),
      author,
      content: newContent,
      timestamp: new Date().toLocaleString('zh-TW'),
      replies: []
    };

    setDiscussions(prev => [newDiscussion, ...prev]);
    setNewContent('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>新增討論</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="您的姓名"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <Textarea
            placeholder="輸入討論內容..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
          />
          <Button onClick={handleSubmit} className="w-full">
            發布討論
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {discussions.map((discussion) => (
          <Card key={discussion.id} className="shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {discussion.author.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">
                      {discussion.author}
                    </span>
                    <span className="text-xs text-gray-500">
                      {discussion.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {discussion.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 