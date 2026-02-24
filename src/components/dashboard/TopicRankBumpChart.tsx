// src/components/dashboard/TopicRankBumpChart.tsx
// Bump chart showing topic popularity rankings over time
// "Which topics are trending up/down? What's rising to the top?"

'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TOPIC_COLORS } from '@/types/dashboard';

export interface TopicRankBumpChartProps {
  data: any[]; // Array of daily log data
  topN?: number; // How many top topics to track (default: 6)
}

export function TopicRankBumpChart({ data, topN = 6 }: TopicRankBumpChartProps) {
  // Calculate topic rankings over time
  const rankData = useMemo(() => {
    if (!data || data.length < 2) return { chartData: [], topTopics: [] };

    // First pass: collect all topic counts per day
    const dailyTopicCounts: Record<string, Record<string, number>> = {};
    const allTopics = new Set<string>();

    data.forEach((day) => {
      const date = day.log_date || day.filename;
      dailyTopicCounts[date] = {};

      const interactions = day.parsed?.interactions || [];
      interactions.forEach((i: any) => {
        const topic = i.topic || 'Uncategorized';
        allTopics.add(topic);
        dailyTopicCounts[date][topic] = (dailyTopicCounts[date][topic] || 0) + 1;
      });
    });

    // Second pass: calculate overall topic totals to identify top N
    const topicTotals: Record<string, number> = {};
    allTopics.forEach(topic => {
      topicTotals[topic] = 0;
      Object.values(dailyTopicCounts).forEach(dayCounts => {
        topicTotals[topic] += dayCounts[topic] || 0;
      });
    });

    // Get top N topics by total volume
    const topTopics = Object.entries(topicTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([topic]) => topic);

    // Third pass: calculate daily rankings for top topics
    const chartData = data.map((day) => {
      const date = day.log_date || day.filename;
      const dayCounts = dailyTopicCounts[date];

      // Rank topics for this day
      const rankedTopics = Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([topic]) => topic);

      // Build data point with ranks for top topics
      const dataPoint: any = { date };

      topTopics.forEach(topic => {
        const rank = rankedTopics.indexOf(topic);
        // Rank is 0-indexed, convert to 1-indexed (1st, 2nd, 3rd...)
        // If topic not present this day, assign a low rank (topN + 1)
        dataPoint[topic] = rank === -1 ? topN + 1 : rank + 1;
      });

      return dataPoint;
    });

    return { chartData, topTopics };
  }, [data, topN]);

  const { chartData, topTopics } = rankData;

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Not enough data for trend analysis. Upload at least 2 days of logs.
        </p>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">
          {payload[0]?.payload?.date}
        </p>
        <div className="space-y-1">
          {payload
            .sort((a: any, b: any) => a.value - b.value) // Sort by rank (1st, 2nd, 3rd)
            .map((entry: any) => {
              const rank = entry.value;
              const topic = entry.name;
              const color = TOPIC_COLORS[topic] || '#c8a961';

              // Show medal emoji for top 3
              let medal = '';
              if (rank === 1) medal = '🥇';
              else if (rank === 2) medal = '🥈';
              else if (rank === 3) medal = '🥉';

              return (
                <div key={topic} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-foreground font-medium">
                    {medal} #{rank}
                  </span>
                  <span className="text-muted-foreground">{topic}</span>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <defs>
            {topTopics.map((topic, index) => {
              const color = TOPIC_COLORS[topic] || '#c8a961';
              return (
                <linearGradient key={topic} id={`gradient-${topic}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.4} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#666', fontSize: 10 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            reversed // Rank 1 at top
            domain={[1, topN + 1]}
            ticks={Array.from({ length: topN }, (_, i) => i + 1)}
            tick={{ fill: '#666', fontSize: 10 }}
            label={{ value: 'Rank', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            iconType="line"
          />

          {topTopics.map((topic, index) => {
            const color = TOPIC_COLORS[topic] || '#c8a961';
            return (
              <Line
                key={topic}
                type="monotone"
                dataKey={topic}
                name={topic}
                stroke={color}
                strokeWidth={2.5}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        Lower position = higher rank · Lines rising = gaining popularity · Lines falling = declining interest
      </div>
    </div>
  );
}
