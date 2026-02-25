import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'
import type { Conversation } from '@/types/dashboard'
import { TOPIC_COLORS, SENSITIVITY_COLORS } from '@/types/dashboard'

export interface ActiveFilters {
  topics: string[]
  languages: string[]
  sensitivity: string[]
  latencyRange: 'all' | 'fast' | 'warning' | 'slow'
  anomalyOnly: boolean
  stopOnly: boolean
}

const EMPTY_FILTERS: ActiveFilters = {
  topics: [],
  languages: [],
  sensitivity: [],
  latencyRange: 'all',
  anomalyOnly: false,
  stopOnly: false,
}

interface FacetedFiltersProps {
  conversations: Conversation[]
  filters: ActiveFilters
  onFiltersChange: (filters: ActiveFilters) => void
}

const LANG_DISPLAY: Record<string, string> = {
  'he-IL': 'Hebrew',
  'en-US': 'English',
  'unknown': 'Unknown',
}

const LATENCY_OPTIONS = [
  { value: 'all' as const, label: 'Any Speed', color: '#D0C8B8' },
  { value: 'fast' as const, label: '< 2s Fast', color: '#4A8F6F' },
  { value: 'warning' as const, label: '2-3s Okay', color: '#D4A843' },
  { value: 'slow' as const, label: '> 3s Slow', color: '#C75B3A' },
]

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  getColor,
}: {
  label: string
  options: { value: string; count: number }[]
  selected: string[]
  onChange: (values: string[]) => void
  getColor?: (value: string) => string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click — more robust than backdrop overlay
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
          selected.length > 0
            ? 'bg-gold/15 text-gold border border-gold/30'
            : 'bg-card border border-border text-parchment-dim hover:border-gold/20 hover:text-parchment'
        }`}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="bg-gold/30 text-gold text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl min-w-[200px] py-1 max-h-[300px] overflow-y-auto">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value)
            const color = getColor?.(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => {
                  if (isSelected) {
                    onChange(selected.filter((s) => s !== opt.value))
                  } else {
                    onChange([...selected, opt.value])
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  isSelected ? 'bg-gold/10 text-parchment' : 'text-parchment-dim hover:bg-card-hover hover:text-parchment'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-gold border-gold' : 'border-border'
                  }`}
                >
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#1C1914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {color && (
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                )}
                <span className="flex-1 text-left">{opt.value}</span>
                <span className="text-xs text-text-dim font-mono">{opt.count}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function FacetedFilters({ conversations, filters, onFiltersChange }: FacetedFiltersProps) {
  const topicOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    conversations.forEach((c) => { counts[c.topic] = (counts[c.topic] || 0) + 1 })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([value, count]) => ({ value, count }))
  }, [conversations])

  const langOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    conversations.forEach((c) => { counts[c.language] = (counts[c.language] || 0) + 1 })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([value, count]) => ({ value: LANG_DISPLAY[value] || value, count, raw: value }))
  }, [conversations])

  const sensOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    conversations.forEach((c) => { counts[c.sensitivity] = (counts[c.sensitivity] || 0) + 1 })
    return Object.entries(counts)
      .filter(([key]) => key !== 'low')
      .sort(([, a], [, b]) => b - a)
      .map(([value, count]) => ({ value, count }))
  }, [conversations])

  const activeCount = useMemo(() => {
    let count = 0
    if (filters.topics.length) count++
    if (filters.languages.length) count++
    if (filters.sensitivity.length) count++
    if (filters.latencyRange !== 'all') count++
    if (filters.anomalyOnly) count++
    if (filters.stopOnly) count++
    return count
  }, [filters])

  const clearAll = useCallback(() => {
    onFiltersChange({ ...EMPTY_FILTERS })
  }, [onFiltersChange])

  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      {/* Filter icon + label */}
      <div className="flex items-center gap-1.5 text-parchment-dim text-sm mr-1">
        <Filter size={14} />
        <span>Filter</span>
      </div>

      {/* Topic filter */}
      <MultiSelect
        label="Topic"
        options={topicOptions}
        selected={filters.topics}
        onChange={(topics) => onFiltersChange({ ...filters, topics })}
        getColor={(v) => TOPIC_COLORS[v] || '#6B7280'}
      />

      {/* Language filter */}
      <MultiSelect
        label="Language"
        options={langOptions.map((l) => ({ value: l.value, count: l.count }))}
        selected={filters.languages}
        onChange={(languages) => onFiltersChange({ ...filters, languages })}
      />

      {/* Sensitivity filter */}
      {sensOptions.length > 0 && (
        <MultiSelect
          label="Sensitivity"
          options={sensOptions}
          selected={filters.sensitivity}
          onChange={(sensitivity) => onFiltersChange({ ...filters, sensitivity })}
          getColor={(v) => SENSITIVITY_COLORS[v] || '#6B7280'}
        />
      )}

      {/* Latency range */}
      <div className="flex rounded-md border border-border overflow-hidden">
        {LATENCY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFiltersChange({ ...filters, latencyRange: opt.value })}
            className={`px-2.5 py-1.5 text-xs transition-colors ${
              filters.latencyRange === opt.value
                ? 'bg-gold/15 font-semibold'
                : 'text-parchment-dim hover:text-parchment hover:bg-card-hover'
            }`}
            style={filters.latencyRange === opt.value ? { color: opt.color } : undefined}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Toggle: Anomalies only */}
      <button
        onClick={() => onFiltersChange({ ...filters, anomalyOnly: !filters.anomalyOnly })}
        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
          filters.anomalyOnly
            ? 'bg-critical/15 text-critical border border-critical/30'
            : 'bg-card border border-border text-parchment-dim hover:border-critical/20 hover:text-parchment'
        }`}
      >
        ⚠ Problems
      </button>

      {/* Toggle: Stop commands only */}
      <button
        onClick={() => onFiltersChange({ ...filters, stopOnly: !filters.stopOnly })}
        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
          filters.stopOnly
            ? 'bg-critical/15 text-critical border border-critical/30'
            : 'bg-card border border-border text-parchment-dim hover:border-critical/20 hover:text-parchment'
        }`}
      >
        ⏹ Stops
      </button>

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm text-gold hover:bg-gold/10 transition-colors ml-1"
        >
          <X size={14} />
          Clear {activeCount}
        </button>
      )}
    </div>
  )
}

