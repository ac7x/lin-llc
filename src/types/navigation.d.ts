import type React from 'react';

export interface NavigationItem {
  id:string;
  name: string;
  path: string;
  icon: React.ReactNode;
} 