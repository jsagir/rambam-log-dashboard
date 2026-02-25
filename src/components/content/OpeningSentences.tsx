import { useMemo, useRef, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Play, Pause, Volume2 } from 'lucide-react'
import type { Conversation } from '@/types/dashboard'
import { formatLatency, getLatencyColor } from '@/lib/utils'

interface OpeningSentencesProps {
  conversations: Conversation[]
}

interface SentenceStats {
  audioId: string
  text: string
  count: number
  languages: Record<string, number>
  topics: Record<string, number>
  avgOpeningLatency: number
  avgThinkTime: number
  audioDurationHe: number | null
  audioDurationEn: number | null
  seamlessRate: number
  netGaps: number[]
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

function AudioPlayer({ audioId, lang }: { audioId: string; lang: 'he' | 'en' }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }, [playing])

  const onEnded = useCallback(() => setPlaying(false), [])

  return (
    <span className="inline-flex items-center">
      <audio ref={audioRef} src={`/audio/${lang}/${audioId}.wav`} onEnded={onEnded} preload="none" />
      <button
        onClick={toggle}
        className="p-1 rounded hover:bg-gold/10 transition-colors"
        title={`Play ${lang === 'he' ? 'Hebrew' : 'English'} audio`}
      >
        {playing ? <Pause size={14} className="text-gold" /> : <Play size={14} className="text-parchment-dim" />}
      </button>
    </span>
  )
}

