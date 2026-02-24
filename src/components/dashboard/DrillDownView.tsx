// src/components/dashboard/DrillDownView.tsx
// Day-by-day drill-down with filters and question cards

'use client';

import React, { useState, useMemo } from 'react';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { QuestionCard } from './QuestionCard';
import { SessionFlowMap } from './SessionFlowMap';
import { Search, Filter, Clock } from 'lucide-react';
import { type InteractionData, type SessionData } from '@/types/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export interface DrillDownViewProps {
  data: any[];
}

export function DrillDownView({ data }: DrillDownViewProps) {
  const [selectedDate, setSelectedDate] = useState(data[0]?.log_date || '');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterSensitivity, setFilterSensitivity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Find selected day data
  const selectedDay = useMemo(
    () => data.find((d) => d.log_date === selectedDate),
    [data, selectedDate]
  );

  // Extract interactions and sessions
  const interactions = selectedDay?.parsed?.interactions || [];
  const sessions = selectedDay?.parsed?.sessions || [];

  // Get unique topics
  const topics = useMemo((): string[] => {
    const topicSet = new Set<string>(interactions.map((i: any) => i.topic).filter(Boolean));
    return ['all', ...Array.from(topicSet)];
  }, [interactions]);

  // Filter interactions
  const filtered = useMemo(() => {
    return interactions.filter((interaction: any) => {
      if (filterTopic !== 'all' && interaction.topic !== filterTopic) return false;
      if (filterSensitivity !== 'all' && interaction.sensitivity !== filterSensitivity) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          interaction.question?.toLowerCase().includes(query) ||
          interaction.full_answer?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [interactions, filterTopic, filterSensitivity, searchQuery]);

  // Convert interactions to InteractionData format
  const interactionCards = useMemo(() => {
    return filtered.map((i: any) => ({
      id: i.index,
      time: i.stt_time?.split(' ')[1] || '',
      session: 1,
      question: i.question,
      answer: i.full_answer || '',
      lang: i.classification?.language || i.question_language_detected || 'unknown',
      type: i.classification?.question_type || 'unknown',
      topic: i.topic || 'Uncategorized',
      latency: i.latencies?.classification_to_first_chunk_ms || 0,
      accuracy: 'pending' as const,
      anomalies: i.anomalies || [],
      sensitivity: i.sensitivity || 'low',
      audioId: i.classification?.audio_id || 'unknown',
      opening: i.classification?.opening_text || '',
      vip: i.vip || null,
      is_greeting: i.is_greeting || false,
    }));
  }, [filtered]);

  // Convert sessions to SessionData format
  const sessionCards: SessionData[] = useMemo(() => {
    return sessions.map((s: any) => ({
      session_id: s.session_id,
      start_time: s.start_time,
      end_time: s.end_time,
      interaction_count: s.interaction_count,
      languages: ['he-IL', 'en-US'], // Simplified
      mode: s.interaction_count > 2 ? ('Inquiry' as const) : ('Q&A' as const),
      topics: [],
    }));
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <div>
        <SectionTitle title="Select Date" />
        <div className="flex gap-2 flex-wrap">
          {data.map((day) => (
            <button
              key={day.log_date}
              onClick={() => setSelectedDate(day.log_date)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedDate === day.log_date
                  ? 'bg-gold/20 text-gold border-gold/30'
                  : 'bg-card text-foreground border-border hover:border-gold/20'
              }`}
            >
              {day.log_date}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {selectedDay && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{interactions.length} interactions</span>
          <span>·</span>
          <span>{sessions.length} sessions</span>
          <span>·</span>
          <span>{selectedDay.time_range || '—'}</span>
        </div>
      )}

      {/* Session Flow */}
      {sessionCards.length > 0 && (
        <div>
          <SectionTitle title="Session Flow Map" />
          <SessionFlowMap sessions={sessionCards} />
        </div>
      )}

      {/* Filters */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions or answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>

          {/* Topic Filter */}
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic === 'all' ? 'All Topics' : topic}
              </option>
            ))}
          </select>

          {/* Sensitivity Filter */}
          <select
            value={filterSensitivity}
            onChange={(e) => setFilterSensitivity(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="all">All Sensitivity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Showing {filtered.length} of {interactions.length} interactions
        </div>
      </div>

      {/* Latency Timeline */}
      {interactionCards.length > 0 && (
        <div>
          <SectionTitle title="Latency Timeline" />
          <div className="bg-card border border-border rounded-lg p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={interactionCards.map((i: InteractionData) => ({ name: `#${i.id}`, latency: i.latency, topic: i.topic }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10 }} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} unit="ms" />
                <Tooltip
                  contentStyle={{ background: '#1a1a1f', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
                  formatter={(value: number) => `${value}ms`}
                />
                <Bar dataKey="latency" radius={[4, 4, 0, 0]}>
                  {interactionCards.map((entry: InteractionData, i: number) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={entry.latency > 3000 ? '#ef4444' : entry.latency > 2000 ? '#f59e0b' : '#c8a96188'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 justify-center text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold/60" />
                <span>Normal (&lt; 2s)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <span>&gt; 2s (Slow)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <span>&gt; 3s (Spike)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Cards */}
      <div>
        <SectionTitle title="Questions & Answers" />
        <div className="space-y-2">
          {interactionCards.length > 0 ? (
            interactionCards.map((interaction: InteractionData) => (
              <QuestionCard
                key={interaction.id}
                interaction={interaction}
                expanded={expandedId === interaction.id}
                onToggle={() =>
                  setExpandedId(expandedId === interaction.id ? null : interaction.id)
                }
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No interactions match the current filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
