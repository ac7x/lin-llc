/**
 * 風險管理器組件
 * 
 * 提供風險管理和追蹤功能，包括：
 * - 風險列表顯示
 * - 風險評估和評分
 * - 風險緩解計劃
 * - 風險統計和趨勢
 */

'use client';

import { useState, useMemo } from 'react';

import { projectStyles } from '@/app/test-projects/styles';
import type { ProjectRisk } from '@/app/test-projects/types';

interface RiskManagerProps {
  risks: ProjectRisk[];
  projectId: string;
  onAddRisk?: () => void;
  onEditRisk?: (risk: ProjectRisk) => void;
  onDeleteRisk?: (riskId: string) => void;
  onUpdateRiskStatus?: (riskId: string, status: string) => void;
}

type SortOption = 'riskLevel' | 'probability' | 'impact' | 'status' | 'dueDate';
type SortDirection = 'asc' | 'desc';

export default function RiskManager({
  risks,
  projectId: _projectId,
  onAddRisk,
  onEditRisk,
  onDeleteRisk,
  onUpdateRiskStatus: _onUpdateRiskStatus,
}: RiskManagerProps) {
  const [sortBy, setSortBy] = useState<SortOption>('riskLevel');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identified':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'monitoring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'mitigated':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return '極高';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'identified':
        return '已識別';
      case 'monitoring':
        return '監控中';
      case 'mitigated':
        return '已緩解';
      case 'closed':
        return '已關閉';
      default:
        return '未知';
    }
  };

  const getProbabilityText = (probability: string) => {
    switch (probability) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  const getImpactText = (impact: string) => {
    switch (impact) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  // 計算風險評分
  const calculateRiskScore = (risk: ProjectRisk): number => {
    const probabilityWeight = risk.probability === 'high' ? 5 : risk.probability === 'medium' ? 3 : 1;
    const impactWeight = risk.impact === 'high' ? 5 : risk.impact === 'medium' ? 3 : 1;
    return probabilityWeight * impactWeight;
  };

  // 篩選和排序風險
  const filteredAndSortedRisks = useMemo(() => {
    const filtered = risks.filter(risk => {
      // 狀態篩選
      if (statusFilter !== 'all' && risk.status !== statusFilter) {
        return false;
      }

      // 風險等級篩選
      if (riskLevelFilter !== 'all' && risk.riskLevel !== riskLevelFilter) {
        return false;
      }

      // 搜尋篩選
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          risk.title.toLowerCase().includes(lowerSearchTerm) ||
          risk.description.toLowerCase().includes(lowerSearchTerm) ||
          (risk.assignedTo && risk.assignedTo.toLowerCase().includes(lowerSearchTerm))
        );
      }

      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'riskLevel':
          aValue = a.riskLevel || '';
          bValue = b.riskLevel || '';
          break;
        case 'probability':
          aValue = a.probability || '';
          bValue = b.probability || '';
          break;
        case 'impact':
          aValue = a.impact || '';
          bValue = b.impact || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'dueDate':
          aValue = a.dueDate ? 
            (typeof a.dueDate === 'object' && 'toDate' in a.dueDate
              ? (a.dueDate as { toDate: () => Date }).toDate().toISOString()
              : a.dueDate.toString()
            ) : '';
          bValue = b.dueDate ? 
            (typeof b.dueDate === 'object' && 'toDate' in b.dueDate
              ? (b.dueDate as { toDate: () => Date }).toDate().toISOString()
              : b.dueDate.toString()
            ) : '';
          break;
        default:
          aValue = a.riskLevel || '';
          bValue = b.riskLevel || '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        return 0;
      }
    });

    return filtered;
  }, [risks, sortBy, sortDirection, statusFilter, riskLevelFilter, searchTerm]);

  // 計算統計資訊
  const stats = useMemo(() => {
    const total = risks.length;
    const critical = risks.filter(risk => risk.riskLevel === 'critical').length;
    const high = risks.filter(risk => risk.riskLevel === 'high').length;
    const active = risks.filter(risk => risk.status !== 'closed').length;
    const mitigated = risks.filter(risk => risk.status === 'mitigated').length;
    const averageScore = risks.length > 0 
      ? Math.round(risks.reduce((sum, risk) => sum + calculateRiskScore(risk), 0) / risks.length)
      : 0;

    return {
      total,
      critical,
      high,
      active,
      mitigated,
      averageScore,
    };
  }, [risks]);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatDate = (date: string | Date | { toDate: () => Date } | null) => {
    if (!date) return '-';
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('zh-TW');
    }
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString('zh-TW');
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('zh-TW');
    }
    return '-';
  };

  return (
    <div className='space-y-6'>
      {/* 統計資訊 */}
      <div className='grid grid-cols-2 md:grid-cols-6 gap-4'>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{stats.total}</div>
          <div className='text-sm text-blue-600 dark:text-blue-400'>總風險數</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-red-600 dark:text-red-400'>{stats.critical}</div>
          <div className='text-sm text-red-600 dark:text-red-400'>極高風險</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>{stats.high}</div>
          <div className='text-sm text-orange-600 dark:text-orange-400'>高風險</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>{stats.active}</div>
          <div className='text-sm text-yellow-600 dark:text-yellow-400'>活躍風險</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>{stats.mitigated}</div>
          <div className='text-sm text-green-600 dark:text-green-400'>已緩解</div>
        </div>
        <div className={projectStyles.card.stats}>
          <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>{stats.averageScore}</div>
          <div className='text-sm text-purple-600 dark:text-purple-400'>平均評分</div>
        </div>
      </div>

      {/* 控制列 */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* 搜尋 */}
          <div className='relative'>
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='搜尋風險...'
              className={projectStyles.form.search}
            />
            <svg
              className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
          </div>

          {/* 狀態篩選 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>全部狀態</option>
            <option value='identified'>已識別</option>
            <option value='monitoring'>監控中</option>
            <option value='mitigated'>已緩解</option>
            <option value='closed'>已關閉</option>
          </select>

          {/* 風險等級篩選 */}
          <select
            value={riskLevelFilter}
            onChange={(e) => setRiskLevelFilter(e.target.value)}
            className={projectStyles.form.select}
          >
            <option value='all'>全部等級</option>
            <option value='critical'>極高</option>
            <option value='high'>高</option>
            <option value='medium'>中</option>
            <option value='low'>低</option>
          </select>
        </div>

        {/* 新增按鈕 */}
        {onAddRisk && (
          <button
            onClick={onAddRisk}
            className={projectStyles.button.primary}
          >
            <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            新增風險
          </button>
        )}
      </div>

      {/* 排序選項 */}
      <div className='flex flex-wrap gap-2'>
        {[
          { key: 'riskLevel', label: '風險等級' },
          { key: 'probability', label: '發生機率' },
          { key: 'impact', label: '影響程度' },
          { key: 'status', label: '狀態' },
          { key: 'dueDate', label: '到期日' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSort(key as SortOption)}
            className={`${projectStyles.button.small} flex items-center gap-1 ${
              sortBy === key ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''
            }`}
          >
            {label} {getSortIcon(key as SortOption)}
          </button>
        ))}
      </div>

      {/* 風險列表 */}
      {filteredAndSortedRisks.length === 0 ? (
        <div className={projectStyles.card.base}>
          <div className='text-center py-8'>
            <svg className='w-12 h-12 text-gray-400 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <p className='text-gray-500 dark:text-gray-400 mb-2'>
              {searchTerm || statusFilter !== 'all' || riskLevelFilter !== 'all' ? '沒有符合條件的風險' : '尚未識別風險'}
            </p>
            {onAddRisk && (
              <button
                onClick={onAddRisk}
                className={projectStyles.button.outline}
              >
                新增第一個風險
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredAndSortedRisks.map((risk) => (
            <div key={risk.id} className={projectStyles.card.base}>
              <div className='flex justify-between items-start mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      {risk.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(risk.riskLevel)}`}>
                      {getRiskLevelText(risk.riskLevel)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(risk.status)}`}>
                      {getStatusText(risk.status)}
                    </span>
                  </div>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                    {risk.description}
                  </p>
                  <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
                    <span>機率: {getProbabilityText(risk.probability)}</span>
                    <span>影響: {getImpactText(risk.impact)}</span>
                    <span>評分: {calculateRiskScore(risk)}</span>
                    {risk.assignedTo && <span>負責人: {risk.assignedTo}</span>}
                    {risk.dueDate && <span>到期日: {formatDate(risk.dueDate)}</span>}
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  {onEditRisk && (
                    <button
                      onClick={() => onEditRisk(risk)}
                      className={projectStyles.button.edit}
                      title='編輯'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                      </svg>
                    </button>
                  )}
                  {onDeleteRisk && (
                    <button
                      onClick={() => onDeleteRisk(risk.id)}
                      className='p-2 text-red-600 hover:text-red-800 transition-colors duration-200'
                      title='刪除'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 緩解計劃 */}
              {risk.mitigationPlan && (
                <div className='mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                  <h4 className='text-sm font-medium text-blue-700 dark:text-blue-300 mb-1'>緩解計劃</h4>
                  <p className='text-sm text-blue-600 dark:text-blue-400'>{risk.mitigationPlan}</p>
                </div>
              )}

              {/* 應急計劃 */}
              {risk.contingencyPlan && (
                <div className='mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                  <h4 className='text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1'>應急計劃</h4>
                  <p className='text-sm text-yellow-600 dark:text-yellow-400'>{risk.contingencyPlan}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 結果統計 */}
      {filteredAndSortedRisks.length > 0 && (
        <div className='text-sm text-gray-500 dark:text-gray-400 text-center'>
          顯示 {filteredAndSortedRisks.length} 個風險
          {(searchTerm || statusFilter !== 'all' || riskLevelFilter !== 'all') && ` (共 ${risks.length} 個)`}
        </div>
      )}
    </div>
  );
}
