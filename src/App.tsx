import { useState, useMemo } from 'react'
import { useAccumulatedData } from '@/hooks/useAccumulatedData'
import { KPIBand } from '@/components/kpi/KPIBand'
import { ContentIntelligence } from '@/components/content/ContentIntelligence'
import { SystemHealth } from '@/components/health/SystemHealth'
import { LatencyPanel } from '@/components/health/LatencyPanel'
import { Loader2 } from 'lucide-react'

export function App() {
  const { data, loading, error } = useAccumulatedData()
  const [showTranslations, setShowTranslations] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | 'all'>('all')

  const filteredConversations = useMemo(() => {
    if (!data) return []
    if (selectedDate === 'all') return data.conversations
    return data.conversations.filter((c) => c.date === selectedDate)
  }, [data, selectedDate])

  const dates = useMemo(() => {
    if (!data) return []
    return [...new Set(data.conversations.map((c) => c.date))].sort()
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-critical text-lg">Failed to load dashboard data</p>
          <p className="text-text-dim mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-[1400px] mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img src="/motj-logo.png" alt="Museum of Tolerance Jerusalem" className="h-10 object-contain" />
            <div>
              <h1 className="font-serif text-4xl text-gold">Rambam Visitor Dashboard</h1>
              <p className="text-parchment-dim text-base mt-1">
                Museum of Tolerance Jerusalem &middot; {data.meta.date_range[0]} to {data.meta.date_range[1]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Translation toggle */}
            <button
              onClick={() => setShowTranslations(!showTranslations)}
              className={`px-4 py-2 rounded-md text-base border transition-colors ${
                showTranslations
                  ? 'bg-info/20 border-info/40 text-info'
                  : 'bg-card border-border text-text-dim'
              }`}
            >
              {showTranslations ? 'Show English ON' : 'Show English OFF'}
            </button>
            {/* Date filter */}
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-card border border-border rounded-md px-4 py-2 text-base text-parchment"
            >
              <option value="all">All Days ({data.meta.total_days})</option>
              {dates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Zone 1: KPI Band */}
      <KPIBand data={data} selectedDate={selectedDate} />

      {/* Zone 2: What Visitors Are Asking */}
      <ContentIntelligence
        conversations={filteredConversations}
        dailyStats={data.daily_stats}
        topicTrend={data.topic_trend}
        kpi={data.kpi}
        showTranslations={showTranslations}
      />

      {/* Zone 2.5: Response Speed */}
      <LatencyPanel
        conversations={filteredConversations}
        dailyStats={data.daily_stats}
      />

      {/* Zone 3: System Issues */}
      <SystemHealth
        conversations={filteredConversations}
        anomalyLog={data.anomaly_log}
        dailyStats={data.daily_stats}
      />
    </div>
  )
}
