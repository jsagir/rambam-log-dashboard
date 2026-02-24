// src/components/dashboard/CumulativeView.tsx
// Cumulative trends view with KPIs and critical issues

'use client';

import React from 'react';
import { StatCard } from '@/components/shared/StatCard';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Activity, Clock, Users, AlertTriangle } from 'lucide-react';

export interface CumulativeViewProps {
  data: any[];
}

export function CumulativeView({ data }: CumulativeViewProps) {
  // Calculate cumulative stats
  const totalInteractions = data.reduce((sum, day) => sum + (day.parsed?.summary?.total_interactions || 0), 0);
  const totalQuestions = data.reduce((sum, day) => sum + (day.parsed?.summary?.total_questions || 0), 0);
  const totalSessions = data.reduce((sum, day) => sum + (day.parsed?.summary?.sessions || 0), 0);

  // Calculate average latency weighted by interaction count
  let totalLatency = 0;
  let totalSamples = 0;
  data.forEach((day) => {
    const stats = day.parsed?.summary?.latency_stats?.generation_start_ms;
    if (stats) {
      totalLatency += stats.avg * stats.samples;
      totalSamples += stats.samples;
    }
  });
  const avgLatency = totalSamples > 0 ? Math.round(totalLatency / totalSamples) : 0;

  // Collect all critical anomalies
  const criticalIssues = data.flatMap((day) => {
    const anomalies = day.parsed?.summary?.anomaly_summary?.critical || {};
    const date = day.log_date || day.filename;
    return Object.entries(anomalies).flatMap(([type, count]) =>
      Array(count as number).fill({ date, type })
    );
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div>
        <SectionTitle title="Overview" subtitle={`${data.length} days analyzed`} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Conversations"
            value={totalInteractions}
            icon={Activity}
          />
          <StatCard
            label="Questions Asked"
            value={totalQuestions}
            icon={Users}
          />
          <StatCard
            label="Sessions"
            value={totalSessions}
            icon={Activity}
          />
          <StatCard
            label="Avg Response Time"
            value={`${(avgLatency / 1000).toFixed(2)}s`}
            icon={Clock}
          />
        </div>
      </div>

      {/* Critical Issues Log */}
      {criticalIssues.length > 0 && (
        <div>
          <SectionTitle
            title="Critical Issues Log"
            subtitle={`${criticalIssues.length} critical anomalies detected`}
          />
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Issue Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {criticalIssues.slice(0, 20).map((issue, i) => (
                  <tr key={i} className="hover:bg-background/50">
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {issue.date}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {issue.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Stats Table */}
      <div>
        <SectionTitle title="Daily Breakdown" />
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Interactions
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Latency
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Health
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((day, i) => {
                const summary = day.parsed?.summary;
                const latency = summary?.latency_stats?.generation_start_ms?.avg || 0;
                return (
                  <tr key={i} className="hover:bg-background/50">
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {day.log_date || day.filename}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {summary?.total_interactions || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {summary?.sessions || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {(latency / 1000).toFixed(2)}s
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg">{summary?.health || '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
