import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, ReferenceLine,
  ScatterChart, Scatter,
  AreaChart, Area,
} from 'recharts'
import type { Conversation, DailyStat } from '@/types/dashboard'
import { TOPIC_COLORS } from '@/types/dashboard'
import { formatLatency, getLatencyColor, extractTime } from '@/lib/utils'

interface LatencyPanelProps {
  conversations: Conversation[]
  dailyStats: DailyStat[]
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
  itemStyle: { color: '#FFFFFF' },
}

export function LatencyPanel({ conversations, dailyStats }: LatencyPanelProps) {
  // Per-conversation latency data
  const latencies = useMemo(() => {
    return conversations.filter((c) => c.latency_ms > 0).map((c) => c.latency_ms)
  }, [conversations])

  // Summary stats
  const stats = useMemo(() => {
    if (latencies.length === 0) return null
    const sorted = [...latencies].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)
    const mid = Math.floor(sorted.length / 2)
    return {
      avg: Math.round(sum / sorted.length),
      median: sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.90)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      under2s: sorted.filter((l) => l <= 2000).length,
      between2and3s: sorted.filter((l) => l > 2000 && l <= 3000).length,
      over3s: sorted.filter((l) => l > 3000).length,
      over6s: sorted.filter((l) => l > 6000).length,
      total: sorted.length,
    }
  }, [latencies])

  // Latency by topic
  const latencyByTopic = useMemo(() => {
    const topicData: Record<string, number[]> = {}
    conversations.filter((c) => c.latency_ms > 0).forEach((c) => {
      if (!topicData[c.topic]) topicData[c.topic] = []
      topicData[c.topic].push(c.latency_ms)
    })
    return Object.entries(topicData)
      .map(([topic, lats]) => ({
        topic,
        avg: Math.round(lats.reduce((a, b) => a + b, 0) / lats.length),
        max: Math.max(...lats),
        count: lats.length,
        fill: TOPIC_COLORS[topic] || '#6B7280',
      }))
      .sort((a, b) => b.avg - a.avg)
  }, [conversations])

  // Latency by language
  const latencyByLang = useMemo(() => {
    const langData: Record<string, number[]> = {}
    conversations.filter((c) => c.latency_ms > 0).forEach((c) => {
      if (!langData[c.language]) langData[c.language] = []
      langData[c.language].push(c.latency_ms)
    })
    return Object.entries(langData).map(([lang, lats]) => ({
      lang,
      avg: Math.round(lats.reduce((a, b) => a + b, 0) / lats.length),
      count: lats.length,
    }))
  }, [conversations])

  // Latency distribution histogram
  const histogram = useMemo(() => {
    const buckets = [
      { range: '0-1s', min: 0, max: 1000, count: 0 },
      { range: '1-2s', min: 1000, max: 2000, count: 0 },
      { range: '2-3s', min: 2000, max: 3000, count: 0 },
      { range: '3-4s', min: 3000, max: 4000, count: 0 },
      { range: '4-5s', min: 4000, max: 5000, count: 0 },
      { range: '5-6s', min: 5000, max: 6000, count: 0 },
      { range: '6s+', min: 6000, max: Infinity, count: 0 },
    ]
    latencies.forEach((l) => {
      const bucket = buckets.find((b) => l >= b.min && l < b.max)
      if (bucket) bucket.count++
    })
    return buckets
  }, [latencies])

  // Daily latency trend with more detail
  const dailyTrend = useMemo(() => {
    return dailyStats.map((d) => ({
      date: d.date.slice(5),
      avg: d.avg_latency_ms,
      max: d.max_latency_ms,
      min: d.min_latency_ms,
      volume: d.total_conversations,
    }))
  }, [dailyStats])

  // Latency over time of day (aggregate by hour)
  const hourlyLatency = useMemo(() => {
    const hourData: Record<number, number[]> = {}
    conversations.filter((c) => c.latency_ms > 0).forEach((c) => {
      if (!hourData[c.hour]) hourData[c.hour] = []
      hourData[c.hour].push(c.latency_ms)
    })
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      avg: hourData[h] ? Math.round(hourData[h].reduce((a, b) => a + b, 0) / hourData[h].length) : 0,
      count: hourData[h]?.length || 0,
    })).filter((d) => d.count > 0)
  }, [conversations])

  // Two-latency model stats (Daniel's request)
  const twoLatencyStats = useMemo(() => {
    const openingLats = conversations.filter(c => c.opening_latency_ms && c.opening_latency_ms > 0).map(c => c.opening_latency_ms!)
    const thinkTimes = conversations.filter(c => c.ai_think_ms && c.ai_think_ms > 0).map(c => c.ai_think_ms!)

    if (openingLats.length === 0 && thinkTimes.length === 0) return null

    const sortedOpening = [...openingLats].sort((a, b) => a - b)
    const sortedThink = [...thinkTimes].sort((a, b) => a - b)
    const openingAvg = sortedOpening.length > 0 ? Math.round(sortedOpening.reduce((a, b) => a + b, 0) / sortedOpening.length) : 0
    const thinkAvg = sortedThink.length > 0 ? Math.round(sortedThink.reduce((a, b) => a + b, 0) / sortedThink.length) : 0
    const openingP95 = sortedOpening.length > 0 ? sortedOpening[Math.floor(sortedOpening.length * 0.95)] : 0
    const thinkP95 = sortedThink.length > 0 ? sortedThink[Math.floor(sortedThink.length * 0.95)] : 0
    const openingMax = sortedOpening.length > 0 ? sortedOpening[sortedOpening.length - 1] : 0
    const thinkMax = sortedThink.length > 0 ? sortedThink[sortedThink.length - 1] : 0
    // Use actual per-interaction audio durations for seamless calculation
    const seamlessCount = conversations.filter(c =>
      c.ai_think_ms != null && c.opening_audio_duration_ms != null &&
      c.ai_think_ms < c.opening_audio_duration_ms
    ).length
    const seamlessRate = thinkTimes.length > 0 ? Math.round(seamlessCount / thinkTimes.length * 100) : 0

    // Net gap stats (negative = buffer, positive = second silence)
    const netGaps = conversations.filter(c => c.net_gap_ms != null).map(c => c.net_gap_ms!)
    const gappedCount = netGaps.filter(g => g > 0).length
    const avgGap = netGaps.length > 0 ? Math.round(netGaps.reduce((a, b) => a + b, 0) / netGaps.length) : 0
    const worstGap = netGaps.length > 0 ? Math.max(...netGaps) : 0

    return { openingAvg, thinkAvg, openingP95, thinkP95, openingMax, thinkMax, seamlessRate, openingCount: sortedOpening.length, thinkCount: sortedThink.length, gappedCount, avgGap, worstGap, totalWithGapData: netGaps.length }
  }, [conversations])

  // Per-language two-latency breakdown
  const langLatencyBreakdown = useMemo(() => {
    const groups: Record<string, { label: string; convos: Conversation[] }> = {
      'he': { label: 'Hebrew', convos: [] },
      'en': { label: 'English', convos: [] },
      'unknown': { label: 'Unknown', convos: [] },
    }
    for (const c of conversations) {
      if (c.language?.startsWith('he')) groups['he'].convos.push(c)
      else if (c.language?.startsWith('en')) groups['en'].convos.push(c)
      else groups['unknown'].convos.push(c)
    }

    return Object.entries(groups)
      .filter(([, g]) => g.convos.length > 0)
      .map(([key, g]) => {
        const cs = g.convos
        const openings = cs.filter(c => c.opening_latency_ms && c.opening_latency_ms > 0).map(c => c.opening_latency_ms!)
        const thinks = cs.filter(c => c.ai_think_ms != null && c.ai_think_ms > 0).map(c => c.ai_think_ms!)
        const e2e = cs.filter(c => c.latency_ms > 0).map(c => c.latency_ms)
        const seamlessCount = cs.filter(c =>
          c.ai_think_ms != null && c.opening_audio_duration_ms != null &&
          c.ai_think_ms < c.opening_audio_duration_ms
        ).length
        const netGaps = cs.filter(c => c.net_gap_ms != null).map(c => c.net_gap_ms!)
        const gapped = netGaps.filter(g => g > 0)

        const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0
        const p95 = (arr: number[]) => {
          if (arr.length === 0) return 0
          const s = [...arr].sort((a, b) => a - b)
          return s[Math.floor(s.length * 0.95)]
        }

        return {
          key,
          label: g.label,
          count: cs.length,
          silenceAvg: avg(openings),
          silenceP95: p95(openings),
          thinkAvg: avg(thinks),
          thinkP95: p95(thinks),
          e2eAvg: avg(e2e),
          e2eP95: p95(e2e),
          seamlessRate: thinks.length > 0 ? Math.round(seamlessCount / thinks.length * 100) : 0,
          gappedCount: gapped.length,
          worstGap: gapped.length > 0 ? Math.max(...gapped) : 0,
        }
      })
  }, [conversations])

  // Daily two-latency trend
  const dailyTwoLatency = useMemo(() => {
    return dailyStats.map(d => ({
      date: d.date.slice(5),
      opening: d.avg_opening_latency_ms || 0,
      think: d.avg_ai_think_ms || 0,
    }))
  }, [dailyStats])

  // Slowest conversations
  const slowest = useMemo(() => {
    return [...conversations]
      .filter((c) => c.latency_ms > 0)
      .sort((a, b) => b.latency_ms - a.latency_ms)
      .slice(0, 10)
  }, [conversations])

  // Latency trend per-interaction (scatter)
  const scatterData = useMemo(() => {
    return conversations
      .filter((c) => c.latency_ms > 0)
      .map((c, i) => ({
        idx: i,
        latency: c.latency_ms,
        topic: c.topic,
        time: extractTime(c.time),
        color: getLatencyColor(c.latency_ms),
      }))
  }, [conversations])

  if (!stats) return <div className="text-parchment-dim text-sm">No latency data available.</div>

  return (
    <section className="mb-8">
      <h2 className="font-serif text-2xl text-gold mb-6" title="This section shows how fast Rambam answers visitors. You can see average speed, which topics are slowest, what time of day is worst, and the individual slowest responses.">Response Speed</h2>

      {/* Two-Latency Model — Daniel's request */}
      {twoLatencyStats && (
        <div className="bg-card border border-gold/20 rounded-lg p-5 mb-6">
          <h3 className="text-base font-semibold text-gold mb-1" title="Two parallel pipelines race from T0: one selects and plays the opening, the other generates the AI answer. The opening audio hides remaining LLM time.">
            Latency Timeline (Parallel Pipelines)
          </h3>
          <p className="text-xs text-parchment-dim mb-4">
            At T0, two pipelines race: <span style={{ color: '#6366F1' }}>opening selection</span> (~1.9s) and <span style={{ color: '#C8A961' }}>LLM generation</span> (~3.5s). Opening audio (~3s) covers remaining LLM time. Answer plays from buffer when opening ends.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Silence Gap card */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6366F1' }} />
                <span className="text-sm font-semibold text-parchment">Silence Gap (T1-T0)</span>
              </div>
              <p className="text-[11px] text-parchment-dim mb-3">
                Opening pipeline time: classify question → select opening → fire audio. The silence visitor FEELS before hearing anything.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-parchment-dim uppercase">Average</div>
                  <div className="text-lg font-bold font-mono" style={{ color: getLatencyColor(twoLatencyStats.openingAvg) }}>
                    {formatLatency(twoLatencyStats.openingAvg)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-parchment-dim uppercase">P95</div>
                  <div className="text-lg font-bold font-mono" style={{ color: getLatencyColor(twoLatencyStats.openingP95) }}>
                    {formatLatency(twoLatencyStats.openingP95)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-parchment-dim uppercase">Worst</div>
                  <div className="text-lg font-bold font-mono" style={{ color: getLatencyColor(twoLatencyStats.openingMax) }}>
                    {formatLatency(twoLatencyStats.openingMax)}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Behind Opening card */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C8A961' }} />
                <span className="text-sm font-semibold text-parchment">AI Behind Opening (T2-T1)</span>
              </div>
              <p className="text-[11px] text-parchment-dim mb-3">
                Remaining LLM time after opening fires. Opening audio (~3s) plays over this. If AI finishes before audio ends → seamless.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-parchment-dim uppercase">Average</div>
                  <div className="text-lg font-bold font-mono" style={{ color: getLatencyColor(twoLatencyStats.thinkAvg) }}>
                    {formatLatency(twoLatencyStats.thinkAvg)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-parchment-dim uppercase">P95</div>
                  <div className="text-lg font-bold font-mono" style={{ color: getLatencyColor(twoLatencyStats.thinkP95) }}>
                    {formatLatency(twoLatencyStats.thinkP95)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-parchment-dim uppercase">Worst</div>
                  <div className="text-lg font-bold font-mono" style={{ color: getLatencyColor(twoLatencyStats.thinkMax) }}>
                    {formatLatency(twoLatencyStats.thinkMax)}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Ready (T2-T0) card */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E0D5C0' }} />
                <span className="text-sm font-semibold text-parchment">AI Ready (T2-T0)</span>
              </div>
              <p className="text-[11px] text-parchment-dim mb-3">
                Total LLM pipeline time from question end. Answer buffered and waiting. Visitor hears it after opening audio finishes.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-parchment-dim uppercase">Average</div>
                  <div className="text-lg font-bold font-mono" style={{ color: getLatencyColor(twoLatencyStats.openingAvg + twoLatencyStats.thinkAvg) }}>
                    {formatLatency(twoLatencyStats.openingAvg + twoLatencyStats.thinkAvg)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-parchment-dim uppercase">P95</div>
                  <div className="text-lg font-bold font-mono" style={{ color: getLatencyColor(twoLatencyStats.openingP95 + twoLatencyStats.thinkP95) }}>
                    {formatLatency(twoLatencyStats.openingP95 + twoLatencyStats.thinkP95)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-parchment-dim uppercase">Worst</div>
                  <div className="text-lg font-bold font-mono" style={{ color: getLatencyColor(twoLatencyStats.openingMax + twoLatencyStats.thinkMax) }}>
                    {formatLatency(twoLatencyStats.openingMax + twoLatencyStats.thinkMax)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seamless rate bar + gap details */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-parchment-dim mb-1">
              <span>Seamless rate (AI ready before opening audio ends — per actual audio_id duration)</span>
              <span className="font-bold" style={{ color: twoLatencyStats.seamlessRate >= 90 ? '#4A8F6F' : twoLatencyStats.seamlessRate >= 70 ? '#D4A843' : '#C75B3A' }}>
                {twoLatencyStats.seamlessRate}%
              </span>
            </div>
            <div className="h-3 rounded bg-background overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${twoLatencyStats.seamlessRate}%`,
                  backgroundColor: twoLatencyStats.seamlessRate >= 90 ? '#4A8F6F' : twoLatencyStats.seamlessRate >= 70 ? '#D4A843' : '#C75B3A',
                }}
              />
            </div>
            {twoLatencyStats.gappedCount > 0 && (
              <div className="mt-2 text-xs text-parchment-dim">
                <span style={{ color: '#C75B3A' }}>{twoLatencyStats.gappedCount}</span> conversations had a second silence gap after opening ended (worst: {formatLatency(twoLatencyStats.worstGap)})
              </div>
            )}
          </div>

          {/* Per-language latency breakdown */}
          {langLatencyBreakdown.length > 1 && (
            <div className="mb-4">
              <div className="text-xs text-parchment-dim mb-3 font-semibold uppercase tracking-wide">Latency by Language</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {langLatencyBreakdown.map(lang => (
                  <div key={lang.key} className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-parchment">{lang.label}</span>
                      <span className="text-xs text-parchment-dim font-mono">{lang.count} questions</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-parchment-dim flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#6366F1' }} />
                          Silence Gap
                        </span>
                        <div className="flex gap-3">
                          <span className="font-mono" style={{ color: getLatencyColor(lang.silenceAvg) }}>{formatLatency(lang.silenceAvg)}</span>
                          <span className="font-mono text-parchment-dim" title="P95">p95: {formatLatency(lang.silenceP95)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-parchment-dim flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#C8A961' }} />
                          AI Behind Opening
                        </span>
                        <div className="flex gap-3">
                          <span className="font-mono" style={{ color: getLatencyColor(lang.thinkAvg) }}>{formatLatency(lang.thinkAvg)}</span>
                          <span className="font-mono text-parchment-dim" title="P95">p95: {formatLatency(lang.thinkP95)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-parchment-dim flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#E0D5C0' }} />
                          E2E Total
                        </span>
                        <div className="flex gap-3">
                          <span className="font-mono" style={{ color: getLatencyColor(lang.e2eAvg) }}>{formatLatency(lang.e2eAvg)}</span>
                          <span className="font-mono text-parchment-dim" title="P95">p95: {formatLatency(lang.e2eP95)}</span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-parchment-dim">Seamless</span>
                          <span className="font-mono font-bold" style={{ color: lang.seamlessRate >= 90 ? '#4A8F6F' : lang.seamlessRate >= 70 ? '#D4A843' : '#C75B3A' }}>
                            {lang.seamlessRate}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded bg-card overflow-hidden mt-1">
                          <div
                            className="h-full rounded transition-all"
                            style={{
                              width: `${lang.seamlessRate}%`,
                              backgroundColor: lang.seamlessRate >= 90 ? '#4A8F6F' : lang.seamlessRate >= 70 ? '#D4A843' : '#C75B3A',
                            }}
                          />
                        </div>
                        {lang.gappedCount > 0 && (
                          <div className="text-[10px] text-parchment-dim mt-1">
                            <span style={{ color: '#C75B3A' }}>{lang.gappedCount}</span> gaps (worst: {formatLatency(lang.worstGap)})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily two-latency trend */}
          {dailyTwoLatency.length > 1 && (
            <div>
              <div className="text-xs text-parchment-dim mb-2">Daily Trend: Silence Gap (T1-T0) vs AI Behind Opening (T2-T1)</div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={dailyTwoLatency}>
                  <XAxis dataKey="date" stroke="#D0C8B8" fontSize={11} />
                  <YAxis stroke="#D0C8B8" fontSize={11} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <ReferenceLine y={3000} stroke="#C75B3A" strokeDasharray="2 4" />
                  <Line type="monotone" dataKey="opening" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} name="Silence Gap" />
                  <Line type="monotone" dataKey="think" stroke="#C8A961" strokeWidth={2} dot={{ r: 3 }} name="AI Think Time" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Summary stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {[
          { label: 'Average', sublabel: '', value: stats.avg, color: getLatencyColor(stats.avg) },
          { label: 'Typical', sublabel: '(median)', value: stats.median, color: getLatencyColor(stats.median) },
          { label: '75% of visitors', sublabel: 'P75', value: stats.p75, color: getLatencyColor(stats.p75) },
          { label: '90% of visitors', sublabel: 'P90', value: stats.p90, color: getLatencyColor(stats.p90) },
          { label: '95% of visitors', sublabel: 'P95', value: stats.p95, color: getLatencyColor(stats.p95) },
          { label: '99% of visitors', sublabel: 'P99', value: stats.p99, color: getLatencyColor(stats.p99) },
          { label: 'Fastest', sublabel: '', value: stats.min, color: '#4A8F6F' },
          { label: 'Slowest', sublabel: '', value: stats.max, color: '#C75B3A' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-xs text-parchment-dim uppercase tracking-wide">{s.label}</div>
            {s.sublabel && <div className="text-[10px] text-parchment-dim">{s.sublabel}</div>}
            <div className="text-lg font-bold font-mono" style={{ color: s.color }}>
              {formatLatency(s.value)}
            </div>
          </div>
        ))}
      </div>

      {/* SLA compliance bar */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <h3 className="text-base font-semibold text-parchment mb-4" title="This tells you how many answers met our speed targets. Under 2 seconds is ideal, 2-3 seconds is acceptable, over 3 seconds means visitors waited too long.">Speed Targets</h3>
        <div className="flex gap-4 items-end text-sm">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-parchment-dim mb-1">
              <span>&lt;2s (Fast)</span>
              <span>{stats.under2s} ({Math.round(stats.under2s / stats.total * 100)}%)</span>
            </div>
            <div className="h-4 rounded bg-background overflow-hidden">
              <div className="h-full bg-success rounded" style={{ width: `${stats.under2s / stats.total * 100}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-parchment-dim mb-1">
              <span>2-3s (Okay)</span>
              <span>{stats.between2and3s} ({Math.round(stats.between2and3s / stats.total * 100)}%)</span>
            </div>
            <div className="h-4 rounded bg-background overflow-hidden">
              <div className="h-full bg-warning rounded" style={{ width: `${stats.between2and3s / stats.total * 100}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-parchment-dim mb-1">
              <span>&gt;3s (Too Slow)</span>
              <span>{stats.over3s} ({Math.round(stats.over3s / stats.total * 100)}%)</span>
            </div>
            <div className="h-4 rounded bg-background overflow-hidden">
              <div className="h-full bg-critical rounded" style={{ width: `${stats.over3s / stats.total * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency distribution histogram */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-parchment mb-4" title="This shows how many answers fell into each speed range. Most should be in the green (under 2 seconds). Red means visitors waited too long.">Speed Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histogram}>
              <XAxis dataKey="range" stroke="#D0C8B8" fontSize={13} />
              <YAxis stroke="#D0C8B8" fontSize={13} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {histogram.map((entry, i) => (
                  <Cell key={i} fill={entry.min >= 3000 ? '#C75B3A' : entry.min >= 2000 ? '#D4A843' : '#4A8F6F'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-interaction scatter */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-parchment mb-4" title="Every single answer is shown as a dot. Dots above the dashed lines were too slow. Clusters of red dots mean a recurring problem.">Speed per Question</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <XAxis dataKey="idx" stroke="#D0C8B8" fontSize={13} />
              <YAxis dataKey="latency" stroke="#D0C8B8" fontSize={13} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${(v/1000).toFixed(1)}s (${v.toLocaleString()}ms)`, 'Response Time']} />
              <ReferenceLine y={3000} stroke="#C75B3A" strokeDasharray="4 4" label={{ value: '3s too slow', fill: '#C75B3A', fontSize: 11 }} />
              <ReferenceLine y={2000} stroke="#D4A843" strokeDasharray="4 4" label={{ value: '2s target', fill: '#D4A843', fontSize: 11 }} />
              <Scatter data={scatterData}>
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} r={3} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Daily trend */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-parchment mb-4" title="This shows the average and worst response time each day. If the line is going up, Rambam is getting slower and may need attention.">Daily Speed Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyTrend}>
              <XAxis dataKey="date" stroke="#D0C8B8" fontSize={13} />
              <YAxis stroke="#D0C8B8" fontSize={13} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="min" stackId="range" stroke="none" fill="#4A8F6F" fillOpacity={0.2} name="Fastest" />
              <Area type="monotone" dataKey="avg" stackId="none" stroke="#C8A961" fill="#C8A961" fillOpacity={0.1} strokeWidth={2} name="Average" />
              <Line type="monotone" dataKey="max" stroke="#C75B3A" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Slowest" />
              <ReferenceLine y={3000} stroke="#C75B3A" strokeDasharray="2 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly latency pattern */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-parchment mb-4" title="This shows which hours of the day Rambam is slowest. Red bars mean that hour averaged over 3 seconds. Helps identify when the system is overloaded.">Speed by Time of Day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyLatency}>
              <XAxis dataKey="hour" stroke="#D0C8B8" fontSize={13} />
              <YAxis stroke="#D0C8B8" fontSize={13} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avg" name="Avg Response Time" radius={[4, 4, 0, 0]}>
                {hourlyLatency.map((entry, i) => (
                  <Cell key={i} fill={getLatencyColor(entry.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latency by topic */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-parchment mb-4" title="This shows which topics take longer for Rambam to answer. Complex subjects like Interfaith or Torah Study often need more thinking time.">Speed by Topic</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={latencyByTopic} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" stroke="#D0C8B8" fontSize={13} />
              <YAxis type="category" dataKey="topic" stroke="#D0C8B8" fontSize={13} width={95} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${(v/1000).toFixed(1)}s (${v.toLocaleString()}ms)`, 'Avg Response Time']} />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                {latencyByTopic.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latency by language */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-parchment mb-4" title="This shows whether Rambam answers faster in Hebrew or English. Unknown language questions are often slower because Rambam struggles to understand them.">Speed by Language</h3>
          <div className="space-y-3">
            {latencyByLang.map(({ lang, avg, count }) => (
              <div key={lang} className="flex items-center gap-3">
                <span className="text-sm text-parchment-dim w-20">{lang}</span>
                <div className="flex-1 h-6 bg-background rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.min((avg / (stats?.max || 5000)) * 100, 100)}%`,
                      backgroundColor: getLatencyColor(avg),
                    }}
                  />
                </div>
                <span className="text-sm font-mono w-16 text-right" style={{ color: getLatencyColor(avg) }}>
                  {formatLatency(avg)}
                </span>
                <span className="text-xs text-parchment-dim w-10 text-right">n={count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slowest conversations table */}
      <div className="bg-card border border-border rounded-lg p-4 mt-6">
        <h3 className="text-base font-semibold text-parchment mb-4" title="These are the 10 questions where visitors waited the longest. Look for patterns: same topic, same time of day, or same language might reveal the cause.">10 Slowest Answers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-parchment-dim border-b border-border">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Time</th>
                <th className="pb-2 pr-3" title="Silence the visitor feels before hearing anything (STT → opening)" style={{ color: '#6366F1' }}>Silence</th>
                <th className="pb-2 pr-3" title="LLM generation time after opening fires (hidden behind opening audio)" style={{ color: '#C8A961' }}>AI Think</th>
                <th className="pb-2 pr-3" title="Total end-to-end response time">Total</th>
                <th className="pb-2 pr-3">Topic</th>
                <th className="pb-2">Question</th>
              </tr>
            </thead>
            <tbody>
              {slowest.map((c, i) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-card-hover/50">
                  <td className="py-2 pr-3 text-parchment-dim">{i + 1}</td>
                  <td className="py-2 pr-3 font-mono text-parchment-dim">{c.date}</td>
                  <td className="py-2 pr-3 font-mono text-parchment-dim">{extractTime(c.time)}</td>
                  <td className="py-2 pr-3 font-mono text-xs" style={{ color: '#6366F1' }}>
                    {c.opening_latency_ms ? formatLatency(c.opening_latency_ms) : '—'}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs" style={{ color: '#C8A961' }}>
                    {c.ai_think_ms ? formatLatency(c.ai_think_ms) : '—'}
                  </td>
                  <td className="py-2 pr-3 font-mono font-bold" style={{ color: getLatencyColor(c.latency_ms) }}>
                    {formatLatency(c.latency_ms)}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: (TOPIC_COLORS[c.topic] || '#6B7280') + '22', color: TOPIC_COLORS[c.topic] || '#6B7280' }}>
                      {c.topic}
                    </span>
                  </td>
                  <td className="py-2 text-parchment-dim truncate max-w-[250px]" dir="auto">{c.question}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
