'use client';

import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle, Clock, Users, MessageCircle } from 'lucide-react';

interface DashboardData {
  filename: string;
  log_date: string;
  parsed: any;
  anomalies: any;
}

interface ExecutiveDashboardProps {
  data: DashboardData[];
}

export function ExecutiveDashboard({ data }: ExecutiveDashboardProps) {
  const insights = useMemo(() => {
    if (data.length === 0) return null;

    // Total conversations
    const totalConversations = data.reduce((sum, d) => sum + d.parsed.total_interactions, 0);

    // Language preferences
    const hebrewTotal = data.reduce((sum, d) => sum + (d.anomalies.metrics.languages.hebrew || 0), 0);
    const englishTotal = data.reduce((sum, d) => sum + (d.anomalies.metrics.languages.english || 0), 0);

    // Response quality
    const criticalIssues = data.reduce((sum, d) => sum + d.anomalies.summary.critical_count, 0);
    const minorIssues = data.reduce((sum, d) => sum + d.anomalies.summary.warning_count, 0);

    // Response speed (weighted average)
    const totalLatencySum = data.reduce((sum, d) => {
      const avgLatency = d.anomalies.metrics.latencies.first_response?.avg || 0;
      return sum + (avgLatency * d.parsed.total_interactions);
    }, 0);
    const avgResponseTime = totalConversations > 0 ? totalLatencySum / totalConversations : 0;

    // Overall health
    const healthScore = criticalIssues === 0 && minorIssues === 0 ? 100 :
                       criticalIssues === 0 && minorIssues <= 5 ? 85 :
                       criticalIssues === 0 ? 70 : 50;

    // Activity trend
    const halfPoint = Math.floor(data.length / 2);
    const firstHalfAvg = data.slice(0, halfPoint).reduce((sum, d) => sum + d.parsed.total_interactions, 0) / halfPoint;
    const secondHalfAvg = data.slice(halfPoint).reduce((sum, d) => sum + d.parsed.total_interactions, 0) / (data.length - halfPoint);
    const isGrowing = secondHalfAvg > firstHalfAvg;
    const growthPercent = Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);

    // Daily breakdown
    const dailyData = data.map(d => ({
      date: d.log_date,
      conversations: d.parsed.total_interactions,
      hebrew: d.anomalies.metrics.languages.hebrew || 0,
      english: d.anomalies.metrics.languages.english || 0,
      avgResponseTime: Math.round(d.anomalies.metrics.latencies.first_response?.avg || 0),
      issues: d.anomalies.summary.critical_count + d.anomalies.summary.warning_count,
    }));

    // Date range
    const dates = data.map(d => d.log_date).sort();
    const dateRange = dates.length === 1 ? dates[0] : `${dates[0]} to ${dates[dates.length - 1]}`;

    return {
      totalConversations,
      hebrewTotal,
      englishTotal,
      criticalIssues,
      minorIssues,
      avgResponseTime,
      healthScore,
      isGrowing,
      growthPercent,
      dailyData,
      dateRange,
      daysAnalyzed: data.length,
    };
  }, [data]);

  if (!insights) return null;

  const healthStatus = insights.healthScore >= 85 ? 'Excellent' :
                      insights.healthScore >= 70 ? 'Good' :
                      insights.healthScore >= 50 ? 'Needs Attention' : 'Action Required';

  const healthColor = insights.healthScore >= 85 ? 'text-green-600' :
                     insights.healthScore >= 70 ? 'text-blue-600' :
                     insights.healthScore >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-2">Rambam System Overview</h2>
        <p className="text-blue-100 mb-6">{insights.dateRange} • {insights.daysAnalyzed} days</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-4xl font-bold">{insights.totalConversations}</div>
            <div className="text-blue-100 text-sm mt-1">Total Visitor Conversations</div>
          </div>
          <div>
            <div className={`text-4xl font-bold ${healthColor}`} style={{color: 'white'}}>{insights.healthScore}%</div>
            <div className="text-blue-100 text-sm mt-1">System Health</div>
          </div>
          <div>
            <div className="text-4xl font-bold">{(insights.avgResponseTime / 1000).toFixed(2)}s</div>
            <div className="text-blue-100 text-sm mt-1">Avg Response Time</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-4xl font-bold flex items-center">
              {insights.isGrowing ? (
                <TrendingUp className="h-10 w-10" />
              ) : (
                <TrendingDown className="h-10 w-10" />
              )}
              <span className="ml-2">{insights.growthPercent.toFixed(0)}%</span>
            </div>
            <div className="text-blue-100 text-sm mt-1">Activity Trend</div>
          </div>
        </div>
      </div>

      {/* Key Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Visitor Engagement"
          value={insights.totalConversations}
          subtitle={`${Math.round(insights.totalConversations / insights.daysAnalyzed)} per day on average`}
          icon={<MessageCircle className="h-6 w-6 text-blue-600" />}
          color="blue"
        />
        <MetricCard
          title="Hebrew Conversations"
          value={`${((insights.hebrewTotal / insights.totalConversations) * 100).toFixed(0)}%`}
          subtitle={`${insights.hebrewTotal} conversations`}
          icon={<Users className="h-6 w-6 text-green-600" />}
          color="green"
        />
        <MetricCard
          title="English Conversations"
          value={`${((insights.englishTotal / insights.totalConversations) * 100).toFixed(0)}%`}
          subtitle={`${insights.englishTotal} conversations`}
          icon={<Users className="h-6 w-6 text-amber-600" />}
          color="amber"
        />
        <MetricCard
          title="Response Quality"
          value={healthStatus}
          subtitle={insights.criticalIssues === 0 ? 'No major issues' : `${insights.criticalIssues} items to review`}
          icon={insights.criticalIssues === 0 ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          color={insights.criticalIssues === 0 ? "green" : "red"}
        />
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Visitor Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={insights.dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="conversations" stroke="#3B82F6" strokeWidth={2} name="Conversations" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Language Preference */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Preference by Day</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={insights.dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="hebrew" fill="#10B981" name="Hebrew" />
            <Bar dataKey="english" fill="#F59E0B" name="English" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Response Time Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Response Speed</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={insights.dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Milliseconds', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgResponseTime" stroke="#8B5CF6" strokeWidth={2} name="Response Time (ms)" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-gray-600">
          <p>✅ Under 4 seconds: Good • ⚠️ 4-6 seconds: Acceptable • 🔴 Over 6 seconds: Needs optimization</p>
        </div>
      </div>

      {/* Issues Summary */}
      {(insights.criticalIssues > 0 || insights.minorIssues > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Needing Review</h3>
          <div className="space-y-3">
            {insights.criticalIssues > 0 && (
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-semibold text-gray-900">{insights.criticalIssues} Important Items</div>
                  <div className="text-sm text-gray-600">These conversations had issues that may need attention</div>
                </div>
              </div>
            )}
            {insights.minorIssues > 0 && (
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-900">{insights.minorIssues} Minor Notes</div>
                  <div className="text-sm text-gray-600">Small issues detected, not urgent but worth reviewing</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Key Insights</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>📊 <strong>{insights.totalConversations}</strong> visitors engaged with Rambam across <strong>{insights.daysAnalyzed}</strong> days</li>
          <li>🗣️ <strong>{((insights.hebrewTotal / insights.totalConversations) * 100).toFixed(0)}%</strong> preferred Hebrew, <strong>{((insights.englishTotal / insights.totalConversations) * 100).toFixed(0)}%</strong> preferred English</li>
          <li>⚡ Average response time: <strong>{(insights.avgResponseTime / 1000).toFixed(2)} seconds</strong> {insights.avgResponseTime < 4000 ? '(Excellent)' : insights.avgResponseTime < 6000 ? '(Good)' : '(Could be improved)'}</li>
          <li>📈 Visitor activity is <strong>{insights.isGrowing ? 'increasing' : 'decreasing'}</strong> by {insights.growthPercent.toFixed(0)}%</li>
          <li>{insights.criticalIssues === 0 ? '✅' : '⚠️'} System health: <strong>{healthStatus}</strong></li>
        </ul>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${bgColors[color] || bgColors.blue}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div className="text-xs font-medium text-gray-600 uppercase">{title}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
    </div>
  );
}
