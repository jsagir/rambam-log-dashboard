// src/components/dashboard/SessionFlowMap.tsx
// Visual session cards showing session metadata

'use client';

import React from 'react';
import { Badge } from '@/components/shared/Badge';
import { type SessionData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

export interface SessionFlowMapProps {
  sessions: SessionData[];
}

export function SessionFlowMap({ sessions }: SessionFlowMapProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {sessions.map((session) => {
        const isInquiry = session.mode === 'Inquiry';
        const duration = calculateDuration(session.start_time, session.end_time);

        return (
          <div
            key={session.session_id}
            className={cn(
              'flex-1 min-w-[180px] bg-card rounded-lg p-4 border transition-colors',
              isInquiry ? 'border-gold/30' : 'border-border'
            )}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gold">
                Session {session.session_id}
              </span>
              <Badge
                variant={isInquiry ? 'gold' : 'default'}
                size="sm"
              >
                {session.mode}
              </Badge>
            </div>

            {/* Metadata */}
            <div className="text-[11px] text-muted-foreground mb-2">
              {formatTime(session.start_time)}
              {session.start_time !== session.end_time && (
                <>–{formatTime(session.end_time)}</>
              )}
              {' · '}
              {duration}
              {' · '}
              {session.interaction_count} {session.interaction_count === 1 ? 'question' : 'questions'}
              {' · '}
              {session.languages.map((lang) => getLangEmoji(lang)).join('')}
            </div>

            {/* Topics */}
            {session.topics.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {session.topics.map((topic, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function calculateDuration(start: string, end: string): string {
  try {
    const startTime = new Date(`2026-01-01 ${start.split(' ')[1]}`);
    const endTime = new Date(`2026-01-01 ${end.split(' ')[1]}`);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return '< 1 min';
    return `${diffMin} min`;
  } catch (e) {
    return '—';
  }
}

function formatTime(timeStr: string): string {
  try {
    const parts = timeStr.split(' ');
    if (parts.length > 1) {
      const timePart = parts[1];
      const [h, m] = timePart.split(':');
      return `${h}:${m}`;
    }
    return timeStr;
  } catch (e) {
    return timeStr;
  }
}

function getLangEmoji(lang: string): string {
  if (lang.includes('he')) return '🇮🇱';
  if (lang.includes('en')) return '🇬🇧';
  return '❓';
}
