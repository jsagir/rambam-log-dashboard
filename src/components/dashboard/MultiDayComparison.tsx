'use client';

import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ParsedLog, AnomalyReport } from '@/types/rambam';

interface MultiDayData {
  filename: string;
  log_date: string;
  parsed: ParsedLog;
  anomalies: AnomalyReport;
}

interface MultiDayComparisonProps {
  data: MultiDayData[];
}

export function MultiDayComparison({ data }: MultiDayComparisonProps) {
  const comparisonData = useMemo(() => {
    return data.map(day => {
      const avgLatency = day.anomalies.metrics.latencies.first_response?.avg || 0;
      const languages = day.anomalies.metrics.languages;

      return {
        date: day.log_date,
        interactions: day.parsed.total_interactions,
        hebrew: languages.hebrew || 0,
        english: languages.english || 0,
        unknown: languages.null || languages.unknown || 0,
        avgLatency: Math.round(avgLatency),
        critical: day.anomalies.summary.critical_count,
        warnings: day.anomalies.summary.warning_count,
        healthScore: day.anomalies.summary.critical_count === 0 && day.anomalies.summary.warning_count === 0 ? 100 :
                     day.anomalies.summary.critical_count === 0 && day.anomalies.summary.warning_count <= 3 ? 80 :
                     day.anomalies.summary.critical_count === 0 ? 60 : 40
      };
    });
  }, [data]);

  return (
    <div className="space-y-6 mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Days Analyzed</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Total Interactions</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {comparisonData.reduce((sum, d) => sum + d.interactions, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Avg Daily Interactions</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {Math.round(comparisonData.reduce((sum, d) => sum + d.interactions, 0) / data.length)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Critical Issues</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {comparisonData.reduce((sum, d) => sum + d.critical, 0)}
          </div>
        </div>
      </div>

      {/* Daily Interactions Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="interactions" stroke="#3B82F6" strokeWidth={2} name="Total Interactions" />
            <Line type="monotone" dataKey="hebrew" stroke="#10B981" strokeWidth={2} name="Hebrew" />
            <Line type="monotone" dataKey="english" stroke="#F59E0B" strokeWidth={2} name="English" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Response Time by Day</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgLatency" fill="#8B5CF6" name="Avg Latency (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Health Score Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Health Score</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="healthScore" stroke="#10B981" strokeWidth={3} name="Health Score" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-gray-600">
          <p>💚 100 = Perfect (no issues)</p>
          <p>💛 80 = Good (minor warnings)</p>
          <p>🧡 60 = Fair (multiple warnings)</p>
          <p>❤️ 40 = Poor (critical issues)</p>
        </div>
      </div>

      {/* Day-by-Day Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Summary Table</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interactions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hebrew</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">English</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Latency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Critical</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warnings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparisonData.map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{day.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{day.interactions}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{day.hebrew}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{day.english}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{day.avgLatency}ms</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      day.critical > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {day.critical}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      day.warnings > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {day.warnings}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            day.healthScore >= 80 ? 'bg-green-500' :
                            day.healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${day.healthScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{day.healthScore}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
