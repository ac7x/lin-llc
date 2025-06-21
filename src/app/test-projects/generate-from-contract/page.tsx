/**
 * 從合約生成專案頁面
 * 
 * 提供從現有合約和模板生成新專案的功能
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { PageContainer, PageHeader } from '@/app/test-projects/components/common';
import { ContractSelector, TemplateSelector, ProjectSetupForm } from '@/app/test-projects/components/generate-from-contract';
import { ProjectService, TemplateService } from '@/app/test-projects/services';
import { projectStyles } from '@/app/test-projects/styles';
import type { Project, Template } from '@/app/test-projects/types/project';

interface Contract {
  id: string;
  contractNumber: string;
  contractName: string;
  clientName: string;
  contractValue: number;
  startDate: Date;
  endDate: Date;
  description: string;
}

export default function GenerateFromContractPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [projectData, setProjectData] = useState({
    projectName: '',
    description: '',
    estimatedBudget: 0,
    estimatedDuration: 0,
    manager: '',
    inspector: '',
    safety: '',
    supervisor: '',
    safetyOfficer: '',
    costController: '',
    area: '',
    address: '',
    region: '',
  });

  // 載入合約資料
  useEffect(() => {
    const loadContracts = async () => {
      try {
        // TODO: 實作從合約服務獲取資料
        // const contractsData = await ContractService.getAllContracts();
        // setContracts(contractsData);
        setContracts([]);
      } catch (error) {
        console.error('載入合約資料失敗:', error);
      }
    };

    loadContracts();
  }, []);

  // 載入模板資料
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await TemplateService.getAllTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('載入模板資料失敗:', error);
      }
    };

    loadTemplates();
  }, []);

  // 當選擇合約時，自動填充專案資料
  useEffect(() => {
    if (selectedContract) {
      const contract = contracts.find(c => c.id === selectedContract);
      if (contract) {
        setProjectData(prev => ({
          ...prev,
          projectName: `${contract.contractName} - 專案`,
          description: contract.description,
          estimatedBudget: contract.contractValue,
          estimatedDuration: Math.ceil((contract.endDate.getTime() - contract.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        }));
      }
    }
  }, [selectedContract, contracts]);

  const handleSubmit = async (data: Record<string, string | number>) => {
    if (!selectedContract || !selectedTemplate) {
      return;
    }

    setIsLoading(true);

    try {
      const contract = contracts.find(c => c.id === selectedContract);
      const template = templates.find(t => t.id === selectedTemplate);

      if (!contract || !template) {
        throw new Error('合約或模板不存在');
      }

      // 創建專案
      const projectDataToSubmit: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
        projectName: data.projectName as string,
        status: 'planning',
        progress: 0,
        manager: data.manager as string,
        inspector: data.inspector as string,
        safety: data.safety as string,
        supervisor: data.supervisor as string,
        safetyOfficer: data.safetyOfficer as string,
        costController: data.costController as string,
        area: data.area as string,
        address: data.address as string,
        region: data.region as string,
        startDate: contract.startDate,
        estimatedEndDate: contract.endDate,
        estimatedBudget: data.estimatedBudget as number,
        estimatedDuration: data.estimatedDuration as number,
        workpackages: [],
        projectType: 'system',
        priority: 'medium',
        riskLevel: 'medium',
        phase: 'initiation',
        healthLevel: 'good',
      };

      const projectId = await ProjectService.createProject(projectDataToSubmit);

      // 從模板創建工作包
      if (template.subWorkpackages.length > 0) {
        // TODO: 實作從模板創建工作包功能
      }

      // 導航到新創建的專案
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('生成專案時發生錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <PageContainer>
      <PageHeader
        title='從合約生成專案'
        subtitle='選擇現有合約和模板，自動生成專案結構'
      />

      <div className='space-y-6'>
        {/* 合約選擇 */}
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            選擇合約
          </h3>
          
          {contracts.length === 0 ? (
            <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
              尚無合約資料
            </div>
          ) : (
            <div className='space-y-4'>
              {contracts.map(contract => (
                <div
                  key={contract.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                    selectedContract === contract.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedContract(contract.id)}
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                        {contract.contractName}
                      </h4>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                        合約編號: {contract.contractNumber}
                      </p>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        客戶: {contract.clientName}
                      </p>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        合約金額: NT$ {contract.contractValue.toLocaleString()}
                      </p>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        期間: {contract.startDate.toLocaleDateString()} - {contract.endDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm text-gray-500 dark:text-gray-400'>
                        合約金額
                      </div>
                      <div className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                        NT$ {contract.contractValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 模板選擇 */}
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            選擇模板
          </h3>
          
          {templates.length === 0 ? (
            <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
              尚無模板資料
            </div>
          ) : (
            <div className='space-y-4'>
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                        {template.name}
                      </h4>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                        {template.description}
                      </p>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        分類: {template.category}
                      </p>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        子工作包數量: {template.subWorkpackages.length}
                      </p>
                    </div>
                    <div className='text-right'>
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'>
                        {template.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 專案設定表單 */}
        {(selectedContract && selectedTemplate) && (
          <div className={projectStyles.card.base}>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
              專案設定
            </h3>
            
            <ProjectSetupForm
              initialData={projectData}
              onSubmit={handleSubmit}
              onCancel={() => {
                setSelectedContract('');
                setSelectedTemplate('');
                setProjectData({
                  projectName: '',
                  description: '',
                  estimatedBudget: 0,
                  estimatedDuration: 0,
                  manager: '',
                  inspector: '',
                  safety: '',
                  supervisor: '',
                  safetyOfficer: '',
                  costController: '',
                  area: '',
                  address: '',
                  region: '',
                });
              }}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
