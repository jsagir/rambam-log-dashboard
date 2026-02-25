import { useState, useMemo, useCallback, useRef } from 'react'
import { Send, Sparkles, ChevronDown, Loader2 } from 'lucide-react'
import type { Conversation } from '@/types/dashboard'
import { TOPIC_COLORS, LANG_FLAGS } from '@/types/dashboard'
import { formatLatency, extractTime, getLatencyColor } from '@/lib/utils'

interface AskTheDataProps {
  conversations: Conversation[]
}

interface QueryResult {
  question: string
  answer: string
  conversations: Conversation[]
  cypherQuery?: string
  timestamp: number
}

const SUGGESTED_QUESTIONS = [
  { label: 'Sensitive topics', query: 'Show me conversations with high or critical sensitivity' },
  { label: 'Slowest answers', query: 'Which conversations had the longest response time?' },
  { label: 'Hebrew vs English', query: 'How do Hebrew and English conversations compare?' },
  { label: 'Popular topics', query: 'What are the most discussed topics?' },
  { label: 'System problems', query: 'Show all conversations with anomalies' },
  { label: 'Comprehension fails', query: 'Which questions did Rambam fail to understand?' },
  { label: 'Kill switch usage', query: 'Show all STOP command conversations' },
  { label: 'Busiest days', query: 'Which days had the most visitor questions?' },
]

/**
 * Phase 2 "Ask the Data" — local intelligence engine.
 * Currently runs client-side filters. Will upgrade to Kuzu-WASM + OpenAI
 * when conversation count exceeds 500.
 *
 * Architecture:
 *   v1 (now):  Natural language → client-side JS filter → result cards
 *   v2 (500+): Natural language → OpenAI → Cypher → Kuzu-WASM → result cards
 */
function queryConversations(question: string, conversations: Conversation[]): QueryResult {
  const q = question.toLowerCase()
  let filtered = [...conversations]
  let answer = ''

  // Sensitivity queries
  if (q.includes('sensitive') || q.includes('sensitivity') || q.includes('critical')) {
    filtered = filtered.filter((c) => c.sensitivity === 'high' || c.sensitivity === 'critical')
    answer = `Found ${filtered.length} conversations with high or critical sensitivity.`
  }
  // Slowest queries
  else if (q.includes('slow') || q.includes('longest') || q.includes('latency') || q.includes('response time')) {
    filtered.sort((a, b) => b.latency_ms - a.latency_ms)
    filtered = filtered.slice(0, 10)
    answer = `Top 10 slowest conversations. The slowest took ${formatLatency(filtered[0]?.latency_ms || 0)}.`
  }
  // Language comparison
  else if (q.includes('hebrew') && q.includes('english') || q.includes('language') || q.includes('compare')) {
    const he = conversations.filter((c) => c.language === 'he-IL')
    const en = conversations.filter((c) => c.language === 'en-US')
    const heAvg = he.length ? Math.round(he.reduce((s, c) => s + c.latency_ms, 0) / he.length) : 0
    const enAvg = en.length ? Math.round(en.reduce((s, c) => s + c.latency_ms, 0) / en.length) : 0
    answer = `Hebrew: ${he.length} conversations (avg ${formatLatency(heAvg)}). English: ${en.length} conversations (avg ${formatLatency(enAvg)}).`
    filtered = conversations
  }
  // Topic queries
  else if (q.includes('topic') || q.includes('popular') || q.includes('discussed')) {
    const counts: Record<string, number> = {}
    conversations.forEach((c) => { counts[c.topic] = (counts[c.topic] || 0) + 1 })
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a)
    answer = `Topic distribution: ${sorted.slice(0, 5).map(([t, n]) => `${t} (${n})`).join(', ')}.`
    filtered = conversations
  }
  // Anomaly queries
  else if (q.includes('anomal') || q.includes('problem') || q.includes('error') || q.includes('issue')) {
    filtered = filtered.filter((c) => c.is_anomaly)
    answer = `Found ${filtered.length} conversations with anomalies.`
  }
  // Comprehension failure
  else if (q.includes('comprehension') || q.includes('understand') || q.includes('fail')) {
    filtered = filtered.filter((c) => c.is_comprehension_failure || c.is_no_answer)
    answer = `Found ${filtered.length} conversations where Rambam failed to understand or answer.`
  }
  // Stop commands
  else if (q.includes('stop') || q.includes('kill') || q.includes('thank you')) {
    filtered = filtered.filter((c) => c.is_thank_you_interrupt)
    answer = `Found ${filtered.length} STOP command (kill switch) conversations.`
  }
  // Busiest days
  else if (q.includes('busy') || q.includes('busiest') || q.includes('most')) {
    const dayCounts: Record<string, number> = {}
    conversations.forEach((c) => { dayCounts[c.date] = (dayCounts[c.date] || 0) + 1 })
    const sorted = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)
    answer = `Busiest days: ${sorted.slice(0, 3).map(([d, n]) => `${d} (${n} questions)`).join(', ')}.`
    filtered = conversations
  }
  // Specific topic filter
  else {
    const topicMatch = Object.keys(TOPIC_COLORS).find((t) => q.includes(t.toLowerCase()))
    if (topicMatch) {
      filtered = filtered.filter((c) => c.topic === topicMatch)
      answer = `Found ${filtered.length} conversations about ${topicMatch}.`
    } else {
      // Full-text search fallback
      filtered = filtered.filter(
        (c) =>
          c.question.toLowerCase().includes(q) ||
          c.answer.toLowerCase().includes(q) ||
          c.question_en.toLowerCase().includes(q) ||
          c.answer_en.toLowerCase().includes(q)
      )
      answer = filtered.length > 0
        ? `Found ${filtered.length} conversations matching "${question}".`
        : `No conversations match "${question}". Try rephrasing or use a suggested question below.`
    }
  }

  return {
    question,
    answer,
    conversations: filtered.slice(0, 20),
    timestamp: Date.now(),
  }
}

