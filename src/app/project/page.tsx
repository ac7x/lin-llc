'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Subpackage { name: string }
interface Task { subpackages: Subpackage[] }
interface Package { name: string; tasks: Task[] }
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  packages: Package[];
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pkgInputs, setPkgInputs] = useState<Record<string, string>>({});
  const [taskInputs, setTaskInputs] = useState<Record<string, Record<number, string>>>({});
  const [subInputs, setSubInputs] = useState<Record<string, Record<number, Record<number, string>>>>({});

  // 載入專案列表
  useEffect(() => {
    void (async () => {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const projectList = snapshot.docs.map(doc => {
        const data = doc.data();
        // 確保 packages 是陣列，且每個 package 都有 tasks 陣列
        const packages = Array.isArray(data.packages) 
          ? data.packages.map((pkg: any) => ({
              name: pkg.name || '',
              tasks: Array.isArray(pkg.tasks) 
                ? pkg.tasks.map((task: any) => ({
                    subpackages: Array.isArray(task.subpackages) 
                      ? task.subpackages.map((sub: any) => ({ name: sub.name || '' }))
                      : []
                  }))
                : []
            }))
          : [];
        
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          createdAt: data.createdAt || new Date().toISOString(),
          packages,
        };
      }) as Project[];
      setProjects(projectList);
    })();
  }, []);

  // 建立專案
  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: projectName.trim(),
        description: projectDescription.trim(),
        createdAt: new Date().toISOString(),
        packages: [],
      });
      const newProject: Project = {
        id: docRef.id,
        name: projectName.trim(),
        description: projectDescription.trim(),
        createdAt: new Date().toISOString(),
        packages: [],
      };
      setProjects(prev => [newProject, ...prev]);
      setProjectName('');
      setProjectDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error('建立專案失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新增工作包
  const handleAddPackage = async (projectId: string, pkgName: string) => {
    if (!pkgName.trim()) return;
    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = [
        ...project.packages,
        { name: pkgName.trim(), tasks: [] }
      ];
      await updateProjectPackages(projectId, updatedPackages);
      setPkgInputs(prev => ({ ...prev, [projectId]: '' }));
    } finally {
      setLoading(false);
    }
  };

  // 新增任務
  const handleAddTask = async (projectId: string, pkgIdx: number, taskName: string) => {
    if (!taskName.trim()) return;
    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = project.packages.map((pkg, idx) =>
        idx === pkgIdx
          ? { ...pkg, tasks: [...pkg.tasks, { subpackages: [] }] }
          : pkg
      );
      await updateProjectPackages(projectId, updatedPackages);
      setTaskInputs(prev => ({
        ...prev,
        [projectId]: { ...prev[projectId], [pkgIdx]: '' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 新增子工作包
  const handleAddSubpackage = async (projectId: string, pkgIdx: number, taskIdx: number, subName: string) => {
    if (!subName.trim()) return;
    setLoading(true);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const updatedPackages = project.packages.map((pkg, i) =>
        i === pkgIdx
          ? {
              ...pkg,
              tasks: pkg.tasks.map((task, j) =>
                j === taskIdx
                  ? { ...task, subpackages: [...task.subpackages, { name: subName.trim() }] }
                  : task
              )
            }
          : pkg
      );
      await updateProjectPackages(projectId, updatedPackages);
      setSubInputs(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [pkgIdx]: { ...prev[projectId]?.[pkgIdx], [taskIdx]: '' }
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Firestore 更新 packages 共用方法
  const updateProjectPackages = async (projectId: string, packages: Package[]) => {
    await updateDoc(doc(db, 'projects', projectId), { packages });
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, packages } : p))
    );
  };

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">專案管理</h1>
      
      {/* 建立專案表單 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>建立新專案</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="專案名稱"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="mb-2"
            />
            <Input
              placeholder="專案描述（選填）"
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
              className="mb-4"
            />
            <Button 
              onClick={handleCreateProject} 
              disabled={loading || !projectName.trim()}
              className="w-full"
            >
              {loading ? '建立中...' : '建立專案'}
            </Button>
            {success && (
              <p className="text-green-600 text-center mt-2">專案建立成功！</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 專案列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">專案列表</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">尚無專案</p>
        ) : (
          projects.map(project => (
            <Card key={project.id}>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-600 mt-1">{project.description}</p>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  建立時間：{new Date(project.createdAt).toLocaleString('zh-TW')}
                </p>
                {/* 新增工作包表單 */}
                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="新增工作包名稱"
                    value={pkgInputs[project.id] || ''}
                    onChange={e => setPkgInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                    className="w-40"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddPackage(project.id, pkgInputs[project.id] || '')}
                    disabled={loading || !(pkgInputs[project.id] || '').trim()}
                  >新增工作包</Button>
                </div>
                {/* 工作包列表 */}
                <ul className="mt-2 space-y-2">
                  {project.packages?.map((pkg, pkgIdx) => (
                    <li key={pkgIdx} className="border rounded p-2">
                      <div className="font-medium">{pkg.name}</div>
                      {/* 新增任務表單 */}
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="新增任務"
                          value={taskInputs[project.id]?.[pkgIdx] || ''}
                          onChange={e => setTaskInputs(prev => ({
                            ...prev,
                            [project.id]: { ...prev[project.id], [pkgIdx]: e.target.value }
                          }))}
                          className="w-40"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddTask(project.id, pkgIdx, taskInputs[project.id]?.[pkgIdx] || '')}
                          disabled={loading || !(taskInputs[project.id]?.[pkgIdx] || '').trim()}
                        >新增任務</Button>
                      </div>
                      {/* 任務列表 */}
                      <ul className="ml-4 mt-2 space-y-2">
                        {pkg.tasks?.map((task, taskIdx) => (
                          <li key={taskIdx} className="border rounded p-2">
                            <div className="font-medium">任務 {taskIdx + 1}</div>
                            {/* 新增子工作包表單 */}
                            <div className="flex gap-2 mt-2">
                              <Input
                                placeholder="新增子工作包名稱"
                                value={subInputs[project.id]?.[pkgIdx]?.[taskIdx] || ''}
                                onChange={e => setSubInputs(prev => ({
                                  ...prev,
                                  [project.id]: {
                                    ...prev[project.id],
                                    [pkgIdx]: {
                                      ...prev[project.id]?.[pkgIdx],
                                      [taskIdx]: e.target.value
                                    }
                                  }
                                }))}
                                className="w-40"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddSubpackage(project.id, pkgIdx, taskIdx, subInputs[project.id]?.[pkgIdx]?.[taskIdx] || '')}
                                disabled={loading || !(subInputs[project.id]?.[pkgIdx]?.[taskIdx] || '').trim()}
                              >新增子工作包</Button>
                            </div>
                            {/* 子工作包列表 */}
                            <ul className="ml-4 mt-2 list-disc">
                              {task.subpackages?.map((sub, subIdx) => (
                                <li key={subIdx}>{sub.name}</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
} 