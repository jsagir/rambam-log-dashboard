import { useState, useMemo } from 'react'
import { useAccumulatedData } from '@/hooks/useAccumulatedData'
import { KPIBand } from '@/components/kpi/KPIBand'
import { ContentIntelligence } from '@/components/content/ContentIntelligence'
import { SystemHealth } from '@/components/health/SystemHealth'
import { LatencyPanel } from '@/components/health/LatencyPanel'
import { AskPanel } from '@/components/content/AskPanel'
import { Loader2, TrendingUp, CalendarSearch, ChevronLeft, ChevronRight } from 'lucide-react'

type ViewMode = 'cumulative' | 'drilldown'

export function App() {
  const { data, loading, error } = useAccumulatedData()
  const [showTranslations, setShowTranslations] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('cumulative')
  const [selectedDate, setSelectedDate] = useState<string | 'all'>('all')

  const dates = useMemo(() => {
    if (!data) return []
    return [...new Set(data.conversations.map((c) => c.date))].sort()
  }, [data])

  const filteredConversations = useMemo(() => {
    if (!data) return []
    if (viewMode === 'cumulative') return data.conversations
    if (selectedDate === 'all') return data.conversations
    return data.conversations.filter((c) => c.date === selectedDate)
  }, [data, viewMode, selectedDate])

  // Day drill-down helpers
  const currentDateIndex = dates.indexOf(selectedDate as string)
  const dayConvoCount = useMemo(() => {
    if (!data || viewMode === 'cumulative' || selectedDate === 'all') return 0
    return data.conversations.filter((c) => c.date === selectedDate).length
  }, [data, viewMode, selectedDate])

  const dayLabel = useMemo(() => {
    if (selectedDate === 'all' || viewMode === 'cumulative') return ''
    try {
      const d = new Date(selectedDate + 'T12:00:00')
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    } catch {
      return selectedDate
    }
  }, [selectedDate, viewMode])

  // When switching to drilldown, select the latest date
  function handleModeChange(mode: ViewMode) {
    setViewMode(mode)
    if (mode === 'drilldown' && (selectedDate === 'all' || !dates.includes(selectedDate as string))) {
      setSelectedDate(dates[dates.length - 1] || 'all')
    }
    if (mode === 'cumulative') {
      setSelectedDate('all')
    }
  }

  function navigateDay(dir: -1 | 1) {
    const idx = currentDateIndex + dir
    if (idx >= 0 && idx < dates.length) {
      setSelectedDate(dates[idx])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
          <p className="text-parchment-dim text-sm">Loading dashboard data...</p>
        </div>
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
      <header className="mb-6">
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
        </div>
      </header>

      {/* Navigation bar — Cumulative Trends / Day Drill-Down */}
      <nav className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* View mode buttons */}
          <button
            onClick={() => handleModeChange('cumulative')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-medium transition-all ${
              viewMode === 'cumulative'
                ? 'bg-gold/15 text-gold border-2 border-gold/40 shadow-sm'
                : 'bg-card border-2 border-border text-parchment-dim hover:text-parchment hover:border-gold/20'
            }`}
          >
            <TrendingUp size={18} />
            Cumulative Trends
          </button>
          <button
            onClick={() => handleModeChange('drilldown')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-medium transition-all ${
              viewMode === 'drilldown'
                ? 'bg-gold/15 text-gold border-2 border-gold/40 shadow-sm'
                : 'bg-card border-2 border-border text-parchment-dim hover:text-parchment hover:border-gold/20'
            }`}
          >
            <CalendarSearch size={18} />
            Day Drill-Down
          </button>
        </div>

        {/* Day navigator — only visible in drill-down mode */}
        {viewMode === 'drilldown' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDay(-1)}
              disabled={currentDateIndex <= 0}
              className="p-2 rounded-md bg-card border border-border text-parchment-dim hover:text-parchment hover:border-gold/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous day"
            >
              <ChevronLeft size={18} />
            </button>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-card border border-border rounded-md px-4 py-2 text-base text-parchment min-w-[160px]"
            >
              {dates.map((d) => {
                const dayName = new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
                return <option key={d} value={d}>{dayName} {d}</option>
              })}
            </select>
            <button
              onClick={() => navigateDay(1)}
              disabled={currentDateIndex >= dates.length - 1}
              className="p-2 rounded-md bg-card border border-border text-parchment-dim hover:text-parchment hover:border-gold/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next day"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Color legend */}
        <div className="flex items-center gap-4 text-sm text-parchment-dim">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Good</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> Attention</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-critical" /> Problem</span>
        </div>
      </nav>

      {/* Drill-down day banner */}
      {viewMode === 'drilldown' && selectedDate !== 'all' && (
        <div className="mb-6 bg-card border border-gold/20 rounded-lg px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gold">{dayLabel}</h2>
            <p className="text-parchment-dim text-sm">{dayConvoCount} visitor questions on this day</p>
          </div>
          <button
            onClick={() => handleModeChange('cumulative')}
            className="text-sm text-gold/70 hover:text-gold transition-colors"
          >
            Back to Cumulative Trends
          </button>
        </div>
      )}

      {/* Zone 1: KPI Band */}
      <KPIBand data={data} selectedDate={viewMode === 'cumulative' ? 'all' : selectedDate} />

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

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-border/30 text-center">
        <p className="text-text-dim text-xs">
          Rambam Visitor Dashboard &middot; Museum of Tolerance Jerusalem &middot; Updates automatically from logs
        </p>
        <p className="text-text-dim/50 text-xs mt-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" /> Good
          </span>
          {' '}&middot;{' '}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" /> Needs attention
          </span>
          {' '}&middot;{' '}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-critical" /> Problem
          </span>
        </p>
      </footer>

      {/* Sticky Ask the Data panel — always available */}
      <AskPanel conversations={data.conversations} />
    </div>
  )
}
