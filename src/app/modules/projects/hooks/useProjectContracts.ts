/**
 * 專案合約 Hook
 * 
 * 提供專案合約相關功能：
 * - 合約管理
 * - 合約狀態追蹤
 * - 合約文件管理
 * - 合約分析
 */

import { useState, useEffect, useCallback } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, doc, updateDoc, deleteDoc, addDoc, query, where, orderBy } from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import { useAuth } from '@/hooks/useAuth';

// 合約型別
export interface ProjectContract {
  id: string;
  contractNumber: string;
  contractName: string;
  contractType: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
  clientName: string;
  clientContact: string;
  startDate: Date;
  endDate: Date;
  estimatedValue: number;
  actualValue: number;
  description: string;
  terms: string;
  attachments: ContractAttachment[];
  milestones: ContractMilestone[];
  payments: ContractPayment[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo: string;
}

// 合約附件
export interface ContractAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

// 合約里程碑
export interface ContractMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  paymentPercentage: number;
  deliverables: string[];
}

// 合約付款
export interface ContractPayment {
  id: string;
  paymentNumber: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod: string;
  reference: string;
  notes: string;
}

// 合約統計
export interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  cancelledContracts: number;
  totalValue: number;
  averageValue: number;
  overduePayments: number;
  upcomingMilestones: number;
}

