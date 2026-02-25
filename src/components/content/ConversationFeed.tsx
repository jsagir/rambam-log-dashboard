import { useState, useMemo } from 'react'
import { Star, Clock, AlertTriangle, Search } from 'lucide-react'
import { ConversationCard } from './ConversationCard'
import { FacetedFilters, applyFacetedFilters, EMPTY_FILTERS } from './FacetedFilters'
import type { ActiveFilters } from './FacetedFilters'
import type { Conversation } from '@/types/dashboard'

interface ConversationFeedProps {
  conversations: Conversation[]
  showTranslations: boolean
}

type SortMode = 'notable' | 'recent' | 'review' | 'search'

function scoreNotable(c: Conversation): number {
  let score = 0
  if (c.vip) score += 100
  score += (c.anomalies?.length || 0) * 10
  if (c.sensitivity === 'critical') score += 50
  if (c.sensitivity === 'high') score += 30
  if (c.sensitivity === 'medium') score += 10
  if (c.latency_ms > 3000) score += 20
  if (c.latency_ms > 2000) score += 10
  if (c.is_comprehension_failure) score += 40
  if (c.is_no_answer) score += 30
  return score
}

export function ConversationFeed({ conversations, showTranslations }: ConversationFeedProps) {
  const [sortMode, setSortMode] = useState<SortMode>('notable')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<ActiveFilters>({ ...EMPTY_FILTERS })

  const stopCount = useMemo(
    () => conversations.filter((c) => c.is_thank_you_interrupt).length,
    [conversations]
  )

  const politeCount = useMemo(
    () => conversations.filter((c) => c.thank_you_type === 'polite').length,
    [conversations]
  )

  // Apply faceted filters first, then sort/search
  const sorted = useMemo(() => {
    let items = applyFacetedFilters(conversations, filters)

    if (sortMode === 'search' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(
        (c) =>
          c.question.toLowerCase().includes(q) ||
          c.answer.toLowerCase().includes(q) ||
          c.topic.toLowerCase().includes(q) ||
          (c.opening_text && c.opening_text.toLowerCase().includes(q))
      )
    }

    if (sortMode === 'notable') {
      items.sort((a, b) => scoreNotable(b) - scoreNotable(a))
    } else if (sortMode === 'recent') {
      items.sort((a, b) => (b.time > a.time ? 1 : -1))
    } else if (sortMode === 'review') {
      items = items.filter((c) => c.is_anomaly || c.is_comprehension_failure || c.is_no_answer)
      items.sort((a, b) => scoreNotable(b) - scoreNotable(a))
    }

    return items
  }, [conversations, sortMode, searchQuery, filters])

  const tabs: { mode: SortMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'notable', icon: <Star size={16} />, label: 'Most Interesting' },
    { mode: 'recent', icon: <Clock size={16} />, label: 'Latest' },
    { mode: 'review', icon: <AlertTriangle size={16} />, label: 'Needs Attention' },
    { mode: 'search', icon: <Search size={16} />, label: 'Search' },
  ]

  return (
    <div>
      {/* Faceted filters */}
      <FacetedFilters
        conversations={conversations}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Sort tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.mode}
            onClick={() => setSortMode(tab.mode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-base transition-colors ${
              sortMode === tab.mode
                ? 'bg-gold/20 text-gold border border-gold/30 font-medium'
                : 'text-parchment-dim hover:text-parchment border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        {sortMode === 'search' && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, answers, topics..."
            className="flex-1 min-w-[200px] bg-card border border-border rounded-md px-4 py-2 text-base text-parchment placeholder:text-parchment-dim focus:outline-none focus:border-gold/50"
            autoFocus
          />
        )}
        {stopCount > 0 && (
          <span
            className="text-sm font-semibold px-2 py-0.5 rounded"
            style={{ backgroundColor: '#C75B3A22', color: '#C75B3A', border: '1px solid #C75B3A33' }}
          >
            ⏹ {stopCount} Kill Switch{stopCount !== 1 ? 'es' : ''}
          </span>
        )}
        {politeCount > 0 && (
          <span
            className="text-sm font-semibold px-2 py-0.5 rounded"
            style={{ backgroundColor: '#4A8F6F22', color: '#4A8F6F', border: '1px solid #4A8F6F33' }}
          >
            🙏 {politeCount} Thank{politeCount !== 1 ? 's' : ''}
          </span>
        )}
        <span className="text-sm text-parchment-dim ml-auto">
          {sorted.length} of {conversations.length}
        </span>
      </div>

      {/* Conversation list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-parchment-dim text-base">
            No visitor questions match your filter.
          </div>
        ) : (
          sorted.map((convo) => (
            <ConversationCard
              key={convo.id}
              conversation={convo}
              showTranslations={showTranslations}
              isExpanded={expandedId === convo.id}
              onToggle={() => setExpandedId(expandedId === convo.id ? null : convo.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
