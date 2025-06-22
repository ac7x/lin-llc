import { type ReactElement } from 'react';
import { projectStyles } from '../../styles';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps): ReactElement {
  return (
    <main className={`${projectStyles.page.container} ${className}`}>
      <div className={projectStyles.page.card}>
        {children}
      </div>
    </main>
  );
} 