export function OpeningSentences({ conversations }: OpeningSentencesProps) {
  const [sortBy, setSortBy] = useState<'count' | 'latency' | 'duration'>('count')
  const [filterLang, setFilterLang] = useState<'all' | 'he' | 'en'>('all')

  const stats = useMemo(() => {
    const map: Record<string, SentenceStats> = {}

    for (const c of conversations) {
      const aid = c.audio_id
      if (!aid) continue

      if (!map[aid]) {
        map[aid] = {
          audioId: aid,
          text: c.opening_text || '',
          count: 0,
          languages: {},
          topics: {},
          avgOpeningLatency: 0,
          avgThinkTime: 0,
          audioDurationHe: null,
          audioDurationEn: null,
          seamlessRate: 0,
          netGaps: [],
        }
      }

      const s = map[aid]
      s.count++
      s.languages[c.language] = (s.languages[c.language] || 0) + 1
      s.topics[c.topic] = (s.topics[c.topic] || 0) + 1
      if (c.opening_audio_duration_ms) {
        // Determine lang from conversation to set duration
        if (c.language?.startsWith('he')) {
          s.audioDurationHe = c.opening_audio_duration_ms
        } else {
          s.audioDurationEn = c.opening_audio_duration_ms
        }
      }
      if (c.net_gap_ms != null) {
        s.netGaps.push(c.net_gap_ms)
      }
    }

    // Compute averages
    for (const aid of Object.keys(map)) {
      const convos = conversations.filter(c => c.audio_id === aid)
      const openings = convos.filter(c => c.opening_latency_ms && c.opening_latency_ms > 0).map(c => c.opening_latency_ms!)
      const thinks = convos.filter(c => c.ai_think_ms != null).map(c => c.ai_think_ms!)
      map[aid].avgOpeningLatency = openings.length > 0 ? Math.round(openings.reduce((a, b) => a + b, 0) / openings.length) : 0
      map[aid].avgThinkTime = thinks.length > 0 ? Math.round(thinks.reduce((a, b) => a + b, 0) / thinks.length) : 0
      const seamless = map[aid].netGaps.filter(g => g <= 0).length
      map[aid].seamlessRate = map[aid].netGaps.length > 0 ? Math.round(seamless / map[aid].netGaps.length * 100) : 0
    }

    return Object.values(map)
  }, [conversations])

  const sorted = useMemo(() => {
    const list = [...stats]
    if (sortBy === 'count') list.sort((a, b) => b.count - a.count)
    else if (sortBy === 'latency') list.sort((a, b) => b.avgOpeningLatency - a.avgOpeningLatency)
    else list.sort((a, b) => (b.audioDurationHe || b.audioDurationEn || 0) - (a.audioDurationHe || a.audioDurationEn || 0))
    return list
  }, [stats, sortBy])

  // Summary stats
  const summary = useMemo(() => {
    const total = stats.reduce((a, s) => a + s.count, 0)
    const uniqueIds = stats.length
    const avgPerSentence = uniqueIds > 0 ? Math.round(total / uniqueIds * 10) / 10 : 0
    const mostUsed = stats.reduce((best, s) => s.count > best.count ? s : best, stats[0])
    const leastUsed = stats.reduce((best, s) => s.count < best.count ? s : best, stats[0])
    const durations = stats.map(s => s.audioDurationHe || s.audioDurationEn || 0).filter(d => d > 0)
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
    const shortestDuration = durations.length > 0 ? Math.min(...durations) : 0
    const longestDuration = durations.length > 0 ? Math.max(...durations) : 0
    return { total, uniqueIds, avgPerSentence, mostUsed, leastUsed, avgDuration, shortestDuration, longestDuration }
  }, [stats])

  // Chart data — top 15 by usage
  const chartData = useMemo(() => {
    return [...stats]
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map(s => ({
        label: `#${s.audioId}`,
        count: s.count,
        text: s.text.slice(0, 40) + (s.text.length > 40 ? '...' : ''),
        color: s.count >= 8 ? '#C8A961' : s.count >= 5 ? '#D0C8B8' : '#6B7280',
      }))
  }, [stats])

  if (stats.length === 0) return <div className="text-parchment-dim text-sm">No opening sentence data.</div>

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-xs text-parchment-dim uppercase">Unique Sentences</div>
          <div className="text-2xl font-bold font-mono text-gold">{summary.uniqueIds}</div>
          <div className="text-xs text-parchment-dim">of 66 available</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-xs text-parchment-dim uppercase">Avg Uses Each</div>
          <div className="text-2xl font-bold font-mono text-parchment">{summary.avgPerSentence}</div>
          <div className="text-xs text-parchment-dim">{summary.total} total plays</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-xs text-parchment-dim uppercase">Avg Duration</div>
          <div className="text-2xl font-bold font-mono text-parchment">{formatLatency(summary.avgDuration)}</div>
          <div className="text-xs text-parchment-dim">{formatLatency(summary.shortestDuration)} — {formatLatency(summary.longestDuration)}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-xs text-parchment-dim uppercase">Most Used</div>
          <div className="text-2xl font-bold font-mono text-gold">#{summary.mostUsed?.audioId}</div>
          <div className="text-xs text-parchment-dim">{summary.mostUsed?.count}x plays</div>
        </div>
      </div>

      {/* Usage chart */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-base font-semibold text-parchment mb-3">Opening Sentence Usage Ranking</h3>
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 28)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 50, right: 20 }}>
            <XAxis type="number" stroke="#D0C8B8" fontSize={12} />
            <YAxis type="category" dataKey="label" stroke="#D0C8B8" fontSize={12} width={45} tick={{ fill: '#F5F0E8' }} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value: number) => [`${value} times`, 'Used']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-parchment-dim">Sort:</span>
          {(['count', 'latency', 'duration'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded text-xs transition-colors ${sortBy === s ? 'bg-gold/20 text-gold' : 'text-parchment-dim hover:text-parchment'}`}
            >
              {s === 'count' ? 'Most Used' : s === 'latency' ? 'Slowest' : 'Longest Audio'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-parchment-dim">Play:</span>
          {(['all', 'he', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => setFilterLang(l)}
              className={`px-3 py-1 rounded text-xs transition-colors ${filterLang === l ? 'bg-gold/20 text-gold' : 'text-parchment-dim hover:text-parchment'}`}
            >
              {l === 'all' ? 'Both' : l === 'he' ? 'Hebrew' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {/* Full sentence list */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-parchment-dim border-b border-border bg-card">
              <th className="p-3 w-10">#</th>
              <th className="p-3 w-12">Play</th>
              <th className="p-3">Opening Sentence</th>
              <th className="p-3 w-16 text-center">Used</th>
              <th className="p-3 w-20 text-center">Duration</th>
              <th className="p-3 w-20 text-center">Silence</th>
              <th className="p-3 w-20 text-center">Seamless</th>
              <th className="p-3 w-32">Top Topics</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const duration = s.audioDurationHe || s.audioDurationEn || 0
              const topTopics = Object.entries(s.topics)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 2)
                .map(([t]) => t)

              return (
                <tr key={s.audioId} className="border-b border-border/30 hover:bg-card-hover/50">
                  <td className="p-3 font-mono text-gold">{s.audioId}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-0.5">
                      {(filterLang === 'all' || filterLang === 'he') && <AudioPlayer audioId={s.audioId} lang="he" />}
                      {(filterLang === 'all' || filterLang === 'en') && <AudioPlayer audioId={s.audioId} lang="en" />}
                    </div>
                  </td>
                  <td className="p-3 text-parchment-dim text-xs max-w-[300px]">
                    <span className="line-clamp-2">{s.text || '—'}</span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold" style={{ color: s.count >= 8 ? '#C8A961' : '#F5F0E8' }}>
                    {s.count}
                  </td>
                  <td className="p-3 text-center font-mono text-xs">
                    {duration > 0 ? formatLatency(duration) : '—'}
                  </td>
                  <td className="p-3 text-center font-mono text-xs" style={{ color: getLatencyColor(s.avgOpeningLatency) }}>
                    {s.avgOpeningLatency > 0 ? formatLatency(s.avgOpeningLatency) : '—'}
                  </td>
                  <td className="p-3 text-center font-mono text-xs" style={{ color: s.seamlessRate >= 90 ? '#4A8F6F' : s.seamlessRate >= 70 ? '#D4A843' : '#C75B3A' }}>
                    {s.netGaps.length > 0 ? `${s.seamlessRate}%` : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {topTopics.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 text-parchment-dim">{t}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Language distribution per sentence */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-base font-semibold text-parchment mb-3">
          <Volume2 size={16} className="inline mr-2 text-gold" />
          Audio Files Available
        </h3>
        <p className="text-xs text-parchment-dim mb-3">
          66 Hebrew (ElevenLabs) + 66 English (Azure) opening sentences. {stats.length} of 66 used in current data.
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-parchment-dim mb-1">Hebrew (ElevenLabs V3)</div>
            <div className="font-mono text-parchment">66 files, avg {formatLatency(3202)}</div>
            <div className="text-parchment-dim">Range: {formatLatency(1280)} — {formatLatency(5520)}</div>
          </div>
          <div>
            <div className="text-parchment-dim mb-1">English (Azure TTS)</div>
            <div className="font-mono text-parchment">66 files, avg {formatLatency(4066)}</div>
            <div className="text-parchment-dim">Range: {formatLatency(1875)} — {formatLatency(6012)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
