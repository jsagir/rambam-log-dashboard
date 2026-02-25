import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line,
} from 'recharts'
import type { Conversation, AnomalyEntry, DailyStat } from '@/types/dashboard'
import { formatLatency, extractTime, getLatencyColor } from '@/lib/utils'

interface SystemHealthProps {
  conversations: Conversation[]
  anomalyLog: AnomalyEntry[]
  dailyStats: DailyStat[]
}

export function SystemHealth({ conversations, anomalyLog, dailyStats }: SystemHealthProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Latency scatter data
  const scatterData = useMemo(() => {
    return conversations
      .filter((c) => c.latency_ms > 0)
      .map((c, i) => ({
        index: i,
        latency: c.latency_ms,
        question: c.question.slice(0, 40),
        time: extractTime(c.time),
        color: getLatencyColor(c.latency_ms),
      }))
  }, [conversations])

  // Daily latency trend
  const latencyTrend = useMemo(() => {
    return dailyStats.map((d) => ({
      date: d.date.slice(5),
      avg: d.avg_latency_ms,
      max: d.max_latency_ms,
    }))
  }, [dailyStats])

  // Anomaly counts by type
  const anomalyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    anomalyLog.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count }))
  }, [anomalyLog])

  const TOOLTIP_STYLE = {
    contentStyle: {
      backgroundColor: '#252019',
      border: '1px solid #3A332A',
      borderRadius: '8px',
      color: '#F5F0E8',
      fontSize: '12px',
    },
  }

  return (
    <section>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left mb-4"
      >
        <h2 className="font-serif text-2xl text-gold" title="Technical health of the Rambam system. Shows anomalies (things that went wrong), response time scatter, and daily trends. Click to expand.">System Health</h2>
        {isOpen ? (
          <ChevronUp size={18} className="text-gold" />
        ) : (
          <ChevronDown size={18} className="text-gold" />
        )}
        <span className="text-sm text-parchment-dim ml-2">
          {anomalyLog.length} anomalies detected
        </span>
      </button>

      {isOpen && (
        <div className="space-y-6">
          {/* Latency scatter plot */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold text-parchment mb-4" title="Each dot is one visitor interaction. Green dots are fast responses, yellow is borderline, red means the visitor waited too long.">
              Response Latency (per interaction)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <XAxis dataKey="index" stroke="#D0C8B8" fontSize={13} label={{ value: 'Interaction #', position: 'bottom', fill: '#9A9080', fontSize: 10 }} />
                <YAxis dataKey="latency" stroke="#D0C8B8" fontSize={13} label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#9A9080', fontSize: 10 }} />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(value: number) => [`${value.toLocaleString()}ms`, 'Latency']}
                  labelFormatter={(label) => `Interaction #${label}`}
                />
                {/* Threshold lines as reference */}
                <Scatter data={scatterData} shape="circle">
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} r={3} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-sm text-parchment-dim">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> &lt;2s Good</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> 2-3s Warning</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-critical" /> &gt;3s Critical</span>
            </div>
          </div>

          {/* Daily latency trend */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold text-parchment mb-4" title="Gold line shows average response time each day. Red dashed line shows the worst response that day. Rising trend = system getting slower.">Daily Latency Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={latencyTrend}>
                <XAxis dataKey="date" stroke="#D0C8B8" fontSize={13} />
                <YAxis stroke="#D0C8B8" fontSize={13} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="avg" stroke="#C8A961" strokeWidth={2} dot={{ r: 3 }} name="Avg Latency" />
                <Line type="monotone" dataKey="max" stroke="#C75B3A" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Max Latency" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Anomaly breakdown */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold text-parchment mb-4" title="Types of problems detected. Red dots are critical (system errors, language failures). Yellow dots are warnings (slow responses, fallbacks).">Anomaly Breakdown</h3>
            <div className="space-y-2">
              {anomalyCounts.map(({ type, count }) => {
                const isCritical = ['LANG_UNKNOWN', 'LLM_ERROR', 'NON_200_CODE', 'EMPTY_RESPONSE'].includes(type)
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className={`text-xs font-mono ${isCritical ? 'text-critical' : 'text-warning'}`}>
                      {isCritical ? '🔴' : '🟡'}
                    </span>
                    <span className="text-sm text-parchment-dim flex-1 font-mono">{type}</span>
                    <span className="text-sm font-bold text-parchment">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent anomalies feed */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold text-parchment mb-4" title="A live feed of the most recent problems. Each row shows when it happened, what went wrong, and which question triggered it. Review for patterns.">Recent Anomalies</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {anomalyLog.slice(0, 20).map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-border/30 last:border-0">
                  <span className="text-parchment-dim font-mono shrink-0">{a.date} {a.time ? extractTime(a.time) : ''}</span>
                  <span className={`font-mono shrink-0 ${
                    ['LANG_UNKNOWN', 'LLM_ERROR', 'NON_200_CODE', 'EMPTY_RESPONSE'].includes(a.type)
                      ? 'text-critical'
                      : 'text-warning'
                  }`}>
                    {a.type}
                  </span>
                  <span className="text-parchment-dim truncate" dir="auto">
                    {a.question}
                  </span>
                  {a.latency_ms > 0 && (
                    <span className="text-parchment-dim font-mono ml-auto shrink-0">
                      {formatLatency(a.latency_ms)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
