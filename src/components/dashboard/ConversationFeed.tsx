// src/components/dashboard/ConversationFeed.tsx
// Research-backed conversation feed: content as hero, not logs as afterthought

'use client';

import React, { useState, useMemo } from 'react';
import { Search, Star, AlertTriangle, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { type InteractionData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

export interface ConversationFeedProps {
  interactions: InteractionData[];
}

type SortMode = 'notable' | 'recent' | 'review' | 'search';

export function ConversationFeed({ interactions }: ConversationFeedProps) {
  const [sortMode, setSortMode] = useState<SortMode>('notable');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Score interactions for "Notable" sort
  const scoredInteractions = useMemo(() => {
    if (!interactions || !Array.isArray(interactions)) return [];

    return interactions.map(i => {
      let notableScore = 0;

      // VIP = highest priority
      if (i.vip) notableScore += 100;

      // Anomalies
      if (i.anomalies && i.anomalies.length > 0) {
        notableScore += i.anomalies.length * 10;
      }

      // Sensitivity
      if (i.sensitivity === 'critical') notableScore += 50;
      else if (i.sensitivity === 'high') notableScore += 30;
      else if (i.sensitivity === 'medium') notableScore += 10;

      // High latency
      if (i.latency > 3000) notableScore += 20;
      else if (i.latency > 2000) notableScore += 10;

      // Quality issues
      if (i.accuracy === 'incorrect') notableScore += 40;
      else if (i.accuracy === 'partial') notableScore += 20;

      return { ...i, notableScore };
    });
  }, [interactions]);

  // Apply sorting and filtering
  const sorted = useMemo(() => {
    let filtered = scoredInteractions;

    // Search filter
    if (sortMode === 'search' && searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.question?.toLowerCase().includes(query) ||
        i.answer?.toLowerCase().includes(query) ||
        i.topic?.toLowerCase().includes(query)
      );
    }

    // Sort by mode
    if (sortMode === 'notable') {
      filtered = [...filtered].sort((a, b) => b.notableScore - a.notableScore);
    } else if (sortMode === 'recent') {
      filtered = [...filtered].sort((a, b) => b.id - a.id); // Assuming higher ID = more recent
    } else if (sortMode === 'review') {
      filtered = filtered.filter(i =>
        i.accuracy === 'incorrect' ||
        i.accuracy === 'partial' ||
        i.sensitivity === 'high' ||
        i.sensitivity === 'critical' ||
        (i.anomalies && i.anomalies.length > 0)
      );
    }

    return filtered;
  }, [scoredInteractions, sortMode, searchQuery]);

  // Get sensitivity border color
  const getSensitivityBorderColor = (sensitivity: string) => {
    switch (sensitivity) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-gray-600';
    }
  };

  // Get accuracy badge variant
  const getAccuracyVariant = (accuracy: string) => {
    switch (accuracy) {
      case 'correct': return 'success';
      case 'partial': return 'warning';
      case 'incorrect': return 'error';
      case 'guardrail': return 'info';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Sort Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setSortMode('notable')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            sortMode === 'notable'
              ? 'bg-gold/20 text-gold border border-gold/30'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Star className="h-3.5 w-3.5" />
          Notable
        </button>
        <button
          onClick={() => setSortMode('recent')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            sortMode === 'recent'
              ? 'bg-gold/20 text-gold border border-gold/30'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Recent
        </button>
        <button
          onClick={() => setSortMode('review')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            sortMode === 'review'
              ? 'bg-gold/20 text-gold border border-gold/30'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Review
        </button>
        <button
          onClick={() => setSortMode('search')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            sortMode === 'search'
              ? 'bg-gold/20 text-gold border border-gold/30'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      </div>

      {/* Search Input (only visible in search mode) */}
      {sortMode === 'search' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions, answers, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>
      )}

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        Showing {sorted.length} conversation{sorted.length !== 1 ? 's' : ''}
      </div>

      {/* Conversation Cards */}
      <div className="space-y-2">
        {sorted.length > 0 ? (
          sorted.map((interaction) => (
            <div
              key={interaction.id}
              className={cn(
                'bg-card border border-border rounded-lg p-4 cursor-pointer transition-all hover:border-gold/30 border-l-4',
                getSensitivityBorderColor(interaction.sensitivity)
              )}
              onClick={() => setExpandedId(expandedId === interaction.id ? null : interaction.id)}
            >
              {/* Compact View */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Meta Row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{interaction.lang === 'he-IL' ? '🇮🇱' : '🇬🇧'}</span>
                    <span className="text-xs text-muted-foreground">{interaction.time}</span>
                    <Badge variant={getAccuracyVariant(interaction.accuracy)} size="sm">
                      {interaction.accuracy}
                    </Badge>
                    {interaction.vip && (
                      <Badge variant="gold" size="sm" className="flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        VIP
                      </Badge>
                    )}
                    {interaction.anomalies && interaction.anomalies.length > 0 && (
                      <Badge variant="error" size="sm">
                        {interaction.anomalies.length} anomaly
                      </Badge>
                    )}
                  </div>

                  {/* Question Preview */}
                  <p
                    className={cn(
                      'text-sm text-foreground line-clamp-2 mb-1',
                      interaction.lang === 'he-IL' && 'text-right'
                    )}
                    dir={interaction.lang === 'he-IL' ? 'rtl' : 'ltr'}
                  >
                    {interaction.question}
                  </p>

                  {/* Topic & Latency */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {interaction.topic}
                    </span>
                    <span>·</span>
                    <span className={cn(
                      'flex items-center gap-1',
                      interaction.latency > 3000 ? 'text-red-400' :
                      interaction.latency > 2000 ? 'text-yellow-400' :
                      'text-muted-foreground'
                    )}>
                      <Clock className="h-3 w-3" />
                      {interaction.latency}ms
                    </span>
                    <span>·</span>
                    <span>Session {interaction.session}</span>
                  </div>
                </div>

                {/* Expand Indicator */}
                <div className="text-muted-foreground text-xs">
                  {expandedId === interaction.id ? '▼' : '▶'}
                </div>
              </div>

              {/* Expanded View */}
              {expandedId === interaction.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {/* Opening Line */}
                  {interaction.opening && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Opening Used:</div>
                      <p className="text-xs text-muted-foreground italic">{interaction.opening}</p>
                    </div>
                  )}

                  {/* Full Answer */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Rambam's Answer:</div>
                    <div
                      className={cn(
                        'bg-background border-l-2 border-gold/30 pl-4 py-2 text-sm text-foreground',
                        interaction.lang === 'he-IL' && 'text-right pr-4 pl-0 border-l-0 border-r-2'
                      )}
                      dir={interaction.lang === 'he-IL' ? 'rtl' : 'ltr'}
                    >
                      {interaction.answer}
                    </div>
                  </div>

                  {/* Anomalies */}
                  {interaction.anomalies && interaction.anomalies.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-red-400 mb-1">Anomalies Detected:</div>
                      <ul className="list-disc list-inside text-xs text-red-400 space-y-0.5">
                        {interaction.anomalies.map((anomaly, idx) => (
                          <li key={idx}>{anomaly}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Audio ID */}
                  <div className="text-xs text-muted-foreground">
                    Audio ID: <code className="bg-background px-1 py-0.5 rounded">{interaction.audioId}</code>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No conversations match the current {sortMode} filter
          </div>
        )}
      </div>
    </div>
  );
}