export function useProjectContracts() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<ProjectContract | null>(null);

  // 載入合約數據
  const [contractsSnapshot, contractsLoading, contractsError] = useCollection(
    collection(db, 'contracts')
  );

  // 處理錯誤
  const handleError = useCallback((err: Error, operation: string) => {
    console.error(`合約管理錯誤 (${operation}):`, err);
    setError(`${operation} 失敗: ${err.message}`);
  }, []);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 處理 useCollection 錯誤
  useEffect(() => {
    if (contractsError) {
      setError(`載入合約失敗: ${contractsError.message}`);
    }
  }, [contractsError]);

  // 取得所有合約
  const contracts = contractsSnapshot?.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // 轉換 Firestore Timestamp 到 Date
      startDate: data.startDate?.toDate ? data.startDate.toDate() : data.startDate,
      endDate: data.endDate?.toDate ? data.endDate.toDate() : data.endDate,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      // 轉換附件中的日期
      attachments: (data.attachments || []).map((attachment: any) => ({
        ...attachment,
        uploadedAt: attachment.uploadedAt?.toDate ? attachment.uploadedAt.toDate() : attachment.uploadedAt,
      })),
      // 轉換里程碑中的日期
      milestones: (data.milestones || []).map((milestone: any) => ({
        ...milestone,
        dueDate: milestone.dueDate?.toDate ? milestone.dueDate.toDate() : milestone.dueDate,
        completedDate: milestone.completedDate?.toDate ? milestone.completedDate.toDate() : milestone.completedDate,
      })),
      // 轉換付款中的日期
      payments: (data.payments || []).map((payment: any) => ({
        ...payment,
        dueDate: payment.dueDate?.toDate ? payment.dueDate.toDate() : payment.dueDate,
        paidDate: payment.paidDate?.toDate ? payment.paidDate.toDate() : payment.paidDate,
      })),
    };
  }) as ProjectContract[] || [];

  // 新增合約
  const addContract = useCallback(async (contractData: Omit<ProjectContract, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setLoading(true);
      const now = new Date();
      
      const newContract = {
        ...contractData,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
      };

      const docRef = await addDoc(collection(db, 'contracts'), newContract);
      return docRef.id;
    } catch (err) {
      handleError(err as Error, '新增合約');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  // 更新合約
  const updateContract = useCallback(async (contractId: string, updates: Partial<ProjectContract>) => {
    try {
      setLoading(true);
      const contractRef = doc(db, 'contracts', contractId);
      
      await updateDoc(contractRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (err) {
      handleError(err as Error, '更新合約');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // 刪除合約
  const deleteContract = useCallback(async (contractId: string) => {
    try {
      setLoading(true);
      const contractRef = doc(db, 'contracts', contractId);
      await deleteDoc(contractRef);
    } catch (err) {
      handleError(err as Error, '刪除合約');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // 更新合約狀態
  const updateContractStatus = useCallback(async (contractId: string, status: ProjectContract['status']) => {
    try {
      await updateContract(contractId, { status });
    } catch (err) {
      handleError(err as Error, '更新合約狀態');
      throw err;
    }
  }, [updateContract, handleError]);

  // 新增合約附件
  const addContractAttachment = useCallback(async (
    contractId: string, 
    attachment: Omit<ContractAttachment, 'id' | 'uploadedAt'>
  ) => {
    if (!user) return;

    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) throw new Error('合約不存在');

      const newAttachment: ContractAttachment = {
        ...attachment,
        id: Date.now().toString(),
        uploadedAt: new Date(),
        uploadedBy: user.uid,
      };

      const updatedAttachments = [...contract.attachments, newAttachment];
      await updateContract(contractId, { attachments: updatedAttachments });
    } catch (err) {
      handleError(err as Error, '新增附件');
      throw err;
    }
  }, [contracts, updateContract, user, handleError]);

  // 刪除合約附件
  const deleteContractAttachment = useCallback(async (contractId: string, attachmentId: string) => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) throw new Error('合約不存在');

      const updatedAttachments = contract.attachments.filter(a => a.id !== attachmentId);
      await updateContract(contractId, { attachments: updatedAttachments });
    } catch (err) {
      handleError(err as Error, '刪除附件');
      throw err;
    }
  }, [contracts, updateContract, handleError]);

  // 新增合約里程碑
  const addContractMilestone = useCallback(async (
    contractId: string, 
    milestone: Omit<ContractMilestone, 'id'>
  ) => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) throw new Error('合約不存在');

      const newMilestone: ContractMilestone = {
        ...milestone,
        id: Date.now().toString(),
      };

      const updatedMilestones = [...contract.milestones, newMilestone];
      await updateContract(contractId, { milestones: updatedMilestones });
    } catch (err) {
      handleError(err as Error, '新增里程碑');
      throw err;
    }
  }, [contracts, updateContract, handleError]);

  // 更新里程碑狀態
  const updateMilestoneStatus = useCallback(async (
    contractId: string, 
    milestoneId: string, 
    status: ContractMilestone['status'],
    completedDate?: Date
  ) => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) throw new Error('合約不存在');

      const updatedMilestones = contract.milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, status, completedDate: status === 'completed' ? completedDate || new Date() : undefined }
          : m
      );

      await updateContract(contractId, { milestones: updatedMilestones });
    } catch (err) {
      handleError(err as Error, '更新里程碑狀態');
      throw err;
    }
  }, [contracts, updateContract, handleError]);

  // 新增合約付款
  const addContractPayment = useCallback(async (
    contractId: string, 
    payment: Omit<ContractPayment, 'id'>
  ) => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) throw new Error('合約不存在');

      const newPayment: ContractPayment = {
        ...payment,
        id: Date.now().toString(),
      };

      const updatedPayments = [...contract.payments, newPayment];
      await updateContract(contractId, { payments: updatedPayments });
    } catch (err) {
      handleError(err as Error, '新增付款');
      throw err;
    }
  }, [contracts, updateContract, handleError]);

  // 更新付款狀態
  const updatePaymentStatus = useCallback(async (
    contractId: string, 
    paymentId: string, 
    status: ContractPayment['status'],
    paidDate?: Date
  ) => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) throw new Error('合約不存在');

      const updatedPayments = contract.payments.map(p => 
        p.id === paymentId 
          ? { ...p, status, paidDate: status === 'paid' ? paidDate || new Date() : undefined }
          : p
      );

      await updateContract(contractId, { payments: updatedPayments });
    } catch (err) {
      handleError(err as Error, '更新付款狀態');
      throw err;
    }
  }, [contracts, updateContract, handleError]);

  // 計算合約統計
  const calculateContractStats = useCallback((): ContractStats => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const cancelledContracts = contracts.filter(c => c.status === 'cancelled').length;
    
    const totalValue = contracts.reduce((sum, c) => sum + (c.estimatedValue || 0), 0);
    const averageValue = totalContracts > 0 ? totalValue / totalContracts : 0;
    
    const overduePayments = contracts.reduce((sum, c) => 
      sum + c.payments.filter(p => p.status === 'overdue').length, 0
    );
    
    const upcomingMilestones = contracts.reduce((sum, c) => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return sum + c.milestones.filter(m => 
        m.status === 'pending' && m.dueDate <= thirtyDaysFromNow
      ).length;
    }, 0);

    return {
      totalContracts,
      activeContracts,
      completedContracts,
      cancelledContracts,
      totalValue,
      averageValue,
      overduePayments,
      upcomingMilestones,
    };
  }, [contracts]);

  // 取得即將到期的合約
  const getUpcomingContracts = useCallback(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return contracts.filter(c => 
      c.status === 'active' && c.endDate <= thirtyDaysFromNow
    );
  }, [contracts]);

  // 取得逾期付款
  const getOverduePayments = useCallback(() => {
    const now = new Date();
    const overduePayments: Array<{ contract: ProjectContract; payment: ContractPayment }> = [];
    
    contracts.forEach(contract => {
      contract.payments.forEach(payment => {
        if (payment.status === 'pending' && payment.dueDate < now) {
          overduePayments.push({ contract, payment });
        }
      });
    });
    
    return overduePayments;
  }, [contracts]);

  // 取得即將到期的里程碑
  const getUpcomingMilestones = useCallback(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingMilestones: Array<{ contract: ProjectContract; milestone: ContractMilestone }> = [];
    
    contracts.forEach(contract => {
      contract.milestones.forEach(milestone => {
        if (milestone.status === 'pending' && milestone.dueDate <= thirtyDaysFromNow) {
          upcomingMilestones.push({ contract, milestone });
        }
      });
    });
    
    return upcomingMilestones;
  }, [contracts]);

  return {
    // 狀態
    loading: loading || contractsLoading,
    error,
    
    // 數據
    contracts,
    selectedContract,
    setSelectedContract,
    
    // 統計
    contractStats: calculateContractStats(),
    upcomingContracts: getUpcomingContracts(),
    overduePayments: getOverduePayments(),
    upcomingMilestones: getUpcomingMilestones(),
    
    // 操作
    addContract,
    updateContract,
    deleteContract,
    updateContractStatus,
    addContractAttachment,
    deleteContractAttachment,
    addContractMilestone,
    updateMilestoneStatus,
    addContractPayment,
    updatePaymentStatus,
    clearError,
  };
}
