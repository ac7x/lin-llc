import type { ReactNode } from 'react';

export interface NavigationItem {
  id: string;
  name: string;
  path: string;
  icon: ReactNode;
}
