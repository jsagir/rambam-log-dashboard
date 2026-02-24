// src/components/shared/StatCard.tsx
// KPI stat card with icon, value, and optional sparkline

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Sparkline } from './Sparkline';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[]; // 7-day trend data
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  sparklineData,
  className
}: StatCardProps) {
  return (
    <div className={cn('bg-card border border-border rounded-lg p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sparklineData && sparklineData.length > 1 && (
              <Sparkline data={sparklineData} width={60} height={20} />
            )}
          </div>
          {trend && (
            <p className={cn(
              'text-xs mt-1',
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="ml-3">
            <Icon className="h-5 w-5 text-gold" />
          </div>
        )}
      </div>
    </div>
  );
}
