/**
 * 專案 Gemini Hook
 * 
 * 提供專案相關的 AI 對話功能，包括專案分析、建議和問題解答
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { getAI, getGenerativeModel, GoogleAIBackend, GenerativeModel } from 'firebase/ai';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase-config';
import { safeAsync, getErrorMessage, logError } from '@/utils/errorUtils';
import type { Project, WorkPackage, SubWorkPackage, IssueRecord } from '../types';

// 初始化 Firebase
const firebaseApp = initializeApp(firebaseConfig);

// 初始化 Gemini API
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

export interface ProjectChatMessage {
  id: string;
  role: 'user' | 'gemini';
  content: string;
  createdAt: Date;
  projectId?: string;
  context?: {
    project?: Project;
    workPackages?: WorkPackage[];
    subWorkPackages?: SubWorkPackage[];
    issues?: IssueRecord[];
  };
}

export interface UseProjectGeminiOptions {
  projectId?: string;
  autoInitialize?: boolean;
  maxTokens?: number;
}

export interface UseProjectGeminiReturn {
  // 狀態
  messages: ProjectChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // 操作方法
  sendMessage: (content: string, context?: any) => Promise<void>;
  clearMessages: () => void;
  addContext: (context: any) => void;
  
  // 專案相關方法
  analyzeProject: (project: Project) => Promise<void>;
  getProjectSuggestions: (project: Project) => Promise<void>;
  analyzeWorkPackage: (workPackage: WorkPackage) => Promise<void>;
  getRiskAnalysis: (project: Project, issues: IssueRecord[]) => Promise<void>;
  getProgressReport: (project: Project, workPackages: WorkPackage[]) => Promise<void>;
}

export function useProjectGemini(options: UseProjectGeminiOptions = {}): UseProjectGeminiReturn {
  const {
    projectId,
    autoInitialize = true,
    maxTokens = 1000,
  } = options;

  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<any>({});
  
  const chatRef = useRef<ReturnType<GenerativeModel['startChat']> | null>(null);
  const model = getGenerativeModel(ai, { model: 'gemini-2.0-flash' });

  // 初始化聊天
  useEffect(() => {
    if (autoInitialize) {
      initializeChat();
    }
  }, [autoInitialize, maxTokens]);

  const initializeChat = useCallback(() => {
    chatRef.current = model.startChat({
      generationConfig: {
        maxOutputTokens: maxTokens,
      },
    });
  }, [model, maxTokens]);

  // 構建上下文提示
  const buildContextPrompt = useCallback((baseContext: any, additionalContext?: any): string => {
    const mergedContext = { ...baseContext, ...additionalContext };
    let prompt = '';

    if (mergedContext.project) {
      const startDate = mergedContext.project.startDate instanceof Date 
        ? mergedContext.project.startDate.toLocaleDateString('zh-TW')
        : (mergedContext.project.startDate && typeof mergedContext.project.startDate === 'object' && 'toDate' in mergedContext.project.startDate)
          ? mergedContext.project.startDate.toDate().toLocaleDateString('zh-TW')
          : '未設定';
      
      const endDate = mergedContext.project.estimatedEndDate instanceof Date 
        ? mergedContext.project.estimatedEndDate.toLocaleDateString('zh-TW')
        : (mergedContext.project.estimatedEndDate && typeof mergedContext.project.estimatedEndDate === 'object' && 'toDate' in mergedContext.project.estimatedEndDate)
          ? mergedContext.project.estimatedEndDate.toDate().toLocaleDateString('zh-TW')
          : '未設定';

      prompt += `專案資訊：
- 專案名稱：${mergedContext.project.projectName}
- 狀態：${mergedContext.project.status}
- 進度：${mergedContext.project.progress || 0}%
- 開始日期：${startDate}
- 預計結束日期：${endDate}
- 預算：${mergedContext.project.estimatedBudget ? `NT$ ${mergedContext.project.estimatedBudget.toLocaleString()}` : '未設定'}

`;
    }

    if (mergedContext.workPackages && mergedContext.workPackages.length > 0) {
      prompt += `工作包資訊：
${mergedContext.workPackages.map((wp: WorkPackage, index: number) => 
  `${index + 1}. ${wp.name} - 進度：${wp.progress || 0}% - 狀態：${wp.status}`
).join('\n')}

`;
    }

    if (mergedContext.issues && mergedContext.issues.length > 0) {
      prompt += `問題記錄：
${mergedContext.issues.map((issue: IssueRecord, index: number) => 
  `${index + 1}. ${issue.description || '無標題'} - 嚴重程度：${issue.severity} - 狀態：${issue.status}`
).join('\n')}

`;
    }

    if (prompt) {
      prompt += '請基於以上專案資訊回答用戶的問題。你是一位在台灣具備十年以上工地管理經驗的專案經理，熟悉工地作業流程、施工進度與品質控制，擅長成本預算管控與安全規劃。請用繁體中文回答，並提供實用的建議。';
    }

    return prompt;
  }, []);

  // 發送訊息
  const sendMessage = useCallback(async (content: string, additionalContext?: any) => {
    if (!content.trim()) return;

    const userMsg: ProjectChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      createdAt: new Date(),
      projectId,
      context: { ...context, ...additionalContext },
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    await safeAsync(async () => {
      if (!chatRef.current) {
        throw new Error('聊天實例未初始化');
      }

      // 構建上下文提示
      const contextPrompt = buildContextPrompt(context, additionalContext);
      const fullPrompt = contextPrompt ? `${contextPrompt}\n\n用戶問題：${content}` : content;

      const result = await chatRef.current.sendMessage(fullPrompt);
      const response = result.response;
      const text = response.text();

      const geminiMsg: ProjectChatMessage = {
        id: `${Date.now()}-gemini`,
        role: 'gemini',
        content: text,
        createdAt: new Date(),
        projectId,
        context: { ...context, ...additionalContext },
      };

      setMessages(prev => [...prev, geminiMsg]);
    }, (error) => {
      const errorMsg: ProjectChatMessage = {
        id: `${Date.now()}-gemini`,
        role: 'gemini',
        content: `抱歉，處理您的請求時發生錯誤：${getErrorMessage(error)}`,
        createdAt: new Date(),
        projectId,
        context: { ...context, ...additionalContext },
      };
      setMessages(prev => [...prev, errorMsg]);
      setError(getErrorMessage(error));
      logError(error, { operation: 'project_gemini_send', projectId });
    });

    setIsLoading(false);
  }, [context, projectId, buildContextPrompt]);

  // 清除訊息
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    initializeChat();
  }, [initializeChat]);

  // 添加上下文
  const addContext = useCallback((newContext: any) => {
    setContext((prev: any) => ({ ...prev, ...newContext }));
  }, []);

  // 專案分析
  const analyzeProject = useCallback(async (project: Project) => {
    const startDate = project.startDate instanceof Date 
      ? project.startDate.toLocaleDateString('zh-TW')
      : (project.startDate && typeof project.startDate === 'object' && 'toDate' in project.startDate)
        ? project.startDate.toDate().toLocaleDateString('zh-TW')
        : '未設定';
    
    const endDate = project.estimatedEndDate instanceof Date 
      ? project.estimatedEndDate.toLocaleDateString('zh-TW')
      : (project.estimatedEndDate && typeof project.estimatedEndDate === 'object' && 'toDate' in project.estimatedEndDate)
        ? project.estimatedEndDate.toDate().toLocaleDateString('zh-TW')
        : '未設定';

    const analysisPrompt = `請分析這個專案的狀況：

專案名稱：${project.projectName}
狀態：${project.status}
進度：${project.progress || 0}%
開始日期：${startDate}
預計結束日期：${endDate}
預算：${project.estimatedBudget ? `NT$ ${project.estimatedBudget.toLocaleString()}` : '未設定'}

請提供：
1. 專案健康狀況評估
2. 潛在風險分析
3. 改進建議
4. 時程和預算控制建議`;

    await sendMessage(analysisPrompt, { project });
  }, [sendMessage]);

  // 取得專案建議
  const getProjectSuggestions = useCallback(async (project: Project) => {
    const suggestionPrompt = `基於這個專案的資訊，請提供具體的改進建議：

專案名稱：${project.projectName}
狀態：${project.status}
進度：${project.progress || 0}%

請針對以下方面提供建議：
1. 進度管理
2. 風險控制
3. 品質保證
4. 成本控制
5. 團隊協作`;

    await sendMessage(suggestionPrompt, { project });
  }, [sendMessage]);

  // 分析工作包
  const analyzeWorkPackage = useCallback(async (workPackage: WorkPackage) => {
    const wpAnalysisPrompt = `請分析這個工作包的狀況：

工作包名稱：${workPackage.name}
描述：${workPackage.description || '無描述'}
狀態：${workPackage.status}
進度：${workPackage.progress || 0}%
預算：${workPackage.budget ? `NT$ ${workPackage.budget.toLocaleString()}` : '未設定'}
優先級：${workPackage.priority}

請提供：
1. 工作包執行狀況評估
2. 進度控制建議
3. 資源配置建議
4. 風險識別`;

    await sendMessage(wpAnalysisPrompt, { workPackage });
  }, [sendMessage]);

  // 風險分析
  const getRiskAnalysis = useCallback(async (project: Project, issues: IssueRecord[]) => {
    const riskPrompt = `請進行專案風險分析：

專案資訊：
- 專案名稱：${project.projectName}
- 狀態：${project.status}
- 進度：${project.progress || 0}%

問題記錄：
${issues.map((issue, index) => 
  `${index + 1}. ${issue.description || '無描述'} - 嚴重程度：${issue.severity} - 狀態：${issue.status} - 描述：${issue.description || '無描述'}`
).join('\n')}

請提供：
1. 風險評估報告
2. 高風險項目識別
3. 風險緩解策略
4. 預防措施建議`;

    await sendMessage(riskPrompt, { project, issues });
  }, [sendMessage]);

  // 進度報告
  const getProgressReport = useCallback(async (project: Project, workPackages: WorkPackage[]) => {
    const progressPrompt = `請生成專案進度報告：

專案資訊：
- 專案名稱：${project.projectName}
- 狀態：${project.status}
- 整體進度：${project.progress || 0}%

工作包進度：
${workPackages.map((wp, index) => 
  `${index + 1}. ${wp.name} - 進度：${wp.progress || 0}% - 狀態：${wp.status}`
).join('\n')}

請提供：
1. 進度總結
2. 完成情況分析
3. 延遲項目識別
4. 後續行動建議
5. 里程碑達成狀況`;

    await sendMessage(progressPrompt, { project, workPackages });
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    addContext,
    analyzeProject,
    getProjectSuggestions,
    analyzeWorkPackage,
    getRiskAnalysis,
    getProgressReport,
  };
} 