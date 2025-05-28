// src/modules/shared/domain/enums/project-status.ts

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  ON_HOLD = 'onHold',
}

// 中英文對照 (optional)
export const ProjectStatusLabelMap: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: '規劃中',
  [ProjectStatus.IN_PROGRESS]: '進行中',
  [ProjectStatus.COMPLETED]: '已完成',
  [ProjectStatus.ON_HOLD]: '暫停中',
};
