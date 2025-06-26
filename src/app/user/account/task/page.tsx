'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckSquareIcon, 
  UserIcon, 
  EyeIcon,
  EditIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FolderIcon
} from 'lucide-react';
import { toast } from 'sonner';

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
}

export default function UserTaskPage() {
  const { user } = useGoogleAuth();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        console.log('🔍 開始查詢用戶任務，用戶ID:', user.uid);
        
        // 查詢所有專案
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const userTasks: UserTask[] = [];
        
        console.log('📁 找到專案數量:', projectsSnapshot.size);
        
        projectsSnapshot.forEach(projectDoc => {
          const projectData = projectDoc.data();
          const projectId = projectDoc.id;
          
          console.log('📂 檢查專案:', projectData.name, '(ID:', projectId, ')');
          
          // 遍歷所有工作包、子工作包、任務包
          projectData.packages?.forEach((pkg: any, packageIndex: number) => {
            console.log('📦 檢查工作包:', pkg.name, '(index:', packageIndex, ')');
            
            pkg.subpackages?.forEach((subpkg: any, subpackageIndex: number) => {
              console.log('📋 檢查子工作包:', subpkg.name, '(index:', subpackageIndex, ')');
              
              subpkg.taskpackages?.forEach((task: any, taskIndex: number) => {
                console.log('📝 檢查任務:', task.name, '(index:', taskIndex, ')');
                console.log('  - 提交者列表:', task.submitters);
                console.log('  - 審核者列表:', task.reviewers);
                
                // 檢查當前用戶是否為提交者或審核者
                const isSubmitter = task.submitters?.includes(user.uid);
                const isReviewer = task.reviewers?.includes(user.uid);
                
                console.log('  - 是否為提交者:', isSubmitter);
                console.log('  - 是否為審核者:', isReviewer);
                
                // 如果是提交者，創建提交者任務記錄
                if (isSubmitter) {
                  const submitterTask = {
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
                    assignedAt: task.assignedAt,
                    submittedAt: task.submittedAt,
                    approvedAt: task.approvedAt,
                  };
                  userTasks.push(submitterTask);
                  console.log('  ✅ 添加提交者任務:', submitterTask.id);
                }
                
                // 如果是審核者，創建審核者任務記錄
                if (isReviewer) {
                  const reviewerTask = {
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
                    assignedAt: task.assignedAt,
                    submittedAt: task.submittedAt,
                    approvedAt: task.approvedAt,
                  };
                  userTasks.push(reviewerTask);
                  console.log('  ✅ 添加審核者任務:', reviewerTask.id);
                }
              });
            });
          });
        });
        
        console.log('📊 總共找到用戶任務數量:', userTasks.length);
        console.log('📋 所有任務列表:', userTasks);
        
        setTasks(userTasks);
      } catch (error) {
        console.error('載入任務失敗:', error);
        toast.error('載入任務失敗');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

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
        return { text: '審核者', color: 'bg-purple-100 text-purple-800', icon: EyeIcon };
      default:
        return { text: '未知', color: 'bg-gray-100 text-gray-800', icon: UserIcon };
    }
  };

  const handleViewProject = (task: UserTask) => {
    // 導航到專案頁面的特定任務
    const url = `/project?projectId=${task.projectId}&packageIndex=${task.packageIndex}&subpackageIndex=${task.subpackageIndex}&taskIndex=${task.taskIndex}`;
    window.open(url, '_blank');
  };

  // 按狀態分組任務
  const tasksByStatus = {
    pending: tasks.filter(task => task.role === 'submitter' && (task.status === 'in-progress' || task.status === 'rejected')),
    review: tasks.filter(task => task.role === 'reviewer' && task.status === 'submitted'),
    completed: tasks.filter(task => task.status === 'approved'),
    all: tasks,
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProject(task)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            查看專案
                          </Button>
                          
                          {task.role === 'submitter' && (task.status === 'in-progress' || task.status === 'rejected') && (
                            <Button
                              size="sm"
                              onClick={() => handleViewProject(task)}
                            >
                              <EditIcon className="h-4 w-4 mr-1" />
                              更新進度
                            </Button>
                          )}
                          
                          {task.role === 'reviewer' && task.status === 'submitted' && (
                            <Button
                              size="sm"
                              onClick={() => handleViewProject(task)}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              審核任務
                            </Button>
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