// Utility: apply filters to conversation array
const LANG_REVERSE: Record<string, string> = {
  'Hebrew': 'he-IL',
  'English': 'en-US',
  'Unknown': 'unknown',
}

export function applyFacetedFilters(conversations: Conversation[], filters: ActiveFilters): Conversation[] {
  let items = conversations

  if (filters.topics.length > 0) {
    items = items.filter((c) => filters.topics.includes(c.topic))
  }

  if (filters.languages.length > 0) {
    const langCodes = filters.languages.map((l) => LANG_REVERSE[l] || l)
    items = items.filter((c) => langCodes.includes(c.language))
  }

  if (filters.sensitivity.length > 0) {
    items = items.filter((c) => filters.sensitivity.includes(c.sensitivity))
  }

  if (filters.latencyRange === 'fast') {
    items = items.filter((c) => c.latency_ms > 0 && c.latency_ms <= 2000)
  } else if (filters.latencyRange === 'warning') {
    items = items.filter((c) => c.latency_ms > 2000 && c.latency_ms <= 3000)
  } else if (filters.latencyRange === 'slow') {
    items = items.filter((c) => c.latency_ms > 3000)
  }

  if (filters.anomalyOnly) {
    items = items.filter((c) => c.is_anomaly)
  }

  if (filters.stopOnly) {
    items = items.filter((c) => c.is_thank_you_interrupt)
  }

  return items
}

export { EMPTY_FILTERS }
