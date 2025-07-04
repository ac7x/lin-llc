'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, useGoogleAuth } from '@/app/(system)';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { 
  CheckSquareIcon, 
  UserIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FolderIcon,
  SendIcon,
  EyeIcon,
  ThumbsUpIcon,
  ThumbsDownIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { removeUndefinedValues } from '@/lib/utils';
import { useTaskManagement } from '@/app/project/hooks/use-task-management';
import type { Project } from '@/app/project/types';

interface UserInfo {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}

interface UserTask {
  id: string;
  name: string;
  projectName: string;
  projectId: string;
  packageIndex: number;
  subpackageIndex: number;
  taskIndex: number;
  role: 'submitter' | 'reviewer';
  status?: 'draft' | 'in-progress' | 'submitted' | 'approved' | 'rejected';
  completed: number;
  total: number;
  progress: number;
  assignedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  submitters: UserInfo[];
  reviewers: UserInfo[];
}

export default function UserTaskPage() {
  const { user } = useGoogleAuth();
  const { submitTaskProgress, reviewTask } = useTaskManagement();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 任務提交相關狀態
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  const [completedInput, setCompletedInput] = useState('');
  const [totalInput, setTotalInput] = useState('');
  
  // 審核相關狀態
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedReviewTask, setSelectedReviewTask] = useState<UserTask | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  // 載入用戶信息
  const loadUserInfo = async (uids: string[]): Promise<UserInfo[]> => {
    const userInfos: UserInfo[] = [];
    
    for (const uid of uids) {
      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userInfos.push({
            uid,
            name: userData.name || userData.displayName || '未知用戶',
            email: userData.email || '',
            photoURL: userData.photoURL,
          });
        } else {
          // 用戶不存在
          userInfos.push({
            uid,
            name: '未知用戶',
            email: '',
          });
        }
      } catch (error) {
        console.error(`載入用戶信息失敗 ${uid}:`, error);
        // 如果載入失敗，添加預設信息
        userInfos.push({
          uid,
          name: '未知用戶',
          email: '',
        });
      }
    }
    
    return userInfos;
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const loadUserTasks = async () => {
      try {
        // 直接查詢所有專案
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const userTasks: UserTask[] = [];
        
        for (const projectDoc of projectsSnapshot.docs) {
          const projectData = projectDoc.data() as Project;
          const projectId = projectDoc.id;
          
          // 遍歷所有工作包、子工作包、任務包
          for (const [packageIndex, pkg] of (projectData.packages || []).entries()) {
            for (const [subpackageIndex, subpkg] of (pkg.subpackages || []).entries()) {
              for (const [taskIndex, task] of (subpkg.taskpackages || []).entries()) {
                // 檢查當前用戶是否為提交者或審核者
                const isSubmitter = task.submitters?.includes(user.uid);
                const isReviewer = task.reviewers?.includes(user.uid);
                
                if (isSubmitter || isReviewer) {
                  // 載入提交者和審核者的用戶信息
                  const submitterUids = task.submitters || [];
                  const reviewerUids = task.reviewers || [];
                  
                  const [submitters, reviewers] = await Promise.all([
                    loadUserInfo(submitterUids),
                    loadUserInfo(reviewerUids)
                  ]);
                  
                  // 如果是提交者，創建提交者任務記錄
                  if (isSubmitter) {
                    userTasks.push({
                      id: `${projectId}_${packageIndex}_${subpackageIndex}_${taskIndex}_submitter`,
                      name: task.name,
                      projectName: projectData.name,
                      projectId,
                      packageIndex,
                      subpackageIndex,
                      taskIndex,
                      role: 'submitter' as const,
                      status: task.status,
                      completed: task.completed || 0,
                      total: task.total || 0,
                      progress: task.progress || 0,
                      assignedAt: task.time?.createdAt,
                      submittedAt: task.submittedAt,
                      approvedAt: task.approvedAt,
                      submitters,
                      reviewers,
                    });
                  }
                  
                  // 如果是審核者，創建審核者任務記錄
                  if (isReviewer) {
                    userTasks.push({
                      id: `${projectId}_${packageIndex}_${subpackageIndex}_${taskIndex}_reviewer`,
                      name: task.name,
                      projectName: projectData.name,
                      projectId,
                      packageIndex,
                      subpackageIndex,
                      taskIndex,
                      role: 'reviewer' as const,
                      status: task.status,
                      completed: task.completed || 0,
                      total: task.total || 0,
                      progress: task.progress || 0,
                      assignedAt: task.time?.createdAt,
                      submittedAt: task.submittedAt,
                      approvedAt: task.approvedAt,
                      submitters,
                      reviewers,
                    });
                  }
                }
              }
            }
          }
        }
        
        setTasks(userTasks);
      } catch (error) {
        console.error('載入任務失敗:', error);
        toast.error('載入任務失敗');
      } finally {
        setLoading(false);
      }
    };
    
    void loadUserTasks();
  }, [user]);

  // 使用正確的任務管理邏輯提交進度
  const handleDirectSubmit = async () => {
    if (!selectedTask || !user) return;

    const completed = parseInt(completedInput) || 0;
    const total = parseInt(totalInput) || 0;

    if (total <= 0) {
      toast.error('總數量必須大於0');
      return;
    }

    if (completed > total) {
      toast.error('完成數量不能大於總數量');
      return;
    }

    setSubmitLoading(true);
    
    try {
      // 獲取專案數據
      const projectRef = doc(db, 'projects', selectedTask.projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        toast.error('找不到專案數據');
        return;
      }

      const projectData = projectDoc.data() as Project;

      // 使用 submitTaskProgress 函數來正確處理審核流程
      const success = await submitTaskProgress(
        projectData,
        {
          packageIndex: selectedTask.packageIndex,
          subpackageIndex: selectedTask.subpackageIndex,
          taskIndex: selectedTask.taskIndex,
        },
        completed,
        total,
        () => {} // 空的更新回調，因為我們會手動更新本地狀態
      );

      if (success) {
        // 重新獲取更新後的專案數據來取得正確的任務狀態
        const updatedProjectDoc = await getDoc(projectRef);
        if (updatedProjectDoc.exists()) {
          const updatedProjectData = updatedProjectDoc.data() as Project;
          const updatedTask = updatedProjectData.packages[selectedTask.packageIndex]
            .subpackages[selectedTask.subpackageIndex]
            .taskpackages[selectedTask.taskIndex];

          // 更新本地任務列表
          setTasks(prev => prev.map(t => 
            t.id === selectedTask.id 
              ? { ...t, completed, total, progress: updatedTask.progress, status: updatedTask.status }
              : t
          ));

          // 根據狀態顯示適當的訊息
          if (updatedTask.status === 'submitted') {
            toast.success('任務已提交審核，等待審核者審核');
          } else if (updatedTask.status === 'approved') {
            toast.success('任務已完成並自動核准');
          } else {
            toast.success('任務進度已更新');
          }
        }

        // 重置表單
        setSelectedTask(null);
        setCompletedInput('');
        setTotalInput('');
      } else {
        toast.error('提交任務失敗');
      }
      
    } catch (error) {
      console.error('提交任務失敗:', error);
      toast.error('提交任務失敗');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 開啟提交drawer
  const openSubmitDrawer = (task: UserTask) => {
    setSelectedTask(task);
    setCompletedInput(task.completed.toString());
    setTotalInput(task.total.toString());
  };

  // 審核任務
  const handleReviewTask = async (approved: boolean) => {
    if (!selectedReviewTask || !user) return;

    setReviewLoading(true);
    
    try {
      // 獲取專案數據
      const projectRef = doc(db, 'projects', selectedReviewTask.projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        toast.error('找不到專案數據');
        return;
      }

      const projectData = projectDoc.data() as Project;

      const success = await reviewTask(
        projectData,
        {
          packageIndex: selectedReviewTask.packageIndex,
          subpackageIndex: selectedReviewTask.subpackageIndex,
          taskIndex: selectedReviewTask.taskIndex,
        },
        approved,
        () => {}, // 空的更新回調
        reviewComment
      );

      if (success) {
        // 重新獲取更新後的專案數據
        const updatedProjectDoc = await getDoc(projectRef);
        if (updatedProjectDoc.exists()) {
          const updatedProjectData = updatedProjectDoc.data() as Project;
          const updatedTask = updatedProjectData.packages[selectedReviewTask.packageIndex]
            .subpackages[selectedReviewTask.subpackageIndex]
            .taskpackages[selectedReviewTask.taskIndex];

          // 更新本地任務列表
          setTasks(prev => prev.map(t => 
            t.id === selectedReviewTask.id 
              ? { ...t, status: updatedTask.status, approvedAt: updatedTask.approvedAt }
              : t
          ));

          toast.success(approved ? '任務審核通過' : '任務已駁回');
        }

        // 重置表單
        setSelectedReviewTask(null);
        setReviewComment('');
      } else {
        toast.error('審核失敗');
      }
      
    } catch (error) {
      console.error('審核任務失敗:', error);
      toast.error('審核失敗');
    } finally {
      setReviewLoading(false);
    }
  };

  // 開啟審核drawer
  const openReviewDrawer = (task: UserTask) => {
    setSelectedReviewTask(task);
    setReviewComment('');
  };

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">請先登入以查看任務</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'in-progress':
        return { text: '進行中', color: 'bg-blue-100 text-blue-800', icon: ClockIcon };
      case 'submitted':
        return { text: '待審核', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon };
      case 'approved':
        return { text: '已核准', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon };
      case 'rejected':
        return { text: '已駁回', color: 'bg-red-100 text-red-800', icon: XCircleIcon };
      default:
        return { text: '草稿', color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'submitter':
        return { text: '提交者', color: 'bg-blue-100 text-blue-800', icon: UserIcon };
      case 'reviewer':
        return { text: '審核者', color: 'bg-purple-100 text-purple-800', icon: UserIcon };
      default:
        return { text: '未知', color: 'bg-gray-100 text-gray-800', icon: UserIcon };
    }
  };

  // 按狀態分組任務
  const tasksByStatus = {
    pending: tasks.filter(task => task.role === 'submitter' && (task.status === 'in-progress' || task.status === 'rejected')),
    review: tasks.filter(task => task.role === 'reviewer' && task.status === 'submitted'),
    completed: tasks.filter(task => task.status === 'approved'),
    all: tasks,
  };

  // 用戶頭像組件
  const UserAvatarGroup = ({ users, label }: { users: UserInfo[], label: string }) => {
    if (users.length === 0) return null;
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}：</span>
        <div className="flex items-center -space-x-2">
          {users.slice(0, 3).map((user) => (
            <Avatar key={user.uid} className="h-8 w-8 border-2 border-background">
              <AvatarImage src={user.photoURL} alt={user.name} />
              <AvatarFallback className="text-xs">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {users.length > 3 && (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background text-xs text-muted-foreground">
              +{users.length - 3}
            </div>
          )}
        </div>
        {users.length === 1 && (
          <span className="text-sm text-muted-foreground">{users[0].name}</span>
        )}
      </div>
    );
  };

  return (
    <main className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <CheckSquareIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">我的任務</h1>
      </div>

      {loading ? (
        <div className="text-center py-8">載入中...</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">目前沒有指派給您的任務</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tasksByStatus.pending.length}</div>
                  <div className="text-sm text-muted-foreground">待處理任務</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{tasksByStatus.review.length}</div>
                  <div className="text-sm text-muted-foreground">待審核任務</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{tasksByStatus.completed.length}</div>
                  <div className="text-sm text-muted-foreground">已完成任務</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{tasksByStatus.all.length}</div>
                  <div className="text-sm text-muted-foreground">總任務數</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 任務列表 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">任務列表</h2>
            {tasks.map(task => {
              const statusInfo = getStatusInfo(task.status);
              const roleInfo = getRoleInfo(task.role);
              const StatusIcon = statusInfo.icon;
              const RoleIcon = roleInfo.icon;

              return (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquareIcon className="h-5 w-5" />
                        {task.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={roleInfo.color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo.text}
                        </Badge>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.text}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 專案信息 */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FolderIcon className="h-4 w-4" />
                        <span>專案：{task.projectName}</span>
                      </div>

                      {/* 提交者和審核者信息 */}
                      <div className="space-y-3">
                        <UserAvatarGroup users={task.submitters} label="提交者" />
                        <UserAvatarGroup users={task.reviewers} label="審核者" />
                      </div>

                      {/* 進度條 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>進度</span>
                          <span>{task.completed} / {task.total} ({task.progress}%)</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>

                      {/* 時間信息 */}
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground space-y-1">
                          {task.submittedAt && (
                            <p>提交時間：{new Date(task.submittedAt).toLocaleString('zh-TW')}</p>
                          )}
                          {task.approvedAt && (
                            <p>審核時間：{new Date(task.approvedAt).toLocaleString('zh-TW')}</p>
                          )}
                        </div>

                        {/* 操作按鈕 */}
                        <div className="flex gap-2">
                          {task.role === 'submitter' && (task.status === 'in-progress' || task.status === 'rejected') && (
                            <>
                              {/* 快速提交按鈕 - 使用Drawer */}
                              <Drawer>
                                <DrawerTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => openSubmitDrawer(task)}
                                  >
                                    <SendIcon className="h-4 w-4 mr-1" />
                                    快速提交
                                  </Button>
                                </DrawerTrigger>
                                <DrawerContent>
                                  <DrawerHeader>
                                    <DrawerTitle>提交任務進度</DrawerTitle>
                                    <DrawerDescription>
                                      更新任務「{selectedTask?.name}」的完成進度
                                    </DrawerDescription>
                                  </DrawerHeader>
                                  <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="completed">完成數量</Label>
                                        <Input
                                          id="completed"
                                          type="number"
                                          min="0"
                                          value={completedInput}
                                          onChange={(e) => setCompletedInput(e.target.value)}
                                          placeholder="已完成數量"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="total">總數量</Label>
                                        <Input
                                          id="total"
                                          type="number"
                                          min="1"
                                          value={totalInput}
                                          onChange={(e) => setTotalInput(e.target.value)}
                                          placeholder="總數量"
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* 進度預覽 */}
                                    {completedInput && totalInput && (
                                      <div className="space-y-2">
                                        <Label>進度預覽</Label>
                                        <Progress 
                                          value={Math.round((parseInt(completedInput) / parseInt(totalInput)) * 100)} 
                                          className="h-2" 
                                        />
                                        <p className="text-sm text-muted-foreground">
                                          {Math.round((parseInt(completedInput) / parseInt(totalInput)) * 100)}% 完成
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <DrawerFooter>
                                    <Button 
                                      onClick={handleDirectSubmit}
                                      disabled={submitLoading || !completedInput || !totalInput}
                                    >
                                      {submitLoading ? '提交中...' : '確認提交'}
                                    </Button>
                                    <DrawerClose asChild>
                                      <Button variant="outline">取消</Button>
                                    </DrawerClose>
                                  </DrawerFooter>
                                </DrawerContent>
                              </Drawer>
                            </>
                          )}

                          {task.role === 'reviewer' && task.status === 'submitted' && (
                            <>
                              {/* 審核按鈕 - 使用Drawer */}
                              <Drawer>
                                <DrawerTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openReviewDrawer(task)}
                                  >
                                    <EyeIcon className="h-4 w-4 mr-1" />
                                    審核任務
                                  </Button>
                                </DrawerTrigger>
                                <DrawerContent>
                                  <DrawerHeader>
                                    <DrawerTitle>審核任務</DrawerTitle>
                                    <DrawerDescription>
                                      審核任務「{selectedReviewTask?.name}」的提交內容
                                    </DrawerDescription>
                                  </DrawerHeader>
                                  <div className="p-4 space-y-4">
                                    {/* 任務基本信息 */}
                                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                                      <div className="flex justify-between text-sm">
                                        <span className="font-medium">專案名稱：</span>
                                        <span>{selectedReviewTask?.projectName}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="font-medium">任務進度：</span>
                                        <span>{selectedReviewTask?.completed} / {selectedReviewTask?.total} ({selectedReviewTask?.progress}%)</span>
                                      </div>
                                      <div className="space-y-2">
                                        <span className="text-sm font-medium">進度條：</span>
                                        <Progress value={selectedReviewTask?.progress || 0} className="h-2" />
                                      </div>
                                      {selectedReviewTask?.submittedAt && (
                                        <div className="flex justify-between text-sm">
                                          <span className="font-medium">提交時間：</span>
                                          <span>{new Date(selectedReviewTask.submittedAt).toLocaleString('zh-TW')}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* 審核意見 */}
                                    <div className="space-y-2">
                                      <Label htmlFor="reviewComment">審核意見</Label>
                                      <Textarea
                                        id="reviewComment"
                                        placeholder="請輸入審核意見（駁回時必填）"
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                  <DrawerFooter>
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="destructive"
                                        onClick={() => handleReviewTask(false)}
                                        disabled={reviewLoading || !reviewComment.trim()}
                                        className="flex-1"
                                      >
                                        <ThumbsDownIcon className="h-4 w-4 mr-1" />
                                        {reviewLoading ? '處理中...' : '駁回'}
                                      </Button>
                                      <Button 
                                        onClick={() => handleReviewTask(true)}
                                        disabled={reviewLoading}
                                        className="flex-1"
                                      >
                                        <ThumbsUpIcon className="h-4 w-4 mr-1" />
                                        {reviewLoading ? '處理中...' : '核准'}
                                      </Button>
                                    </div>
                                    <DrawerClose asChild>
                                      <Button variant="outline">取消</Button>
                                    </DrawerClose>
                                  </DrawerFooter>
                                </DrawerContent>
                              </Drawer>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
} 