import { useState, useCallback, useRef, useMemo } from 'react'
import { Send, Sparkles, ChevronDown, Loader2, Zap, Brain } from 'lucide-react'
import type { Conversation } from '@/types/dashboard'
import { TOPIC_COLORS, LANG_FLAGS } from '@/types/dashboard'
import { formatLatency, extractTime, getLatencyColor } from '@/lib/utils'

// ══════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════
const ASK_PROXY_URL = import.meta.env.VITE_ASK_PROXY_URL || ''

interface AskTheDataProps {
  conversations: Conversation[]
}

interface QueryResult {
  question: string
  answer: string
  stats?: string[]
  insights?: string[]
  follow_ups?: string[]
  conversations: Conversation[]
  timestamp: number
  source: 'ai' | 'local'
}

// ══════════════════════════════════════════════════
// 1. DATA SUMMARY BUILDER — compact text for GPT
// ══════════════════════════════════════════════════
function buildDataSummary(conversations: Conversation[]): string {
  const lines: string[] = []
  const total = conversations.length
  const dates = [...new Set(conversations.map(c => c.date))].sort()

  // Overview
  lines.push(`DATASET: ${total} visitor conversations across ${dates.length} days (${dates[0]} to ${dates[dates.length - 1]})`)

  // Language breakdown
  const langCounts: Record<string, number> = {}
  conversations.forEach(c => { langCounts[c.language] = (langCounts[c.language] || 0) + 1 })
  lines.push(`LANGUAGES: ${Object.entries(langCounts).map(([l, n]) => `${l}: ${n}`).join(', ')}`)

  // Topic breakdown
  const topicCounts: Record<string, number> = {}
  conversations.forEach(c => { topicCounts[c.topic] = (topicCounts[c.topic] || 0) + 1 })
  const topicsSorted = Object.entries(topicCounts).sort(([, a], [, b]) => b - a)
  lines.push(`TOPICS: ${topicsSorted.map(([t, n]) => `${t}: ${n}`).join(', ')}`)

  // Latency
  const withLatency = conversations.filter(c => c.latency_ms > 0)
  const avgLat = withLatency.length ? Math.round(withLatency.reduce((s, c) => s + c.latency_ms, 0) / withLatency.length) : 0
  const maxLat = withLatency.length ? Math.max(...withLatency.map(c => c.latency_ms)) : 0
  lines.push(`LATENCY: avg ${avgLat}ms, max ${maxLat}ms`)

  // Anomalies
  const anomCount = conversations.filter(c => c.is_anomaly).length
  const failCount = conversations.filter(c => c.is_comprehension_failure).length
  const stopCount = conversations.filter(c => c.is_thank_you_interrupt).length
  const politeCount = conversations.filter(c => c.thank_you_type === 'polite').length
  const noAnswerCount = conversations.filter(c => c.is_no_answer).length
  const oooCount = conversations.filter(c => c.is_out_of_order).length
  lines.push(`ANOMALIES: ${anomCount} (${((anomCount / total) * 100).toFixed(1)}%)`)
  lines.push(`FAILURES: comprehension=${failCount}, no_answer=${noAnswerCount}, out_of_order=${oooCount}`)
  lines.push(`STOPS: ${stopCount} kill switches, ${politeCount} polite thanks`)

  // Sensitivity
  const sensCounts: Record<string, number> = {}
  conversations.forEach(c => { sensCounts[c.sensitivity] = (sensCounts[c.sensitivity] || 0) + 1 })
  lines.push(`SENSITIVITY: ${Object.entries(sensCounts).map(([s, n]) => `${s}: ${n}`).join(', ')}`)

  // Seamless rate
  const thinkTimes = conversations.filter(c => c.ai_think_ms && c.ai_think_ms > 0)
  if (thinkTimes.length > 0) {
    const seamless = thinkTimes.filter(c => (c.ai_think_ms || 0) < 3000).length
    lines.push(`SEAMLESS_RATE: ${((seamless / thinkTimes.length) * 100).toFixed(1)}%`)
  }

  // Per-day summary
  lines.push('')
  lines.push('PER-DAY BREAKDOWN:')
  const dayMap: Record<string, Conversation[]> = {}
  conversations.forEach(c => { if (!dayMap[c.date]) dayMap[c.date] = []; dayMap[c.date].push(c) })
  for (const date of dates) {
    const dayConvos = dayMap[date] || []
    const dayAvg = dayConvos.filter(c => c.latency_ms > 0).length > 0
      ? Math.round(dayConvos.filter(c => c.latency_ms > 0).reduce((s, c) => s + c.latency_ms, 0) / dayConvos.filter(c => c.latency_ms > 0).length)
      : 0
    const dayAnom = dayConvos.filter(c => c.is_anomaly).length
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
    const heCount = dayConvos.filter(c => c.language === 'he-IL').length
    const enCount = dayConvos.filter(c => c.language === 'en-US').length
    lines.push(`${dayName} ${date}: ${dayConvos.length} convos, he:${heCount} en:${enCount}, avg ${dayAvg}ms, ${dayAnom} anomalies`)
  }

  // Hourly distribution
  const hourCounts: Record<number, number> = {}
  conversations.forEach(c => { hourCounts[c.hour] = (hourCounts[c.hour] || 0) + 1 })
  const hourEntries = Object.entries(hourCounts).sort(([a], [b]) => Number(a) - Number(b))
  lines.push('')
  lines.push(`HOURLY: ${hourEntries.map(([h, n]) => `${h}:00=${n}`).join(', ')}`)

  // Anomaly type breakdown
  const anomTypes: Record<string, number> = {}
  conversations.forEach(c => c.anomalies?.forEach(a => { anomTypes[a] = (anomTypes[a] || 0) + 1 }))
  if (Object.keys(anomTypes).length > 0) {
    lines.push(`ANOMALY_TYPES: ${Object.entries(anomTypes).sort(([, a], [, b]) => b - a).map(([t, n]) => `${t}: ${n}`).join(', ')}`)
  }

  // VIPs
  const vips = conversations.filter(c => c.vip)
  if (vips.length > 0) {
    lines.push(`VIPS: ${vips.map(c => `${c.vip} (${c.date})`).join(', ')}`)
  }

  // Sample conversations — send ALL conversations as compact lines for full data access
  lines.push('')
  lines.push('ALL CONVERSATIONS (compact):')
  conversations.forEach((c, i) => {
    const flags: string[] = []
    if (c.is_anomaly) flags.push('ANOM')
    if (c.is_thank_you_interrupt) flags.push('STOP')
    if (c.thank_you_type === 'polite') flags.push('POLITE')
    if (c.is_comprehension_failure) flags.push('FAIL')
    if (c.is_no_answer) flags.push('NOANSWER')
    if (c.is_out_of_order) flags.push('OOO')
    if (c.is_greeting) flags.push('GREET')
    if (c.vip) flags.push(`VIP:${c.vip}`)
    const flagStr = flags.length > 0 ? ` [${flags.join(',')}]` : ''
    const qText = (c.question_en || c.question).slice(0, 120)
    lines.push(`#${i + 1} ${c.date} ${extractTime(c.time)} | ${c.language} | ${c.topic} | ${c.sensitivity} | ${c.latency_ms}ms${flagStr} | Q: "${qText}"`)
  })

  return lines.join('\n')
}

