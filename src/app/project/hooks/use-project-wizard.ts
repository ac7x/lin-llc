import { useState } from 'react';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { Project, Package, Subpackage, TaskPackage } from '../types';

interface ProjectWizardConfig {
  name: string;
  createPackages: boolean;
  packageCount: number;
  createSubpackages: boolean;
  subpackageCount: number;
  createTasks: boolean;
  taskCount: number;
}

/**
 * 專案建立精靈 Hook
 */
export function useProjectWizard() {
  const [loading, setLoading] = useState(false);
  const { user } = useGoogleAuth();

  const createProject = async (config: ProjectWizardConfig): Promise<Project> => {
    if (!user?.uid) {
      throw new Error('用戶未登入');
    }

    setLoading(true);

    try {
      // 建立專案資料結構
      const now = new Date().toISOString();
      const project: Omit<Project, 'id'> = {
        name: config.name,
        description: '',
        packages: [],
        createdAt: now,
        completed: 0,
        total: 0,
        progress: 0,
      };

      // 如果需要建立包
      if (config.createPackages) {
        const packages: Package[] = [];

        for (let i = 0; i < config.packageCount; i++) {
          const packageData: Package = {
            name: `工作包 ${i + 1}`,
            subpackages: [],
            completed: 0,
            total: 0,
            progress: 0,
          };

          // 如果需要建立子包
          if (config.createSubpackages) {
            for (let j = 0; j < config.subpackageCount; j++) {
              const subpackage: Subpackage = {
                name: `子工作包 ${i + 1}-${j + 1}`,
                taskpackages: [],
                completed: 0,
                total: 0,
                progress: 0,
              };

              // 如果需要建立任務
              if (config.createTasks) {
                for (let k = 0; k < config.taskCount; k++) {
                  const task: TaskPackage = {
                    name: `任務 ${i + 1}-${j + 1}-${k + 1}`,
                    total: 1,
                    completed: 0,
                    progress: 0,
                    submitters: [],
                    reviewers: [],
                  };

                  subpackage.taskpackages.push(task);
                }
                subpackage.total = config.taskCount;
              }

              packageData.subpackages.push(subpackage);
            }
            packageData.total = packageData.subpackages.reduce((sum, sub) => sum + sub.total, 0);
          }

          packages.push(packageData);
        }

        project.total = packages.reduce((sum, pkg) => sum + pkg.total, 0);

        project.packages = packages;
      }

      // 儲存到 Firestore
      const projectsRef = collection(db, 'projects');
      const docRef = await addDoc(projectsRef, {
        ...project,
        updatedAt: now,
      });

      const createdProject: Project = {
        ...project,
        id: docRef.id,
      };

      return createdProject;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProject,
    loading,
  };
} 