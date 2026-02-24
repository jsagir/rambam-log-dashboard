'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Interaction } from '@/types/rambam';

interface TimelineChartProps {
  interactions: Interaction[];
}

export function TimelineChart({ interactions }: TimelineChartProps) {
  const safeInteractions = Array.isArray(interactions) ? interactions : [];
  const chartData = useMemo(() => {
    // Group interactions by hour for trend analysis
    const hourlyData: Record<string, { hour: string; count: number; avgLatency: number; latencies: number[] }> = {};

    safeInteractions.forEach((interaction) => {
      const timestamp = interaction.timestamps?.stt;
      if (!timestamp) return;

      const date = new Date(timestamp);
      const hour = `${date.getHours().toString().padStart(2, '0')}:00`;

      if (!hourlyData[hour]) {
        hourlyData[hour] = { hour, count: 0, avgLatency: 0, latencies: [] };
      }

      hourlyData[hour].count++;

      const firstResponse = interaction.latencies?.first_response;
      if (firstResponse) {
        hourlyData[hour].latencies.push(firstResponse);
      }
    });

    // Calculate average latencies
    return Object.values(hourlyData).map(data => ({
      hour: data.hour,
      count: data.count,
      avgLatency: data.latencies.length > 0
        ? Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length)
        : 0
    })).sort((a, b) => a.hour.localeCompare(b.hour));
  }, [safeInteractions]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity Trend</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="count"
            stroke="#3B82F6"
            name="Interactions"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgLatency"
            stroke="#F59E0B"
            name="Avg Latency (ms)"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-gray-600">
        <p>📊 This chart shows interaction volume and average response latency by hour</p>
        <p className="mt-1">💡 Use this to identify peak times and performance patterns</p>
      </div>
    </div>
  );
}
