import { useState, useCallback, useRef } from 'react'
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
  stats?: string[]
  conversations: Conversation[]
  timestamp: number
}

const SUGGESTED_QUESTIONS = [
  { label: 'Sensitive topics', query: 'Show me sensitive conversations' },
  { label: 'Slowest answers', query: 'What caused long response times?' },
  { label: 'Hebrew vs English', query: 'Compare Hebrew and English' },
  { label: 'Popular topics', query: 'What topics are most popular?' },
  { label: 'System problems', query: 'Show anomalies and problems' },
  { label: 'Comprehension fails', query: 'When did Rambam not understand?' },
  { label: 'Kill switch usage', query: 'Show stop commands' },
  { label: 'Busiest days', query: 'Which days were busiest?' },
]

// ──────────────────────────────────────────────
// TOPIC SYNONYMS: maps user words → actual topic names
// ──────────────────────────────────────────────
const TOPIC_SYNONYMS: Record<string, string[]> = {
  'Kashrut': ['kashrut', 'kosher', 'kasher', 'meat', 'dairy', 'milk', 'food', 'diet', 'eating', 'בשר', 'חלב', 'כשר'],
  'Military & Draft': ['military', 'army', 'draft', 'soldier', 'idf', 'haredi', 'ultra-orthodox', 'yeshiva', 'צבא', 'גיוס', 'חרדי'],
  'Interfaith': ['interfaith', 'christian', 'islam', 'muslim', 'jesus', 'church', 'mosque', 'religion', 'נצרות', 'ישו', 'מוסלמ'],
  'Theology': ['theology', 'god', 'divine', 'soul', 'faith', 'belief', 'creator', 'spiritual', 'אלוהים', 'נשמה', 'אמונה'],
  'Torah & Text': ['torah', 'talmud', 'bible', 'scripture', 'parsha', 'text', 'verse', 'study', 'תורה', 'תלמוד', 'פרשת'],
  'Jewish Law': ['jewish law', 'halacha', 'halakha', 'halachic', 'mitzvah', 'mitzva', 'commandment', 'shabbat', 'sabbath', 'הלכה', 'מצוו', 'שבת'],
  'Philosophy': ['philosophy', 'wisdom', 'ethics', 'moral', 'virtue', 'truth', 'meaning', 'tolerance', 'justice', 'חכמה', 'מוסר'],
  'Personal Life': ['personal', 'family', 'child', 'children', 'education', 'medicine', 'health', 'doctor', 'advice', 'anger', 'חינוך', 'רפואה'],
  'History': ['history', 'historical', 'egypt', 'spain', 'where live', 'born', 'biography', 'life', 'מצרים', 'ספרד', 'תולדות'],
  'Relationships': ['relationship', 'love', 'marriage', 'couple', 'dating', 'spouse', 'אהבה', 'נישואין', 'זוגיות'],
  'Meta': ['meta', 'museum', 'hologram', 'robot', 'ai', 'artificial', 'technology', 'installation', 'מוזיאון', 'הולוגרמ'],
  'Blessings': ['blessing', 'bless', 'prayer', 'pray', 'ברכ', 'תפילה'],
  'Daily Life': ['daily', 'coffee', 'sleep', 'morning', 'routine', 'wash', 'tea', 'breakfast', 'קפה', 'שנת'],
  'Greetings': ['greeting', 'hello', 'goodbye', 'hi', 'welcome', 'שלום', 'בוקר טוב'],
}

// ──────────────────────────────────────────────
// INTENT DETECTION: what is the user asking about?
// ──────────────────────────────────────────────
type Intent =
  | { type: 'topic'; topic: string }
  | { type: 'slow' }
  | { type: 'fast' }
  | { type: 'language_compare' }
  | { type: 'language_filter'; lang: string }
  | { type: 'popular_topics' }
  | { type: 'anomalies' }
  | { type: 'comprehension_fail' }
  | { type: 'stop_commands' }
  | { type: 'busiest_days' }
  | { type: 'sensitive' }
  | { type: 'vip' }
  | { type: 'no_answer' }
  | { type: 'greetings' }
  | { type: 'date_filter'; date: string }
  | { type: 'out_of_order' }
  | { type: 'text_search'; terms: string[] }

