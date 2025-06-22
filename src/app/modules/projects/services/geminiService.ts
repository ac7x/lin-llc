/**
 * 專案 Gemini 服務層
 * 提供專案相關的 AI 分析功能
 */

import { 
  getAI, 
  getGenerativeModel, 
  GoogleAIBackend, 
  GenerativeModel 
} from 'firebase/ai';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase-config';
import { safeAsync, getErrorMessage, logError } from '@/utils/errorUtils';
import type { Project, WorkPackage, SubWorkPackage, IssueRecord } from '../types';

// 初始化 Firebase
const firebaseApp = initializeApp(firebaseConfig);

// 初始化 Gemini API
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

/**
 * 專案分析結果類型
 */
export interface ProjectAnalysisResult {
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  issues: string[];
  nextSteps: string[];
}

/**
 * 工作包分析結果類型
 */
export interface WorkPackageAnalysisResult {
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  recommendations: string[];
  resourceNeeds: string[];
  timelineAdjustments: string[];
}

/**
 * 風險分析結果類型
 */
export interface RiskAnalysisResult {
  highRisks: string[];
  mediumRisks: string[];
  lowRisks: string[];
  mitigationStrategies: string[];
  contingencyPlans: string[];
}

/**
 * 進度報告結果類型
 */
export interface ProgressReportResult {
  overallProgress: number;
  completedItems: string[];
  delayedItems: string[];
  upcomingMilestones: string[];
  recommendations: string[];
}

/**
 * Gemini 服務類別
 */
export class GeminiService {
  private static model: GenerativeModel = getGenerativeModel(ai, { model: 'gemini-2.0-flash' });

  /**
   * 分析專案健康狀況
   */
  static async analyzeProjectHealth(project: Project): Promise<ProjectAnalysisResult> {
    const result = await safeAsync(async () => {
      const prompt = `請分析這個專案的健康狀況：

專案資訊：
- 專案名稱：${project.projectName}
- 狀態：${project.status}
- 進度：${project.progress || 0}%
- 開始日期：${this.formatDate(project.startDate)}
- 預計結束日期：${this.formatDate(project.estimatedEndDate)}
- 預算：${project.estimatedBudget ? `NT$ ${project.estimatedBudget.toLocaleString()}` : '未設定'}

請提供以下格式的 JSON 回應：
{
  "healthScore": 0-100,
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["建議1", "建議2"],
  "issues": ["問題1", "問題2"],
  "nextSteps": ["下一步1", "下一步2"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text) as ProjectAnalysisResult;
      } catch (error) {
        throw new Error('無法解析 AI 回應');
      }
    }, (error) => {
      logError(error, { operation: 'analyze_project_health', projectId: project.id });
      throw new Error(`分析專案健康狀況失敗: ${getErrorMessage(error)}`);
    });

    if (!result) {
      throw new Error('分析專案健康狀況失敗');
    }

    return result;
  }

  /**
   * 分析工作包狀況
   */
  static async analyzeWorkPackage(workPackage: WorkPackage): Promise<WorkPackageAnalysisResult> {
    const result = await safeAsync(async () => {
      const prompt = `請分析這個工作包的狀況：

工作包資訊：
- 名稱：${workPackage.name}
- 描述：${workPackage.description || '無描述'}
- 狀態：${workPackage.status}
- 進度：${workPackage.progress || 0}%
- 預算：${workPackage.budget ? `NT$ ${workPackage.budget.toLocaleString()}` : '未設定'}
- 優先級：${workPackage.priority}

請提供以下格式的 JSON 回應：
{
  "status": "on-track|at-risk|behind|completed",
  "recommendations": ["建議1", "建議2"],
  "resourceNeeds": ["資源需求1", "資源需求2"],
  "timelineAdjustments": ["時程調整1", "時程調整2"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text) as WorkPackageAnalysisResult;
      } catch (error) {
        throw new Error('無法解析 AI 回應');
      }
    }, (error) => {
      logError(error, { operation: 'analyze_work_package', workPackageId: workPackage.id });
      throw new Error(`分析工作包失敗: ${getErrorMessage(error)}`);
    });

    if (!result) {
      throw new Error('分析工作包失敗');
    }

    return result;
  }

