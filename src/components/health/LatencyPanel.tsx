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
    backgroundColor: '#252019',
    border: '1px solid #3A332A',
    borderRadius: '8px',
    color: '#F5F0E8',
    fontSize: '12px',
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
      <h2 className="font-serif text-2xl text-gold mb-6" title="How fast is Rambam responding? This section breaks down response times from every angle — averages, percentiles, by topic, by time of day, and highlights the slowest interactions.">Latency Deep Dive</h2>

      {/* Summary stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {[
          { label: 'Average', value: stats.avg, color: getLatencyColor(stats.avg) },
          { label: 'Median', value: stats.median, color: getLatencyColor(stats.median) },
          { label: 'P75', value: stats.p75, color: getLatencyColor(stats.p75) },
          { label: 'P90', value: stats.p90, color: getLatencyColor(stats.p90) },
          { label: 'P95', value: stats.p95, color: getLatencyColor(stats.p95) },
          { label: 'P99', value: stats.p99, color: getLatencyColor(stats.p99) },
          { label: 'Min', value: stats.min, color: '#4A8F6F' },
          { label: 'Max', value: stats.max, color: '#C75B3A' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-xs text-parchment-dim uppercase tracking-wide">{s.label}</div>
            <div className="text-lg font-bold font-mono" style={{ color: s.color }}>
              {formatLatency(s.value)}
            </div>
          </div>
        ))}
      </div>

      {/* SLA compliance bar */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <h3 className="text-base font-semibold text-parchment mb-4" title="How many responses meet the speed targets? Under 2s is ideal, 2-3s is tolerable, over 3s means visitors are waiting too long.">SLA Compliance</h3>
        <div className="flex gap-4 items-end text-sm">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-parchment-dim mb-1">
              <span>&lt;2s (Good)</span>
              <span>{stats.under2s} ({Math.round(stats.under2s / stats.total * 100)}%)</span>
            </div>
            <div className="h-4 rounded bg-background overflow-hidden">
              <div className="h-full bg-success rounded" style={{ width: `${stats.under2s / stats.total * 100}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-parchment-dim mb-1">
              <span>2-3s (Warning)</span>
              <span>{stats.between2and3s} ({Math.round(stats.between2and3s / stats.total * 100)}%)</span>
            </div>
            <div className="h-4 rounded bg-background overflow-hidden">
              <div className="h-full bg-warning rounded" style={{ width: `${stats.between2and3s / stats.total * 100}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-parchment-dim mb-1">
              <span>&gt;3s (Critical)</span>
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
          <h3 className="text-base font-semibold text-parchment mb-4" title="How response times are spread across time buckets. Most responses should cluster in the green (under 2s) range.">Latency Distribution</h3>
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
          <h3 className="text-base font-semibold text-parchment mb-4" title="Every single response plotted by time. Dots above the dashed lines (2s yellow, 3s red) are too slow. Clusters of red dots suggest a systemic issue.">Per-Interaction Latency</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <XAxis dataKey="idx" stroke="#D0C8B8" fontSize={13} />
              <YAxis dataKey="latency" stroke="#D0C8B8" fontSize={13} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toLocaleString()}ms`, 'Latency']} />
              <ReferenceLine y={3000} stroke="#C75B3A" strokeDasharray="4 4" label={{ value: '3s', fill: '#C75B3A', fontSize: 10 }} />
              <ReferenceLine y={2000} stroke="#D4A843" strokeDasharray="4 4" label={{ value: '2s', fill: '#D4A843', fontSize: 10 }} />
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
          <h3 className="text-base font-semibold text-parchment mb-4" title="Average and maximum response time per day. A rising trend means the system is getting slower over time — may need investigation.">Daily Latency Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyTrend}>
              <XAxis dataKey="date" stroke="#D0C8B8" fontSize={13} />
              <YAxis stroke="#D0C8B8" fontSize={13} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="min" stackId="range" stroke="none" fill="#4A8F6F" fillOpacity={0.2} name="Min" />
              <Area type="monotone" dataKey="avg" stackId="none" stroke="#C8A961" fill="#C8A961" fillOpacity={0.1} strokeWidth={2} name="Avg" />
              <Line type="monotone" dataKey="max" stroke="#C75B3A" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Max" />
              <ReferenceLine y={3000} stroke="#C75B3A" strokeDasharray="2 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly latency pattern */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-parchment mb-4" title="Are there specific hours when Rambam is slower? Red bars mean that hour averages over 3 seconds. Useful for identifying peak-load times.">Latency by Hour of Day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyLatency}>
              <XAxis dataKey="hour" stroke="#D0C8B8" fontSize={13} />
              <YAxis stroke="#D0C8B8" fontSize={13} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avg" name="Avg Latency" radius={[4, 4, 0, 0]}>
                {hourlyLatency.map((entry, i) => (
                  <Cell key={i} fill={getLatencyColor(entry.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latency by topic */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-base font-semibold text-parchment mb-4" title="Do certain topics take longer to answer? Complex topics like Interfaith or Torah Study may require more processing time.">Avg Latency by Topic</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={latencyByTopic} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" stroke="#D0C8B8" fontSize={13} />
              <YAxis type="category" dataKey="topic" stroke="#D0C8B8" fontSize={13} width={95} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toLocaleString()}ms`, 'Avg Latency']} />
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
          <h3 className="text-base font-semibold text-parchment mb-4" title="Does the system respond faster in Hebrew or English? Unknown language conversations are often slower due to fallback processing.">Latency by Language</h3>
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
        <h3 className="text-base font-semibold text-parchment mb-4" title="The 10 interactions where Rambam took the longest to respond. These are the worst visitor experiences — check if there's a pattern (same topic, same time of day, same language).">Top 10 Slowest Responses</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-parchment-dim border-b border-border">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Time</th>
                <th className="pb-2 pr-3">Latency</th>
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
