'use client';

import React, { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage, logError, safeAsync } from '@/lib/error-utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  file?: {
    name: string;
    type: string;
    data: string;
  };
}

interface ProjectAIAssistantProps {
  projectId?: string;
  title?: string;
  className?: string;
}

// 將檔案轉換為 GenerativePart
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

export default function ProjectAIAssistant({ 
  projectId, 
  title, 
  className = "w-full h-[600px] flex flex-col" 
}: ProjectAIAssistantProps) {
  const { user } = useAuth();
  const isProjectContext = !!projectId;
  const assistantTitle = title || (isProjectContext ? '專案AI助手' : 'AI 助手');
  const initialMessage = isProjectContext 
    ? '您好！我是您的專案AI助手，我可以協助您處理專案相關的問題，包括進度追蹤、任務管理、預算規劃等。有什麼可以幫助您的嗎？'
    : '您好！我是您的AI助手，我可以協助您處理各種業務需求。有什麼可以幫助您的嗎？';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: initialMessage,
      role: 'ai',
      timestamp: new Date().toLocaleTimeString('zh-TW')
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Firebase AI 相關的 refs 和狀態
  const [aiInitialized, setAiInitialized] = useState(false);
  const modelRef = useRef<any>(null);

  // 初始化 Firebase AI
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const { initializeApp } = await import('firebase/app');
        const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai');
        const { firebaseConfig } = await import('@/lib/firebase-config');
        
        const firebaseApp = initializeApp(firebaseConfig);
        const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
        const model = getGenerativeModel(ai, { model: 'gemini-2.0-flash' });
        
        modelRef.current = model;
        chatRef.current = model.startChat({
          generationConfig: {
            maxOutputTokens: 1000,
          },
        });
        
        setAiInitialized(true);
             } catch (error) {
         console.error('初始化 Firebase AI 失敗:', error);
         setError('AI 服務初始化失敗，將使用備用模式');
         setAiInitialized(false);
       }
    };

    void initializeAI();
  }, []);

  // 檢查是否接近底部
  const checkIfNearBottom = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 100;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < threshold);
  };

  // 滾動到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 監聽滾動事件
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkIfNearBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 當有新訊息時，如果用戶在底部附近，則自動滾動
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isNearBottom]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAIPrompt = (input: string): string => {
    if (isProjectContext) {
      return `你是一位在台灣具備十年以上工地管理經驗的專案經理，熟悉工地作業流程、施工進度與品質控制，擅長成本預算管控與安全規劃。請基於專案管理的角度回答以下問題：${input}`;
    } else {
      return `你是一位專業的業務助手，請協助回答以下問題：${input}`;
    }
  };

  const getFallbackResponse = (input: string): string => {
    const projectResponses = [
      '根據您的問題，我建議您檢查專案的進度追蹤和里程碑設定。',
      '這是一個很好的想法！您可以考慮將此項目加入專案規劃中，並評估所需資源。',
      '基於目前的專案狀況，我建議您優先處理高優先級的任務，確保關鍵路徑順暢。',
      '您提到的問題很重要，建議與團隊成員討論解決方案，並制定行動計畫。',
      '我理解您的關切。讓我們一步步分析這個專案問題，找出最佳解決方案。'
    ];

    const generalResponses = [
      '這是一個很有趣的問題！讓我為您提供一些專業建議。',
      '根據您的描述，我建議您可以考慮以下幾個方案來解決這個問題。',
      '我理解您的需求。讓我幫您分析一下最佳的解決方式。',
      '這確實是一個需要仔細考慮的問題。我建議您從這些角度思考。',
      '基於我的分析，我認為您可以嘗試這樣的方法來達成目標。'
    ];

    const responses = isProjectContext ? projectResponses : generalResponses;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed && !selectedFile) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('zh-TW')
    };

    if (selectedFile) {
      userMessage.file = {
        name: selectedFile.name,
        type: selectedFile.type,
        data: await fileToGenerativePart(selectedFile).then(part => part.inlineData.data),
      };
    }

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    await safeAsync(async () => {
      let responseText: string;

      if (aiInitialized && modelRef.current) {
        // 使用真實的 Firebase AI
        let result;
        if (selectedFile) {
          const filePart = await fileToGenerativePart(selectedFile);
          const prompt = `請分析這個檔案並回答以下問題：${trimmed || '請總結這個檔案的重要內容。'}`;
          result = await modelRef.current.generateContent([prompt, filePart]);
        } else {
          if (!chatRef.current) {
            throw new Error('聊天實例未初始化');
          }
          const prompt = getAIPrompt(trimmed);
          result = await chatRef.current.sendMessage(prompt);
        }
        
        const response = result.response;
        responseText = response.text();
      } else {
        // 備用模式：使用模擬回應
        responseText = getFallbackResponse(trimmed);
      }

      const aiMessage: ChatMessage = {
        id: `${Date.now()}-ai`,
        role: 'ai',
        content: responseText,
        timestamp: new Date().toLocaleTimeString('zh-TW')
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, (error) => {
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-ai`,
        role: 'ai',
        content: `抱歉，處理您的請求時發生錯誤：${getErrorMessage(error)}`,
        timestamp: new Date().toLocaleTimeString('zh-TW')
      };
      setMessages(prev => [...prev, errorMessage]);
      logError(error, { operation: 'ai_send', user: user?.email, projectId });
    });

    setIsLoading(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: '1',
        content: initialMessage,
        role: 'ai',
        timestamp: new Date().toLocaleTimeString('zh-TW')
      }
    ]);
    setInputValue('');
    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 重新初始化聊天
    if (modelRef.current) {
      chatRef.current = modelRef.current.startChat({
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image src="/sup.svg" alt="AI Assistant" width={20} height={20} />
            {assistantTitle}
            {!aiInitialized && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                備用模式
              </span>
            )}
          </CardTitle>
          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            清除對話
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          style={{ height: 'calc(100% - 120px)' }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 animate-fade-in ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Image src="/sup.svg" alt="AI Assistant" width={16} height={16} />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.file && (
                  <div className="mt-2 text-xs opacity-70">
                    📎 {message.file.name}
                  </div>
                )}
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  <Image src="/sup.svg" alt="AI Assistant" width={16} height={16} />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded text-sm">
            {error}
          </div>
        )}
        
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/50 rounded">
            <Upload className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-600 flex-1">{selectedFile.name}</span>
            <Button
              onClick={removeSelectedFile}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="輸入您的問題..."
              disabled={isLoading}
              className="flex-1"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,text/*,.pdf,.doc,.docx"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              disabled={isLoading}
              title="上傳檔案"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || (!inputValue.trim() && !selectedFile)}
            >
              {isLoading ? '處理中...' : '發送'}
            </Button>
          </div>
        </form>
      </CardContent>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </Card>
  );
} 