function detectIntents(q: string): Intent[] {
  const intents: Intent[] = []
  const lower = q.toLowerCase().replace(/[?!.,;:]/g, '').trim()
  const words = lower.split(/\s+/)

  // Topic matching via synonyms
  for (const [topic, synonyms] of Object.entries(TOPIC_SYNONYMS)) {
    for (const syn of synonyms) {
      if (lower.includes(syn)) {
        intents.push({ type: 'topic', topic })
        break
      }
    }
  }

  // Latency / speed intents
  const slowWords = ['slow', 'long', 'latency', 'delay', 'wait', 'timeout', 'spike', 'response time', 'took long', 'too long', 'sluggish']
  if (slowWords.some((w) => lower.includes(w))) intents.push({ type: 'slow' })

  const fastWords = ['fast', 'quick', 'instant', 'responsive', 'snappy', 'fastest']
  if (fastWords.some((w) => lower.includes(w))) intents.push({ type: 'fast' })

  // Language
  if ((lower.includes('hebrew') && lower.includes('english')) || lower.includes('compare') || lower.includes('vs') || lower.includes('versus'))
    intents.push({ type: 'language_compare' })
  else if (lower.includes('hebrew') || lower.includes('עברית'))
    intents.push({ type: 'language_filter', lang: 'he-IL' })
  else if (lower.includes('english') || lower.includes('אנגלית'))
    intents.push({ type: 'language_filter', lang: 'en-US' })

  // Popular topics
  if (lower.includes('popular') || lower.includes('common') || lower.includes('most asked') || lower.includes('frequent') || lower.includes('top topic'))
    intents.push({ type: 'popular_topics' })

  // Anomalies
  const anomalyWords = ['anomal', 'problem', 'error', 'issue', 'bug', 'broken', 'failed', 'failure', 'wrong']
  if (anomalyWords.some((w) => lower.includes(w))) intents.push({ type: 'anomalies' })

  // Comprehension
  if (lower.includes('understand') || lower.includes('comprehen') || lower.includes('confus') || lower.includes('rephrase') || lower.includes('didn\'t get'))
    intents.push({ type: 'comprehension_fail' })

  // Stop commands
  if (lower.includes('stop') || lower.includes('kill') || lower.includes('thank you') || lower.includes('interrupt'))
    intents.push({ type: 'stop_commands' })

  // Busiest
  if (lower.includes('busy') || lower.includes('busiest') || lower.includes('most questions') || lower.includes('peak') || lower.includes('volume'))
    intents.push({ type: 'busiest_days' })

  // Sensitivity
  if (lower.includes('sensitiv') || lower.includes('critical') || lower.includes('controversial') || lower.includes('political') || lower.includes('danger'))
    intents.push({ type: 'sensitive' })

  // VIP
  if (lower.includes('vip') || lower.includes('important') || lower.includes('notable') || lower.includes('special visitor'))
    intents.push({ type: 'vip' })

  // No answer
  if (lower.includes('no answer') || lower.includes('empty') || lower.includes('blank') || lower.includes('unanswered') || lower.includes('didn\'t answer'))
    intents.push({ type: 'no_answer' })

  // Greeting queries
  if (lower.includes('greeting') || lower.includes('hello') || lower.includes('שלום'))
    intents.push({ type: 'greetings' })

  // Out of order
  if (lower.includes('out of order') || lower.includes('out-of-order') || lower.includes('david') || lower.includes('bug'))
    intents.push({ type: 'out_of_order' })

  // Date filter — look for YYYY-MM-DD patterns or month names
  const dateMatch = lower.match(/(\d{4}-\d{2}-\d{2})/)
  if (dateMatch) intents.push({ type: 'date_filter', date: dateMatch[1] })

  // If no intent detected, do text search with the meaningful words
  if (intents.length === 0) {
    const stopWords = new Set(['what', 'which', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'show', 'me', 'all', 'find', 'get', 'list', 'display', 'tell', 'give', 'can', 'you', 'conversations', 'questions', 'that', 'have', 'had', 'this', 'those', 'these', 'it', 'they', 'them', 'been', 'be', 'not', 'and', 'or', 'but', 'if', 'any', 'some', 'most', 'trigger', 'cause', 'caused', 'make', 'made'])
    const terms = words.filter((w) => w.length > 2 && !stopWords.has(w))
    if (terms.length > 0) {
      intents.push({ type: 'text_search', terms })
    }
  }

  return intents
}

