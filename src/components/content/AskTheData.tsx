import { useState, useCallback, useRef, useMemo } from 'react'
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
  insights?: string[]
  conversations: Conversation[]
  timestamp: number
}

// ══════════════════════════════════════════════════
// 1. TOPIC ALIASES — comprehensive user-word → canonical topic
// ══════════════════════════════════════════════════
const TOPIC_ALIASES: Record<string, string> = {
  // Kashrut
  kashrut: 'Kashrut', kosher: 'Kashrut', kasher: 'Kashrut', meat: 'Kashrut',
  dairy: 'Kashrut', milk: 'Kashrut', food: 'Kashrut', diet: 'Kashrut',
  eating: 'Kashrut', 'waiting hours': 'Kashrut', כשרות: 'Kashrut',
  בשר: 'Kashrut', חלב: 'Kashrut', כשר: 'Kashrut',

  // Jewish Law
  halacha: 'Jewish Law', halakha: 'Jewish Law', halachic: 'Jewish Law',
  'jewish law': 'Jewish Law', law: 'Jewish Law', mitzvah: 'Jewish Law',
  mitzvot: 'Jewish Law', shabbat: 'Jewish Law', sabbath: 'Jewish Law',
  הלכה: 'Jewish Law', מצווה: 'Jewish Law', מצוות: 'Jewish Law', שבת: 'Jewish Law',
  'bava kamma': 'Jewish Law', 'bava metzia': 'Jewish Law', 'bava batra': 'Jewish Law',
  'shulchan aruch': 'Jewish Law',

  // Theology
  theology: 'Theology', god: 'Theology', divine: 'Theology', soul: 'Theology',
  faith: 'Theology', belief: 'Theology', creator: 'Theology', spiritual: 'Theology',
  אלוהים: 'Theology', נשמה: 'Theology', אמונה: 'Theology', תיאולוגיה: 'Theology',

  // Military & Draft
  military: 'Military & Draft', army: 'Military & Draft', draft: 'Military & Draft',
  haredi: 'Military & Draft', soldiers: 'Military & Draft', yeshiva: 'Military & Draft',
  'ultra-orthodox': 'Military & Draft', idf: 'Military & Draft',
  צבא: 'Military & Draft', גיוס: 'Military & Draft', חרדי: 'Military & Draft',
  חרדים: 'Military & Draft',

  // Torah & Text
  torah: 'Torah & Text', parsha: 'Torah & Text', bible: 'Torah & Text',
  scripture: 'Torah & Text', verse: 'Torah & Text', parashat: 'Torah & Text',
  genesis: 'Torah & Text', exodus: 'Torah & Text', talmud: 'Torah & Text',
  sanhedrin: 'Torah & Text', gemara: 'Torah & Text', mishna: 'Torah & Text',
  תורה: 'Torah & Text', תלמוד: 'Torah & Text', פרשת: 'Torah & Text',

  // Philosophy
  philosophy: 'Philosophy', ethics: 'Philosophy', wisdom: 'Philosophy',
  'meaning of life': 'Philosophy', tolerance: 'Philosophy', justice: 'Philosophy',
  moral: 'Philosophy', virtue: 'Philosophy', truth: 'Philosophy',
  'pirkei avot': 'Philosophy', חכמה: 'Philosophy', מוסר: 'Philosophy',

  // Meta
  hologram: 'Meta', robot: 'Meta', ai: 'Meta', technology: 'Meta',
  museum: 'Meta', exhibit: 'Meta', installation: 'Meta', artificial: 'Meta',
  מוזיאון: 'Meta', הולוגרמה: 'Meta',

  // Personal Life
  personal: 'Personal Life', children: 'Personal Life', education: 'Personal Life',
  medicine: 'Personal Life', health: 'Personal Life', family: 'Personal Life',
  advice: 'Personal Life', anger: 'Personal Life', doctor: 'Personal Life',
  חינוך: 'Personal Life', רפואה: 'Personal Life',

  // History
  egypt: 'History', spain: 'History', cordoba: 'History', biography: 'History',
  born: 'History', 'life story': 'History', historical: 'History',
  מצרים: 'History', ספרד: 'History', תולדות: 'History',

  // Interfaith
  interfaith: 'Interfaith', christian: 'Interfaith', islam: 'Interfaith',
  muslim: 'Interfaith', jesus: 'Interfaith', church: 'Interfaith',
  mosque: 'Interfaith', religion: 'Interfaith',
  נצרות: 'Interfaith', ישו: 'Interfaith', מוסלמי: 'Interfaith',

  // Greetings
  greeting: 'Greetings', hello: 'Greetings', 'good morning': 'Greetings',
  shalom: 'Greetings', שלום: 'Greetings', 'בוקר טוב': 'Greetings',

  // Relationships
  love: 'Relationships', marriage: 'Relationships', relationship: 'Relationships',
  couple: 'Relationships', dating: 'Relationships', spouse: 'Relationships',
  אהבה: 'Relationships', נישואין: 'Relationships', זוגיות: 'Relationships',

  // Blessings
  blessing: 'Blessings', prayer: 'Blessings', pray: 'Blessings', bless: 'Blessings',
  ברכה: 'Blessings', תפילה: 'Blessings',

  // Daily Life
  coffee: 'Daily Life', sleep: 'Daily Life', routine: 'Daily Life',
  morning: 'Daily Life', breakfast: 'Daily Life', wash: 'Daily Life',
  tea: 'Daily Life', קפה: 'Daily Life',

  // General
  general: 'General',
}

// ══════════════════════════════════════════════════
// 2. INTERMEDIATE LOGICAL REPRESENTATION (ILR)
// ══════════════════════════════════════════════════
interface ILR {
  filters: {
    topics?: string[]
    languages?: string[]
    date_exact?: string
    date_range?: { start: string; end: string }
    latency_op?: '>' | '<' | 'between'
    latency_val?: number
    latency_val2?: number
    sensitivity?: string[]
    hour_range?: { start: number; end: number }
    is_anomaly?: boolean
    is_stop?: boolean
    is_greeting?: boolean
    is_no_answer?: boolean
    is_comprehension_failure?: boolean
    is_out_of_order?: boolean
    vip_only?: boolean
  }
  mode: 'list' | 'aggregate' | 'compare' | 'summary' | 'rank' | 'faq' | 'opening_analysis' | 'busiest_hour' | 'busiest_day'
  compare_dimension?: string // 'language' | 'topic' | 'date'
  compare_a?: string
  compare_b?: string
  sort?: { field: string; dir: 'asc' | 'desc' }
  text_search?: string[]
  limit?: number
}