// ══════════════════════════════════════════════════
// 2. LLM QUERY — call OpenAI proxy
// ══════════════════════════════════════════════════
interface LLMResponse {
  filters?: {
    topics?: string[] | null
    languages?: string[] | null
    date_exact?: string | null
    date_range?: { start: string; end: string } | null
    latency_op?: string | null
    latency_val?: number | null
    sensitivity?: string[] | null
    is_anomaly?: boolean | null
    is_stop?: boolean | null
    is_greeting?: boolean | null
    is_no_answer?: boolean | null
    is_comprehension_failure?: boolean | null
    is_out_of_order?: boolean | null
    vip_only?: boolean | null
    text_search?: string[] | null
    hour_range?: { start: number; end: number } | null
  }
  sort?: { field: string; dir: string } | null
  mode?: string
  answer: string
  stats?: string[]
  insights?: string[] | null
  follow_ups?: string[]
}

async function queryLLM(question: string, dataSummary: string): Promise<LLMResponse> {
  const res = await fetch(ASK_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, dataSummary }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Proxy error ${res.status}: ${errText}`)
  }
  return res.json()
}

function applyLLMFilters(conversations: Conversation[], filters: LLMResponse['filters']): Conversation[] {
  if (!filters) return conversations
  let result = [...conversations]

  if (filters.topics?.length) {
    result = result.filter(c => filters.topics!.includes(c.topic))
  }
  if (filters.languages?.length) {
    result = result.filter(c => filters.languages!.includes(c.language))
  }
  if (filters.date_exact) {
    result = result.filter(c => c.date === filters.date_exact)
  }
  if (filters.date_range) {
    result = result.filter(c => c.date >= filters.date_range!.start && c.date <= filters.date_range!.end)
  }
  if (filters.latency_op && filters.latency_val) {
    if (filters.latency_op === '>') {
      result = result.filter(c => c.latency_ms > filters.latency_val!)
    } else if (filters.latency_op === '<') {
      result = result.filter(c => c.latency_ms > 0 && c.latency_ms < filters.latency_val!)
    }
  }
  if (filters.sensitivity?.length) {
    result = result.filter(c => filters.sensitivity!.includes(c.sensitivity))
  }
  if (filters.hour_range) {
    result = result.filter(c => c.hour >= filters.hour_range!.start && c.hour < filters.hour_range!.end)
  }
  if (filters.is_anomaly) result = result.filter(c => c.is_anomaly)
  if (filters.is_stop) result = result.filter(c => c.is_thank_you_interrupt)
  if (filters.is_greeting) result = result.filter(c => c.is_greeting)
  if (filters.is_no_answer) result = result.filter(c => c.is_no_answer)
  if (filters.is_comprehension_failure) result = result.filter(c => c.is_comprehension_failure)
  if (filters.is_out_of_order) result = result.filter(c => c.is_out_of_order)
  if (filters.vip_only) result = result.filter(c => c.vip)
  if (filters.text_search?.length) {
    result = result.filter(c => {
      const text = `${c.question} ${c.answer} ${c.question_en || ''} ${c.answer_en || ''} ${c.topic} ${c.opening_text || ''}`.toLowerCase()
      return filters.text_search!.some(term => text.includes(term.toLowerCase()))
    })
  }

  return result
}

// ══════════════════════════════════════════════════
// 3. LOCAL ILR ENGINE (fallback)
// ══════════════════════════════════════════════════
const TOPIC_ALIASES: Record<string, string> = {
  kashrut: 'Kashrut', kosher: 'Kashrut', kasher: 'Kashrut', meat: 'Kashrut',
  dairy: 'Kashrut', milk: 'Kashrut', food: 'Kashrut', diet: 'Kashrut',
  eating: 'Kashrut', 'waiting hours': 'Kashrut', כשרות: 'Kashrut',
  בשר: 'Kashrut', חלב: 'Kashrut', כשר: 'Kashrut',
  halacha: 'Jewish Law', halakha: 'Jewish Law', halachic: 'Jewish Law',
  'jewish law': 'Jewish Law', law: 'Jewish Law', mitzvah: 'Jewish Law',
  mitzvot: 'Jewish Law', shabbat: 'Jewish Law', sabbath: 'Jewish Law',
  הלכה: 'Jewish Law', מצווה: 'Jewish Law', מצוות: 'Jewish Law', שבת: 'Jewish Law',
  theology: 'Theology', god: 'Theology', divine: 'Theology', soul: 'Theology',
  faith: 'Theology', belief: 'Theology', אלוהים: 'Theology', נשמה: 'Theology',
  military: 'Military & Draft', army: 'Military & Draft', draft: 'Military & Draft',
  haredi: 'Military & Draft', soldiers: 'Military & Draft', idf: 'Military & Draft',
  צבא: 'Military & Draft', גיוס: 'Military & Draft', חרדי: 'Military & Draft',
  torah: 'Torah & Text', talmud: 'Torah & Text', bible: 'Torah & Text',
  תורה: 'Torah & Text', תלמוד: 'Torah & Text',
  philosophy: 'Philosophy', ethics: 'Philosophy', wisdom: 'Philosophy',
  חכמה: 'Philosophy', מוסר: 'Philosophy',
  hologram: 'Meta', robot: 'Meta', ai: 'Meta', museum: 'Meta', מוזיאון: 'Meta',
  personal: 'Personal Life', health: 'Personal Life', family: 'Personal Life',
  egypt: 'History', spain: 'History', cordoba: 'History',
  interfaith: 'Interfaith', christian: 'Interfaith', islam: 'Interfaith', muslim: 'Interfaith',
  greeting: 'Greetings', hello: 'Greetings', shalom: 'Greetings', שלום: 'Greetings',
  love: 'Relationships', marriage: 'Relationships', אהבה: 'Relationships',
  blessing: 'Blessings', prayer: 'Blessings', ברכה: 'Blessings',
  coffee: 'Daily Life', sleep: 'Daily Life', morning: 'Daily Life',
}

function localQuery(question: string, conversations: Conversation[]): QueryResult {
  const lower = question.toLowerCase().replace(/[?!.,;:]/g, ' ').trim()
  const tokens = lower.split(/\s+/).filter(Boolean)
  let filtered = [...conversations]
  const stats: string[] = []
  const insights: string[] = []
  let answer = ''

  // Topic match
  const topics = new Set<string>()
  for (const t of tokens) {
    if (TOPIC_ALIASES[t]) topics.add(TOPIC_ALIASES[t])
  }
  if (topics.size > 0) {
    filtered = filtered.filter(c => topics.has(c.topic))
    answer = `**${[...topics].join(', ')}**: ${filtered.length} conversations`
  }

  // Language
  if (lower.includes('hebrew') || lower.includes('עברית')) {
    filtered = filtered.filter(c => c.language === 'he-IL')
    if (!answer) answer = `**Hebrew conversations**: ${filtered.length}`
  } else if (lower.includes('english') || lower.includes('אנגלית')) {
    filtered = filtered.filter(c => c.language === 'en-US')
    if (!answer) answer = `**English conversations**: ${filtered.length}`
  }

  // Anomalies
  if (lower.includes('anomal') || lower.includes('problem') || lower.includes('error') || lower.includes('issue') || lower.includes('בעי')) {
    filtered = filtered.filter(c => c.is_anomaly)
    answer = `**Problems**: ${filtered.length} of ${conversations.length} (${((filtered.length / conversations.length) * 100).toFixed(0)}%)`
    const typeCounts: Record<string, number> = {}
    filtered.forEach(c => c.anomalies.forEach(a => { typeCounts[a] = (typeCounts[a] || 0) + 1 }))
    Object.entries(typeCounts).sort(([, a], [, b]) => b - a).forEach(([type, count]) => {
      stats.push(`${type}: ${count}`)
    })
  }

  // Slow
  if (lower.includes('slow') || lower.includes('latency') || lower.includes('delay') || lower.includes('איטי')) {
    filtered = filtered.filter(c => c.latency_ms > 3000)
    if (!answer) answer = `**Slow responses (>3s)**: ${filtered.length}`
    filtered.sort((a, b) => b.latency_ms - a.latency_ms)
  }

  // Stops
  if (lower.includes('stop') || lower.includes('kill') || lower.includes('interrupt')) {
    filtered = filtered.filter(c => c.is_thank_you_interrupt)
    answer = `**Stop commands**: ${filtered.length} kill switch activations`
  }

  // Compare Hebrew vs English
  if (lower.includes(' vs ') || lower.includes('compare') || lower.includes('לעומת')) {
    if ((lower.includes('hebrew') || lower.includes('עברית')) && (lower.includes('english') || lower.includes('אנגלית'))) {
      const he = conversations.filter(c => c.language === 'he-IL')
      const en = conversations.filter(c => c.language === 'en-US')
      const heAvg = he.length ? Math.round(he.reduce((s, c) => s + c.latency_ms, 0) / he.length) : 0
      const enAvg = en.length ? Math.round(en.reduce((s, c) => s + c.latency_ms, 0) / en.length) : 0
      answer = `**Hebrew vs English** — ${conversations.length} total`
      stats.push(`🇮🇱 Hebrew: ${he.length} convos, avg ${formatLatency(heAvg)}`)
      stats.push(`🇺🇸 English: ${en.length} convos, avg ${formatLatency(enAvg)}`)
      filtered = []
    }
  }

  // Summary
  if (lower.includes('summary') || lower.includes('overview') || lower.includes('status') || lower.includes('סיכום')) {
    const avgLat = conversations.filter(c => c.latency_ms > 0).reduce((s, c) => s + c.latency_ms, 0) / (conversations.filter(c => c.latency_ms > 0).length || 1)
    const dates = [...new Set(conversations.map(c => c.date))].sort()
    answer = `**Dashboard Summary** — ${dates.length} days, ${conversations.length} conversations`
    stats.push(`📅 ${dates[0]} to ${dates[dates.length - 1]}`)
    stats.push(`⏱ Avg response: ${formatLatency(Math.round(avgLat))}`)
    stats.push(`⚠ ${conversations.filter(c => c.is_anomaly).length} problems`)
    stats.push(`⏹ ${conversations.filter(c => c.is_thank_you_interrupt).length} stop commands`)
    filtered = []
  }

  // Busiest hour
  if (lower.includes('busiest hour') || lower.includes('peak hour') || lower.includes('what time') || lower.includes('שעת שיא')) {
    const hourCounts: Record<number, number> = {}
    filtered.forEach(c => { hourCounts[c.hour] = (hourCounts[c.hour] || 0) + 1 })
    const sorted = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)
    answer = `**Busiest hours**`
    sorted.slice(0, 8).forEach(([hour, count]) => {
      const bar = '█'.repeat(Math.max(1, Math.round(count / filtered.length * 20)))
      stats.push(`${hour}:00 — ${count} conversations ${bar}`)
    })
    filtered = []
  }

  // Topic ranking
  if (lower.includes('top') || lower.includes('most') || lower.includes('ranking') || lower.includes('popular') || lower.includes('הכי')) {
    if (lower.includes('topic') || lower.includes('about') || lower.includes('ask') || lower.includes('נושא')) {
      const counts: Record<string, number> = {}
      filtered.forEach(c => { counts[c.topic] = (counts[c.topic] || 0) + 1 })
      const ranked = Object.entries(counts).sort(([, a], [, b]) => b - a)
      answer = `**Topic ranking** (${ranked.length} topics)`
      ranked.forEach(([topic, count], i) => {
        const pct = ((count / filtered.length) * 100).toFixed(0)
        stats.push(`${i + 1}. ${topic}: ${count} (${pct}%)`)
      })
      filtered = []
    }
  }

  // Text search fallback
  if (!answer) {
    const searchTerms = tokens.filter(t => t.length > 2)
    if (searchTerms.length > 0) {
      filtered = filtered.filter(c => {
        const text = `${c.question} ${c.answer} ${c.question_en || ''} ${c.answer_en || ''} ${c.topic}`.toLowerCase()
        return searchTerms.some(term => text.includes(term))
      })
      answer = `**"${searchTerms.join(', ')}"**: ${filtered.length} matching conversations`
    } else {
      answer = `I couldn't parse that. Try: "kashrut", "slow responses", "compare Hebrew vs English", "problems", "summary"`
      filtered = []
    }
  }

  // Enrich
  if (filtered.length > 0) {
    const langCounts: Record<string, number> = {}
    filtered.forEach(c => { langCounts[c.language] = (langCounts[c.language] || 0) + 1 })
    stats.push(`🗣 ${Object.entries(langCounts).map(([l, n]) => `${LANG_FLAGS[l] || '❓'} ${n}`).join(' · ')}`)
    const avgLat = filtered.filter(c => c.latency_ms > 0)
    if (avgLat.length > 0) {
      stats.push(`⏱ Avg: ${formatLatency(Math.round(avgLat.reduce((s, c) => s + c.latency_ms, 0) / avgLat.length))}`)
    }
  }

  return {
    question,
    answer,
    stats: stats.length > 0 ? stats : undefined,
    insights: insights.length > 0 ? insights : undefined,
    conversations: filtered.slice(0, 25),
    timestamp: Date.now(),
    source: 'local',
  }
}

