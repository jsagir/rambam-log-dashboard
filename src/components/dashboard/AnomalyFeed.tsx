// src/components/dashboard/AnomalyFeed.tsx
// Chronological anomaly event feed with bidirectional navigation
// Principle: "Never show a number without a path to the content behind it"

'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';

export interface AnomalyEvent {
  date: string;
  time: string;
  type: string;
  severity: 'critical' | 'warning' | 'operational';
  metric: string;
  value: string;
  expected: string;
  explanation: string;
  interactionId?: number;
  conversationLink?: string;
}

export interface AnomalyFeedProps {
  data: any[]; // Array of daily log data
  onInteractionClick?: (id: number) => void;
}

export function AnomalyFeed({ data, onInteractionClick }: AnomalyFeedProps) {
  // Extract and categorize anomalies
  const anomalies = useMemo(() => {
    const events: AnomalyEvent[] = [];

    data.forEach((day) => {
      const date = day.log_date || day.filename;
      const interactions = day.parsed?.interactions || [];

      interactions.forEach((i: any) => {
        if (i.anomalies && i.anomalies.length > 0) {
          i.anomalies.forEach((anomaly: string) => {
            // Parse anomaly type and create event
            let severity: 'critical' | 'warning' | 'operational' = 'warning';
            let metric = 'Unknown';
            let value = '';
            let expected = '';
            let explanation = anomaly;

            // Categorize by anomaly type
            if (anomaly.includes('LANG_UNKNOWN') || anomaly.includes('LLM_ERROR') || anomaly.includes('NON_200')) {
              severity = 'critical';
              metric = 'System Error';
              explanation = `Critical system error: ${anomaly}`;
            } else if (anomaly.includes('LATENCY') || anomaly.includes('SLOW')) {
              severity = 'warning';
              metric = 'Response Time';
              value = `${i.latency}ms`;
              expected = '< 3000ms';
              explanation = `Response time exceeded threshold: ${i.latency}ms on ${i.topic || 'general'} question`;
            } else if (anomaly.includes('STT_TRUNCATION')) {
              severity = 'warning';
              metric = 'Speech Recognition';
              explanation = 'Question may have been cut off during speech-to-text';
            } else {
              severity = 'operational';
              explanation = anomaly;
            }

            events.push({
              date,
              time: i.stt_time?.split(' ')[1] || '',
              type: anomaly.split('_')[0] || 'ANOMALY',
              severity,
              metric,
              value,
              expected,
              explanation,
              interactionId: i.index,
            });
          });
        }
      });
    });

    // Sort by date and time (most recent first)
    return events.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.time.localeCompare(a.time);
    });
  }, [data]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'critical' ? '🔴' : severity === 'warning' ? '🟡' : '🟢';
  };

  if (anomalies.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-foreground font-medium">No Anomalies Detected</p>
        <p className="text-sm text-muted-foreground mt-1">
          System performance is healthy across all monitored metrics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">
            {anomalies.filter(a => a.severity === 'critical').length} Critical
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">
            {anomalies.filter(a => a.severity === 'warning').length} Warnings
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">
            {anomalies.filter(a => a.severity === 'operational').length} Operational
          </span>
        </div>
      </div>

      {/* Anomaly Cards */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {anomalies.slice(0, 20).map((anomaly, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-lg p-3 hover:border-gold/30 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSeverityIcon(anomaly.severity)}</span>
                <Badge variant={getSeverityColor(anomaly.severity)} size="sm">
                  {anomaly.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {anomaly.date} {anomaly.time}
                </span>
              </div>
              {anomaly.interactionId !== undefined && onInteractionClick && (
                <button
                  onClick={() => onInteractionClick(anomaly.interactionId!)}
                  className="text-xs text-gold hover:text-gold/80 flex items-center gap-1 transition-colors"
                >
                  View conversation
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Metric Info */}
            {anomaly.metric && (
              <div className="flex items-center gap-4 mb-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Metric: </span>
                  <span className="text-foreground font-medium">{anomaly.metric}</span>
                </div>
                {anomaly.value && (
                  <div>
                    <span className="text-muted-foreground">Value: </span>
                    <span className="text-foreground font-medium">{anomaly.value}</span>
                  </div>
                )}
                {anomaly.expected && (
                  <div>
                    <span className="text-muted-foreground">Expected: </span>
                    <span className="text-foreground font-medium">{anomaly.expected}</span>
                  </div>
                )}
              </div>
            )}

            {/* Explanation */}
            <p className="text-sm text-foreground/90">{anomaly.explanation}</p>
          </div>
        ))}
      </div>

      {anomalies.length > 20 && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Showing 20 of {anomalies.length} anomalies · Earlier events hidden for clarity
        </div>
      )}
    </div>
  );
}
