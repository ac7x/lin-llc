/**
 * 專案合約管理頁面
 * 
 * 提供專案合約的完整管理功能：
 * - 合約列表顯示
 * - 合約狀態追蹤
 * - 合約文件管理
 * - 合約分析統計
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

import { PageContainer, PageHeader } from '@/app/modules/projects/components/common';
import { projectStyles } from '@/app/modules/projects/styles';
import { useProjectContracts } from '@/app/modules/projects/hooks/useProjectContracts';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/classNameUtils';

// 合約狀態標籤組件
function ContractStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    draft: { label: '草稿', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    pending: { label: '待審核', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' },
    active: { label: '執行中', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' },
    completed: { label: '已完成', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' },
    cancelled: { label: '已取消', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' },
    expired: { label: '已過期', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.className
    )}>
      {config.label}
    </span>
  );
}

// 統計卡片組件
function StatCard({ title, value, subtitle, icon }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center">
        {icon && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          </div>
        )}
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    contracts,
    loading,
    error,
    contractStats,
    upcomingContracts,
    overduePayments,
    upcomingMilestones,
    selectedContract,
    setSelectedContract,
    addContract,
    updateContract,
    deleteContract,
    updateContractStatus,
    clearError,
  } = useProjectContracts();

  // 搜尋和篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 篩選和排序後的合約
  const filteredContracts = useMemo(() => {
    let filtered = contracts;

    // 搜尋篩選
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contract =>
        contract.contractName.toLowerCase().includes(term) ||
        contract.contractNumber.toLowerCase().includes(term) ||
        contract.clientName.toLowerCase().includes(term)
      );
    }

    // 狀態篩選
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'contractName':
          aValue = a.contractName;
          bValue = b.contractName;
          break;
        case 'clientName':
          aValue = a.clientName;
          bValue = b.clientName;
          break;
        case 'estimatedValue':
          aValue = a.estimatedValue;
          bValue = b.estimatedValue;
          break;
        case 'startDate':
          aValue = a.startDate;
          bValue = b.startDate;
          break;
        case 'endDate':
          aValue = a.endDate;
          bValue = b.endDate;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contracts, searchTerm, statusFilter, sortBy, sortOrder]);

  // 處理排序
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // 處理合約狀態更新
  const handleStatusUpdate = async (contractId: string, newStatus: string) => {
    try {
      await updateContractStatus(contractId, newStatus as any);
    } catch (err) {
      console.error('更新合約狀態失敗:', err);
    }
  };

  if (authLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              需要登入
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              請先登入以查看合約管理頁面
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="專案合約管理"
        subtitle="管理專案相關的合約、追蹤狀態和分析統計"
      >
        <div className="flex space-x-2">
          <Link href="/contracts/add" className={projectStyles.button.primary}>
            新增合約
          </Link>
        </div>
      </PageHeader>

      {/* 錯誤顯示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="總合約數"
          value={contractStats.totalContracts}
          subtitle="所有合約"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="執行中合約"
          value={contractStats.activeContracts}
          subtitle="正在執行"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="總合約金額"
          value={`NT$ ${contractStats.totalValue.toLocaleString()}`}
          subtitle="所有合約總值"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
        <StatCard
          title="逾期付款"
          value={contractStats.overduePayments}
          subtitle="需要處理"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
      </div>

      {/* 篩選和搜尋 */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜尋合約名稱、編號或客戶..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有狀態</option>
              <option value="draft">草稿</option>
              <option value="pending">待審核</option>
              <option value="active">執行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
              <option value="expired">已過期</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt-desc">建立日期 (新到舊)</option>
              <option value="createdAt-asc">建立日期 (舊到新)</option>
              <option value="contractName-asc">合約名稱 (A-Z)</option>
              <option value="contractName-desc">合約名稱 (Z-A)</option>
              <option value="estimatedValue-desc">合約金額 (高到低)</option>
              <option value="estimatedValue-asc">合約金額 (低到高)</option>
              <option value="endDate-asc">結束日期 (近到遠)</option>
              <option value="endDate-desc">結束日期 (遠到近)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 合約列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('contractName')}>
                  合約資訊
                  {sortBy === 'contractName' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('clientName')}>
                  客戶
                  {sortBy === 'clientName' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('estimatedValue')}>
                  合約金額
                  {sortBy === 'estimatedValue' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">載入中...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">尚無合約資料</p>
                      <Link href="/contracts/add" className="mt-2 text-blue-600 dark:text-blue-400 hover:underline">
                        新增第一個合約
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {contract.contractName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {contract.contractNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {contract.clientName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {contract.clientContact}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        NT$ {contract.estimatedValue.toLocaleString()}
                      </div>
                      {contract.actualValue > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          實際: NT$ {contract.actualValue.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {contract.startDate.toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        至 {contract.endDate.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ContractStatusBadge status={contract.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          查看
                        </Link>
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        >
                          編輯
                        </button>
                        <select
                          value={contract.status}
                          onChange={(e) => handleStatusUpdate(contract.id, e.target.value)}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="draft">草稿</option>
                          <option value="pending">待審核</option>
                          <option value="active">執行中</option>
                          <option value="completed">已完成</option>
                          <option value="cancelled">已取消</option>
                          <option value="expired">已過期</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 即將到期合約提醒 */}
      {upcomingContracts.length > 0 && (
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            即將到期的合約
          </h3>
          <div className="space-y-2">
            {upcomingContracts.slice(0, 3).map((contract) => (
              <div key={contract.id} className="flex justify-between items-center text-sm">
                <span className="text-yellow-700 dark:text-yellow-300">
                  {contract.contractName} - {contract.clientName}
                </span>
                <span className="text-yellow-600 dark:text-yellow-400">
                  到期: {contract.endDate.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 逾期付款提醒 */}
      {overduePayments.length > 0 && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            逾期付款提醒
          </h3>
          <div className="space-y-2">
            {overduePayments.slice(0, 3).map(({ contract, payment }) => (
              <div key={payment.id} className="flex justify-between items-center text-sm">
                <span className="text-red-700 dark:text-red-300">
                  {contract.contractName} - {payment.paymentNumber}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  NT$ {payment.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
