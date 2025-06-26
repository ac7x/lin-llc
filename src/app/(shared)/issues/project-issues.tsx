'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '@/app/(system)';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, CheckCircle, Circle, Settings } from 'lucide-react';
import { Issue, IssueFormData, IssueType, IssuePriority, IssueStatus, ProjectIssuesProps } from './types';

/**
 * 專案問題追蹤組件 - 管理專案問題回報和追蹤
 */
export default function ProjectIssues({ projectId, disabled = false }: ProjectIssuesProps) {
  const [user] = useAuthState(auth);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    type: 'bug',
    priority: 'medium'
  });

  // 載入問題列表
  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, 'projects', projectId, 'issues'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issueList: Issue[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        issueList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || data.resolvedAt
        } as Issue);
      });
      setIssues(issueList);
    });

    return () => unsubscribe();
  }, [projectId]);

  // 提交新問題
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!user || !formData.title.trim()) return;

    try {
      setLoading(true);

      const issue: Omit<Issue, 'id'> = {
        projectId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        status: 'open',
        assignee: formData.assignee,
        reporter: user.uid,
        createdAt: Timestamp.now().toDate().toISOString()
      };

      await addDoc(collection(db, 'projects', projectId, 'issues'), {
        ...issue,
        createdAt: Timestamp.now()
      });

      // 重置表單
      setFormData({ title: '', description: '', type: 'bug', priority: 'medium' });
      setShowAddForm(false);
    } catch (error) {
      console.error('新增問題失敗:', error);
      alert('新增問題失敗');
    } finally {
      setLoading(false);
    }
  };

  // 更新問題狀態
  const updateIssueStatus = async (issueId: string, newStatus: IssueStatus): Promise<void> => {
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: Timestamp.now()
      };

      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolvedAt = Timestamp.now();
      }

      await updateDoc(doc(db, 'projects', projectId, 'issues', issueId), updateData);
    } catch (error) {
      console.error('更新問題狀態失敗:', error);
      alert('更新問題狀態失敗');
    }
  };

  // 篩選問題
  const filteredIssues = issues.filter(issue => 
    statusFilter === 'all' || issue.status === statusFilter
  );

  // 獲取優先級顏色
  const getPriorityColor = (priority: IssuePriority): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  // 獲取狀態圖示
  const getStatusIcon = (status: IssueStatus) => {
    switch (status) {
      case 'open': return <Circle className="h-4 w-4" />;
      case 'in-progress': return <Settings className="h-4 w-4 animate-spin" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">請先登入以查看專案問題</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 標題與控制項 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          問題追蹤
        </h3>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IssueStatus | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="open">待處理</SelectItem>
              <SelectItem value="in-progress">處理中</SelectItem>
              <SelectItem value="resolved">已解決</SelectItem>
              <SelectItem value="closed">已關閉</SelectItem>
            </SelectContent>
          </Select>
          {!disabled && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              回報問題
            </Button>
          )}
        </div>
      </div>

      {/* 新增問題表單 */}
      {showAddForm && !disabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">回報新問題</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="問題標題"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <Textarea
                placeholder="詳細描述問題..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as IssueType }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="問題類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug 錯誤</SelectItem>
                    <SelectItem value="feature">功能需求</SelectItem>
                    <SelectItem value="task">任務</SelectItem>
                    <SelectItem value="improvement">改進建議</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as IssuePriority }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="優先級" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="critical">緊急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? '提交中...' : '提交'}
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

      {/* 問題列表 */}
      <div className="space-y-2">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                {statusFilter === 'all' ? '尚無問題回報' : `無 ${statusFilter} 狀態的問題`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <Card key={issue.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(issue.status)}
                    <h4 className="font-medium">{issue.title}</h4>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(issue.priority)}`} />
                  </div>
                  {!disabled && (
                    <Select
                      value={issue.status}
                      onValueChange={(value) => updateIssueStatus(issue.id!, value as IssueStatus)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">待處理</SelectItem>
                        <SelectItem value="in-progress">處理中</SelectItem>
                        <SelectItem value="resolved">已解決</SelectItem>
                        <SelectItem value="closed">已關閉</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                {issue.description && (
                  <p className="text-sm text-gray-600">{issue.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">{issue.type}</Badge>
                  <Badge variant="outline">{issue.priority}</Badge>
                  <span className="text-gray-500">
                    {new Date(issue.createdAt).toLocaleDateString('zh-TW')}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 