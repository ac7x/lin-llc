/**
 * 從合約生成專案頁面
 * 
 * 提供從現有合約自動生成專案的功能，包括：
 * - 合約選擇
 * - 專案設定
 * - 工作包生成
 * - 模板應用
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { PageContainer, PageHeader } from '@/modules/test-projects/components/common';
import { ProjectService } from '@/modules/test-projects/services/projectService';
import { WorkpackageService } from '@/modules/test-projects/services/workpackageService';
import { projectStyles } from '@/modules/test-projects/styles';
import type { Project, Template } from '@/modules/test-projects/types/project';

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

  // 模擬載入合約資料
  useEffect(() => {
    // 這裡應該從實際的合約服務獲取資料
    const mockContracts: Contract[] = [
      {
        id: '1',
        contractNumber: 'CTR-2024-001',
        contractName: '台北市區道路維修工程',
        clientName: '台北市政府',
        contractValue: 5000000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        description: '台北市區主要道路維修及改善工程',
      },
      {
        id: '2',
        contractNumber: 'CTR-2024-002',
        contractName: '新北市橋樑檢測工程',
        clientName: '新北市政府',
        contractValue: 3000000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-11-30'),
        description: '新北市轄區橋樑安全檢測及維護工程',
      },
    ];

    setContracts(mockContracts);
  }, []);

  // 模擬載入模板資料
  useEffect(() => {
    // 這裡應該從實際的模板服務獲取資料
    const mockTemplates: Template[] = [
      {
        id: '1',
        name: '道路維修工程模板',
        description: '適用於道路維修及改善工程',
        category: '道路工程',
        subWorkpackages: [],
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: '橋樑檢測工程模板',
        description: '適用於橋樑檢測及維護工程',
        category: '橋樑工程',
        subWorkpackages: [],
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    setTemplates(mockTemplates);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContract || !selectedTemplate) {
      alert('請選擇合約和模板');
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
        projectName: projectData.projectName,
        status: 'planning',
        progress: 0,
        manager: projectData.manager,
        inspector: projectData.inspector,
        safety: projectData.safety,
        supervisor: projectData.supervisor,
        safetyOfficer: projectData.safetyOfficer,
        costController: projectData.costController,
        area: projectData.area,
        address: projectData.address,
        region: projectData.region,
        startDate: contract.startDate,
        estimatedEndDate: contract.endDate,
        estimatedBudget: projectData.estimatedBudget,
        estimatedDuration: projectData.estimatedDuration,
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
        console.log('從模板創建工作包功能待實現');
      }

      // 導航到新創建的專案
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('生成專案時發生錯誤:', error);
      alert('生成專案失敗，請重試');
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
        </div>

        {/* 模板選擇 */}
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            選擇專案模板
          </h3>
          
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                  {template.name}
                </h4>
                <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                  {template.description}
                </p>
                <div className='mt-2'>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'>
                    {template.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 專案設定 */}
        <div className={projectStyles.card.base}>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            專案設定
          </h3>
          
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* 專案名稱 */}
              <div>
                <label htmlFor='projectName' className={projectStyles.form.label}>
                  專案名稱 *
                </label>
                <input
                  id='projectName'
                  type='text'
                  value={projectData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入專案名稱'
                  required
                />
              </div>

              {/* 描述 */}
              <div>
                <label htmlFor='description' className={projectStyles.form.label}>
                  專案描述
                </label>
                <textarea
                  id='description'
                  value={projectData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={projectStyles.form.textarea}
                  placeholder='輸入專案描述'
                  rows={3}
                />
              </div>

              {/* 預算 */}
              <div>
                <label htmlFor='estimatedBudget' className={projectStyles.form.label}>
                  預算 (NT$)
                </label>
                <input
                  id='estimatedBudget'
                  type='number'
                  value={projectData.estimatedBudget}
                  onChange={(e) => handleInputChange('estimatedBudget', parseFloat(e.target.value) || 0)}
                  className={projectStyles.form.input}
                  placeholder='0'
                />
              </div>

              {/* 工期 */}
              <div>
                <label htmlFor='estimatedDuration' className={projectStyles.form.label}>
                  工期 (天)
                </label>
                <input
                  id='estimatedDuration'
                  type='number'
                  value={projectData.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 0)}
                  className={projectStyles.form.input}
                  placeholder='0'
                />
              </div>

              {/* 專案經理 */}
              <div>
                <label htmlFor='manager' className={projectStyles.form.label}>
                  專案經理
                </label>
                <input
                  id='manager'
                  type='text'
                  value={projectData.manager}
                  onChange={(e) => handleInputChange('manager', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入專案經理姓名'
                />
              </div>

              {/* 監工 */}
              <div>
                <label htmlFor='inspector' className={projectStyles.form.label}>
                  監工
                </label>
                <input
                  id='inspector'
                  type='text'
                  value={projectData.inspector}
                  onChange={(e) => handleInputChange('inspector', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入監工姓名'
                />
              </div>

              {/* 安全主管 */}
              <div>
                <label htmlFor='safety' className={projectStyles.form.label}>
                  安全主管
                </label>
                <input
                  id='safety'
                  type='text'
                  value={projectData.safety}
                  onChange={(e) => handleInputChange('safety', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入安全主管姓名'
                />
              </div>

              {/* 工地主任 */}
              <div>
                <label htmlFor='supervisor' className={projectStyles.form.label}>
                  工地主任
                </label>
                <input
                  id='supervisor'
                  type='text'
                  value={projectData.supervisor}
                  onChange={(e) => handleInputChange('supervisor', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入工地主任姓名'
                />
              </div>

              {/* 安全員 */}
              <div>
                <label htmlFor='safetyOfficer' className={projectStyles.form.label}>
                  安全員
                </label>
                <input
                  id='safetyOfficer'
                  type='text'
                  value={projectData.safetyOfficer}
                  onChange={(e) => handleInputChange('safetyOfficer', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入安全員姓名'
                />
              </div>

              {/* 成本控制員 */}
              <div>
                <label htmlFor='costController' className={projectStyles.form.label}>
                  成本控制員
                </label>
                <input
                  id='costController'
                  type='text'
                  value={projectData.costController}
                  onChange={(e) => handleInputChange('costController', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入成本控制員姓名'
                />
              </div>

              {/* 地區 */}
              <div>
                <label htmlFor='area' className={projectStyles.form.label}>
                  地區
                </label>
                <input
                  id='area'
                  type='text'
                  value={projectData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入地區'
                />
              </div>

              {/* 地址 */}
              <div>
                <label htmlFor='address' className={projectStyles.form.label}>
                  地址
                </label>
                <input
                  id='address'
                  type='text'
                  value={projectData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入地址'
                />
              </div>

              {/* 區域 */}
              <div>
                <label htmlFor='region' className={projectStyles.form.label}>
                  區域
                </label>
                <input
                  id='region'
                  type='text'
                  value={projectData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className={projectStyles.form.input}
                  placeholder='輸入區域'
                />
              </div>
            </div>

            {/* 按鈕 */}
            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={() => router.back()}
                className={projectStyles.button.outline}
                disabled={isLoading}
              >
                取消
              </button>
              <button
                type='submit'
                className={projectStyles.button.primary}
                disabled={isLoading}
              >
                {isLoading ? '生成中...' : '生成專案'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