// ══════════════════════════════════════════════════
// 3. DATE RESOLVER
// ══════════════════════════════════════════════════
function resolveDate(token: string, allDates: string[]): { exact?: string; range?: { start: string; end: string } } | null {
  const sorted = [...allDates].sort()
  const latest = sorted[sorted.length - 1]
  const earliest = sorted[0]

  // ISO date: 2026-02-22
  if (/^\d{4}-\d{2}-\d{2}$/.test(token)) return { exact: token }

  // Short date: 02-22 or 02/22
  const shortMatch = token.match(/^(\d{1,2})[/-](\d{1,2})$/)
  if (shortMatch) {
    const m = shortMatch[1].padStart(2, '0')
    const d = shortMatch[2].padStart(2, '0')
    const year = latest.slice(0, 4)
    return { exact: `${year}-${m}-${d}` }
  }

  // "feb 22", "february 22"
  const monthNames: Record<string, string> = {
    jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
    apr: '04', april: '04', may: '05', jun: '06', june: '06',
    jul: '07', july: '07', aug: '08', august: '08', sep: '09', september: '09',
    oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12',
    // Hebrew months
    ינואר: '01', פברואר: '02', מרס: '03', אפריל: '04', מאי: '05', יוני: '06',
    יולי: '07', אוגוסט: '08', ספטמבר: '09', אוקטובר: '10', נובמבר: '11', דצמבר: '12',
  }
  const monthDayMatch = token.match(/^(\w+)\s+(\d{1,2})$/)
  if (monthDayMatch) {
    const month = monthNames[monthDayMatch[1].toLowerCase()]
    if (month) {
      const day = monthDayMatch[2].padStart(2, '0')
      const year = latest.slice(0, 4)
      return { exact: `${year}-${month}-${day}` }
    }
  }

  // Relative words
  const low = token.toLowerCase()
  if (low === 'today' || low === 'היום') {
    // Use latest available date as "today"
    return { exact: latest }
  }
  if (low === 'yesterday' || low === 'אתמול') {
    const d = new Date(latest)
    d.setDate(d.getDate() - 1)
    const iso = d.toISOString().slice(0, 10)
    return sorted.includes(iso) ? { exact: iso } : { exact: sorted[sorted.length - 2] || latest }
  }
  if (low === 'last day' || low === 'most recent' || low === 'האחרון' || low === 'אחרון') {
    return { exact: latest }
  }
  if (low === 'first day' || low === 'ראשון') {
    return { exact: earliest }
  }
  if (low === 'this week' || low === 'השבוע') {
    const d = new Date(latest)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    return { range: { start: weekStart.toISOString().slice(0, 10), end: latest } }
  }
  if (low === 'last week' || low === 'שבוע שעבר') {
    const d = new Date(latest)
    const weekEnd = new Date(d)
    weekEnd.setDate(d.getDate() - d.getDay() - 1)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    return { range: { start: weekStart.toISOString().slice(0, 10), end: weekEnd.toISOString().slice(0, 10) } }
  }

  return null
}

// ══════════════════════════════════════════════════
// 4. TOKENIZER + ALIAS MAPPER + ILR BUILDER
// ══════════════════════════════════════════════════
const STOP_WORDS = new Set([
  'what', 'which', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were',
  'do', 'does', 'did', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'about', 'show', 'me', 'all', 'find', 'get', 'list',
  'display', 'tell', 'give', 'can', 'you', 'conversations', 'questions', 'that',
  'have', 'had', 'this', 'those', 'these', 'it', 'they', 'them', 'been', 'be',
  'not', 'and', 'or', 'but', 'if', 'any', 'some', 'trigger', 'cause', 'caused',
  'make', 'made', 'there', 'than', 'i', 'my', 'we', 'our', 'your',
  // Hebrew stop words
  'מה', 'איך', 'למה', 'איפה', 'מתי', 'את', 'של', 'על', 'עם', 'בין', 'כל', 'הוא',
  'היא', 'הם', 'הן', 'אני', 'אנחנו', 'שלי', 'שלך',
])

