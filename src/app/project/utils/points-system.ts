/**
 * 積分系統 - 任務完成自動獎勵
 * 最少代碼實現任務與積分關聯
 */

import { permissionService } from '@/app/settings/lib/permission-service';

/**
 * 積分規則配置
 */
export const POINTS_CONFIG = {
  // 任務完成積分
  TASK_COMPLETED: 10,           // 完成任務基礎積分
  TASK_REVIEWED: 5,             // 審核任務積分
  
  // 階層完成獎勵
  SUBPACKAGE_COMPLETED: 50,     // 子工作包完成獎勵
  PACKAGE_COMPLETED: 200,       // 工作包完成獎勵  
  PROJECT_COMPLETED: 1000,      // 專案完成獎勵
  
  // 品質獎勵
  PERFECT_SCORE: 20,            // 100% 完成度額外獎勵
  EARLY_COMPLETION: 15,         // 提前完成獎勵
  
  // 協作獎勵
  TEAM_BONUS: 5,                // 團隊協作獎勵（每個參與者）
} as const;

/**
 * 積分計算器
 */
export class PointsCalculator {
  /**
   * 計算任務完成積分
   * @param completed 完成數量
   * @param total 總數量
   * @param participantCount 參與人數
   */
  static calculateTaskPoints(completed: number, total: number, participantCount: number = 1): number {
    let points = POINTS_CONFIG.TASK_COMPLETED;
    
    // 完美完成獎勵
    if (completed === total && total > 0) {
      points += POINTS_CONFIG.PERFECT_SCORE;
    }
    
    // 團隊協作獎勵
    if (participantCount > 1) {
      points += POINTS_CONFIG.TEAM_BONUS * (participantCount - 1);
    }
    
    return points;
  }
  
  /**
   * 計算審核積分
   */
  static calculateReviewPoints(): number {
    return POINTS_CONFIG.TASK_REVIEWED;
  }
  
  /**
   * 計算階層完成獎勵
   */
  static calculateLevelCompletionPoints(level: 'subpackage' | 'package' | 'project'): number {
    switch (level) {
      case 'subpackage': return POINTS_CONFIG.SUBPACKAGE_COMPLETED;
      case 'package': return POINTS_CONFIG.PACKAGE_COMPLETED;
      case 'project': return POINTS_CONFIG.PROJECT_COMPLETED;
      default: return 0;
    }
  }
}

/**
 * 積分獎勵服務
 */
export class PointsRewardService {
  /**
   * 獎勵任務完成積分
   */
  static async rewardTaskCompletion(
    userIds: string[],
    taskName: string,
    completed: number,
    total: number
  ): Promise<void> {
    const points = PointsCalculator.calculateTaskPoints(completed, total, userIds.length);
    
    const promises = userIds.map(uid =>
      permissionService.addUserPoints(
        uid,
        points,
        `完成任務「${taskName}」(${completed}/${total})`
      )
    );
    
    await Promise.all(promises);
  }
  
  /**
   * 獎勵任務審核積分
   */
  static async rewardTaskReview(reviewerId: string, taskName: string): Promise<void> {
    const points = PointsCalculator.calculateReviewPoints();
    
    await permissionService.addUserPoints(
      reviewerId,
      points,
      `審核任務「${taskName}」`
    );
  }
  
  /**
   * 獎勵階層完成積分
   */
  static async rewardLevelCompletion(
    userIds: string[],
    level: 'subpackage' | 'package' | 'project',
    levelName: string
  ): Promise<void> {
    const points = PointsCalculator.calculateLevelCompletionPoints(level);
    
    const levelText = { 
      subpackage: '子工作包', 
      package: '工作包', 
      project: '專案' 
    }[level];
    
    const promises = userIds.map(uid =>
      permissionService.addUserPoints(
        uid,
        points,
        `完成${levelText}「${levelName}」`
      )
    );
    
    await Promise.all(promises);
  }
} 