// ──────────────────────────────────────────────
// QUERY ENGINE: process intents → filter + summarize
// ──────────────────────────────────────────────
function queryConversations(question: string, conversations: Conversation[]): QueryResult {
  const intents = detectIntents(question)
  let filtered = [...conversations]
  const answers: string[] = []
  const stats: string[] = []

  if (intents.length === 0) {
    return {
      question,
      answer: `I couldn't understand that query. Try asking about a topic (like "kashrut" or "theology"), or use the suggested questions below.`,
      conversations: [],
      timestamp: Date.now(),
    }
  }

  for (const intent of intents) {
    switch (intent.type) {
      case 'topic': {
        filtered = filtered.filter((c) => c.topic === intent.topic)
        const avg = filtered.length ? Math.round(filtered.reduce((s, c) => s + c.latency_ms, 0) / filtered.length) : 0
        const anomCount = filtered.filter((c) => c.is_anomaly).length
        answers.push(`**${intent.topic}**: ${filtered.length} conversations`)
        stats.push(`Avg response: ${formatLatency(avg)}`)
        if (anomCount > 0) stats.push(`${anomCount} with problems`)
        const langs = filtered.reduce((acc, c) => { acc[c.language] = (acc[c.language] || 0) + 1; return acc }, {} as Record<string, number>)
        const langStr = Object.entries(langs).map(([l, n]) => `${LANG_FLAGS[l] || '❓'} ${n}`).join(', ')
        stats.push(`Languages: ${langStr}`)
        break
      }

      case 'slow': {
        filtered.sort((a, b) => b.latency_ms - a.latency_ms)
        const slow3s = filtered.filter((c) => c.latency_ms > 3000)
        const slow2s = filtered.filter((c) => c.latency_ms > 2000 && c.latency_ms <= 3000)
        answers.push(`**Slow responses**: ${slow3s.length} over 3s, ${slow2s.length} between 2-3s`)
        filtered = filtered.filter((c) => c.latency_ms > 0).slice(0, 15)
        if (filtered.length > 0) {
          const topicCounts: Record<string, number> = {}
          filtered.forEach((c) => { topicCounts[c.topic] = (topicCounts[c.topic] || 0) + 1 })
          const topTopics = Object.entries(topicCounts).sort(([, a], [, b]) => b - a).slice(0, 3)
          stats.push(`Slowest: ${formatLatency(filtered[0].latency_ms)}`)
          stats.push(`Topics causing delays: ${topTopics.map(([t, n]) => `${t} (${n})`).join(', ')}`)
        }
        break
      }

      case 'fast': {
        filtered = filtered.filter((c) => c.latency_ms > 0 && c.latency_ms <= 2000)
        filtered.sort((a, b) => a.latency_ms - b.latency_ms)
        answers.push(`**Fast responses**: ${filtered.length} under 2s`)
        if (filtered.length > 0) stats.push(`Fastest: ${formatLatency(filtered[0].latency_ms)}`)
        filtered = filtered.slice(0, 15)
        break
      }

      case 'language_compare': {
        const he = conversations.filter((c) => c.language === 'he-IL')
        const en = conversations.filter((c) => c.language === 'en-US')
        const unk = conversations.filter((c) => c.language === 'unknown')
        const heAvg = he.length ? Math.round(he.reduce((s, c) => s + c.latency_ms, 0) / he.length) : 0
        const enAvg = en.length ? Math.round(en.reduce((s, c) => s + c.latency_ms, 0) / en.length) : 0
        const heAnom = he.filter((c) => c.is_anomaly).length
        const enAnom = en.filter((c) => c.is_anomaly).length
        answers.push(`**Language comparison** across ${conversations.length} conversations`)
        stats.push(`🇮🇱 Hebrew: ${he.length} conversations, avg ${formatLatency(heAvg)}, ${heAnom} problems`)
        stats.push(`🇺🇸 English: ${en.length} conversations, avg ${formatLatency(enAvg)}, ${enAnom} problems`)
        if (unk.length > 0) stats.push(`❓ Unknown: ${unk.length} (likely Russian/Arabic)`)
        stats.push(heAvg < enAvg ? `Hebrew is ${formatLatency(enAvg - heAvg)} faster on average` : `English is ${formatLatency(heAvg - enAvg)} faster on average`)
        break
      }

      case 'language_filter': {
        filtered = filtered.filter((c) => c.language === intent.lang)
        const label = intent.lang === 'he-IL' ? 'Hebrew' : intent.lang === 'en-US' ? 'English' : 'Unknown'
        answers.push(`**${label} conversations**: ${filtered.length}`)
        break
      }

      case 'popular_topics': {
        const counts: Record<string, number> = {}
        conversations.forEach((c) => { counts[c.topic] = (counts[c.topic] || 0) + 1 })
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a)
        answers.push(`**Topic ranking** (${Object.keys(counts).length} topics across ${conversations.length} conversations)`)
        sorted.forEach(([topic, count], i) => {
          const pct = ((count / conversations.length) * 100).toFixed(0)
          stats.push(`${i + 1}. ${topic}: ${count} (${pct}%)`)
        })
        break
      }

      case 'anomalies': {
        filtered = filtered.filter((c) => c.is_anomaly)
        answers.push(`**Problems found**: ${filtered.length} of ${conversations.length} conversations`)
        const typeCounts: Record<string, number> = {}
        filtered.forEach((c) => c.anomalies.forEach((a) => { typeCounts[a] = (typeCounts[a] || 0) + 1 }))
        const sorted = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)
        sorted.forEach(([type, count]) => stats.push(`${type}: ${count}`))
        break
      }

      case 'comprehension_fail': {
        filtered = filtered.filter((c) => c.is_comprehension_failure || c.is_no_answer)
        answers.push(`**Comprehension failures**: ${filtered.length} conversations where Rambam couldn't understand or answer`)
        const langs = filtered.reduce((acc, c) => { acc[c.language] = (acc[c.language] || 0) + 1; return acc }, {} as Record<string, number>)
        Object.entries(langs).forEach(([l, n]) => stats.push(`${LANG_FLAGS[l] || '❓'} ${l}: ${n}`))
        break
      }

      case 'stop_commands': {
        filtered = filtered.filter((c) => c.is_thank_you_interrupt)
        answers.push(`**STOP commands**: ${filtered.length} kill switch activations`)
        const byDay: Record<string, number> = {}
        filtered.forEach((c) => { byDay[c.date] = (byDay[c.date] || 0) + 1 })
        const sorted = Object.entries(byDay).sort(([, a], [, b]) => b - a)
        stats.push(`Days with most stops: ${sorted.slice(0, 3).map(([d, n]) => `${d} (${n})`).join(', ')}`)
        break
      }

      case 'busiest_days': {
        const dayCounts: Record<string, number> = {}
        conversations.forEach((c) => { dayCounts[c.date] = (dayCounts[c.date] || 0) + 1 })
        const sorted = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)
        answers.push(`**Daily activity** across ${Object.keys(dayCounts).length} days`)
        sorted.forEach(([date, count]) => stats.push(`${date}: ${count} questions`))
        break
      }

      case 'sensitive': {
        filtered = filtered.filter((c) => c.sensitivity === 'high' || c.sensitivity === 'critical')
        answers.push(`**Sensitive conversations**: ${filtered.length}`)
        const critCount = filtered.filter((c) => c.sensitivity === 'critical').length
        const highCount = filtered.filter((c) => c.sensitivity === 'high').length
        stats.push(`Critical: ${critCount}, High: ${highCount}`)
        const topicCounts: Record<string, number> = {}
        filtered.forEach((c) => { topicCounts[c.topic] = (topicCounts[c.topic] || 0) + 1 })
        const sorted = Object.entries(topicCounts).sort(([, a], [, b]) => b - a)
        stats.push(`Topics: ${sorted.map(([t, n]) => `${t} (${n})`).join(', ')}`)
        break
      }

      case 'vip': {
        filtered = filtered.filter((c) => c.vip)
        answers.push(filtered.length > 0
          ? `**VIP visitors**: ${filtered.length} conversations`
          : `**No VIP visitors** detected in the current dataset.`)
        break
      }

      case 'no_answer': {
        filtered = filtered.filter((c) => c.is_no_answer)
        answers.push(`**Unanswered questions**: ${filtered.length}`)
        break
      }

      case 'greetings': {
        filtered = filtered.filter((c) => c.is_greeting)
        answers.push(`**Greetings**: ${filtered.length} hello/goodbye conversations`)
        break
      }

      case 'out_of_order': {
        filtered = filtered.filter((c) => c.is_out_of_order)
        answers.push(`**Out-of-order events**: ${filtered.length} (David/Starcloud bug — Rambam receives answer but doesn't speak it)`)
        break
      }

      case 'date_filter': {
        filtered = filtered.filter((c) => c.date === intent.date)
        answers.push(`**${intent.date}**: ${filtered.length} conversations`)
        break
      }

      case 'text_search': {
        const matchingSets = intent.terms.map((term) =>
          filtered.filter((c) =>
            c.question.toLowerCase().includes(term) ||
            c.answer.toLowerCase().includes(term) ||
            (c.question_en && c.question_en.toLowerCase().includes(term)) ||
            (c.answer_en && c.answer_en.toLowerCase().includes(term)) ||
            c.topic.toLowerCase().includes(term) ||
            (c.opening_text && c.opening_text.toLowerCase().includes(term))
          )
        )
        // Union of all matches
        const matchIds = new Set(matchingSets.flat().map((c) => c.id))
        filtered = filtered.filter((c) => matchIds.has(c.id))
        answers.push(filtered.length > 0
          ? `**Text search** for "${intent.terms.join(', ')}": ${filtered.length} matches`
          : `No matches for "${intent.terms.join(', ')}". Try different words or a topic name.`)
        break
      }
    }
  }

  return {
    question,
    answer: answers.join('. '),
    stats: stats.length > 0 ? stats : undefined,
    conversations: filtered.slice(0, 20),
    timestamp: Date.now(),
  }
}

