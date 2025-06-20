import Link from 'next/link';

import type { ProjectDocument } from '@/types/project';

const StatusBadge = ({ status }: { status?: string }) => {
  const statusClasses: Record<string, string> = {
    進行中: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    已完成: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    已暫停: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  const defaultClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  const className = status ? statusClasses[status] || defaultClass : defaultClass;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {status ?? '-'}
    </span>
  );
};

type ProjectsTableProps = {
  projects: ProjectDocument[];
};

export function ProjectsTable({ projects }: ProjectsTableProps) {
  if (projects.length === 0) {
    return <div className='px-4 py-8 text-center text-gray-500 dark:text-gray-400'>尚無專案</div>;
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full border-collapse'>
        <thead>
          <tr className='bg-gray-50 dark:bg-gray-900'>
            <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
              序號
            </th>
            <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
              專案名稱
            </th>
            <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
              合約ID
            </th>
            <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
              建立日期
            </th>
            <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
              狀態
            </th>
            <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
              操作
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
          {projects.map(project => (
            <tr
              key={project.id}
              className='hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200'
            >
              <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>{project.idx}</td>
              <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                {project.projectName}
              </td>
              <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                {project.contractId}
              </td>
              <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                {project.createdAt || '-'}
              </td>
              <td className='px-4 py-3 text-sm'>
                <StatusBadge status={project.status} />
              </td>
              <td className='px-4 py-3 text-sm'>
                <Link
                  href={`/projects/${project.id}`}
                  className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200'
                >
                  查看
                  <svg
                    className='w-4 h-4 ml-1'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
