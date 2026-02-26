import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine,
} from 'recharts'
import { Globe, Calendar, Zap, Users } from 'lucide-react'
import type { Conversation, DailyStat } from '@/types/dashboard'
import { formatLatency, getLatencyColor } from '@/lib/utils'

interface OperationalIntelligenceProps {
  conversations: Conversation[]
  dailyStats: DailyStat[]
  dateRange: [string, string]
}

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#1C1914',
    border: '1px solid #C8A961',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    opacity: 0.97,
  },
  labelStyle: { color: '#C8A961', fontWeight: 700 },
}

// ─── 1. Unknown Language Analysis ───────────────────────────────────

function UnknownLanguageSection({ conversations }: { conversations: Conversation[] }) {
  const [showAll, setShowAll] = useState(false)

  const analysis = useMemo(() => {
    const unknowns = conversations.filter(c => c.language === 'unknown')
    const comprehensionFails = unknowns.filter(c => c.is_comprehension_failure)
    const greetings = unknowns.filter(c => c.is_greeting)

    // Categorize by text pattern
    const russian: Conversation[] = []
    const arabic: Conversation[] = []
    const shortNoise: Conversation[] = []
    const realAttempts: Conversation[] = []

    for (const c of unknowns) {
      const q = c.question || ''
      if (/[\u0400-\u04FF]/.test(q)) {
        russian.push(c)
      } else if (/[\u0600-\u06FF]/.test(q)) {
        arabic.push(c)
      } else if (q.length < 15 && !c.is_greeting) {
        shortNoise.push(c)
      } else {
        realAttempts.push(c)
      }
    }

    return {
      total: unknowns.length,
      pct: conversations.length > 0 ? Math.round(unknowns.length / conversations.length * 100) : 0,
      comprehensionFails: comprehensionFails.length,
      greetings: greetings.length,
      russian: russian.length,
      arabic: arabic.length,
      shortNoise: shortNoise.length,
      realAttempts: realAttempts.length,
      samples: unknowns.filter(c => !c.is_greeting).slice(0, showAll ? 20 : 6),
    }
  }, [conversations, showAll])

  if (analysis.total === 0) return null

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Globe size={18} className="text-gold" />
        <h3 className="text-base font-semibold text-parchment">Unknown Language Analysis</h3>
        <span className="text-xs text-parchment-dim ml-auto">{analysis.total} of {conversations.length} ({analysis.pct}%)</span>
      </div>
      <p className="text-xs text-parchment-dim mb-4">
        Conversations where the system couldn't identify the language. Helps distinguish real foreign language demand from ambient noise.
      </p>

      {/* Breakdown chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {analysis.russian > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-[#9B59B6]/15 text-[#9B59B6] font-medium">
            Russian {analysis.russian}
          </span>
        )}
        {analysis.arabic > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-[#1ABC9C]/15 text-[#1ABC9C] font-medium">
            Arabic {analysis.arabic}
          </span>
        )}
        {analysis.shortNoise > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-[#E74C3C]/15 text-[#E74C3C] font-medium">
            Short / Noise {analysis.shortNoise}
          </span>
        )}
        {analysis.greetings > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-[#6B7280]/15 text-[#6B7280] font-medium">
            Greetings {analysis.greetings}
          </span>
        )}
        {analysis.realAttempts > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-[#3498DB]/15 text-[#3498DB] font-medium">
            Real Attempts {analysis.realAttempts}
          </span>
        )}
        {analysis.comprehensionFails > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-[#C75B3A]/15 text-[#C75B3A] font-medium">
            Comprehension Failures {analysis.comprehensionFails}
          </span>
        )}
      </div>

      {/* Sample questions */}
      <div className="space-y-1.5">
        {analysis.samples.map((c, i) => {
          const q = c.question || ''
          const isRussian = /[\u0400-\u04FF]/.test(q)
          const isArabic = /[\u0600-\u06FF]/.test(q)
          const isShort = q.length < 15

          return (
            <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b border-border/20 last:border-0">
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                isRussian ? 'bg-[#9B59B6]/15 text-[#9B59B6]' :
                isArabic ? 'bg-[#1ABC9C]/15 text-[#1ABC9C]' :
                isShort ? 'bg-[#E74C3C]/15 text-[#E74C3C]' :
                'bg-[#3498DB]/15 text-[#3498DB]'
              }`}>
                {isRussian ? 'RU' : isArabic ? 'AR' : isShort ? 'NOISE' : 'OTHER'}
              </span>
              <span className="text-parchment-dim flex-1 truncate" dir="auto">
                {q || '(empty)'}
              </span>
              {c.is_comprehension_failure && (
                <span className="shrink-0 text-[10px] text-[#C75B3A]">FAIL</span>
              )}
              <span className="shrink-0 font-mono text-parchment-dim">{c.date}</span>
            </div>
          )
        })}
      </div>
      {analysis.total > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-gold hover:text-gold/80 transition-colors"
        >
          {showAll ? 'Show less' : `Show all ${analysis.total - analysis.greetings} non-greeting samples`}
        </button>
      )}
    </div>
  )
}

// ─── 2. Uptime / Availability Calendar ──────────────────────────────

function UptimeCalendar({ dailyStats, dateRange }: { dailyStats: DailyStat[]; dateRange: [string, string] }) {
  const calendarData = useMemo(() => {
    // Generate all dates in range
    const start = new Date(dateRange[0] + 'T12:00:00')
    const end = new Date(dateRange[1] + 'T12:00:00')
    const days: { date: string; dayName: string; count: number; status: 'active' | 'low' | 'offline'; hours: string }[] = []

    const statMap = new Map(dailyStats.map(d => [d.date, d]))

    const d = new Date(start)
    while (d <= end) {
      const iso = d.toISOString().split('T')[0]
      const stat = statMap.get(iso)
      const count = stat?.total_conversations || 0
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })

      let hours = ''
      if (stat) {
        const firstH = stat.first_interaction?.split(' ').pop()?.split(':').slice(0, 2).join(':') || ''
        const lastH = stat.last_interaction?.split(' ').pop()?.split(':').slice(0, 2).join(':') || ''
        hours = firstH && lastH ? `${firstH}–${lastH}` : ''
      }

      days.push({
        date: iso,
        dayName,
        count,
        status: count === 0 ? 'offline' : count < 5 ? 'low' : 'active',
        hours,
      })
      d.setDate(d.getDate() + 1)
    }

    const totalDays = days.length
    const activeDays = days.filter(d => d.status === 'active').length
    const lowDays = days.filter(d => d.status === 'low').length
    const offlineDays = days.filter(d => d.status === 'offline').length
    const uptimePct = totalDays > 0 ? Math.round((activeDays + lowDays) / totalDays * 100) : 0

    return { days, totalDays, activeDays, lowDays, offlineDays, uptimePct }
  }, [dailyStats, dateRange])

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Calendar size={18} className="text-gold" />
        <h3 className="text-base font-semibold text-parchment">Uptime & Availability</h3>
        <span className="text-xs font-mono ml-auto" style={{ color: calendarData.uptimePct >= 90 ? '#4A8F6F' : calendarData.uptimePct >= 70 ? '#D4A843' : '#C75B3A' }}>
          {calendarData.uptimePct}% operational
        </span>
      </div>
      <p className="text-xs text-parchment-dim mb-4">
        Days with log activity vs. gaps. Missing days may indicate system downtime, museum closure, or log collection failure.
      </p>

      {/* Summary chips */}
      <div className="flex gap-3 mb-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#4A8F6F]" />
          Active ({calendarData.activeDays})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#D4A843]" />
          Low ({calendarData.lowDays})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#C75B3A]/30 border border-[#C75B3A]/50" />
          Offline ({calendarData.offlineDays})
        </span>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] text-parchment-dim text-center py-1">{d}</div>
        ))}
        {/* Offset for first day of week */}
        {(() => {
          if (calendarData.days.length === 0) return null
          const firstDay = new Date(calendarData.days[0].date + 'T12:00:00').getDay()
          return Array.from({ length: firstDay }, (_, i) => (
            <div key={`pad-${i}`} />
          ))
        })()}
        {/* Day cells */}
        {calendarData.days.map(day => (
          <div
            key={day.date}
            className={`rounded-md p-1.5 text-center border transition-colors ${
              day.status === 'offline'
                ? 'bg-[#C75B3A]/10 border-[#C75B3A]/30'
                : day.status === 'low'
                ? 'bg-[#D4A843]/15 border-[#D4A843]/30'
                : 'bg-[#4A8F6F]/15 border-[#4A8F6F]/30'
            }`}
            title={`${day.date} (${day.dayName}): ${day.count} conversations${day.hours ? ` | ${day.hours}` : ''}`}
          >
            <div className="text-[11px] font-mono text-parchment">{day.date.split('-')[2]}</div>
            <div className={`text-[10px] font-mono ${
              day.status === 'offline' ? 'text-[#C75B3A]' : day.status === 'low' ? 'text-[#D4A843]' : 'text-[#4A8F6F]'
            }`}>
              {day.count === 0 ? '—' : day.count}
            </div>
            {day.hours && <div className="text-[8px] text-parchment-dim">{day.hours}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 3. OUT_OF_ORDER Race Condition Trend ───────────────────────────

function RaceConditionTrend({ conversations, dailyStats }: { conversations: Conversation[]; dailyStats: DailyStat[] }) {
  const { trendData, raceConversations, totalRace, racePct } = useMemo(() => {
    const races = conversations.filter(c => c.is_out_of_order)
    const totalRace = races.length
    const racePct = conversations.length > 0 ? Math.round(totalRace / conversations.length * 1000) / 10 : 0

    const trendData = dailyStats.map(d => ({
      date: d.date.slice(5),
      fullDate: d.date,
      outOfOrder: d.out_of_order_count || 0,
      total: d.total_conversations,
      rate: d.total_conversations > 0 ? Math.round((d.out_of_order_count || 0) / d.total_conversations * 100) : 0,
    }))

    return { trendData, raceConversations: races, totalRace, racePct }
  }, [conversations, dailyStats])

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Zap size={18} className="text-gold" />
        <h3 className="text-base font-semibold text-parchment">Race Conditions (OUT_OF_ORDER)</h3>
        <span className="text-xs font-mono ml-auto" style={{ color: totalRace === 0 ? '#4A8F6F' : totalRace <= 3 ? '#D4A843' : '#C75B3A' }}>
          {totalRace} cases ({racePct}%)
        </span>
      </div>
      <p className="text-xs text-parchment-dim mb-4">
        LLM answer arrived BEFORE the opening sentence fired — proof of parallel architecture. After model upgrades (4.1), frequency may increase as the LLM gets faster.
      </p>

      {/* Trend chart */}
      {trendData.length > 1 && (
        <div className="mb-4">
          <div className="text-xs text-parchment-dim mb-2">Daily Race Condition Count</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={trendData}>
              <XAxis dataKey="date" stroke="#D0C8B8" fontSize={11} />
              <YAxis stroke="#D0C8B8" fontSize={11} allowDecimals={false} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number, name: string) => {
                  if (name === 'outOfOrder') return [`${value} race conditions`, 'OUT_OF_ORDER']
                  return [value, name]
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <ReferenceLine y={0} stroke="#D0C8B8" />
              <Bar dataKey="outOfOrder" name="outOfOrder" radius={[4, 4, 0, 0]}>
                {trendData.map((entry, i) => (
                  <Cell key={i} fill={entry.outOfOrder > 0 ? '#E67E22' : '#2D2A24'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Race condition details */}
      {raceConversations.length > 0 && (
        <div>
          <div className="text-xs text-parchment-dim mb-2">Race Condition Details</div>
          <div className="space-y-1.5">
            {raceConversations.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b border-border/20 last:border-0">
                <span className="shrink-0 font-mono text-parchment-dim">{c.date}</span>
                <span className="shrink-0 font-mono text-[#E67E22]">
                  {c.ai_think_ms != null ? `${c.ai_think_ms}ms` : '—'}
                </span>
                <span className="text-parchment-dim flex-1 truncate" dir="auto">
                  {c.question_en || c.question}
                </span>
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[#E67E22]/15 text-[#E67E22]">
                  AI beat opening by {c.ai_think_ms != null ? formatLatency(Math.abs(c.ai_think_ms)) : '?'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalRace === 0 && (
        <div className="text-xs text-parchment-dim text-center py-4">
          No race conditions detected in current data. Opening pipeline always fires before LLM completes.
        </div>
      )}
    </div>
  )
}

// ─── 4. Session Inference ───────────────────────────────────────────

interface InferredSession {
  id: number
  date: string
  startTime: string
  endTime: string
  questions: number
  greetings: number
  languages: string[]
  durationMin: number
  conversations: Conversation[]
}

function SessionPatterns({ conversations }: { conversations: Conversation[] }) {
  const [showSessions, setShowSessions] = useState(false)

  const { sessions, stats } = useMemo(() => {
    // Sort by time
    const sorted = [...conversations].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })

    const SESSION_GAP_MS = 30 * 60 * 1000 // 30 minutes

    const sessions: InferredSession[] = []
    let currentSession: Conversation[] = []
    let lastTime: number | null = null

    for (const c of sorted) {
      // Parse time
      const parts = c.time.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)/)
      if (!parts) {
        currentSession.push(c)
        continue
      }
      const ts = new Date(
        parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]),
        parseInt(parts[4]), parseInt(parts[5]), parseInt(parts[6])
      ).getTime()

      if (lastTime !== null && (ts - lastTime) > SESSION_GAP_MS) {
        // Close current session
        if (currentSession.length > 0) {
          sessions.push(buildSession(sessions.length + 1, currentSession))
        }
        currentSession = []
      }

      currentSession.push(c)
      lastTime = ts
    }

    // Close final session
    if (currentSession.length > 0) {
      sessions.push(buildSession(sessions.length + 1, currentSession))
    }

    // Summary stats
    const questionCounts = sessions.map(s => s.questions)
    const durations = sessions.filter(s => s.durationMin > 0).map(s => s.durationMin)
    const avgQuestions = questionCounts.length > 0 ? Math.round(questionCounts.reduce((a, b) => a + b, 0) / questionCounts.length * 10) / 10 : 0
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
    const maxQuestions = Math.max(...questionCounts, 0)
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0
    const singleQuestion = sessions.filter(s => s.questions <= 1).length

    return {
      sessions,
      stats: {
        totalSessions: sessions.length,
        avgQuestions,
        avgDuration,
        maxQuestions,
        maxDuration,
        singleQuestion,
        singlePct: sessions.length > 0 ? Math.round(singleQuestion / sessions.length * 100) : 0,
      },
    }
  }, [conversations])

  // Session length distribution
  const sessionDistribution = useMemo(() => {
    const buckets = [
      { label: '1 question', min: 0, max: 1, count: 0 },
      { label: '2-3', min: 2, max: 3, count: 0 },
      { label: '4-6', min: 4, max: 6, count: 0 },
      { label: '7-10', min: 7, max: 10, count: 0 },
      { label: '10+', min: 11, max: Infinity, count: 0 },
    ]
    for (const s of sessions) {
      const bucket = buckets.find(b => s.questions >= b.min && s.questions <= b.max)
      if (bucket) bucket.count++
    }
    return buckets
  }, [sessions])

  if (conversations.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Users size={18} className="text-gold" />
        <h3 className="text-base font-semibold text-parchment">Visitor Sessions (Inferred)</h3>
        <span className="text-xs text-parchment-dim ml-auto">{stats.totalSessions} sessions from {conversations.length} questions</span>
      </div>
      <p className="text-xs text-parchment-dim mb-4">
        Sessions inferred from 30-minute gaps between questions. Estimates visitor count, engagement depth, and dwell time.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-background rounded-lg p-3 text-center border border-border">
          <div className="text-[10px] text-parchment-dim uppercase">Sessions</div>
          <div className="text-xl font-bold font-mono text-gold">{stats.totalSessions}</div>
          <div className="text-[10px] text-parchment-dim">~visitors</div>
        </div>
        <div className="bg-background rounded-lg p-3 text-center border border-border">
          <div className="text-[10px] text-parchment-dim uppercase">Avg Questions</div>
          <div className="text-xl font-bold font-mono text-parchment">{stats.avgQuestions}</div>
          <div className="text-[10px] text-parchment-dim">per session</div>
        </div>
        <div className="bg-background rounded-lg p-3 text-center border border-border">
          <div className="text-[10px] text-parchment-dim uppercase">Avg Duration</div>
          <div className="text-xl font-bold font-mono text-parchment">{stats.avgDuration}m</div>
          <div className="text-[10px] text-parchment-dim">longest: {stats.maxDuration}m</div>
        </div>
        <div className="bg-background rounded-lg p-3 text-center border border-border">
          <div className="text-[10px] text-parchment-dim uppercase">Single Question</div>
          <div className="text-xl font-bold font-mono text-parchment-dim">{stats.singlePct}%</div>
          <div className="text-[10px] text-parchment-dim">{stats.singleQuestion} of {stats.totalSessions}</div>
        </div>
      </div>

      {/* Session length distribution */}
      <div className="mb-4">
        <div className="text-xs text-parchment-dim mb-2">Questions per Session</div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={sessionDistribution}>
            <XAxis dataKey="label" stroke="#D0C8B8" fontSize={11} />
            <YAxis stroke="#D0C8B8" fontSize={11} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v} sessions`, 'Count']} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {sessionDistribution.map((entry, i) => (
                <Cell key={i} fill={entry.min <= 1 ? '#6B7280' : entry.min <= 3 ? '#D4A843' : '#4A8F6F'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session list */}
      <button
        onClick={() => setShowSessions(!showSessions)}
        className="text-xs text-gold hover:text-gold/80 transition-colors mb-2"
      >
        {showSessions ? 'Hide session details' : 'Show all sessions'}
      </button>

      {showSessions && (
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/20 last:border-0">
              <span className="shrink-0 w-6 font-mono text-gold">#{s.id}</span>
              <span className="shrink-0 font-mono text-parchment-dim">{s.date}</span>
              <span className="shrink-0 font-mono text-parchment-dim">{s.startTime}–{s.endTime}</span>
              <span className="shrink-0 font-mono font-bold text-parchment">{s.questions}q</span>
              {s.durationMin > 0 && (
                <span className="shrink-0 text-parchment-dim">{s.durationMin}min</span>
              )}
              <div className="flex gap-1 flex-1 justify-end">
                {s.languages.map(l => (
                  <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 text-parchment-dim">{l}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function buildSession(id: number, convos: Conversation[]): InferredSession {
  const questions = convos.filter(c => !c.is_greeting).length
  const greetings = convos.filter(c => c.is_greeting).length
  const languages = [...new Set(convos.map(c => c.language))]

  const times = convos.map(c => {
    const parts = c.time.match(/(\d+):(\d+):(\d+)/)
    return parts ? `${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}` : ''
  }).filter(Boolean)

  const startTime = times[0] || ''
  const endTime = times[times.length - 1] || ''

  // Duration in minutes
  let durationMin = 0
  if (convos.length > 1) {
    const firstParts = convos[0].time.match(/(\d+):(\d+):(\d+)/)
    const lastParts = convos[convos.length - 1].time.match(/(\d+):(\d+):(\d+)/)
    if (firstParts && lastParts) {
      const firstMin = parseInt(firstParts[1]) * 60 + parseInt(firstParts[2])
      const lastMin = parseInt(lastParts[1]) * 60 + parseInt(lastParts[2])
      durationMin = Math.max(0, lastMin - firstMin)
    }
  }

  return {
    id,
    date: convos[0].date,
    startTime,
    endTime,
    questions,
    greetings,
    languages,
    durationMin,
    conversations: convos,
  }
}

// ─── Main Component ─────────────────────────────────────────────────

export function OperationalIntelligence({ conversations, dailyStats, dateRange }: OperationalIntelligenceProps) {
  return (
    <section className="mb-8">
      <h2 className="font-serif text-2xl text-gold mb-6" title="System-level intelligence: language analysis, uptime tracking, race conditions, and visitor session patterns inferred from log data.">
        Operational Intelligence
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UnknownLanguageSection conversations={conversations} />
        <UptimeCalendar dailyStats={dailyStats} dateRange={dateRange} />
        <RaceConditionTrend conversations={conversations} dailyStats={dailyStats} />
        <SessionPatterns conversations={conversations} />
      </div>
    </section>
  )
}
