import { projectStyles } from '../../styles';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`${projectStyles.page.container} ${className}`}>
      <div className={projectStyles.page.card}>
        {children}
      </div>
    </main>
  );
} 