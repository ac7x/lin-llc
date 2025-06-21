import type { 
  ProjectStatus, 
  ProjectType, 
  ProjectPriority, 
  ProjectRiskLevel, 
  ProjectHealthLevel, 
  ProjectPhase 
} from '../types/project';

// ============================================================================
// 專案狀態選項
// ============================================================================

export const PROJECT_STATUS_OPTIONS = [
  { value: 'planning', label: '規劃中' },
  { value: 'approved', label: '已核准' },
  { value: 'in-progress', label: '執行中' },
  { value: 'on-hold', label: '暫停中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'archived', label: '已封存' },
] as const;

// ============================================================================
// 專案類型選項
// ============================================================================

export const PROJECT_TYPE_OPTIONS = [
  { value: 'system', label: '系統工程' },
  { value: 'maintenance', label: '維護工程' },
  { value: 'transport', label: '搬運工程' },
] as const;

// ============================================================================
// 專案優先級選項
// ============================================================================

export const PROJECT_PRIORITY_OPTIONS = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '緊急' },
] as const;

// ============================================================================
// 專案風險等級選項
// ============================================================================

export const PROJECT_RISK_LEVEL_OPTIONS = [
  { value: 'low', label: '低風險' },
  { value: 'medium', label: '中風險' },
  { value: 'high', label: '高風險' },
  { value: 'critical', label: '極高風險' },
] as const;

// ============================================================================
// 專案健康度選項
// ============================================================================

export const PROJECT_HEALTH_LEVEL_OPTIONS = [
  { value: 'excellent', label: '優秀' },
  { value: 'good', label: '良好' },
  { value: 'fair', label: '一般' },
  { value: 'poor', label: '不佳' },
  { value: 'critical', label: '危急' },
] as const;

// ============================================================================
// 專案階段選項
// ============================================================================

export const PROJECT_PHASE_OPTIONS = [
  { value: 'initiation', label: '啟動' },
  { value: 'planning', label: '規劃' },
  { value: 'execution', label: '執行' },
  { value: 'monitoring', label: '監控' },
  { value: 'closure', label: '收尾' },
] as const;

// ============================================================================
// 標籤對應函數
// ============================================================================

export const getStatusLabel = (status: ProjectStatus): string => {
  const option = PROJECT_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label || status;
};

export const getTypeLabel = (type: ProjectType): string => {
  const option = PROJECT_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.label || type;
};

export const getPriorityLabel = (priority: ProjectPriority): string => {
  const option = PROJECT_PRIORITY_OPTIONS.find(opt => opt.value === priority);
  return option?.label || priority;
};

export const getRiskLevelLabel = (riskLevel: ProjectRiskLevel): string => {
  const option = PROJECT_RISK_LEVEL_OPTIONS.find(opt => opt.value === riskLevel);
  return option?.label || riskLevel;
};

export const getHealthLevelLabel = (healthLevel: ProjectHealthLevel): string => {
  const option = PROJECT_HEALTH_LEVEL_OPTIONS.find(opt => opt.value === healthLevel);
  return option?.label || healthLevel;
};

export const getPhaseLabel = (phase: ProjectPhase): string => {
  const option = PROJECT_PHASE_OPTIONS.find(opt => opt.value === phase);
  return option?.label || phase;
}; 