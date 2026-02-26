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

    // Two-latency model (Daniel's request)
    const openingLats = convos.filter(c => c.opening_latency_ms && c.opening_latency_ms > 0).map(c => c.opening_latency_ms!)
    const avgOpening = openingLats.length > 0 ? Math.round(openingLats.reduce((a, b) => a + b, 0) / openingLats.length) : 0
    const thinkTimes = convos.filter(c => c.ai_think_ms && c.ai_think_ms > 0).map(c => c.ai_think_ms!)
    const avgThink = thinkTimes.length > 0 ? Math.round(thinkTimes.reduce((a, b) => a + b, 0) / thinkTimes.length) : 0
    // Use actual per-interaction audio durations for seamless calculation
    const seamlessCount = convos.filter(c =>
      c.ai_think_ms != null && c.opening_audio_duration_ms != null &&
      c.ai_think_ms < c.opening_audio_duration_ms
    ).length
    const seamlessRate = thinkTimes.length > 0 ? Math.round(seamlessCount / thinkTimes.length * 100) : 0

    // Total to answer = opening + think (sequential model)
    const totalToAnswer = avgOpening + avgThink

    // Per-language latency breakdown
    const heCvs = convos.filter(c => c.language?.startsWith('he'))
    const enCvs = convos.filter(c => c.language?.startsWith('en'))
    const avgFn = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0
    const heOpening = avgFn(heCvs.filter(c => c.opening_latency_ms && c.opening_latency_ms > 0).map(c => c.opening_latency_ms!))
    const enOpening = avgFn(enCvs.filter(c => c.opening_latency_ms && c.opening_latency_ms > 0).map(c => c.opening_latency_ms!))
    const heThink = avgFn(heCvs.filter(c => c.ai_think_ms && c.ai_think_ms > 0).map(c => c.ai_think_ms!))
    const enThink = avgFn(enCvs.filter(c => c.ai_think_ms && c.ai_think_ms > 0).map(c => c.ai_think_ms!))
    const heTotal = heOpening + heThink
    const enTotal = enOpening + enThink

    return { total, avgLatency, medianLatency, p95Latency, latencySpikes, anomalies, hebrewPct, health, healthEmoji, langCounts, avgOpening, avgThink, seamlessRate, totalToAnswer, heOpening, enOpening, heThink, enThink, heTotal, enTotal }
  }, [data, selectedDate])

  const dailySpark = data.daily_stats.map((d) => d.total_conversations)
  const openingSpark = data.daily_stats.map((d) => d.avg_opening_latency_ms || 0)
  const thinkSpark = data.daily_stats.map((d) => d.avg_ai_think_ms || 0)
  const totalSpark = data.daily_stats.map((d) => (d.avg_opening_latency_ms || 0) + (d.avg_ai_think_ms || 0))

  return (
    <section className="mb-8">
      <div className="flex gap-3 flex-wrap">
        <StatCard
          label="Visitor Questions"
          value={formatNumber(stats.total)}
          icon={<MessageSquare size={18} />}
          sparkData={dailySpark}
          subtitle={`Over ${data.meta.total_days} days`}
          tooltip="This shows how many questions visitors asked Rambam. The small line chart shows the daily trend — peaks often mean group tours came through."
        />
        <StatCard
          label="Silence Gap"
          value={formatLatency(stats.avgOpening)}
          icon={<Clock size={18} />}
          sparkData={openingSpark}
          sparkColor={stats.avgOpening > 3000 ? '#C75B3A' : stats.avgOpening > 2000 ? '#D4A843' : '#4A8F6F'}
          subtitle={`HE ${formatLatency(stats.heOpening)} · EN ${formatLatency(stats.enOpening)}`}
          tooltip="The silence the visitor FEELS after finishing their question, before Rambam starts speaking. Both the opening pipeline and LLM start in parallel at this point. Under 2s ideal, over 3s uncomfortable."
        />
        <StatCard
          label="AI Ready"
          value={formatLatency(stats.totalToAnswer)}
          icon={<Clock size={18} />}
          sparkData={totalSpark}
          sparkColor={stats.totalToAnswer > 5000 ? '#C75B3A' : stats.totalToAnswer > 3500 ? '#D4A843' : '#4A8F6F'}
          subtitle={`HE ${formatLatency(stats.heTotal)} · EN ${formatLatency(stats.enTotal)}`}
          tooltip="Total time from question end until the AI answer is ready (T2-T0). Both pipelines run in parallel from T0. The answer arrives at this time and waits in the buffer. Visitor hears it after the opening audio finishes."
        />
        <StatCard
          label="AI Behind Opening"
          value={formatLatency(stats.avgThink)}
          icon={<Clock size={18} />}
          sparkData={thinkSpark}
          sparkColor={stats.avgThink > 3000 ? '#C75B3A' : stats.avgThink > 2000 ? '#D4A843' : '#4A8F6F'}
          subtitle={`HE ${formatLatency(stats.heThink)} · EN ${formatLatency(stats.enThink)} · ${stats.seamlessRate}% seamless`}
          tooltip="Remaining LLM time AFTER the opening fires. The opening audio (~3s) plays over this gap. If the AI finishes before the audio ends, the visitor hears zero second silence. The percentage shows how often this works."
        />
        <StatCard
          label="System Status"
          value={`${stats.healthEmoji} ${stats.health}`}
          icon={<Activity size={18} />}
          subtitle={`${stats.anomalies} problems found`}
          tooltip="This tells you if Rambam is working well overall. Green means things are running smoothly. Yellow means there are some issues. Red means something needs attention right away."
        />
        <StatCard
          label="Languages"
          value={`${stats.hebrewPct}% Hebrew`}
          icon={<Languages size={18} />}
          subtitle={`${Object.keys(stats.langCounts).length} languages heard`}
          tooltip="This shows what languages visitors speak. Rambam understands Hebrew and English. 'Unknown' usually means Russian or Arabic speakers who Rambam cannot understand yet."
        />
        <StatCard
          label="Problems"
          value={stats.anomalies}
          icon={<AlertTriangle size={18} />}
          sparkColor="#C75B3A"
          subtitle={`${data.kpi.anomaly_rate}% of all questions`}
          tooltip="This shows how many times something went wrong: Rambam was too slow, could not understand the visitor, or had a system error. Lower is better."
        />
      </div>
    </section>
  )
}