function buildILR(rawQuery: string, allDates: string[]): ILR {
  const q = rawQuery.replace(/[?!.,;:]/g, ' ').trim()
  const lower = q.toLowerCase()
  const tokens = lower.split(/\s+/).filter(Boolean)

  const ilr: ILR = { filters: {}, mode: 'list' }

  // ── Multi-word phrase matching (check before single tokens) ──

  // Topic aliases: try longest match first (multi-word aliases)
  const multiWordAliases = Object.keys(TOPIC_ALIASES).filter(k => k.includes(' ')).sort((a, b) => b.length - a.length)
  const resolvedTopics = new Set<string>()
  for (const alias of multiWordAliases) {
    if (lower.includes(alias)) {
      resolvedTopics.add(TOPIC_ALIASES[alias])
    }
  }
  // Single-word topic aliases
  for (const token of tokens) {
    if (TOPIC_ALIASES[token]) {
      resolvedTopics.add(TOPIC_ALIASES[token])
    }
  }

  // ── Comparison detection ──
  const isComparison = lower.includes(' vs ') || lower.includes(' versus ') || lower.includes('לעומת')
    || lower.includes('compare') || lower.includes('השוואה')

  if (isComparison) {
    ilr.mode = 'compare'

    // "Hebrew vs English" or "English vs Hebrew"
    if ((lower.includes('hebrew') || lower.includes('עברית')) && (lower.includes('english') || lower.includes('אנגלית'))) {
      ilr.compare_dimension = 'language'
      ilr.compare_a = 'he-IL'
      ilr.compare_b = 'en-US'
    }
    // "morning vs afternoon" / "בוקר לעומת צהריים"
    else if ((lower.includes('morning') || lower.includes('בוקר')) && (lower.includes('afternoon') || lower.includes('צהריים') || lower.includes('evening') || lower.includes('ערב'))) {
      ilr.compare_dimension = 'time_of_day'
      ilr.compare_a = 'morning'
      ilr.compare_b = 'afternoon'
    }
    // "weekday vs weekend" / "חול לעומת שבת"
    else if (lower.includes('weekday') || lower.includes('weekend') || lower.includes('שבת')) {
      ilr.compare_dimension = 'day_type'
      ilr.compare_a = 'weekday'
      ilr.compare_b = 'weekend'
    }
    // Two topics
    else if (resolvedTopics.size === 2) {
      const topicArr = [...resolvedTopics]
      ilr.compare_dimension = 'topic'
      ilr.compare_a = topicArr[0]
      ilr.compare_b = topicArr[1]
    }
    // Two dates
    else {
      const dateTokens: string[] = []
      // Try to find date pairs like "feb 15 vs feb 24"
      const dateRegex = /(\w+\s+\d{1,2}|\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2})/g
      let m
      while ((m = dateRegex.exec(lower)) !== null) {
        const resolved = resolveDate(m[1], allDates)
        if (resolved?.exact) dateTokens.push(resolved.exact)
      }
      if (dateTokens.length >= 2) {
        ilr.compare_dimension = 'date'
        ilr.compare_a = dateTokens[0]
        ilr.compare_b = dateTokens[1]
      }
    }
  }

  // ── Topic filter (if not a comparison between two topics) ──
  if (resolvedTopics.size > 0 && !(ilr.mode === 'compare' && ilr.compare_dimension === 'topic')) {
    ilr.filters.topics = [...resolvedTopics]
  }

  // ── Language filter ──
  if (!isComparison || ilr.compare_dimension !== 'language') {
    if (lower.includes('hebrew') || lower.includes('עברית')) ilr.filters.languages = ['he-IL']
    else if (lower.includes('english') || lower.includes('אנגלית')) ilr.filters.languages = ['en-US']
    else if (lower.includes('unknown') || lower.includes('לא ידועה') || lower.includes('russian') || lower.includes('arabic') || lower.includes('רוסית') || lower.includes('ערבית')) ilr.filters.languages = ['unknown']
  }

  // ── Date resolution ──
  // Try full query first for phrases like "feb 22"
  const dateResult = resolveDate(lower, allDates)
  if (dateResult?.exact) {
    ilr.filters.date_exact = dateResult.exact
  } else if (dateResult?.range) {
    ilr.filters.date_range = dateResult.range
  } else {
    // Try individual tokens and multi-token combos
    for (let i = 0; i < tokens.length; i++) {
      const single = resolveDate(tokens[i], allDates)
      if (single?.exact) { ilr.filters.date_exact = single.exact; break }
      if (single?.range) { ilr.filters.date_range = single.range; break }
      // Try two-token combo: "feb 22"
      if (i < tokens.length - 1) {
        const combo = resolveDate(`${tokens[i]} ${tokens[i + 1]}`, allDates)
        if (combo?.exact) { ilr.filters.date_exact = combo.exact; break }
        if (combo?.range) { ilr.filters.date_range = combo.range; break }
      }
    }
  }

  // ── Latency intent ──
  const slowWords = ['slow', 'long', 'latency', 'delay', 'wait', 'timeout', 'spike', 'sluggish', 'איטי', 'לאט', 'איטיות']
  const fastWords = ['fast', 'quick', 'instant', 'responsive', 'snappy', 'fastest', 'מהיר']
  if (slowWords.some(w => lower.includes(w))) {
    ilr.filters.latency_op = '>'
    ilr.filters.latency_val = 3000
  } else if (fastWords.some(w => lower.includes(w))) {
    ilr.filters.latency_op = '<'
    ilr.filters.latency_val = 2000
  }
  // "slowest" or "longest" → sort desc
  if (lower.includes('slowest') || lower.includes('longest') || lower.includes('worst') || lower.includes('הכי איטי')) {
    ilr.sort = { field: 'latency_ms', dir: 'desc' }
  } else if (lower.includes('fastest') || lower.includes('הכי מהיר')) {
    ilr.sort = { field: 'latency_ms', dir: 'asc' }
  }

  // ── "Which topics are slowest?" → special aggregation ──
  if (lower.includes('topic') && (lower.includes('slow') || lower.includes('fast') || lower.includes('latency') || lower.includes('speed'))) {
    ilr.mode = 'aggregate'
  }

  // ── Anomaly / problems ──
  const anomalyWords = ['anomal', 'problem', 'error', 'issue', 'bug', 'broken', 'failed', 'failure', 'wrong', 'בעיות', 'בעיה', 'תקלה', 'שגיאה']
  if (anomalyWords.some(w => lower.includes(w))) ilr.filters.is_anomaly = true

  // ── Comprehension failures ──
  if (lower.includes('understand') || lower.includes('comprehen') || lower.includes('confus') || lower.includes('rephrase') || lower.includes("didn't get") || lower.includes('הבין') || lower.includes('לא הבין')) {
    ilr.filters.is_comprehension_failure = true
  }

  // ── Stop commands ──
  const stopWords2 = ['stop', 'kill', 'interrupt', 'cut off', 'הפסק', 'עצר', 'עצירה']
  if (stopWords2.some(w => lower.includes(w)) || (lower.includes('thank you') && (lower.includes('stop') || lower.includes('command') || lower.includes('trigger')))) {
    ilr.filters.is_stop = true
  }

  // ── Sensitivity ──
  if (lower.includes('sensitiv') || lower.includes('critical') || lower.includes('controversial') || lower.includes('political') || lower.includes('danger') || lower.includes('רגיש') || lower.includes('מסוכן')) {
    ilr.filters.sensitivity = ['high', 'critical']
  }

  // ── No answer ──
  if (lower.includes('no answer') || lower.includes('unanswered') || lower.includes('empty') || lower.includes('blank') || lower.includes("didn't answer") || lower.includes('ללא מענה') || lower.includes('לא ענה')) {
    ilr.filters.is_no_answer = true
  }

  // ── VIP ──
  if (lower.includes('vip') || lower.includes('notable') || lower.includes('special visitor') || lower.includes('אורח מיוחד')) {
    ilr.filters.vip_only = true
  }

  // ── Greetings ──
  if (lower.includes('greeting') && !resolvedTopics.has('Greetings')) {
    ilr.filters.is_greeting = true
  }

  // ── Out of order ──
  if (lower.includes('out of order') || lower.includes('out-of-order')) {
    ilr.filters.is_out_of_order = true
  }

  // ── Time of day ──
  if (!isComparison) {
    if (lower.includes('morning') || lower.includes('בוקר')) {
      ilr.filters.hour_range = { start: 6, end: 12 }
    } else if (lower.includes('afternoon') || lower.includes('צהריים')) {
      ilr.filters.hour_range = { start: 12, end: 17 }
    } else if (lower.includes('evening') || lower.includes('ערב')) {
      ilr.filters.hour_range = { start: 17, end: 23 }
    }
  }

  // ── Mode detection ──

  // FAQ / repeated
  const faqWords = ['faq', 'repeated', 'most asked', 'most common question', 'frequent question', 'keeps getting asked', 'שאלה נפוצה', 'הכי נפוץ']
  if (faqWords.some(w => lower.includes(w))) {
    ilr.mode = 'faq'
  }

  // Ranking / top
  const rankWords = ['most', 'top', 'popular', 'ranking', 'breakdown', 'distribution', 'common', 'frequent', 'הכי', 'נפוץ', 'דירוג']
  if (ilr.mode === 'list' && rankWords.some(w => lower.includes(w))) {
    // Check if it's about topics specifically
    if (lower.includes('topic') || lower.includes('about') || lower.includes('נושא')) {
      ilr.mode = 'rank'
    }
  }

  // Busiest hour
  if (lower.includes('busiest hour') || lower.includes('peak hour') || lower.includes('what time') || lower.includes('when do') || lower.includes('שעת שיא') || lower.includes('באיזו שעה')) {
    ilr.mode = 'busiest_hour'
  }
  // Busiest day
  else if (lower.includes('busiest') || lower.includes('peak day') || lower.includes('most questions') || lower.includes('volume') || lower.includes('יום עמוס')) {
    ilr.mode = 'busiest_day'
  }

  // Summary / overview
  const summaryWords = ['summary', 'overview', 'status', 'report', 'how is it', 'tell me about', 'סיכום', 'סטטוס']
  if (summaryWords.some(w => lower.includes(w))) {
    ilr.mode = 'summary'
  }

  // Opening sentence analysis
  if (lower.includes('opening') || lower.includes('intro') || lower.includes('audio') || lower.includes('פתיחה')) {
    ilr.mode = 'opening_analysis'
  }

  // "Average latency" / "seamless rate" / "failure rate" → aggregate
  if (lower.includes('average') || lower.includes('avg') || lower.includes('rate') || lower.includes('percentage') || lower.includes('ממוצע') || lower.includes('אחוז')) {
    if (ilr.mode === 'list') ilr.mode = 'aggregate'
  }

  // "How many" → aggregate count
  if (lower.includes('how many') || lower.includes('total') || lower.includes('count') || lower.includes('כמה')) {
    if (ilr.mode === 'list') ilr.mode = 'aggregate'
  }

  // ── Text search fallback ──
  // If we have no filters and no special mode, treat as text search
  const hasFilters = Object.keys(ilr.filters).length > 0
  const hasSpecialMode = ilr.mode !== 'list'
  if (!hasFilters && !hasSpecialMode && !isComparison) {
    const searchTerms = tokens.filter(t => t.length > 2 && !STOP_WORDS.has(t))
    if (searchTerms.length > 0) {
      ilr.text_search = searchTerms
    }
  }

  return ilr
}