function ResultCard({ conversation: c }: { conversation: Conversation }) {
  const [expanded, setExpanded] = useState(false)
  const flag = LANG_FLAGS[c.language] || '❓'
  const topicColor = TOPIC_COLORS[c.topic] || '#6B7280'
  const latColor = getLatencyColor(c.latency_ms)

  return (
    <div
      className="border border-border/60 rounded-lg overflow-hidden transition-colors hover:border-gold/20 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="px-4 py-3 flex items-center gap-2.5 text-sm">
        <span className="text-base">{flag}</span>
        <span className="text-parchment-dim font-mono text-xs">{c.date} {extractTime(c.time)}</span>
        <span
          className="px-1.5 py-0.5 rounded text-xs font-semibold"
          style={{ backgroundColor: topicColor + '18', color: topicColor }}
        >
          {c.topic}
        </span>
        {c.is_thank_you_interrupt && (
          <span className="text-xs font-bold text-critical">⏹ STOP</span>
        )}
        {c.is_anomaly && <span className="text-critical">⚠</span>}
        <span className="ml-auto font-mono text-xs font-semibold" style={{ color: latColor }}>
          {formatLatency(c.latency_ms)}
        </span>
        <ChevronDown size={14} className={`text-parchment-dim transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      <div className="px-4 pb-3">
        <div className="text-sm text-parchment leading-relaxed" dir={c.language === 'he-IL' ? 'rtl' : 'ltr'}>
          {expanded ? c.question : (c.question.length > 80 ? c.question.slice(0, 80) + '...' : c.question)}
        </div>
        {c.question_en && c.language === 'he-IL' && (
          <div className="text-xs text-translation italic mt-1">
            {expanded ? c.question_en : (c.question_en.length > 80 ? c.question_en.slice(0, 80) + '...' : c.question_en)}
          </div>
        )}
      </div>

      {expanded && c.answer && (
        <div className="px-4 pb-3 pt-2 border-t border-border/30">
          <div className="flex items-center gap-2 mb-2 text-gold/60 text-xs">
            <div className="flex-1 h-px bg-gold/15" />
            <span>✦ Rambam</span>
            <div className="flex-1 h-px bg-gold/15" />
          </div>
          <div className="text-sm text-parchment-dim leading-relaxed" dir={c.language === 'he-IL' ? 'rtl' : 'ltr'}>
            {c.answer.length > 300 ? c.answer.slice(0, 300) + '...' : c.answer}
          </div>
        </div>
      )}
    </div>
  )
}

export function AskTheData({ conversations }: AskTheDataProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAsk = useCallback((question: string) => {
    if (!question.trim()) return
    setIsThinking(true)

    // Simulate brief processing delay for UX (real Kuzu/OpenAI would be async)
    setTimeout(() => {
      const result = queryConversations(question, conversations)
      setResults((prev) => [result, ...prev])
      setQuery('')
      setIsThinking(false)
    }, 300)
  }, [conversations])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk(query)
    }
  }, [query, handleAsk])

  return (
    <div className="space-y-5">
      {/* Oracle header */}
      <div className="text-center pb-2">
        <p className="text-parchment-dim text-sm">
          Ask questions about {conversations.length} visitor conversations
        </p>
      </div>

      {/* Suggested questions — gilded chips */}
      <div className="flex flex-wrap gap-2 justify-center">
        {SUGGESTED_QUESTIONS.map((sq) => (
          <button
            key={sq.label}
            onClick={() => handleAsk(sq.query)}
            className="px-3 py-1.5 rounded-md text-sm border border-gold/20 text-gold/70 hover:text-gold hover:bg-gold/10 hover:border-gold/40 transition-all"
          >
            {sq.label}
          </button>
        ))}
      </div>

      {/* Query input — scribal desk aesthetic */}
      <div className="relative">
        <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden focus-within:border-gold/40 transition-colors">
          <Sparkles size={18} className="text-gold/40 ml-4 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the data anything..."
            className="flex-1 bg-transparent px-3 py-3 text-base text-parchment placeholder:text-text-dim/50 focus:outline-none"
            disabled={isThinking}
          />
          <button
            onClick={() => handleAsk(query)}
            disabled={isThinking || !query.trim()}
            className="px-4 py-3 text-gold hover:bg-gold/10 disabled:text-text-dim/30 transition-colors flex-shrink-0"
          >
            {isThinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.timestamp} className="space-y-3">
            {/* Question echo */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gold text-xs font-bold">Q</span>
              </div>
              <p className="text-parchment text-sm font-medium">{result.question}</p>
            </div>

            {/* Answer */}
            <div className="ml-9 space-y-3">
              <p className="text-parchment-dim text-sm leading-relaxed">{result.answer}</p>

              {/* Result cards */}
              {result.conversations.length > 0 && (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                  {result.conversations.map((c) => (
                    <ResultCard key={c.id} conversation={c} />
                  ))}
                </div>
              )}

              {/* Cypher query (future: shown when Kuzu is active) */}
              {result.cypherQuery && (
                <details className="text-xs">
                  <summary className="text-text-dim/50 cursor-pointer hover:text-text-dim transition-colors">
                    Show query
                  </summary>
                  <pre className="mt-1 p-2 bg-background rounded text-gold/60 font-mono overflow-x-auto">
                    {result.cypherQuery}
                  </pre>
                </details>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/30 ml-9" />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {results.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gold/20 text-5xl mb-3">✦</div>
          <p className="text-parchment-dim text-sm">
            Choose a suggested question above, or type your own.
          </p>
          <p className="text-text-dim/50 text-xs mt-1">
            Results show matching visitor conversations with full details.
          </p>
        </div>
      )}
    </div>
  )
}
