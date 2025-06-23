/**
 * 儀表板專案統計數據的介面
 */
export interface ProjectStats {
  id: string;
  name: string;
  progress: number;
}

/**
 * 活動日誌項目的介面
 */
export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  details?: Record<string, any>;
}
