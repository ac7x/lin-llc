import { type ReactElement } from 'react';
import { projectStyles } from '../../styles';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps): ReactElement {
  return (
    <div className={projectStyles.page.header}>
      <div>
        <h1 className={projectStyles.page.title}>{title}</h1>
        {subtitle && <p className={projectStyles.page.subtitle}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