// ──────────────────────────────────────────────
// RESULT CARD — compact conversation display
// ──────────────────────────────────────────────
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
        <span className="text-base" title={c.language === 'he-IL' ? 'Hebrew speaker' : c.language === 'en-US' ? 'English speaker' : 'Language unknown'}>{flag}</span>
        <span className="text-parchment-dim font-mono text-xs" title={`Full time: ${c.time}`}>{c.date} {extractTime(c.time)}</span>
        <span
          className="px-1.5 py-0.5 rounded text-xs font-semibold"
          style={{ backgroundColor: topicColor + '18', color: topicColor }}
          title={`Topic: ${c.topic}`}
        >
          {c.topic}
        </span>
        {c.is_thank_you_interrupt && (
          <span className="text-xs font-bold text-critical" title="KILL SWITCH — Visitor said 'Thank you' to stop Rambam mid-sentence">⏹ STOP</span>
        )}
        {c.is_anomaly && (
          <span className="text-critical cursor-help" title={c.anomalies.join(', ')}>⚠</span>
        )}
        <span className="ml-auto font-mono text-xs font-semibold" style={{ color: latColor }} title={`Response time: ${c.latency_ms}ms`}>
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
            {c.answer}
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────
export function AskTheData({ conversations }: AskTheDataProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAsk = useCallback((question: string) => {
    if (!question.trim()) return
    setIsThinking(true)

    setTimeout(() => {
      const result = queryConversations(question, conversations)
      setResults((prev) => [result, ...prev])
      setQuery('')
      setIsThinking(false)
    }, 200)
  }, [conversations])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk(query)
    }
  }, [query, handleAsk])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center pb-2">
        <p className="text-parchment-dim text-sm">
          Ask about {conversations.length} visitor conversations — topics, speed, problems, patterns
        </p>
      </div>

      {/* Suggested questions */}
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

      {/* Input */}
      <div className="relative">
        <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden focus-within:border-gold/40 transition-colors">
          <Sparkles size={18} className="text-gold/40 ml-4 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try: halacha, slow responses, kashrut, Hebrew questions..."
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
            {/* Question */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gold text-xs font-bold">Q</span>
              </div>
              <p className="text-parchment text-sm font-medium">{result.question}</p>
            </div>

            {/* Answer + Stats */}
            <div className="ml-9 space-y-3">
              <p className="text-parchment text-sm leading-relaxed" dangerouslySetInnerHTML={{
                __html: result.answer
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gold">$1</strong>')
              }} />

              {/* Stats bullets */}
              {result.stats && result.stats.length > 0 && (
                <div className="bg-background/50 rounded-lg px-4 py-3 space-y-1">
                  {result.stats.map((stat, i) => (
                    <div key={i} className="text-sm text-parchment-dim flex items-start gap-2">
                      <span className="text-gold/40 mt-0.5">›</span>
                      <span>{stat}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Conversation results */}
              {result.conversations.length > 0 && (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                  {result.conversations.map((c) => (
                    <ResultCard key={c.id} conversation={c} />
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-border/30 ml-9" />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {results.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gold/20 text-5xl mb-3">✦</div>
          <p className="text-parchment-dim text-sm">
            Choose a suggested question, or type a topic name, keyword, or question.
          </p>
          <p className="text-text-dim/50 text-xs mt-2">
            Examples: "halacha" &middot; "slow responses" &middot; "Hebrew kashrut" &middot; "what caused problems?"
          </p>
        </div>
      )}
    </div>
  )
}
