// src/components/dashboard/CumulativeView.tsx
// Cumulative trends view with KPIs and visualizations

'use client';

import React, { useMemo } from 'react';
import { StatCard } from '@/components/shared/StatCard';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { TopicStream } from './TopicStream';
import { TopicQualityTreemap } from './TopicQualityTreemap';
import { DailySummary } from './DailySummary';
import { Activity, Clock, Users, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { TOPIC_COLORS } from '@/types/dashboard';

export interface CumulativeViewProps {
  data: any[];
}

const SENSITIVITY_COLORS = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

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

  // Engagement trend data (Hebrew vs English over time)
  const engagementTrend = useMemo(() => {
    return data.map((day) => {
      const summary = day.parsed?.summary;
      const lang = summary?.language_distribution || {};
      return {
        date: day.log_date || day.filename,
        hebrew: lang['he-IL'] || 0,
        english: lang['en-US'] || 0,
        total: summary?.total_interactions || 0,
      };
    }).filter(d => d.total > 0);
  }, [data]);

  // Topic distribution across all days
  const topicDistribution = useMemo(() => {
    const topicCounts: Record<string, number> = {};
    data.forEach((day) => {
      const interactions = day.parsed?.interactions || [];
      interactions.forEach((i: any) => {
        const topic = i.topic || 'Uncategorized';
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    return Object.entries(topicCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data]);

  // Question type distribution
  const typeDistribution = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    data.forEach((day) => {
      const interactions = day.parsed?.interactions || [];
      interactions.forEach((i: any) => {
        const type = i.classification?.question_type || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
    });
    return Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Sensitivity radar
  const sensitivityRadar = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    data.forEach((day) => {
      const interactions = day.parsed?.interactions || [];
      interactions.forEach((i: any) => {
        const sensitivity = i.sensitivity || 'low';
        if (sensitivity in counts) {
          counts[sensitivity as keyof typeof counts]++;
        }
      });
    });
    return Object.entries(counts).map(([subject, count]) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      count,
      fullMark: totalInteractions,
    }));
  }, [data, totalInteractions]);

  // Daily latency trend
  const latencyTrend = useMemo(() => {
    return data.map((day) => {
      const summary = day.parsed?.summary;
      const latency = summary?.latency_stats?.generation_start_ms?.avg || 0;
      return {
        date: day.log_date || day.filename,
        latency: Math.round(latency),
        interactions: summary?.total_interactions || 0,
      };
    }).filter(d => d.interactions > 0);
  }, [data]);

  // Sparkline data for KPI cards (daily trends)
  const interactionsSparkline = useMemo(() => {
    return data.map(day => day.parsed?.summary?.total_interactions || 0);
  }, [data]);

  const questionsSparkline = useMemo(() => {
    return data.map(day => day.parsed?.summary?.total_questions || 0);
  }, [data]);

  const sessionsSparkline = useMemo(() => {
    return data.map(day => day.parsed?.summary?.sessions || 0);
  }, [data]);

  const latencySparkline = useMemo(() => {
    return data.map(day => {
      const latency = day.parsed?.summary?.latency_stats?.generation_start_ms?.avg || 0;
      return Math.round(latency);
    });
  }, [data]);

  // Collect all critical anomalies
  const criticalIssues = data.flatMap((day) => {
    const anomalies = day.parsed?.summary?.anomaly_summary?.critical || {};
    const date = day.log_date || day.filename;
    return Object.entries(anomalies).flatMap(([type, count]) =>
      Array(count as number).fill({ date, type })
    );
  });

  const TYPE_COLORS = ['#c8a961', '#7da87b', '#6e8fae', '#b07da8', '#ae8a6e', '#f472b6', '#60a5fa'];

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
            sparklineData={interactionsSparkline}
          />
          <StatCard
            label="Questions Asked"
            value={totalQuestions}
            icon={Users}
            sparklineData={questionsSparkline}
          />
          <StatCard
            label="Sessions"
            value={totalSessions}
            icon={Activity}
            sparklineData={sessionsSparkline}
          />
          <StatCard
            label="Avg Response Time"
            value={`${(avgLatency / 1000).toFixed(2)}s`}
            icon={Clock}
            sparklineData={latencySparkline}
          />
        </div>
      </div>

      {/* AI Daily Summary */}
      <DailySummary data={data} />

      {/* Engagement Trend */}
      {engagementTrend.length > 0 && (
        <div>
          <SectionTitle title="Engagement Trend" />
          <div className="bg-card border border-border rounded-lg p-5">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={engagementTrend}>
                <defs>
                  <linearGradient id="gHebrew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEnglish" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1f',
                    border: '1px solid #333',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hebrew"
                  stackId="1"
                  stroke="#60a5fa"
                  fill="url(#gHebrew)"
                  name="🇮🇱 Hebrew"
                />
                <Area
                  type="monotone"
                  dataKey="english"
                  stackId="1"
                  stroke="#f472b6"
                  fill="url(#gEnglish)"
                  name="🇬🇧 English"
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Topic Stream - ThemeRiver visualization */}
      <div>
        <SectionTitle
          title="Topic Stream: What Visitors Think About"
          subtitle="Flowing patterns reveal which topics are growing, declining, or seasonal"
        />
        <div className="bg-card border border-border rounded-lg p-5">
          <TopicStream data={data} />
        </div>
      </div>

      {/* Topic Quality Treemap */}
      <div>
        <SectionTitle
          title="Topic Quality Snapshot"
          subtitle="Rectangle size = volume · Color = quality score"
        />
        <div className="bg-card border border-border rounded-lg p-5">
          <TopicQualityTreemap data={data} />
        </div>
      </div>

      {/* Topic Distribution + Question Types side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Topic Distribution */}
        {topicDistribution.length > 0 && (
          <div>
            <SectionTitle title="Topic Distribution" />
            <div className="bg-card border border-border rounded-lg p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topicDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                  <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#999', fontSize: 10 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1f',
                      border: '1px solid #333',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {topicDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TOPIC_COLORS[entry.name] || '#c8a961'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Question Type Distribution */}
        {typeDistribution.length > 0 && (
          <div>
            <SectionTitle title="Question Types" />
            <div className="bg-card border border-border rounded-lg p-5">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={{ stroke: '#555' }}
                  >
                    {typeDistribution.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1f',
                      border: '1px solid #333',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Latency Trend + Sensitivity Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latency Trend */}
        {latencyTrend.length > 0 && (
          <div>
            <SectionTitle title="Response Time Trend" />
            <div className="bg-card border border-border rounded-lg p-5">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={latencyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                  <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#666', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1f',
                      border: '1px solid #333',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => `${value}ms`}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#c8a961"
                    strokeWidth={2}
                    dot={{ fill: '#c8a961' }}
                    name="Avg Latency"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 justify-center text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500/60" />
                  <span>&lt; 2s (Good)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                  <span>2-4s (Warn)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500/60" />
                  <span>&gt; 4s (Critical)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sensitivity Radar */}
        <div>
          <SectionTitle title="Sensitivity Distribution" />
          <div className="bg-card border border-border rounded-lg p-5">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={sensitivityRadar}>
                <PolarGrid stroke="#2a2a30" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#999', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#555', fontSize: 9 }} />
                <Radar
                  name="Questions"
                  dataKey="count"
                  stroke="#c8a961"
                  fill="#c8a961"
                  fillOpacity={0.25}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1f',
                    border: '1px solid #333',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
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
