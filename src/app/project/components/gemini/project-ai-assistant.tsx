'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

interface ProjectAIAssistantProps {
  projectId?: string;
  title?: string;
  className?: string;
}

export default function ProjectAIAssistant({ 
  projectId, 
  title, 
  className = "w-full h-[600px] flex flex-col" 
}: ProjectAIAssistantProps) {
  const isProjectContext = !!projectId;
  const assistantTitle = title || (isProjectContext ? '專案AI助手' : 'AI 助手');
  const initialMessage = isProjectContext 
    ? '您好！我是您的專案AI助手，有什麼可以幫助您的嗎？'
    : '您好！我是您的AI助手，有什麼可以幫助您的嗎？我可以協助您處理各種業務需求。';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: initialMessage,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString('zh-TW')
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('zh-TW')
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 模擬AI回應
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputValue),
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('zh-TW')
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const getAIResponse = (input: string): string => {
    const projectResponses = [
      '根據您的問題，我建議您檢查專案的進度追蹤。',
      '這是一個很好的想法！您可以考慮將此項目加入專案規劃中。',
      '基於目前的專案狀況，我建議您優先處理高優先級的任務。',
      '您提到的問題很重要，建議與團隊成員討論解決方案。',
      '我理解您的關切。讓我們一步步分析這個專案問題。'
    ];

    const generalResponses = [
      '這是一個很有趣的問題！讓我為您提供一些建議。',
      '根據您的描述，我建議您可以考慮以下方案。',
      '我理解您的需求。讓我幫您分析一下最佳的解決方式。',
      '這確實是一個需要仔細考慮的問題。我建議您從以下角度思考。',
      '基於我的分析，我認為您可以嘗試這樣的方法。'
    ];

    const responses = isProjectContext ? projectResponses : generalResponses;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          {assistantTitle}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 mb-4 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
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
                    <Bot className="w-4 h-4" />
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
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="輸入您的問題..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            發送
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 