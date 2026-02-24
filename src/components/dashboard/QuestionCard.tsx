//src/components/dashboard/QuestionCard.tsx
// Expandable interaction card with RTL support

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/shared/Badge';
import { ChevronDown } from 'lucide-react';
import {
  ACCURACY_COLORS,
  ACCURACY_LABELS,
  SENSITIVITY_COLORS,
  LANG_LABELS,
  type InteractionData,
} from '@/types/dashboard';

export interface QuestionCardProps {
  interaction: InteractionData;
  expanded: boolean;
  onToggle: () => void;
}

export function QuestionCard({ interaction, expanded, onToggle }: QuestionCardProps) {
  const isRtl = interaction.lang === 'he-IL' || interaction.lang === 'he';
  const hasAnomalies = interaction.anomalies && interaction.anomalies.length > 0;

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer mb-2',
        expanded ? 'bg-card' : 'bg-card/80',
        hasAnomalies ? 'border-red-500/40' : expanded ? 'border-gold/30' : 'border-border'
      )}
      onClick={onToggle}
    >
      {/* Header Row */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground font-mono min-w-[50px]">
          #{interaction.id}
        </span>
        <span className="text-xs text-muted-foreground min-w-[45px]">
          {interaction.time}
        </span>
        <Badge
          variant="default"
          size="sm"
          className="border"
          style={{
            backgroundColor: `${ACCURACY_COLORS[interaction.accuracy]}20`,
            borderColor: `${ACCURACY_COLORS[interaction.accuracy]}30`,
            color: ACCURACY_COLORS[interaction.accuracy],
          }}
        >
          {ACCURACY_LABELS[interaction.accuracy]}
        </Badge>
        <Badge variant="info" size="sm">
          {LANG_LABELS[interaction.lang] || interaction.lang}
        </Badge>
        <Badge
          variant="default"
          size="sm"
          className="border"
          style={{
            backgroundColor: `${SENSITIVITY_COLORS[interaction.sensitivity]}20`,
            borderColor: `${SENSITIVITY_COLORS[interaction.sensitivity]}30`,
            color: SENSITIVITY_COLORS[interaction.sensitivity],
          }}
        >
          {interaction.sensitivity}
        </Badge>
        {interaction.vip && (
          <Badge variant="default" size="sm" className="bg-pink-500/20 text-pink-400 border-pink-500/30">
            ⭐ VIP: {interaction.vip}
          </Badge>
        )}
        {interaction.anomalies && interaction.anomalies.map((anomaly, i) => (
          <Badge key={i} variant="error" size="sm">
            {anomaly}
          </Badge>
        ))}
        <div className="flex-1" />
        <span className="text-[11px] text-muted-foreground font-mono">
          {interaction.latency}ms
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </div>

      {/* Question Preview */}
      <div
        className={cn('px-4 pb-3', isRtl && 'text-right font-hebrew')}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="text-sm text-foreground leading-relaxed font-medium">
          {expanded
            ? interaction.question
            : interaction.question.length > 120
            ? interaction.question.slice(0, 120) + '…'
            : interaction.question}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border p-4 bg-background/50">
          {/* Classification & Performance */}
          <div className="flex gap-4 flex-wrap mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Classification
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="success" size="sm">
                  {interaction.type}
                </Badge>
                <Badge variant="info" size="sm">
                  {interaction.topic}
                </Badge>
                <Badge variant="default" size="sm" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Audio #{interaction.audioId}
                </Badge>
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Performance
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={
                    interaction.latency > 3000
                      ? 'error'
                      : interaction.latency > 2000
                      ? 'warning'
                      : 'success'
                  }
                  size="sm"
                >
                  Latency: {interaction.latency}ms
                </Badge>
              </div>
            </div>
          </div>

          {/* Opening Line */}
          {interaction.opening && (
            <>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Opening Line
              </div>
              <div className="text-xs text-muted-foreground italic mb-4">
                &ldquo;{interaction.opening}&rdquo;
              </div>
            </>
          )}

          {/* Rambam's Answer */}
          <div className="text-[10px] text-gold uppercase tracking-wider mb-2">
            Rambam&apos;s Answer
          </div>
          <div
            className={cn(
              'text-sm text-foreground leading-relaxed p-4 bg-background rounded-lg border border-gold/10',
              isRtl && 'font-hebrew text-right'
            )}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {interaction.answer}
          </div>
        </div>
      )}
    </div>
  );
}
