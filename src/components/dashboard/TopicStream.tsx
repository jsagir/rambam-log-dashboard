// src/components/dashboard/TopicStream.tsx
// Stacked area chart (streamgraph) showing topic volumes flowing over time
// "ThemeRiver" visualization - reveals which topics are growing, declining, or seasonal

'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TOPIC_COLORS } from '@/types/dashboard';

export interface TopicStreamProps {
  data: any[]; // Array of daily log data
  onTopicClick?: (topic: string) => void;
}

export function TopicStream({ data, onTopicClick }: TopicStreamProps) {
  // Transform data into streamgraph format
  const streamData = useMemo(() => {
    // Collect all topics across all days
    const allTopics = new Set<string>();
    data.forEach((day) => {
      const interactions = day.parsed?.interactions || [];
      interactions.forEach((i: any) => {
        const topic = i.topic || 'Uncategorized';
        allTopics.add(topic);
      });
    });

    // Build time series with topic counts per day
    return data.map((day) => {
      const interactions = day.parsed?.interactions || [];
      const topicCounts: Record<string, number> = {};

      // Initialize all topics to 0
      allTopics.forEach(topic => {
        topicCounts[topic] = 0;
      });

      // Count interactions per topic
      interactions.forEach((i: any) => {
        const topic = i.topic || 'Uncategorized';
        topicCounts[topic]++;
      });

      return {
        date: day.log_date || day.filename,
        ...topicCounts
      };
    });
  }, [data]);

  // Get top topics (limit to 8 for visual clarity)
  const topTopics = useMemo(() => {
    const topicTotals: Record<string, number> = {};

    streamData.forEach((day) => {
      Object.entries(day).forEach(([key, value]) => {
        if (key !== 'date') {
          topicTotals[key] = (topicTotals[key] || 0) + (value as number);
        }
      });
    });

    return Object.entries(topicTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic]) => topic);
  }, [streamData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            {payload
              .filter((entry: any) => entry.value > 0)
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">{entry.name}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {entry.value} ({Math.round((entry.value / total) * 100)}%)
                  </span>
                </div>
              ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border text-xs">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold text-foreground">{total}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={streamData}>
          <defs>
            {topTopics.map((topic, index) => {
              const color = TOPIC_COLORS[topic] || '#c8a961';
              return (
                <linearGradient key={topic} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#666', fontSize: 11 }}
            stroke="#666"
          />
          <YAxis
            tick={{ fill: '#666', fontSize: 11 }}
            stroke="#666"
            label={{ value: 'Questions', angle: -90, position: 'insideLeft', style: { fill: '#666', fontSize: 11 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            onClick={(e) => {
              if (onTopicClick && e.value) {
                onTopicClick(e.value);
              }
            }}
          />
          {topTopics.map((topic, index) => (
            <Area
              key={topic}
              type="monotone"
              dataKey={topic}
              stackId="1"
              stroke={TOPIC_COLORS[topic] || '#c8a961'}
              fill={`url(#gradient-${index})`}
              name={topic}
              onClick={() => onTopicClick && onTopicClick(topic)}
              style={{ cursor: onTopicClick ? 'pointer' : 'default' }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 text-xs text-muted-foreground text-center">
        Showing top {topTopics.length} topics by volume. Click a topic stream to filter conversations.
      </div>
    </div>
  );
}
