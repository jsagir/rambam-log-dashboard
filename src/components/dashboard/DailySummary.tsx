// src/components/dashboard/DailySummary.tsx
// AI-style narrative summary: transforms data into actionable insights
// "The single most valuable element for stakeholders who won't explore charts"

'use client';

import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

export interface DailySummaryProps {
  data: any[]; // Array of daily log data
}

export function DailySummary({ data }: DailySummaryProps) {
  const summary = useMemo(() => {
    if (!data || data.length === 0) {
      return "No data available to generate summary.";
    }

    // Aggregate data
    const totalInteractions = data.reduce((sum, day) => sum + (day.parsed?.summary?.total_interactions || 0), 0);

    // Find top topic
    const topicCounts: Record<string, number> = {};
    data.forEach((day) => {
      const interactions = day.parsed?.interactions || [];
      interactions.forEach((i: any) => {
        const topic = i.topic || 'Uncategorized';
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1]);

    const topTopic = sortedTopics[0] || ['General', 0];
    const topTopicPercent = totalInteractions > 0 ? Math.round((topTopic[1] / totalInteractions) * 100) : 0;

    // Calculate quality score
    const qualityScores: number[] = [];
    data.forEach((day) => {
      const interactions = day.parsed?.interactions || [];
      interactions.forEach((i: any) => {
        const accuracy = i.accuracy || 'pending';
        if (accuracy === 'correct') qualityScores.push(100);
        else if (accuracy === 'partial') qualityScores.push(50);
        else if (accuracy === 'incorrect') qualityScores.push(0);
      });
    });

    const avgQuality = qualityScores.length > 0
      ? (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length / 10).toFixed(1)
      : 'N/A';

    // Count anomalies
    const criticalCount = data.reduce((sum, day) => {
      const critical = day.parsed?.summary?.anomaly_summary?.critical || {};
      return sum + Object.values(critical).reduce((a: any, b: any) => a + b, 0);
    }, 0);

    const warningCount = data.reduce((sum, day) => {
      const warnings = day.parsed?.summary?.anomaly_summary?.warning || {};
      return sum + Object.values(warnings).reduce((a: any, b: any) => a + b, 0);
    }, 0);

    // Find latency spike
    const latencySpike = (() => {
      for (const day of data) {
        const interactions = day.parsed?.interactions || [];
        for (const i of interactions) {
          if (i.latency && i.latency > 3000) {
            return {
              latency: (i.latency / 1000).toFixed(1),
              topic: i.topic || 'Unknown',
              question: i.question?.substring(0, 60) + '...'
            };
          }
        }
      }
      return null;
    })();

    // VIP count
    const vipCount = data.reduce((sum, day) => {
      const interactions = day.parsed?.interactions || [];
      return sum + interactions.filter((i: any) => i.vip).length;
    }, 0);

    // Build narrative
    let narrative = '';

    // Opening sentence
    if (data.length === 1) {
      narrative += `Today's ${totalInteractions} conversation${totalInteractions !== 1 ? 's' : ''} `;
    } else {
      narrative += `Over ${data.length} days, ${totalInteractions} conversation${totalInteractions !== 1 ? 's' : ''} `;
    }

    // Topic focus
    if (topTopicPercent > 25) {
      narrative += `focused heavily on **${topTopic[0]}** (${topTopicPercent}% of questions). `;
    } else {
      narrative += `covered a diverse range of topics, with **${topTopic[0]}** leading at ${topTopicPercent}%. `;
    }

    // Quality
    if (avgQuality !== 'N/A') {
      const qualityNum = parseFloat(avgQuality);
      if (qualityNum >= 8.5) {
        narrative += `Rambam's answers maintained **excellent quality** (${avgQuality}/10). `;
      } else if (qualityNum >= 7.0) {
        narrative += `Quality scores averaged **${avgQuality}/10**, showing strong performance. `;
      } else {
        narrative += `Quality scores averaged ${avgQuality}/10, with room for improvement. `;
      }
    }

    // Anomalies
    if (criticalCount > 0) {
      narrative += `⚠️ **${criticalCount} critical issue${criticalCount !== 1 ? 's' : ''}** detected. `;
    } else if (warningCount > 0) {
      narrative += `${warningCount} warning${warningCount !== 1 ? 's' : ''} noted. `;
    } else {
      narrative += `System performance was healthy with no critical issues. `;
    }

    // Latency spike
    if (latencySpike) {
      narrative += `One latency spike (${latencySpike.latency}s) on a ${latencySpike.topic} question suggests increased complexity. `;
    }

    // VIP interactions
    if (vipCount > 0) {
      narrative += `🌟 **${vipCount} VIP interaction${vipCount !== 1 ? 's' : ''}** recorded.`;
    }

    return narrative.trim();
  }, [data]);

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1.5">Daily Intelligence Summary</h3>
          <div
            className="text-sm text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: summary.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gold font-semibold">$1</strong>') }}
          />
        </div>
      </div>
    </div>
  );
}
