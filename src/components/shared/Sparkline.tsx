// src/components/shared/Sparkline.tsx
// Tufte's sparklines: tiny inline charts showing trend at a glance
// "A number without context is just a number; a number with direction is information"

'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export interface SparklineProps {
  data: number[]; // Array of values
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = '#c8a961',
  strokeWidth = 1.5
}: SparklineProps) {
  // Transform data to chart format
  const chartData = data.map((value, index) => ({ index, value }));

  // Determine trend color (last value vs first value)
  const trend = data.length >= 2 ? (data[data.length - 1] >= data[0] ? 'up' : 'down') : 'flat';
  const lineColor = trend === 'up' ? '#4a8f6f' : trend === 'down' ? '#c75b3a' : color;

  if (data.length === 0) return null;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={strokeWidth}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
