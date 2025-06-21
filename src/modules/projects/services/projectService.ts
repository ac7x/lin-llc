/**
 * 專案服務層
 * 
 * 處理專案相關的 CRUD 操作，包括：
 * - 專案建立、讀取、更新、刪除
 * - 專案狀態管理
 * - 專案成員管理
 * - 專案統計資料
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import type { 
  Project, 
  ProjectDocument, 
  ProjectFilters, 
  ProjectSortOption,
  ProjectStats,
  ProjectMember 
} from '@/modules/projects/types/project';
import { logError, safeAsync, retry } from '@/utils/errorUtils';

export class ProjectService {
  private static readonly COLLECTION_NAME = 'projects';

  /**
   * 建立新專案
   */
  static async createProject(projectData: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await safeAsync(async () => {
      const now = Timestamp.now();
      const project = {
        ...projectData,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await retry(() => addDoc(collection(db, this.COLLECTION_NAME), project), 3, 1000);
      return docRef.id;
    }, (error) => {
      logError(error, { operation: 'create_project' });
      throw error;
    });

    if (!result) {
      throw new Error('建立專案失敗');
    }

    return result;
  }

  /**
   * 根據 ID 取得專案
   */
  static async getProjectById(projectId: string): Promise<Project | null> {
    const result = await safeAsync(async () => {
      const docRef = doc(db, this.COLLECTION_NAME, projectId);
      const docSnap = await retry(() => getDoc(docRef), 3, 1000);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data() as Project;
    }, (error) => {
      logError(error, { operation: 'get_project_by_id', projectId });
      throw error;
    });

    return result;
  }

  /**
   * 取得所有專案
   */
  static async getAllProjects(): Promise<Project[]> {
    const result = await safeAsync(async () => {
      const querySnapshot = await retry(() => getDocs(collection(db, this.COLLECTION_NAME)), 3, 1000);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as unknown as Project));
    }, (error) => {
      logError(error, { operation: 'get_all_projects' });
      throw error;
    });

    return result || [];
  }

  /**
   * 根據篩選條件取得專案
   */
  static async getProjectsByFilters(
    filters: ProjectFilters,
    sortOption: ProjectSortOption = 'createdAt-desc',
    limitCount?: number
  ): Promise<ProjectDocument[]> {
    const result = await safeAsync(async () => {
      const constraints = [];

      // 添加篩選條件
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.projectType) {
        constraints.push(where('projectType', '==', filters.projectType));
      }
      if (filters.priority) {
        constraints.push(where('priority', '==', filters.priority));
      }
      if (filters.riskLevel) {
        constraints.push(where('riskLevel', '==', filters.riskLevel));
      }
      if (filters.healthLevel) {
        constraints.push(where('healthLevel', '==', filters.healthLevel));
      }
      if (filters.phase) {
        constraints.push(where('phase', '==', filters.phase));
      }
      if (filters.manager) {
        constraints.push(where('manager', '==', filters.manager));
      }
      if (filters.region) {
        constraints.push(where('region', '==', filters.region));
      }

      // 添加排序條件
      switch (sortOption) {
        case 'createdAt-asc':
          constraints.push(orderBy('createdAt', 'asc'));
          break;
        case 'createdAt-desc':
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'name-asc':
          constraints.push(orderBy('projectName', 'asc'));
          break;
        case 'name-desc':
          constraints.push(orderBy('projectName', 'desc'));
          break;
        case 'status-asc':
          constraints.push(orderBy('status', 'asc'));
          break;
        case 'status-desc':
          constraints.push(orderBy('status', 'desc'));
          break;
        case 'progress-asc':
          constraints.push(orderBy('progress', 'asc'));
          break;
        case 'progress-desc':
          constraints.push(orderBy('progress', 'desc'));
          break;
        default:
          constraints.push(orderBy('createdAt', 'desc'));
      }

      // 添加限制條件
      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(collection(db, this.COLLECTION_NAME), ...constraints);
      const querySnapshot = await retry(() => getDocs(q), 3, 1000);

      const projects = querySnapshot.docs.map((doc, idx) => ({
        ...doc.data(),
        id: doc.id,
        idx: idx + 1,
        createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || '未知',
      })) as ProjectDocument[];

      // 客戶端篩選（對於無法在 Firestore 查詢中處理的條件）
      let filteredProjects = projects;

      if (filters.searchTerm?.trim()) {
        const lowercasedFilter = filters.searchTerm.trim().toLowerCase();
        filteredProjects = filteredProjects.filter(
          project =>
            project.projectName.toLowerCase().includes(lowercasedFilter) ||
            String(project.contractId).toLowerCase().includes(lowercasedFilter) ||
            project.region?.toLowerCase().includes(lowercasedFilter)
        );
      }

      return filteredProjects;
    }, (error) => {
      logError(error, { operation: 'get_projects_by_filters', filters });
      throw error;
    });

    return result || [];
  }

  /**
   * 更新專案
   */
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    await safeAsync(async () => {
      const docRef = doc(db, this.COLLECTION_NAME, projectId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await retry(() => updateDoc(docRef, updateData), 3, 1000);
    }, (error) => {
      logError(error, { operation: 'update_project', projectId });
      throw error;
    });
  }

  /**
   * 刪除專案
   */
  static async deleteProject(projectId: string): Promise<void> {
    await safeAsync(async () => {
      const docRef = doc(db, this.COLLECTION_NAME, projectId);
      await retry(() => deleteDoc(docRef), 3, 1000);
    }, (error) => {
      logError(error, { operation: 'delete_project', projectId });
      throw error;
    });
  }

  /**
   * 取得專案統計資料
   */
  static async getProjectStats(): Promise<ProjectStats> {
    const result = await safeAsync(async () => {
      const querySnapshot = await retry(() => getDocs(collection(db, this.COLLECTION_NAME)), 3, 1000);
      
      const projects = querySnapshot.docs.map(doc => doc.data() as Project);
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const totalProjects = projects.length;
      const activeProjects = projects.filter(project => project.status === 'in-progress').length;
      const completedProjects = projects.filter(project => project.status === 'completed').length;
      const onHoldProjects = projects.filter(project => project.status === 'on-hold').length;
      
      const overdueProjects = projects.filter(project => {
        if (!project.estimatedEndDate) return false;
        const endDate = project.estimatedEndDate instanceof Timestamp 
          ? project.estimatedEndDate.toDate() 
          : new Date(project.estimatedEndDate);
        return endDate < now;
      }).length;

      const totalQualityIssues = projects.reduce((sum, project) => {
        const issues = project.issues || [];
        const qualityOrProgressIssues = issues.filter(issue => 
          (issue.type === 'quality' || issue.type === 'progress') && issue.status !== 'resolved'
        );
        return sum + qualityOrProgressIssues.length;
      }, 0);

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        onHoldProjects,
        overdueProjects,
        totalQualityIssues,
      };
    }, (error) => {
      logError(error, { operation: 'get_project_stats' });
      throw error;
    });

    if (!result) {
      throw new Error('取得專案統計資料失敗');
    }

    return result;
  }

  /**
   * 取得專案成員
   */
  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const result = await safeAsync(async () => {
      const project = await this.getProjectById(projectId);
      if (!project) return [];

      const memberIds = [
        project.manager,
        project.supervisor,
        project.safetyOfficer,
        project.costController,
      ].filter(Boolean) as string[];

      if (memberIds.length === 0) return [];

      const membersQuery = query(
        collection(db, 'members'),
        where('uid', 'in', memberIds)
      );
      
      const membersSnapshot = await retry(() => getDocs(membersQuery), 3, 1000);
      
      return membersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as ProjectMember[];
    }, (error) => {
      logError(error, { operation: 'get_project_members', projectId });
      throw error;
    });

    return result || [];
  }

  /**
   * 批次更新專案
   */
  static async batchUpdateProjects(updates: Array<{ id: string; updates: Partial<Project> }>): Promise<void> {
    await safeAsync(async () => {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      updates.forEach(({ id, updates: projectUpdates }) => {
        const docRef = doc(db, this.COLLECTION_NAME, id);
        batch.update(docRef, {
          ...projectUpdates,
          updatedAt: now,
        });
      });

      await retry(() => batch.commit(), 3, 1000);
    }, (error) => {
      logError(error, { operation: 'batch_update_projects' });
      throw error;
    });
  }
} 