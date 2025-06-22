/**
 * 專案 Gemini 工具函數
 * 提供專案相關的 AI 輔助功能
 */

import type { Project, WorkPackage, SubWorkPackage, IssueRecord } from '../types';
import type { DateField } from '../types';

/**
 * 格式化專案資訊用於 AI 分析
 */
export function formatProjectForAI(project: Project): string {
  const startDate = formatDateField(project.startDate || null);
  const endDate = formatDateField(project.estimatedEndDate || null);
  
  return `專案名稱：${project.projectName}
狀態：${project.status}
進度：${project.progress || 0}%
開始日期：${startDate}
預計結束日期：${endDate}
預算：${project.estimatedBudget ? `NT$ ${project.estimatedBudget.toLocaleString()}` : '未設定'}
品質分數：${project.qualityScore || 0}`;
}

/**
 * 格式化工作包資訊用於 AI 分析
 */
export function formatWorkPackageForAI(workPackage: WorkPackage): string {
  return `工作包名稱：${workPackage.name}
描述：${workPackage.description || '無描述'}
狀態：${workPackage.status}
進度：${workPackage.progress || 0}%
預算：${workPackage.budget ? `NT$ ${workPackage.budget.toLocaleString()}` : '未設定'}
優先級：${workPackage.priority}
類別：${workPackage.category || '未分類'}`;
}

/**
 * 格式化問題記錄用於 AI 分析
 */
export function formatIssuesForAI(issues: IssueRecord[]): string {
  if (issues.length === 0) {
    return '目前沒有問題記錄';
  }
  
  return issues.map((issue, index) => 
    `${index + 1}. ${issue.description || '無描述'} - 嚴重程度：${issue.severity} - 狀態：${issue.status}`
  ).join('\n');
}

/**
 * 格式化工作包列表用於 AI 分析
 */
export function formatWorkPackagesForAI(workPackages: WorkPackage[]): string {
  if (workPackages.length === 0) {
    return '目前沒有工作包';
  }
  
  return workPackages.map((wp, index) => 
    `${index + 1}. ${wp.name} - 進度：${wp.progress || 0}% - 狀態：${wp.status}`
  ).join('\n');
}

/**
 * 生成專案健康狀況提示
 */
export function generateHealthAnalysisPrompt(project: Project): string {
  return `請分析這個專案的健康狀況：

${formatProjectForAI(project)}

請提供以下格式的 JSON 回應：
{
  "healthScore": 0-100,
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["建議1", "建議2"],
  "issues": ["問題1", "問題2"],
  "nextSteps": ["下一步1", "下一步2"]
}`;
}

/**
 * 生成工作包分析提示
 */
export function generateWorkPackageAnalysisPrompt(workPackage: WorkPackage): string {
  return `請分析這個工作包的狀況：

${formatWorkPackageForAI(workPackage)}

請提供以下格式的 JSON 回應：
{
  "status": "on-track|at-risk|behind|completed",
  "recommendations": ["建議1", "建議2"],
  "resourceNeeds": ["資源需求1", "資源需求2"],
  "timelineAdjustments": ["時程調整1", "時程調整2"]
}`;
}

/**
 * 生成風險分析提示
 */
export function generateRiskAnalysisPrompt(project: Project, issues: IssueRecord[]): string {
  return `請進行專案風險分析：

專案資訊：
${formatProjectForAI(project)}

問題記錄：
${formatIssuesForAI(issues)}

請提供以下格式的 JSON 回應：
{
  "highRisks": ["高風險1", "高風險2"],
  "mediumRisks": ["中風險1", "中風險2"],
  "lowRisks": ["低風險1", "低風險2"],
  "mitigationStrategies": ["緩解策略1", "緩解策略2"],
  "contingencyPlans": ["應變計畫1", "應變計畫2"]
}`;
}

/**
 * 生成進度報告提示
 */
export function generateProgressReportPrompt(project: Project, workPackages: WorkPackage[]): string {
  return `請生成專案進度報告：

專案資訊：
${formatProjectForAI(project)}

工作包進度：
${formatWorkPackagesForAI(workPackages)}

請提供以下格式的 JSON 回應：
{
  "overallProgress": 0-100,
  "completedItems": ["已完成項目1", "已完成項目2"],
  "delayedItems": ["延遲項目1", "延遲項目2"],
  "upcomingMilestones": ["即將到來里程碑1", "即將到來里程碑2"],
  "recommendations": ["建議1", "建議2"]
}`;
}

/**
 * 生成專案建議提示
 */
export function generateSuggestionsPrompt(project: Project): string {
  return `基於這個專案的資訊，請提供具體的改進建議：

${formatProjectForAI(project)}

請針對以下方面提供建議：
1. 進度管理
2. 風險控制
3. 品質保證
4. 成本控制
5. 團隊協作

請以 JSON 陣列格式回應：["建議1", "建議2", "建議3"]`;
}

/**
 * 生成品質分析提示
 */
export function generateQualityAnalysisPrompt(project: Project): string {
  return `請分析這個專案的品質狀況：

${formatProjectForAI(project)}

請提供以下格式的 JSON 回應：
{
  "qualityScore": 0-100,
  "qualityIssues": ["品質問題1", "品質問題2"],
  "improvementSuggestions": ["改進建議1", "改進建議2"]
}`;
}

/**
 * 格式化日期欄位
 */
function formatDateField(dateField: DateField): string {
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

/**
 * 驗證 AI 回應格式
 */
export function validateAIResponse<T>(response: string, expectedKeys: string[]): T {
  try {
    const parsed = JSON.parse(response);
    
    // 檢查是否包含預期的鍵
    for (const key of expectedKeys) {
      if (!(key in parsed)) {
        throw new Error(`回應缺少必要欄位: ${key}`);
      }
    }
    
    return parsed as T;
  } catch (error) {
    throw new Error(`AI 回應格式無效: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 清理 AI 回應文字
 */
export function cleanAIResponse(text: string): string {
  // 移除多餘的空白和換行
  return text.trim().replace(/\n\s*\n/g, '\n');
}

/**
 * 提取 JSON 從 AI 回應中
 */
export function extractJSONFromResponse(response: string): string {
  // 尋找 JSON 開始和結束的位置
  const jsonStart = response.indexOf('{');
  const jsonEnd = response.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error('回應中找不到有效的 JSON');
  }
  
  return response.substring(jsonStart, jsonEnd + 1);
}
