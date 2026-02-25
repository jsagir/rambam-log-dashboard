import { useMemo } from 'react'
import { MessageSquare, Clock, AlertTriangle, Languages, Activity } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import type { AccumulatedData } from '@/types/dashboard'
import { formatLatency, formatNumber } from '@/lib/utils'

interface KPIBandProps {
  data: AccumulatedData
  selectedDate: string | 'all'
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  sparkData?: number[]
  sparkColor?: string
  subtitle?: string
  tooltip?: string
}

function StatCard({ label, value, icon, sparkData, sparkColor = '#C8A961', subtitle, tooltip }: StatCardProps) {
  const chartData = sparkData?.map((v, i) => ({ i, v }))

  return (
    <div className="bg-card border border-border rounded-lg p-5 flex-1 min-w-[180px]" title={tooltip}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gold">{icon}</span>
        <span className="text-parchment-dim text-sm uppercase tracking-wide font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-parchment font-mono">{value}</div>
      {subtitle && <div className="text-sm text-parchment-dim mt-1">{subtitle}</div>}
      {chartData && chartData.length > 1 && (
        <div className="mt-2 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export function KPIBand({ data, selectedDate }: KPIBandProps) {
  const stats = useMemo(() => {
    const convos = selectedDate === 'all'
      ? data.conversations
      : data.conversations.filter((c) => c.date === selectedDate)

    const total = convos.length
    const latencies = convos.filter((c) => c.latency_ms > 0).map((c) => c.latency_ms)
    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0
    const medianLatency = latencies.length > 0
      ? (() => { const s = [...latencies].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2) })()
      : 0
    const p95Latency = latencies.length > 0
      ? [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
      : 0
    const latencySpikes = latencies.filter((l) => l > 3000).length
    const anomalies = convos.filter((c) => c.is_anomaly).length
    const langCounts: Record<string, number> = {}
    convos.forEach((c) => {
      langCounts[c.language] = (langCounts[c.language] || 0) + 1
    })
    const hebrewPct = Math.round(((langCounts['he-IL'] || 0) / total) * 100) || 0

    const anomalyRate = total > 0 ? anomalies / total : 0
    const health = anomalyRate < 0.1 ? 'Healthy' : anomalyRate < 0.25 ? 'Issues' : 'Critical'
    const healthEmoji = anomalyRate < 0.1 ? '🟢' : anomalyRate < 0.25 ? '🟡' : '🔴'

    return { total, avgLatency, medianLatency, p95Latency, latencySpikes, anomalies, hebrewPct, health, healthEmoji, langCounts }
  }, [data, selectedDate])

  const dailySpark = data.daily_stats.map((d) => d.total_conversations)
  const latencySpark = data.daily_stats.map((d) => d.avg_latency_ms)

  return (
    <section className="mb-8">
      <div className="flex gap-3 flex-wrap">
        <StatCard
          label="Conversations"
          value={formatNumber(stats.total)}
          icon={<MessageSquare size={18} />}
          sparkData={dailySpark}
          subtitle={`${data.meta.total_days} days`}
          tooltip="Total number of visitor interactions with the Rambam hologram. The sparkline shows the daily trend — peaks often indicate group tours."
        />
        <StatCard
          label="Avg Response"
          value={formatLatency(stats.avgLatency)}
          icon={<Clock size={18} />}
          sparkData={latencySpark}
          sparkColor={stats.avgLatency > 3000 ? '#C75B3A' : '#4A8F6F'}
          subtitle={`Median: ${formatLatency(stats.medianLatency)} · P95: ${formatLatency(stats.p95Latency)}`}
          tooltip="Average time from visitor question to Rambam's full response. Under 2s is good, 2-3s is acceptable, over 3s means visitors are waiting too long. Median and P95 show the typical and worst-case experience."
        />
        <StatCard
          label="Health"
          value={`${stats.healthEmoji} ${stats.health}`}
          icon={<Activity size={18} />}
          subtitle={`${stats.anomalies} anomalies`}
          tooltip="Overall system health based on anomaly rate. Green = under 10% anomalies (normal). Yellow = 10-25% (some issues). Red = over 25% (needs attention). Anomalies include language detection failures, slow responses, and system errors."
        />
        <StatCard
          label="Languages"
          value={`${stats.hebrewPct}% Hebrew`}
          icon={<Languages size={18} />}
          subtitle={`${Object.keys(stats.langCounts).length} detected`}
          tooltip="Language split of visitor questions. The system supports Hebrew and English. 'Unknown' language usually means Russian or Arabic speakers — these trigger comprehension failures."
        />
        <StatCard
          label="Anomalies"
          value={stats.anomalies}
          icon={<AlertTriangle size={18} />}
          sparkColor="#C75B3A"
          subtitle={`${data.kpi.anomaly_rate}% rate`}
          tooltip="Interactions where something went wrong: language not detected, response too slow (over 3s), system error, or Rambam couldn't understand the question. Lower is better."
        />
      </div>
    </section>
  )
}
