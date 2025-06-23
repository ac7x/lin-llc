/**
 * 合約選擇器組件
 * 提供合約選擇功能
 */

'use client';

import { type ReactElement } from 'react';

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

interface ContractSelectorProps {
  contracts: Contract[];
  selectedContractId?: string;
  onSelectContract: (contractId: string) => void;
  className?: string;
}

export default function ContractSelector({
  contracts,
  selectedContractId,
  onSelectContract,
  className,
}: ContractSelectorProps): ReactElement {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      {contracts.map(contract => (
        <div
          key={contract.id}
          className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
            selectedContractId === contract.id
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          onClick={() => onSelectContract(contract.id)}
        >
          <div className='flex justify-between items-start'>
            <div className='flex-1'>
              <h4 className='font-medium text-gray-900 dark:text-gray-100 mb-1'>
                {contract.contractName}
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                合約編號: {contract.contractNumber}
              </p>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                客戶: {contract.clientName}
              </p>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                期間: {contract.startDate.toLocaleDateString()} - {contract.endDate.toLocaleDateString()}
              </p>
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>
                {contract.description}
              </p>
            </div>
            <div className='text-right ml-4'>
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
  );
} 