  /**
   * 進行風險分析
   */
  static async analyzeRisks(project: Project, issues: IssueRecord[]): Promise<RiskAnalysisResult> {
    const result = await safeAsync(async () => {
      const prompt = `請進行專案風險分析：

專案資訊：
- 專案名稱：${project.projectName}
- 狀態：${project.status}
- 進度：${project.progress || 0}%

問題記錄：
${issues.map((issue, index) => 
  `${index + 1}. ${issue.description || '無描述'} - 嚴重程度：${issue.severity} - 狀態：${issue.status}`
).join('\n')}

請提供以下格式的 JSON 回應：
{
  "highRisks": ["高風險1", "高風險2"],
  "mediumRisks": ["中風險1", "中風險2"],
  "lowRisks": ["低風險1", "低風險2"],
  "mitigationStrategies": ["緩解策略1", "緩解策略2"],
  "contingencyPlans": ["應變計畫1", "應變計畫2"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text) as RiskAnalysisResult;
      } catch (error) {
        throw new Error('無法解析 AI 回應');
      }
    }, (error) => {
      logError(error, { operation: 'analyze_risks', projectId: project.id });
      throw new Error(`風險分析失敗: ${getErrorMessage(error)}`);
    });

    if (!result) {
      throw new Error('風險分析失敗');
    }

    return result;
  }

  /**
   * 生成進度報告
   */
  static async generateProgressReport(
    project: Project, 
    workPackages: WorkPackage[]
  ): Promise<ProgressReportResult> {
    const result = await safeAsync(async () => {
      const prompt = `請生成專案進度報告：

專案資訊：
- 專案名稱：${project.projectName}
- 狀態：${project.status}
- 整體進度：${project.progress || 0}%

工作包進度：
${workPackages.map((wp, index) => 
  `${index + 1}. ${wp.name} - 進度：${wp.progress || 0}% - 狀態：${wp.status}`
).join('\n')}

請提供以下格式的 JSON 回應：
{
  "overallProgress": 0-100,
  "completedItems": ["已完成項目1", "已完成項目2"],
  "delayedItems": ["延遲項目1", "延遲項目2"],
  "upcomingMilestones": ["即將到來里程碑1", "即將到來里程碑2"],
  "recommendations": ["建議1", "建議2"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text) as ProgressReportResult;
      } catch (error) {
        throw new Error('無法解析 AI 回應');
      }
    }, (error) => {
      logError(error, { operation: 'generate_progress_report', projectId: project.id });
      throw new Error(`生成進度報告失敗: ${getErrorMessage(error)}`);
    });

    if (!result) {
      throw new Error('生成進度報告失敗');
    }

    return result;
  }

  /**
   * 取得專案建議
   */
  static async getProjectSuggestions(project: Project): Promise<string[]> {
    const result = await safeAsync(async () => {
      const prompt = `基於這個專案的資訊，請提供具體的改進建議：

專案名稱：${project.projectName}
狀態：${project.status}
進度：${project.progress || 0}%

請針對以下方面提供建議：
1. 進度管理
2. 風險控制
3. 品質保證
4. 成本控制
5. 團隊協作

請以 JSON 陣列格式回應：["建議1", "建議2", "建議3"]`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text) as string[];
      } catch (error) {
        throw new Error('無法解析 AI 回應');
      }
    }, (error) => {
      logError(error, { operation: 'get_project_suggestions', projectId: project.id });
      throw new Error(`取得專案建議失敗: ${getErrorMessage(error)}`);
    });

    if (!result) {
      throw new Error('取得專案建議失敗');
    }

    return result;
  }

  /**
   * 分析專案品質
   */
  static async analyzeProjectQuality(project: Project): Promise<{
    qualityScore: number;
    qualityIssues: string[];
    improvementSuggestions: string[];
  }> {
    return await safeAsync(async () => {
      const prompt = `請分析這個專案的品質狀況：

專案資訊：
- 專案名稱：${project.projectName}
- 狀態：${project.status}
- 進度：${project.progress || 0}%
- 品質分數：${project.qualityScore || 0}

請提供以下格式的 JSON 回應：
{
  "qualityScore": 0-100,
  "qualityIssues": ["品質問題1", "品質問題2"],
  "improvementSuggestions": ["改進建議1", "改進建議2"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (error) {
        throw new Error('無法解析 AI 回應');
      }
    }, (error) => {
      logError(error, { operation: 'analyze_project_quality', projectId: project.id });
      throw new Error(`分析專案品質失敗: ${getErrorMessage(error)}`);
    });
  }

  /**
   * 格式化日期
   */
  private static formatDate(dateField: any): string {
    if (!dateField) return '未設定';
    
    if (dateField instanceof Date) {
      return dateField.toLocaleDateString('zh-TW');
    }
    
    if (dateField && typeof dateField === 'object' && 'toDate' in dateField) {
      return dateField.toDate().toLocaleDateString('zh-TW');
    }
    
    if (typeof dateField === 'string') {
      return new Date(dateField).toLocaleDateString('zh-TW');
    }
    
    return '未設定';
  }
} 