// ══════════════════════════════════════════════════
// 5. ENRICHMENT: contextual stats for any result set
// ══════════════════════════════════════════════════
function enrichResults(filtered: Conversation[], all: Conversation[]): string[] {
  if (filtered.length === 0) return []
  const stats: string[] = []

  // Date span
  const dates = [...new Set(filtered.map(c => c.date))].sort()
  if (dates.length > 1) {
    stats.push(`📅 Across ${dates.length} days (${dates[0]} to ${dates[dates.length - 1]})`)
  } else if (dates.length === 1) {
    stats.push(`📅 From ${dates[0]}`)
  }

  // Language split
  const langCounts: Record<string, number> = {}
  filtered.forEach(c => { langCounts[c.language] = (langCounts[c.language] || 0) + 1 })
  const langStr = Object.entries(langCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([l, n]) => `${LANG_FLAGS[l] || '❓'} ${n}`)
    .join(' · ')
  stats.push(`🗣 ${langStr}`)

  // Avg latency
  const withLatency = filtered.filter(c => c.latency_ms > 0)
  if (withLatency.length > 0) {
    const avg = Math.round(withLatency.reduce((s, c) => s + c.latency_ms, 0) / withLatency.length)
    stats.push(`⏱ Avg response: ${formatLatency(avg)}`)
  }

  // Anomaly count
  const anomCount = filtered.filter(c => c.is_anomaly).length
  if (anomCount > 0) {
    const rate = ((anomCount / filtered.length) * 100).toFixed(0)
    stats.push(`⚠ ${anomCount} problems (${rate}% failure rate)`)
  }

  // Stop command count
  const stopCount = filtered.filter(c => c.is_thank_you_interrupt).length
  if (stopCount > 0) {
    stats.push(`⏹ ${stopCount} interrupted by stop command`)
  }

  // Top repeated question
  const questionCounts: Record<string, number> = {}
  filtered.forEach(c => {
    const key = (c.question_en || c.question).toLowerCase().trim().slice(0, 80)
    questionCounts[key] = (questionCounts[key] || 0) + 1
  })
  const topRepeated = Object.entries(questionCounts).filter(([, n]) => n >= 2).sort(([, a], [, b]) => b - a)
  if (topRepeated.length > 0) {
    const [q, n] = topRepeated[0]
    stats.push(`🔄 "${q}" asked ${n}×`)
  }

  // Comparative rank (if topic filtered)
  const topics = [...new Set(filtered.map(c => c.topic))]
  if (topics.length === 1) {
    const allTopicCounts: Record<string, number> = {}
    all.forEach(c => { allTopicCounts[c.topic] = (allTopicCounts[c.topic] || 0) + 1 })
    const ranked = Object.entries(allTopicCounts).sort(([, a], [, b]) => b - a)
    const rank = ranked.findIndex(([t]) => t === topics[0]) + 1
    if (rank > 0) {
      const pct = ((filtered.length / all.length) * 100).toFixed(0)
      stats.push(`📊 Ranked #${rank} of ${ranked.length} topics (${pct}% of all)`)
    }
  }

  return stats
}

// ══════════════════════════════════════════════════
// 6. INSIGHT DETECTION: auto-surface patterns
// ══════════════════════════════════════════════════
function detectInsights(filtered: Conversation[], all: Conversation[]): string[] {
  if (filtered.length < 3) return []
  const insights: string[] = []

  // High anomaly rate in result set vs overall
  const filteredAnomalyRate = filtered.filter(c => c.is_anomaly).length / filtered.length
  const overallAnomalyRate = all.filter(c => c.is_anomaly).length / all.length
  if (filteredAnomalyRate > overallAnomalyRate * 1.5 && filteredAnomalyRate > 0.1) {
    insights.push(`💡 This subset has ${(filteredAnomalyRate * 100).toFixed(0)}% problems vs ${(overallAnomalyRate * 100).toFixed(0)}% overall — something may be off.`)
  }

  // High latency in result set
  const withLatency = filtered.filter(c => c.latency_ms > 0)
  if (withLatency.length >= 3) {
    const avg = withLatency.reduce((s, c) => s + c.latency_ms, 0) / withLatency.length
    const overallAvg = all.filter(c => c.latency_ms > 0).reduce((s, c) => s + c.latency_ms, 0) / all.filter(c => c.latency_ms > 0).length
    if (avg > overallAvg * 1.3) {
      insights.push(`💡 These conversations average ${formatLatency(Math.round(avg))} — ${((avg / overallAvg - 1) * 100).toFixed(0)}% slower than normal.`)
    }
  }

  // Many stops in subset
  const stopRate = filtered.filter(c => c.is_thank_you_interrupt).length / filtered.length
  if (stopRate > 0.2 && filtered.filter(c => c.is_thank_you_interrupt).length >= 2) {
    insights.push(`💡 ${(stopRate * 100).toFixed(0)}% of these conversations were stopped — higher than expected.`)
  }

  return insights
}

