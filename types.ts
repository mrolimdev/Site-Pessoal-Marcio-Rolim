import type { ReactNode } from 'react';

export interface Skill {
  icon: ReactNode;
  title: string;
  description: string;
  category: 'professional' | 'personal';
}
