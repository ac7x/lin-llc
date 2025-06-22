/**
 * 專案分析結果顯示組件
 * 
 * 顯示 AI 分析的結果
 */

'use client';

import { useState } from 'react';
import { GeminiService, type ProjectAnalysisResult, type RiskAnalysisResult, type ProgressReportResult } from '../../services/geminiService';
import type { Project, WorkPackage, IssueRecord } from '../../types';

interface ProjectAnalysisDisplayProps {
  project: Project;
  workPackages: WorkPackage[];
  issues: IssueRecord[];
  className?: string;
}

export function ProjectAnalysisDisplay({
  project,
  workPackages,
  issues,
  className = '',
}: ProjectAnalysisDisplayProps) {
  const [analysisResult, setAnalysisResult] = useState<ProjectAnalysisResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskAnalysisResult | null>(null);
  const [progressResult, setProgressResult] = useState<ProgressReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await GeminiService.analyzeProjectHealth(project);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeRisks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await GeminiService.analyzeRisks(project, issues);
      setRiskResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '風險分析失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProgressReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await GeminiService.generateProgressReport(project, workPackages);
      setProgressResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成進度報告失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 操作按鈕 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAnalyzeHealth}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? '分析中...' : '專案健康分析'}
        </button>
        <button
          onClick={handleAnalyzeRisks}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? '分析中...' : '風險分析'}
        </button>
        <button
          onClick={handleGenerateProgressReport}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? '生成中...' : '進度報告'}
        </button>
      </div>

      {/* 錯誤顯示 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* 專案健康分析結果 */}
      {analysisResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            專案健康分析
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 健康分數 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">健康分數</span>
                <span className={`text-2xl font-bold ${getHealthScoreColor(analysisResult.healthScore)}`}>
                  {analysisResult.healthScore}/100
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    analysisResult.healthScore >= 80 ? 'bg-green-500' :
                    analysisResult.healthScore >= 60 ? 'bg-yellow-500' :
                    analysisResult.healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${analysisResult.healthScore}%` }}
                />
              </div>
            </div>

            {/* 風險等級 */}
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">風險等級</span>
              <div className={`text-lg font-semibold ${getRiskLevelColor(analysisResult.riskLevel)}`}>
                {analysisResult.riskLevel.toUpperCase()}
              </div>
            </div>
          </div>

          {/* 建議和問題 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">建議</h4>
              <ul className="space-y-1">
                {analysisResult.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">問題</h4>
              <ul className="space-y-1">
                {analysisResult.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 下一步 */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">下一步行動</h4>
            <ul className="space-y-1">
              {analysisResult.nextSteps.map((step, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 風險分析結果 */}
      {riskResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            風險分析
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 高風險 */}
            <div>
              <h4 className="font-medium text-red-600 mb-2">高風險</h4>
              <ul className="space-y-1">
                {riskResult.highRisks.map((risk, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {risk}
                  </li>
                ))}
              </ul>
            </div>

            {/* 中風險 */}
            <div>
              <h4 className="font-medium text-orange-600 mb-2">中風險</h4>
              <ul className="space-y-1">
                {riskResult.mediumRisks.map((risk, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {risk}
                  </li>
                ))}
              </ul>
            </div>

            {/* 低風險 */}
            <div>
              <h4 className="font-medium text-yellow-600 mb-2">低風險</h4>
              <ul className="space-y-1">
                {riskResult.lowRisks.map((risk, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 緩解策略 */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">緩解策略</h4>
            <ul className="space-y-1">
              {riskResult.mitigationStrategies.map((strategy, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {strategy}
                </li>
              ))}
            </ul>
          </div>

          {/* 應變計畫 */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">應變計畫</h4>
            <ul className="space-y-1">
              {riskResult.contingencyPlans.map((plan, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {plan}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 進度報告結果 */}
      {progressResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            進度報告
          </h3>
          
          {/* 整體進度 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">整體進度</span>
              <span className="text-lg font-bold text-blue-600">{progressResult.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${progressResult.overallProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 已完成項目 */}
            <div>
              <h4 className="font-medium text-green-600 mb-2">已完成項目</h4>
              <ul className="space-y-1">
                {progressResult.completedItems.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 延遲項目 */}
            <div>
              <h4 className="font-medium text-red-600 mb-2">延遲項目</h4>
              <ul className="space-y-1">
                {progressResult.delayedItems.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 即將到來里程碑 */}
          <div className="mt-6">
            <h4 className="font-medium text-blue-600 mb-2">即將到來里程碑</h4>
            <ul className="space-y-1">
              {progressResult.upcomingMilestones.map((milestone, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {milestone}
                </li>
              ))}
            </ul>
          </div>

          {/* 建議 */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">建議</h4>
            <ul className="space-y-1">
              {progressResult.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 