// ══════════════════════════════════════════════════
// 7. QUERY EXECUTOR: ILR → filtered results + answer
// ══════════════════════════════════════════════════
function executeQuery(question: string, ilr: ILR, conversations: Conversation[]): QueryResult {
  let filtered = [...conversations]
  const answers: string[] = []
  const allDates = [...new Set(conversations.map(c => c.date))].sort()

  // ── Apply filters ──
  if (ilr.filters.topics?.length) {
    filtered = filtered.filter(c => ilr.filters.topics!.includes(c.topic))
  }
  if (ilr.filters.languages?.length) {
    filtered = filtered.filter(c => ilr.filters.languages!.includes(c.language))
  }
  if (ilr.filters.date_exact) {
    filtered = filtered.filter(c => c.date === ilr.filters.date_exact)
  }
  if (ilr.filters.date_range) {
    filtered = filtered.filter(c => c.date >= ilr.filters.date_range!.start && c.date <= ilr.filters.date_range!.end)
  }
  if (ilr.filters.latency_op === '>') {
    filtered = filtered.filter(c => c.latency_ms > (ilr.filters.latency_val || 0))
  } else if (ilr.filters.latency_op === '<') {
    filtered = filtered.filter(c => c.latency_ms > 0 && c.latency_ms < (ilr.filters.latency_val || Infinity))
  }
  if (ilr.filters.sensitivity?.length) {
    filtered = filtered.filter(c => ilr.filters.sensitivity!.includes(c.sensitivity))
  }
  if (ilr.filters.hour_range) {
    filtered = filtered.filter(c => c.hour >= ilr.filters.hour_range!.start && c.hour < ilr.filters.hour_range!.end)
  }
  if (ilr.filters.is_anomaly) {
    filtered = filtered.filter(c => c.is_anomaly)
  }
  if (ilr.filters.is_stop) {
    filtered = filtered.filter(c => c.is_thank_you_interrupt)
  }
  if (ilr.filters.is_greeting) {
    filtered = filtered.filter(c => c.is_greeting)
  }
  if (ilr.filters.is_no_answer) {
    filtered = filtered.filter(c => c.is_no_answer)
  }
  if (ilr.filters.is_comprehension_failure) {
    filtered = filtered.filter(c => c.is_comprehension_failure || c.is_no_answer)
  }
  if (ilr.filters.is_out_of_order) {
    filtered = filtered.filter(c => c.is_out_of_order)
  }
  if (ilr.filters.vip_only) {
    filtered = filtered.filter(c => c.vip)
  }

  // ── Text search ──
  if (ilr.text_search?.length) {
    const matchIds = new Set<string>()
    for (const term of ilr.text_search) {
      for (const c of filtered) {
        if (
          c.question.toLowerCase().includes(term) ||
          c.answer.toLowerCase().includes(term) ||
          (c.question_en && c.question_en.toLowerCase().includes(term)) ||
          (c.answer_en && c.answer_en.toLowerCase().includes(term)) ||
          c.topic.toLowerCase().includes(term) ||
          (c.opening_text && c.opening_text.toLowerCase().includes(term))
        ) {
          matchIds.add(c.id)
        }
      }
    }
    filtered = filtered.filter(c => matchIds.has(c.id))
  }

  // ── Sort ──
  if (ilr.sort) {
    const dir = ilr.sort.dir === 'desc' ? -1 : 1
    if (ilr.sort.field === 'latency_ms') {
      filtered.sort((a, b) => (a.latency_ms - b.latency_ms) * dir)
    } else if (ilr.sort.field === 'answer_length') {
      filtered.sort((a, b) => (a.answer_length - b.answer_length) * dir)
    }
  }

  // ── Mode-specific processing ──
  const stats: string[] = []
  const insights: string[] = []

  switch (ilr.mode) {
    case 'compare': {
      if (ilr.compare_dimension === 'language') {
        const he = conversations.filter(c => c.language === 'he-IL')
        const en = conversations.filter(c => c.language === 'en-US')
        const unk = conversations.filter(c => c.language === 'unknown')
        const heAvg = he.length ? Math.round(he.reduce((s, c) => s + c.latency_ms, 0) / he.length) : 0
        const enAvg = en.length ? Math.round(en.reduce((s, c) => s + c.latency_ms, 0) / en.length) : 0
        const heAnom = he.filter(c => c.is_anomaly).length
        const enAnom = en.filter(c => c.is_anomaly).length
        const heStop = he.filter(c => c.is_thank_you_interrupt).length
        const enStop = en.filter(c => c.is_thank_you_interrupt).length
        const heTopics = [...new Set(he.map(c => c.topic))].length
        const enTopics = [...new Set(en.map(c => c.topic))].length

        answers.push(`**Hebrew vs English** — ${conversations.length} total conversations`)
        stats.push(`🇮🇱 **Hebrew**: ${he.length} conversations, ${heTopics} topics, avg ${formatLatency(heAvg)}, ${heAnom} problems, ${heStop} stops`)
        stats.push(`🇺🇸 **English**: ${en.length} conversations, ${enTopics} topics, avg ${formatLatency(enAvg)}, ${enAnom} problems, ${enStop} stops`)
        if (unk.length > 0) stats.push(`❓ **Unknown**: ${unk.length} (likely Russian/Arabic — language not detected)`)

        if (heAvg !== enAvg) {
          const faster = heAvg < enAvg ? 'Hebrew' : 'English'
          const diff = Math.abs(heAvg - enAvg)
          insights.push(`💡 ${faster} is ${formatLatency(diff)} faster on average.`)
        }

        // Top topics per language
        const heTopicCounts: Record<string, number> = {}
        he.forEach(c => { heTopicCounts[c.topic] = (heTopicCounts[c.topic] || 0) + 1 })
        const enTopicCounts: Record<string, number> = {}
        en.forEach(c => { enTopicCounts[c.topic] = (enTopicCounts[c.topic] || 0) + 1 })
        const heTop3 = Object.entries(heTopicCounts).sort(([, a], [, b]) => b - a).slice(0, 3)
        const enTop3 = Object.entries(enTopicCounts).sort(([, a], [, b]) => b - a).slice(0, 3)
        stats.push(`🇮🇱 Top Hebrew topics: ${heTop3.map(([t, n]) => `${t} (${n})`).join(', ')}`)
        stats.push(`🇺🇸 Top English topics: ${enTop3.map(([t, n]) => `${t} (${n})`).join(', ')}`)

        filtered = [] // comparison doesn't show cards
      }
      else if (ilr.compare_dimension === 'topic' && ilr.compare_a && ilr.compare_b) {
        const a = conversations.filter(c => c.topic === ilr.compare_a)
        const b = conversations.filter(c => c.topic === ilr.compare_b)
        const aAvg = a.length ? Math.round(a.reduce((s, c) => s + c.latency_ms, 0) / a.length) : 0
        const bAvg = b.length ? Math.round(b.reduce((s, c) => s + c.latency_ms, 0) / b.length) : 0

        answers.push(`**${ilr.compare_a} vs ${ilr.compare_b}**`)
        stats.push(`**${ilr.compare_a}**: ${a.length} conversations, avg ${formatLatency(aAvg)}, ${a.filter(c => c.is_anomaly).length} problems`)
        stats.push(`**${ilr.compare_b}**: ${b.length} conversations, avg ${formatLatency(bAvg)}, ${b.filter(c => c.is_anomaly).length} problems`)

        const aLangs: Record<string, number> = {}
        a.forEach(c => { aLangs[c.language] = (aLangs[c.language] || 0) + 1 })
        const bLangs: Record<string, number> = {}
        b.forEach(c => { bLangs[c.language] = (bLangs[c.language] || 0) + 1 })
        stats.push(`${ilr.compare_a} languages: ${Object.entries(aLangs).map(([l, n]) => `${LANG_FLAGS[l] || '❓'} ${n}`).join(', ')}`)
        stats.push(`${ilr.compare_b} languages: ${Object.entries(bLangs).map(([l, n]) => `${LANG_FLAGS[l] || '❓'} ${n}`).join(', ')}`)

        filtered = [] // comparison doesn't show cards
      }
      else if (ilr.compare_dimension === 'time_of_day') {
        const morning = conversations.filter(c => c.hour >= 6 && c.hour < 12)
        const afternoon = conversations.filter(c => c.hour >= 12 && c.hour < 23)
        const mAvg = morning.length ? Math.round(morning.reduce((s, c) => s + c.latency_ms, 0) / morning.length) : 0
        const aAvg = afternoon.length ? Math.round(afternoon.reduce((s, c) => s + c.latency_ms, 0) / afternoon.length) : 0

        answers.push(`**Morning vs Afternoon**`)
        stats.push(`🌅 **Morning (6:00-12:00)**: ${morning.length} conversations, avg ${formatLatency(mAvg)}, ${morning.filter(c => c.is_anomaly).length} problems`)
        stats.push(`🌇 **Afternoon (12:00-23:00)**: ${afternoon.length} conversations, avg ${formatLatency(aAvg)}, ${afternoon.filter(c => c.is_anomaly).length} problems`)
        filtered = []
      }
      else if (ilr.compare_dimension === 'day_type') {
        const weekend = conversations.filter(c => {
          const d = new Date(c.date)
          return d.getDay() === 0 || d.getDay() === 6
        })
        const weekday = conversations.filter(c => {
          const d = new Date(c.date)
          return d.getDay() >= 1 && d.getDay() <= 5
        })
        const wkAvg = weekday.length ? Math.round(weekday.reduce((s, c) => s + c.latency_ms, 0) / weekday.length) : 0
        const weAvg = weekend.length ? Math.round(weekend.reduce((s, c) => s + c.latency_ms, 0) / weekend.length) : 0

        answers.push(`**Weekday vs Weekend**`)
        stats.push(`📋 **Weekdays**: ${weekday.length} conversations, avg ${formatLatency(wkAvg)}`)
        stats.push(`🏖 **Weekend**: ${weekend.length} conversations, avg ${formatLatency(weAvg)}`)
        filtered = []
      }
      else if (ilr.compare_dimension === 'date' && ilr.compare_a && ilr.compare_b) {
        const a = conversations.filter(c => c.date === ilr.compare_a)
        const b = conversations.filter(c => c.date === ilr.compare_b)
        const aAvg = a.length ? Math.round(a.reduce((s, c) => s + c.latency_ms, 0) / a.length) : 0
        const bAvg = b.length ? Math.round(b.reduce((s, c) => s + c.latency_ms, 0) / b.length) : 0

        answers.push(`**${ilr.compare_a} vs ${ilr.compare_b}**`)
        stats.push(`**${ilr.compare_a}**: ${a.length} conversations, avg ${formatLatency(aAvg)}, ${a.filter(c => c.is_anomaly).length} problems`)
        stats.push(`**${ilr.compare_b}**: ${b.length} conversations, avg ${formatLatency(bAvg)}, ${b.filter(c => c.is_anomaly).length} problems`)
        filtered = []
      }
      break
    }

    case 'faq': {
      // Find repeated questions
      const questionMap: Record<string, { count: number; examples: Conversation[] }> = {}
      filtered.forEach(c => {
        const key = (c.question_en || c.question).toLowerCase().trim().replace(/[?!.,;:]/g, '').slice(0, 100)
        if (!questionMap[key]) questionMap[key] = { count: 0, examples: [] }
        questionMap[key].count++
        if (questionMap[key].examples.length < 2) questionMap[key].examples.push(c)
      })
      const repeated = Object.entries(questionMap)
        .filter(([, v]) => v.count >= 2)
        .sort(([, a], [, b]) => b.count - a.count)

      if (repeated.length === 0) {
        answers.push(`**No repeated questions found** — all ${filtered.length} questions are unique.`)
        filtered = []
      } else {
        answers.push(`**Top repeated questions** (asked 2+ times)`)
        repeated.slice(0, 8).forEach(([q, v], i) => {
          stats.push(`${i + 1}. **"${q}"** — asked ${v.count}×`)
        })
        // Show example conversations for top repeated question
        filtered = repeated.slice(0, 5).flatMap(([, v]) => v.examples)
      }
      break
    }

    case 'rank': {
      const counts: Record<string, number> = {}
      filtered.forEach(c => { counts[c.topic] = (counts[c.topic] || 0) + 1 })
      const ranked = Object.entries(counts).sort(([, a], [, b]) => b - a)

      answers.push(`**Topic ranking** (${ranked.length} topics, ${filtered.length} conversations)`)
      ranked.forEach(([topic, count], i) => {
        const pct = ((count / filtered.length) * 100).toFixed(0)
        const bar = '█'.repeat(Math.max(1, Math.round(count / filtered.length * 20)))
        stats.push(`${i + 1}. ${topic}: ${count} (${pct}%) ${bar}`)
      })
      filtered = [] // ranking doesn't need cards
      break
    }

    case 'busiest_hour': {
      const hourCounts: Record<number, number> = {}
      filtered.forEach(c => { hourCounts[c.hour] = (hourCounts[c.hour] || 0) + 1 })
      const sorted = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)

      answers.push(`**Busiest hours** across ${allDates.length} days`)
      sorted.slice(0, 10).forEach(([hour, count]) => {
        const bar = '█'.repeat(Math.max(1, Math.round(count / filtered.length * 20)))
        stats.push(`${hour}:00 — ${count} conversations ${bar}`)
      })

      if (sorted.length > 0) {
        const [peakHour] = sorted[0]
        insights.push(`💡 Peak activity at ${peakHour}:00 — likely matches tour schedule.`)
      }
      filtered = [] // hourly chart doesn't need cards
      break
    }

    case 'busiest_day': {
      const dayCounts: Record<string, number> = {}
      conversations.forEach(c => { dayCounts[c.date] = (dayCounts[c.date] || 0) + 1 })
      const sorted = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)

      answers.push(`**Daily activity** (${sorted.length} days, ${conversations.length} total)`)
      sorted.forEach(([date, count]) => {
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        const anomalies = conversations.filter(c => c.date === date && c.is_anomaly).length
        const bar = '█'.repeat(Math.max(1, Math.round(count / conversations.length * 20)))
        stats.push(`${dayName} ${date}: ${count} questions${anomalies > 0 ? ` (⚠ ${anomalies} problems)` : ''} ${bar}`)
      })

      const avgPerDay = Math.round(conversations.length / sorted.length)
      insights.push(`💡 Average ${avgPerDay} conversations/day.`)
      filtered = []
      break
    }

    case 'summary': {
      const total = conversations.length
      const topicCounts: Record<string, number> = {}
      conversations.forEach(c => { topicCounts[c.topic] = (topicCounts[c.topic] || 0) + 1 })
      const topTopic = Object.entries(topicCounts).sort(([, a], [, b]) => b - a)[0]
      const anomTotal = conversations.filter(c => c.is_anomaly).length
      const stopTotal = conversations.filter(c => c.is_thank_you_interrupt).length
      const avgLat = Math.round(conversations.filter(c => c.latency_ms > 0).reduce((s, c) => s + c.latency_ms, 0) / (conversations.filter(c => c.latency_ms > 0).length || 1))
      const hePct = ((conversations.filter(c => c.language === 'he-IL').length / total) * 100).toFixed(0)
      const enPct = ((conversations.filter(c => c.language === 'en-US').length / total) * 100).toFixed(0)

      answers.push(`**Dashboard Summary** — ${allDates.length} days, ${total} conversations`)
      stats.push(`📅 Date range: ${allDates[0]} to ${allDates[allDates.length - 1]}`)
      stats.push(`🗣 Languages: ${hePct}% Hebrew, ${enPct}% English`)
      stats.push(`🏆 Top topic: ${topTopic[0]} (${topTopic[1]} conversations)`)
      stats.push(`⏱ Average response: ${formatLatency(avgLat)}`)
      stats.push(`⚠ Problems: ${anomTotal} (${((anomTotal / total) * 100).toFixed(0)}% failure rate)`)
      stats.push(`⏹ Stop commands: ${stopTotal}`)

      // Seamless rate from conversations
      const seamless = conversations.filter(c => c.ai_think_ms !== null && c.opening_latency_ms !== null && (c.ai_think_ms || 0) < 3000)
      if (seamless.length > 0) {
        const rate = ((seamless.length / conversations.filter(c => c.ai_think_ms !== null).length) * 100).toFixed(0)
        stats.push(`🎯 Seamless response rate: ${rate}%`)
      }

      filtered = []
      break
    }

    case 'opening_analysis': {
      const openingCounts: Record<string, { count: number; totalLen: number; conversations: Conversation[] }> = {}
      filtered.forEach(c => {
        const key = c.opening_text || '(no opening)'
        if (!openingCounts[key]) openingCounts[key] = { count: 0, totalLen: 0, conversations: [] }
        openingCounts[key].count++
        openingCounts[key].totalLen += c.answer_length
        if (openingCounts[key].conversations.length < 2) openingCounts[key].conversations.push(c)
      })
      const sorted = Object.entries(openingCounts).sort(([, a], [, b]) => b.count - a.count)

      answers.push(`**Opening sentence analysis** — ${sorted.length} distinct openings`)
      sorted.slice(0, 8).forEach(([text, data]) => {
        const avgLen = Math.round(data.totalLen / data.count)
        stats.push(`"${text.slice(0, 60)}${text.length > 60 ? '...' : ''}" — used ${data.count}×, avg answer length: ${avgLen} chars`)
      })

      // Find which opening leads to longest answers (engagement proxy)
      const sortedByEngagement = Object.entries(openingCounts)
        .filter(([, d]) => d.count >= 2)
        .sort(([, a], [, b]) => (b.totalLen / b.count) - (a.totalLen / a.count))
      if (sortedByEngagement.length > 0) {
        const [bestOpening] = sortedByEngagement[0]
        insights.push(`💡 Best engagement: "${bestOpening.slice(0, 50)}" triggers the longest answers.`)
      }

      filtered = sorted.slice(0, 3).flatMap(([, d]) => d.conversations)
      break
    }

    case 'aggregate': {
      // Check what we're aggregating
      const hasTopicFilter = ilr.filters.topics && ilr.filters.topics.length > 0
      const hasLatencyFilter = ilr.filters.latency_op

      // "Which topics are slowest?"
      if (question.toLowerCase().includes('topic') && (question.toLowerCase().includes('slow') || question.toLowerCase().includes('fast') || question.toLowerCase().includes('latency'))) {
        const topicLatency: Record<string, { total: number; count: number }> = {}
        conversations.filter(c => c.latency_ms > 0).forEach(c => {
          if (!topicLatency[c.topic]) topicLatency[c.topic] = { total: 0, count: 0 }
          topicLatency[c.topic].total += c.latency_ms
          topicLatency[c.topic].count++
        })
        const sorted = Object.entries(topicLatency)
          .map(([topic, d]) => ({ topic, avg: Math.round(d.total / d.count), count: d.count }))
          .sort((a, b) => b.avg - a.avg)

        answers.push(`**Topic latency ranking** (slowest first)`)
        sorted.forEach((d, i) => {
          const color = d.avg > 3000 ? '🔴' : d.avg > 2000 ? '🟡' : '🟢'
          stats.push(`${i + 1}. ${color} ${d.topic}: avg ${formatLatency(d.avg)} (${d.count} conversations)`)
        })
        filtered = []
        break
      }

      // "How many" / "failure rate" / "seamless rate"
      if (hasTopicFilter) {
        answers.push(`**${ilr.filters.topics!.join(', ')}**: ${filtered.length} conversations`)
      } else if (hasLatencyFilter) {
        answers.push(`**${ilr.filters.latency_op === '>' ? 'Slow' : 'Fast'} responses**: ${filtered.length}`)
      } else if (ilr.filters.is_anomaly) {
        answers.push(`**Problems**: ${filtered.length} of ${conversations.length} conversations (${((filtered.length / conversations.length) * 100).toFixed(0)}%)`)
        const typeCounts: Record<string, number> = {}
        filtered.forEach(c => c.anomalies.forEach(a => { typeCounts[a] = (typeCounts[a] || 0) + 1 }))
        Object.entries(typeCounts).sort(([, a], [, b]) => b - a).forEach(([type, count]) => {
          stats.push(`${type}: ${count}`)
        })
      } else if (ilr.filters.is_stop) {
        const stops = filtered
        answers.push(`**Stop commands**: ${stops.length} kill switch activations (${((stops.length / conversations.length) * 100).toFixed(0)}% of all conversations)`)
        // Topics that get interrupted most
        const topicCounts: Record<string, number> = {}
        stops.forEach(c => { topicCounts[c.topic] = (topicCounts[c.topic] || 0) + 1 })
        const topicRank = Object.entries(topicCounts).sort(([, a], [, b]) => b - a)
        if (topicRank.length > 0) {
          stats.push(`Topics most interrupted: ${topicRank.slice(0, 5).map(([t, n]) => `${t} (${n})`).join(', ')}`)
        }
        // By day
        const dayCounts: Record<string, number> = {}
        stops.forEach(c => { dayCounts[c.date] = (dayCounts[c.date] || 0) + 1 })
        const dayRank = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)
        stats.push(`Days with most stops: ${dayRank.slice(0, 3).map(([d, n]) => `${d} (${n})`).join(', ')}`)
      } else {
        answers.push(`**${filtered.length} conversations** match your query`)
      }
      break
    }

    default: {
      // 'list' mode — just describe what we found
      const filterDesc: string[] = []
      if (ilr.filters.topics?.length) filterDesc.push(ilr.filters.topics.join(', '))
      if (ilr.filters.languages?.length) filterDesc.push(ilr.filters.languages.map(l => LANG_FLAGS[l] || l).join(', '))
      if (ilr.filters.date_exact) filterDesc.push(ilr.filters.date_exact)
      if (ilr.filters.is_anomaly) filterDesc.push('problems')
      if (ilr.filters.is_stop) filterDesc.push('stop commands')
      if (ilr.filters.is_greeting) filterDesc.push('greetings')
      if (ilr.filters.is_no_answer) filterDesc.push('unanswered')
      if (ilr.filters.is_comprehension_failure) filterDesc.push('comprehension failures')
      if (ilr.filters.sensitivity?.length) filterDesc.push(`${ilr.filters.sensitivity.join('/')} sensitivity`)
      if (ilr.filters.vip_only) filterDesc.push('VIP')
      if (ilr.filters.latency_op === '>') filterDesc.push(`>3s latency`)
      if (ilr.filters.latency_op === '<') filterDesc.push(`<2s latency`)
      if (ilr.text_search?.length) filterDesc.push(`"${ilr.text_search.join(', ')}"`)

      const desc = filterDesc.length > 0 ? filterDesc.join(' + ') : 'all conversations'
      answers.push(`**${desc}**: ${filtered.length} conversation${filtered.length !== 1 ? 's' : ''}`)
    }
  }

  // ── Enrichment (always) ──
  const enrichment = enrichResults(filtered, conversations)
  stats.push(...enrichment)

  // ── Insights ──
  insights.push(...detectInsights(filtered, conversations))

  // ── Fallback if nothing found ──
  if (filtered.length === 0 && answers.length === 0 && stats.length === 0) {
    return {
      question,
      answer: `I didn't catch that. Try asking about:\n• A topic: "kashrut", "theology", "military"\n• Performance: "slow responses", "failure rate"\n• Patterns: "most asked question", "compare Hebrew vs English"\n• Specific dates: "Feb 22", "busiest day"\n\nOr just type a word to search all conversations.`,
      conversations: [],
      timestamp: Date.now(),
    }
  }

  return {
    question,
    answer: answers.join('. '),
    stats: stats.length > 0 ? stats : undefined,
    insights: insights.length > 0 ? insights : undefined,
    conversations: filtered.slice(0, 25),
    timestamp: Date.now(),
  }
}

