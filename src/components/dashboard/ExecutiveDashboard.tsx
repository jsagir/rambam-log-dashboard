// src/components/dashboard/ExecutiveDashboard.tsx
// Dual-mode dashboard: Cumulative Trends + Day Drill-Down

'use client';

import React, { useState } from 'react';
import { CumulativeView } from './CumulativeView';
import { DrillDownView } from './DrillDownView';
import { BarChart3, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExecutiveDashboardProps {
  data: any[];
}

type TabMode = 'cumulative' | 'drilldown';

export function ExecutiveDashboard({ data }: ExecutiveDashboardProps) {
  const [mode, setMode] = useState<TabMode>('cumulative');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img
                src="/motj-logo.png"
                alt="Museum of Tolerance Jerusalem"
                className="h-12 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">
                  Rambam System Dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Museum of Tolerance Jerusalem - AI Holographic Experience Monitoring
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('cumulative')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium text-sm',
                mode === 'cumulative'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Cumulative Trends
            </button>
            <button
              onClick={() => setMode('drilldown')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium text-sm',
                mode === 'drilldown'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Calendar className="h-4 w-4" />
              Day Drill-Down
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === 'cumulative' ? (
          <CumulativeView data={data} />
        ) : (
          <DrillDownView data={data} />
        )}
      </main>
    </div>
  );
}
