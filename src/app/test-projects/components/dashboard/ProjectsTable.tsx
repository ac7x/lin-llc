import Link from 'next/link';
import { projectStyles } from '../../styles';

interface Project {
  id: string;
  projectName: string;
  status: string;
  progress?: number;
  createdAt: string;
  [key: string]: string | number | undefined;
}

interface ProjectsTableProps {
  projects: Project[];
  showAdvancedColumns?: boolean;
}

export default function ProjectsTable({ projects, showAdvancedColumns = false }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
        尚無專案
      </div>
    );
  }

  return (
    <div className={projectStyles.table.container}>
      <table className={projectStyles.table.table}>
        <thead className={projectStyles.table.thead}>
          <tr>
            <th className={projectStyles.table.th}>序號</th>
            <th className={projectStyles.table.th}>專案名稱</th>
            <th className={projectStyles.table.th}>狀態</th>
            <th className={projectStyles.table.th}>進度</th>
            {showAdvancedColumns && (
              <>
                <th className={projectStyles.table.th}>類型</th>
                <th className={projectStyles.table.th}>優先級</th>
                <th className={projectStyles.table.th}>風險等級</th>
              </>
            )}
            <th className={projectStyles.table.th}>建立日期</th>
            <th className={projectStyles.table.th}>操作</th>
          </tr>
        </thead>
        <tbody className={projectStyles.table.tbody}>
          {projects.map((project, index) => (
            <tr key={project.id} className={projectStyles.table.rowHover}>
              <td className={projectStyles.table.td}>{index + 1}</td>
              <td className={projectStyles.table.td}>
                <Link
                  href={`/projects/${project.id}`}
                  className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  {project.projectName}
                </Link>
              </td>
              <td className={projectStyles.table.td}>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                  {project.status}
                </span>
              </td>
              <td className={projectStyles.table.td}>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2rem]">
                    {project.progress || 0}%
                  </span>
                </div>
              </td>
              {showAdvancedColumns && (
                <>
                  <td className={projectStyles.table.td}>-</td>
                  <td className={projectStyles.table.td}>-</td>
                  <td className={projectStyles.table.td}>-</td>
                </>
              )}
              <td className={projectStyles.table.td}>
                {project.createdAt || '未知'}
              </td>
              <td className={projectStyles.table.td}>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                  >
                    查看
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 