// ══════════════════════════════════════════════════
// 8. SUGGESTED QUESTIONS — showcase different capabilities
// ══════════════════════════════════════════════════
const SUGGESTED_QUESTIONS = [
  { label: 'Top topics', query: 'What do visitors ask about most?' },
  { label: 'Kashrut', query: 'Show me kashrut conversations' },
  { label: 'Problems', query: 'Any problems or failures?' },
  { label: 'Slowest topics', query: 'Which topics trigger the slowest responses?' },
  { label: 'Interrupted', query: 'Which conversations get interrupted?' },
  { label: 'Busiest hour', query: 'Busiest hour of the day?' },
  { label: 'Hebrew vs English', query: 'Compare Hebrew vs English' },
  { label: 'Army questions', query: 'Did anyone ask about the army?' },
]

// ══════════════════════════════════════════════════
// 9. RESULT CARD — compact conversation display
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
          <span className="text-xs" title="Critical sensitivity — politically or religiously explosive content">🔴</span>
        )}
        {c.sensitivity === 'high' && (
          <span className="text-xs" title="High sensitivity — requires care in handling">🟠</span>
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
// 10. MAIN COMPONENT
// ══════════════════════════════════════════════════
export function AskTheData({ conversations }: AskTheDataProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const allDates = useMemo(() =>
    [...new Set(conversations.map(c => c.date))].sort(),
    [conversations]
  )

  const handleAsk = useCallback((question: string) => {
    if (!question.trim()) return
    setIsThinking(true)

    setTimeout(() => {
      const ilr = buildILR(question, allDates)
      const result = executeQuery(question, ilr, conversations)
      setResults(prev => [result, ...prev])
      setQuery('')
      setIsThinking(false)
    }, 200)
  }, [conversations, allDates])

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
      </div>

      {/* Suggested questions */}
      <div className="flex flex-wrap gap-2 justify-center">
        {SUGGESTED_QUESTIONS.map(sq => (
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
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try: halacha, slow responses, compare Hebrew vs English, busiest hour, Feb 22..."
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
              <p className="text-parchment text-sm font-medium">{result.question}</p>
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

              {/* Conversation results */}
              {result.conversations.length > 0 && (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
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
            Choose a suggested question, or type a topic name, keyword, or question.
          </p>
          <p className="text-text-dim/50 text-xs mt-2">
            Supports: topics &middot; dates &middot; Hebrew &middot; comparisons &middot; latency &middot; stops &middot; FAQ detection
          </p>
        </div>
      )}
    </div>
  )
}
