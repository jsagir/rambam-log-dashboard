export interface AccumulatedData {
  meta: Meta
  kpi: KPI
  daily_stats: DailyStat[]
  topic_trend: TopicTrend[]
  anomaly_log: AnomalyEntry[]
  conversations: Conversation[]
}

export interface Meta {
  last_updated: string
  total_days: number
  total_conversations: number
  date_range: [string, string]
  generated_by: string
}

export interface KPI {
  total_interactions: number
  total_days: number
  avg_interactions_per_day: number
  avg_latency_ms: number
  max_latency_ms: number
  avg_opening_latency_ms: number
  avg_ai_think_ms: number
  seamless_response_rate: number
  out_of_order_count: number
  anomaly_count: number
  anomaly_rate: number
  failure_count: number
  failure_rate: number
  language_distribution: Record<string, number>
  topic_distribution: Record<string, number>
}

export interface DailyStat {
  date: string
  day_of_week: string
  total_conversations: number
  avg_latency_ms: number
  max_latency_ms: number
  min_latency_ms: number
  language_distribution: Record<string, number>
  topic_distribution: Record<string, number>
  question_type_distribution: Record<string, number>
  hourly_distribution: Record<string, number>
  failure_count: number
  no_answer_count: number
  anomaly_count: number
  out_of_order_count: number
  avg_opening_latency_ms: number
  avg_ai_think_ms: number
  max_ai_think_ms: number
  avg_stream_duration_ms: number
  seamless_rate: number
  first_interaction: string
  last_interaction: string
}

export interface TopicTrend {
  date: string
  [topic: string]: string | number
}

export interface AnomalyEntry {
  date: string
  time: string
  type: string
  question: string
  latency_ms: number
  language: string
  interaction_id: string
}

export interface Conversation {
  id: string
  date: string
  time: string
  hour: number
  question: string
  answer: string
  question_en: string
  answer_en: string
  language: string
  question_type: string
  topic: string
  opening_text: string
  audio_id: string
  latency_ms: number
  opening_latency_ms: number | null
  ai_think_ms: number | null
  stream_duration_ms: number | null
  is_out_of_order: boolean
  answer_length: number
  chunk_count: number
  is_complete: boolean
  is_greeting: boolean
  is_thank_you_interrupt: boolean
  is_comprehension_failure: boolean
  is_no_answer: boolean
  is_anomaly: boolean
  anomaly_type: string | null
  anomalies: string[]
  sensitivity: string
  vip: string | null
  needs_translation: boolean
}

// Color constants
export const TOPIC_COLORS: Record<string, string> = {
  'Kashrut': '#E8A838',
  'Military & Draft': '#E85858',
  'Interfaith': '#D84890',
  'Theology': '#8B5CF6',
  'Torah & Text': '#6366F1',
  'Jewish Law': '#3B82F6',
  'Philosophy': '#14B8A6',
  'Personal Life': '#10B981',
  'History': '#F59E0B',
  'Relationships': '#EC4899',
  'Meta': '#6B7280',
  'Blessings': '#A78BFA',
  'Daily Life': '#34D399',
  'Greetings': '#9CA3AF',
  'General': '#6B7280',
}

export const SENSITIVITY_COLORS: Record<string, string> = {
  'low': '#4A8F6F',
  'medium': '#D4A843',
  'high': '#E8A838',
  'critical': '#C75B3A',
}

export const LANG_LABELS: Record<string, string> = {
  'he-IL': '🇮🇱 Hebrew',
  'en-US': '🇺🇸 English',
  'unknown': '❓ Unknown',
}

export const LANG_FLAGS: Record<string, string> = {
  'he-IL': '🇮🇱',
  'en-US': '🇺🇸',
  'unknown': '❓',
}