// ══════════════════════════════════════════════════
// 4. SUGGESTED QUESTIONS
// ══════════════════════════════════════════════════
const SUGGESTED_QUESTIONS = [
  { label: 'Summary', query: 'Give me a summary of all the data' },
  { label: 'Top topics', query: 'What do visitors ask about most?' },
  { label: 'Problems', query: 'What problems or anomalies occurred?' },
  { label: 'Slowest', query: 'Which conversations had the slowest response times?' },
  { label: 'Hebrew vs English', query: 'Compare Hebrew vs English conversations' },
  { label: 'Interrupted', query: 'Which conversations got interrupted by stop commands?' },
  { label: 'Sensitive', query: 'Show me sensitive or critical conversations' },
  { label: 'Busiest hour', query: 'What is the busiest hour of the day?' },
]

// ══════════════════════════════════════════════════
// 5. RESULT CARD
// ══════════════════════════════════════════════════
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
        {c.thank_you_type === 'polite' && (
          <span className="text-xs font-semibold" style={{ color: '#4A8F6F' }} title="Hebrew 'תודה' — polite thanks, NOT a stop command">🙏</span>
        )}
        {c.is_anomaly && (
          <span className="text-critical cursor-help" title={`Problems: ${c.anomalies.join(', ')}`}>⚠</span>
        )}
        {c.sensitivity === 'critical' && (
          <span className="text-xs" title="Critical sensitivity">🔴</span>
        )}
        {c.sensitivity === 'high' && (
          <span className="text-xs" title="High sensitivity">🟠</span>
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

// ══════════════════════════════════════════════════
// 6. MAIN COMPONENT
// ══════════════════════════════════════════════════
export function AskTheData({ conversations }: AskTheDataProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const dataSummary = useMemo(() => buildDataSummary(conversations), [conversations])

  const handleAsk = useCallback(async (question: string) => {
    if (!question.trim() || isThinking) return
    setIsThinking(true)
    setQuery('')

    try {
      // Try LLM first if proxy URL is configured
      if (ASK_PROXY_URL) {
        try {
          const llmResult = await queryLLM(question, dataSummary)
          setAiAvailable(true)

          // Apply LLM-returned filters to get matching conversations
          const matchedConvos = applyLLMFilters(conversations, llmResult.filters)

          // Sort if specified
          if (llmResult.sort) {
            const dir = llmResult.sort.dir === 'desc' ? -1 : 1
            if (llmResult.sort.field === 'latency_ms') {
              matchedConvos.sort((a, b) => (a.latency_ms - b.latency_ms) * dir)
            }
          }

          const result: QueryResult = {
            question,
            answer: llmResult.answer,
            stats: llmResult.stats,
            insights: llmResult.insights?.filter(Boolean) || undefined,
            follow_ups: llmResult.follow_ups,
            conversations: matchedConvos.slice(0, 25),
            timestamp: Date.now(),
            source: 'ai',
          }
          setResults(prev => [result, ...prev])
          setIsThinking(false)
          return
        } catch (err) {
          console.warn('LLM proxy unavailable, falling back to local:', err)
          setAiAvailable(false)
        }
      }

      // Fallback to local ILR engine
      const result = localQuery(question, conversations)
      setResults(prev => [result, ...prev])
    } finally {
      setIsThinking(false)
    }
  }, [conversations, dataSummary, isThinking])

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
          Ask about {conversations.length} visitor conversations — topics, speed, problems, patterns, comparisons
        </p>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          {ASK_PROXY_URL ? (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border" style={{
              color: aiAvailable === false ? '#C75B3A' : '#C8A961',
              borderColor: aiAvailable === false ? '#C75B3A33' : '#C8A96133',
              backgroundColor: aiAvailable === false ? '#C75B3A0A' : '#C8A9610A',
            }}>
              <Brain size={12} />
              {aiAvailable === null ? 'AI-powered' : aiAvailable ? 'AI-powered' : 'AI unavailable — using local engine'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-parchment-dim/60 px-2 py-0.5 rounded-full border border-border/30">
              <Zap size={12} />
              Local engine
            </span>
          )}
        </div>
      </div>

      {/* Suggested questions */}
      <div className="flex flex-wrap gap-2 justify-center">
        {SUGGESTED_QUESTIONS.map(sq => (
          <button
            key={sq.label}
            onClick={() => handleAsk(sq.query)}
            disabled={isThinking}
            className="px-3 py-1.5 rounded-md text-sm border border-gold/20 text-gold/70 hover:text-gold hover:bg-gold/10 hover:border-gold/40 transition-all disabled:opacity-40"
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
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ASK_PROXY_URL ? 'Ask anything about the visitor data...' : 'Try: kashrut, slow responses, compare Hebrew vs English, summary...'}
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
        {results.map(result => (
          <div key={result.timestamp} className="space-y-3">
            {/* Question */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gold text-xs font-bold">Q</span>
              </div>
              <p className="text-parchment text-sm font-medium flex-1">{result.question}</p>
              <span className="text-xs text-parchment-dim/40 flex-shrink-0" title={result.source === 'ai' ? 'Answered by GPT-4o-mini' : 'Answered by local engine'}>
                {result.source === 'ai' ? '🧠' : '⚡'}
              </span>
            </div>

            {/* Answer + Stats */}
            <div className="ml-9 space-y-3">
              <p className="text-parchment text-sm leading-relaxed" dangerouslySetInnerHTML={{
                __html: result.answer
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gold">$1</strong>')
                  .replace(/\n/g, '<br />')
              }} />

              {/* Stats bullets */}
              {result.stats && result.stats.length > 0 && (
                <div className="bg-background/50 rounded-lg px-4 py-3 space-y-1">
                  {result.stats.map((stat, i) => (
                    <div key={i} className="text-sm text-parchment-dim flex items-start gap-2">
                      <span className="text-gold/40 mt-0.5">›</span>
                      <span dangerouslySetInnerHTML={{
                        __html: stat.replace(/\*\*(.+?)\*\*/g, '<strong class="text-parchment">$1</strong>')
                      }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Insights */}
              {result.insights && result.insights.length > 0 && (
                <div className="bg-gold/5 border border-gold/15 rounded-lg px-4 py-3 space-y-1">
                  {result.insights.map((insight, i) => (
                    <div key={i} className="text-sm text-gold flex items-start gap-2">
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Follow-up suggestions (AI only) */}
              {result.follow_ups && result.follow_ups.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.follow_ups.map((fu, i) => (
                    <button
                      key={i}
                      onClick={() => handleAsk(fu)}
                      disabled={isThinking}
                      className="px-2.5 py-1 rounded text-xs border border-gold/15 text-gold/60 hover:text-gold hover:bg-gold/10 hover:border-gold/30 transition-all disabled:opacity-40"
                    >
                      {fu}
                    </button>
                  ))}
                </div>
              )}

              {/* Conversation results */}
              {result.conversations.length > 0 && (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                  <div className="text-xs text-parchment-dim/50 mb-1">
                    {result.conversations.length} matching conversation{result.conversations.length !== 1 ? 's' : ''}
                  </div>
                  {result.conversations.map((c, i) => (
                    <ResultCard key={`${c.id}-${i}`} conversation={c} />
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
            {ASK_PROXY_URL
              ? 'Ask anything about the visitor data — powered by AI.'
              : 'Choose a suggested question, or type a topic name, keyword, or question.'}
          </p>
          <p className="text-text-dim/50 text-xs mt-2">
            {ASK_PROXY_URL
              ? 'Understands natural language, Hebrew, comparisons, and complex analytical questions.'
              : 'Supports: topics · dates · Hebrew · comparisons · latency · stops · FAQ detection'}
          </p>
        </div>
      )}
    </div>
  )
}
