'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Clock, AlertTriangle, CheckCircle, Users, Calendar } from 'lucide-react';

interface MultiDayData {
  filename: string;
  log_date: string;
  parsed: any;
  anomalies: any;
}

interface AccumulativeKPIsProps {
  data: MultiDayData[];
}

export function AccumulativeKPIs({ data }: AccumulativeKPIsProps) {
  const kpis = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Total interactions across all logs
    const totalInteractions = data.reduce((sum, d) => sum + d.parsed.total_interactions, 0);

    // Language breakdown (accumulative)
    const totalHebrew = data.reduce((sum, d) => sum + (d.anomalies.metrics.languages.hebrew || 0), 0);
    const totalEnglish = data.reduce((sum, d) => sum + (d.anomalies.metrics.languages.english || 0), 0);
    const totalUnknown = data.reduce((sum, d) => sum + (d.anomalies.metrics.languages.null || d.anomalies.metrics.languages.unknown || 0), 0);

    // Total issues (accumulative)
    const totalCritical = data.reduce((sum, d) => sum + d.anomalies.summary.critical_count, 0);
    const totalWarnings = data.reduce((sum, d) => sum + d.anomalies.summary.warning_count, 0);

    // Average response time (weighted by interaction count)
    const totalLatencySum = data.reduce((sum, d) => {
      const avgLatency = d.anomalies.metrics.latencies.first_response?.avg || 0;
      return sum + (avgLatency * d.parsed.total_interactions);
    }, 0);
    const overallAvgLatency = totalInteractions > 0 ? totalLatencySum / totalInteractions : 0;

    // Overall health score (weighted)
    const healthScores = data.map(d => {
      if (d.anomalies.summary.critical_count > 0) return 40;
      if (d.anomalies.summary.warning_count > 3) return 60;
      if (d.anomalies.summary.warning_count > 0) return 80;
      return 100;
    });
    const overallHealthScore = healthScores.reduce((sum, score) => sum + score, 0) / data.length;

    // Best and worst performing days
    const daysWithScores = data.map((d, idx) => ({
      date: d.log_date,
      score: healthScores[idx],
      interactions: d.parsed.total_interactions,
      latency: d.anomalies.metrics.latencies.first_response?.avg || 0
    }));
    const bestDay = daysWithScores.reduce((best, curr) => curr.score > best.score ? curr : best);
    const worstDay = daysWithScores.reduce((worst, curr) => curr.score < worst.score ? curr : worst);

    // Busiest day
    const busiestDay = daysWithScores.reduce((busiest, curr) =>
      curr.interactions > busiest.interactions ? curr : busiest
    );

    // Average per day
    const avgInteractionsPerDay = totalInteractions / data.length;

    // Sessions
    const totalSessions = data.reduce((sum, d) => sum + (d.parsed.sessions?.length || 0), 0);

    // Date range
    const dates = data.map(d => d.log_date).sort();
    const dateRange = `${dates[0]} to ${dates[dates.length - 1]}`;

    // Trend (first half vs second half)
    const halfPoint = Math.floor(data.length / 2);
    const firstHalfAvg = data.slice(0, halfPoint).reduce((sum, d) => sum + d.parsed.total_interactions, 0) / halfPoint;
    const secondHalfAvg = data.slice(halfPoint).reduce((sum, d) => sum + d.parsed.total_interactions, 0) / (data.length - halfPoint);
    const trend = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable';
    const trendPercent = Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);

    return {
      totalInteractions,
      totalHebrew,
      totalEnglish,
      totalUnknown,
      totalCritical,
      totalWarnings,
      overallAvgLatency,
      overallHealthScore,
      bestDay,
      worstDay,
      busiestDay,
      avgInteractionsPerDay,
      totalSessions,
      dateRange,
      daysAnalyzed: data.length,
      trend,
      trendPercent,
    };
  }, [data]);

  if (!kpis) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* Executive Summary Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Accumulative KPIs</h2>
            <p className="text-blue-100 text-sm mt-1">
              {kpis.dateRange} • {kpis.daysAnalyzed} days analyzed
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{kpis.totalInteractions}</div>
            <div className="text-sm text-blue-100">Total Interactions</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-500">
          <div>
            <div className="text-2xl font-bold">{Math.round(kpis.avgInteractionsPerDay)}</div>
            <div className="text-sm text-blue-100">Avg per Day</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{Math.round(kpis.overallHealthScore)}%</div>
            <div className="text-sm text-blue-100">Health Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center gap-2">
              {kpis.trend === 'up' ? (
                <><TrendingUp className="h-6 w-6" /> +{kpis.trendPercent.toFixed(1)}%</>
              ) : kpis.trend === 'down' ? (
                <><TrendingDown className="h-6 w-6" /> -{kpis.trendPercent.toFixed(1)}%</>
              ) : (
                <>Stable</>
              )}
            </div>
            <div className="text-sm text-blue-100">Activity Trend</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Language Distribution */}
        <KPICard
          icon={<Activity className="h-5 w-5 text-blue-600" />}
          label="Hebrew Interactions"
          value={kpis.totalHebrew}
          subtitle={`${((kpis.totalHebrew / kpis.totalInteractions) * 100).toFixed(1)}% of total`}
          color="blue"
        />
        <KPICard
          icon={<Activity className="h-5 w-5 text-green-600" />}
          label="English Interactions"
          value={kpis.totalEnglish}
          subtitle={`${((kpis.totalEnglish / kpis.totalInteractions) * 100).toFixed(1)}% of total`}
          color="green"
        />
        <KPICard
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          label="Avg Response Time"
          value={`${Math.round(kpis.overallAvgLatency)}ms`}
          subtitle="Across all interactions"
          color="purple"
        />
        <KPICard
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          label="Total Sessions"
          value={kpis.totalSessions}
          subtitle={`Avg ${(kpis.totalSessions / kpis.daysAnalyzed).toFixed(1)} per day`}
          color="indigo"
        />
      </div>

      {/* Issues Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          label="Critical Issues"
          value={kpis.totalCritical}
          subtitle={kpis.totalCritical === 0 ? '✅ Excellent!' : '⚠️ Needs attention'}
          color="red"
          highlight={kpis.totalCritical > 0}
        />
        <KPICard
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          label="Warnings"
          value={kpis.totalWarnings}
          subtitle={`Avg ${(kpis.totalWarnings / kpis.daysAnalyzed).toFixed(1)} per day`}
          color="amber"
        />
        <KPICard
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          label="Unknown Language"
          value={kpis.totalUnknown}
          subtitle={`${((kpis.totalUnknown / kpis.totalInteractions) * 100).toFixed(1)}% of total`}
          color="gray"
        />
      </div>

      {/* Performance Highlights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-green-500 pl-4">
            <div className="text-sm font-medium text-gray-500">Best Day</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{kpis.bestDay.date}</div>
            <div className="text-sm text-gray-600 mt-1">
              Health Score: {kpis.bestDay.score}%
            </div>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <div className="text-sm font-medium text-gray-500">Busiest Day</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{kpis.busiestDay.date}</div>
            <div className="text-sm text-gray-600 mt-1">
              {kpis.busiestDay.interactions} interactions
            </div>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <div className="text-sm font-medium text-gray-500">Needs Review</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{kpis.worstDay.date}</div>
            <div className="text-sm text-gray-600 mt-1">
              Health Score: {kpis.worstDay.score}%
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Quick Insights</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>
                📊 <strong>{kpis.totalInteractions}</strong> total visitor interactions across <strong>{kpis.daysAnalyzed}</strong> days
              </li>
              <li>
                🗣️ <strong>{((kpis.totalHebrew / kpis.totalInteractions) * 100).toFixed(0)}%</strong> Hebrew, <strong>{((kpis.totalEnglish / kpis.totalInteractions) * 100).toFixed(0)}%</strong> English interactions
              </li>
              <li>
                ⚡ Average response time: <strong>{Math.round(kpis.overallAvgLatency)}ms</strong> {kpis.overallAvgLatency < 4000 ? '(Good)' : kpis.overallAvgLatency < 6000 ? '(Acceptable)' : '(Needs optimization)'}
              </li>
              <li>
                {kpis.totalCritical === 0 ? '✅' : '🔴'} <strong>{kpis.totalCritical}</strong> critical issues, <strong>{kpis.totalWarnings}</strong> warnings detected
              </li>
              <li>
                📈 Activity trend: {kpis.trend === 'up' ? '📈 Increasing' : kpis.trend === 'down' ? '📉 Decreasing' : '➡️ Stable'} ({kpis.trend !== 'stable' ? `${kpis.trendPercent.toFixed(1)}%` : 'consistent'})
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle: string;
  color: string;
  highlight?: boolean;
}

function KPICard({ icon, label, value, subtitle, color, highlight }: KPICardProps) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    gray: 'bg-gray-50 border-gray-200',
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${highlight ? 'ring-2 ring-red-500' : ''} ${bgColors[color] || bgColors.gray}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div className="text-xs font-medium text-gray-600 uppercase">{label}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
    </div>
  );
}
