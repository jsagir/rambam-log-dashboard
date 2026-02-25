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
                <th className="pb-2 pr-3">Wait Time</th>
                <th className="pb-2 pr-3">Topic</th>
                <th className="pb-2 pr-3">Lang</th>
                <th className="pb-2">Question</th>
              </tr>
            </thead>
            <tbody>
              {slowest.map((c, i) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-card-hover/50">
                  <td className="py-2 pr-3 text-parchment-dim">{i + 1}</td>
                  <td className="py-2 pr-3 font-mono text-parchment-dim">{c.date}</td>
                  <td className="py-2 pr-3 font-mono text-parchment-dim">{extractTime(c.time)}</td>
                  <td className="py-2 pr-3 font-mono font-bold" style={{ color: getLatencyColor(c.latency_ms) }}>
                    {formatLatency(c.latency_ms)}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: (TOPIC_COLORS[c.topic] || '#6B7280') + '22', color: TOPIC_COLORS[c.topic] || '#6B7280' }}>
                      {c.topic}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-parchment-dim">{c.language}</td>
                  <td className="py-2 text-parchment-dim truncate max-w-[300px]" dir="auto">{c.question}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
