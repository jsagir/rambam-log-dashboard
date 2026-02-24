// src/components/shared/SectionTitle.tsx
// Section header with optional subtitle

import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionTitle({ title, subtitle, className }: SectionTitleProps) {
  return (
    <div className={cn('mb-4', className)}>
      <h2 className="text-2xl font-serif font-bold text-foreground">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
