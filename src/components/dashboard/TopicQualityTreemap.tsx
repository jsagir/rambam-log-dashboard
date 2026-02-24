// src/components/dashboard/TopicQualityTreemap.tsx
// Treemap showing topic volume (size) + quality score (color) in one visualization
// Answers: "What are visitors asking about AND how well are we handling each topic?"

'use client';

import React, { useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

export interface TopicQualityTreemapProps {
  data: any[]; // Array of daily log data
}

export function TopicQualityTreemap({ data }: TopicQualityTreemapProps) {
  // Calculate topic volumes and quality scores
  const treemapData = useMemo(() => {
    if (!data || data.length === 0) {
      return { name: 'Topics', children: [] };
    }

    const topicStats: Record<string, { count: number; correctCount: number; partialCount: number; incorrectCount: number }> = {};

    data.forEach((day) => {
      const interactions = day.parsed?.interactions || [];
      interactions.forEach((i: any) => {
        const topic = i.topic || 'Uncategorized';
        if (!topicStats[topic]) {
          topicStats[topic] = { count: 0, correctCount: 0, partialCount: 0, incorrectCount: 0 };
        }
        topicStats[topic].count++;

        // Track quality (simplified scoring)
        const accuracy = i.accuracy || 'pending';
        if (accuracy === 'correct') topicStats[topic].correctCount++;
        else if (accuracy === 'partial') topicStats[topic].partialCount++;
        else if (accuracy === 'incorrect') topicStats[topic].incorrectCount++;
      });
    });

    // Transform to treemap format with quality score
    return {
      name: 'Topics',
      children: Object.entries(topicStats)
        .map(([name, stats]) => {
          // Calculate quality score (0-100)
          const qualityScore = stats.count > 0
            ? Math.round(
                ((stats.correctCount * 100 + stats.partialCount * 50 + stats.incorrectCount * 0) /
                  stats.count)
              )
            : 0;

          return {
            name,
            size: stats.count,
            qualityScore,
            correctCount: stats.correctCount,
            partialCount: stats.partialCount,
            incorrectCount: stats.incorrectCount,
          };
        })
        .sort((a, b) => b.size - a.size)
        .slice(0, 12), // Top 12 topics for visual clarity
    };
  }, [data]);

  // Get color based on quality score
  const getQualityColor = (score: number): string => {
    if (score >= 90) return '#4a8f6f'; // Muted forest green
    if (score >= 75) return '#7b9f35'; // Healthy green
    if (score >= 60) return '#d4a843'; // Amber gold
    if (score >= 40) return '#d97706'; // Orange
    return '#c75b3a'; // Burnt sienna
  };

  // Custom cell renderer
  const CustomizedContent = (props: any) => {
    const { x, y, width, height, name, size, qualityScore } = props;

    // Don't render if too small or missing required data
    if (width < 30 || height < 30 || qualityScore === undefined || qualityScore === null) return null;

    const color = getQualityColor(qualityScore || 0);
    const textColor = (qualityScore || 0) >= 60 ? '#ffffff' : '#1a1a1a';

    return (
      <g>
        {/* Rectangle */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: '#1a1a1f',
            strokeWidth: 2,
            opacity: 0.9,
          }}
        />

        {/* Topic name */}
        {width > 60 && height > 40 && (
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill={textColor}
            fontSize={width > 100 ? 13 : 11}
            fontWeight="600"
          >
            {name && typeof name === 'string' && name.length > 20 ? name.substring(0, 18) + '...' : (name || '')}
          </text>
        )}

        {/* Quality score */}
        {width > 50 && height > 50 && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 8}
            textAnchor="middle"
            fill={textColor}
            fontSize={10}
            opacity={0.9}
          >
            {qualityScore}% ({size})
          </text>
        )}
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-foreground mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Questions:</span>
              <span className="font-medium text-foreground">{data.size}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Quality Score:</span>
              <span
                className="font-semibold"
                style={{ color: getQualityColor(data.qualityScore) }}
              >
                {data.qualityScore}%
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-border space-y-0.5">
              <div className="flex justify-between gap-4">
                <span className="text-green-400">✓ Correct:</span>
                <span className="text-green-400">{data.correctCount}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-yellow-400">~ Partial:</span>
                <span className="text-yellow-400">{data.partialCount}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-red-400">✗ Incorrect:</span>
                <span className="text-red-400">{data.incorrectCount}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <Treemap
          data={treemapData.children}
          dataKey="size"
          stroke="#1a1a1f"
          fill="#c8a961"
          content={<CustomizedContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#4a8f6f' }} />
          <span className="text-muted-foreground">90-100% Excellent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#7b9f35' }} />
          <span className="text-muted-foreground">75-89% Good</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#d4a843' }} />
          <span className="text-muted-foreground">60-74% Fair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#d97706' }} />
          <span className="text-muted-foreground">40-59% Needs Work</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#c75b3a' }} />
          <span className="text-muted-foreground">&lt;40% Critical</span>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground text-center">
        Rectangle size = question volume · Color = quality score · Showing top 12 topics
      </div>
    </div>
  );
}
