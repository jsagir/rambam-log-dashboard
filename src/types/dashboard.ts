// src/types/dashboard.ts
// Rambam Dashboard v2 — Data Schema Types

export interface DashboardData {
  metadata: {
    generated_at: string;
    log_count: number;
    date_range: { first: string; last: string };
    total_interactions: number;
    total_questions: number;
  };
  cumulative: CumulativeData;
  days: Record<string, DayData>;
}

// ─── CUMULATIVE ─────────────────────────────────────────────────────────────

export interface CumulativeData {
  daily_stats: DailyStat[];
  topic_trend: TopicTrend[];
  anomaly_log: AnomalyEntry[];
  kpi: KPI;
}

export interface KPI {
  avg_interactions_per_day: number;
  avg_latency_ms: number;
  accuracy_rate: number;
  anomaly_rate: number;
  inquiry_mode_pct: number;
  depth_question_pct: number;
}

export interface DailyStat {
  date: string;
  interactions: number;
  questions: number;
  greetings: number;
  hebrew: number;
  english: number;
  unknown_lang: number;
  avg_latency_ms: number;
  max_latency_ms: number;
  anomaly_count: number;
  critical_count: number;
  sessions: number;
  inquiry_sessions: number;
  health: HealthStatus;
}

export interface TopicTrend {
  date: string;
  [topic: string]: number | string;
}

export interface AnomalyEntry {
  date: string;
  interaction_id: number;
  type: AnomalyType;
  severity: 'critical' | 'warning';
  question_preview: string;
  latency_ms: number | null;
  language: string;
  topic: string;
}

// ─── PER-DAY ────────────────────────────────────────────────────────────────

export interface DayData {
  date: string;
  summary: DaySummary;
  sessions: SessionData[];
  interactions: InteractionData[];
}

export interface DaySummary {
  interactions: number;
  questions: number;
  sessions: number;
  languages: string[];
  time_span: { first: string; last: string };
  health: HealthStatus;
  avg_latency_ms: number;
  max_latency_ms: number;
}

export interface SessionData {
  session_id: number;
  start_time: string;
  end_time: string;
  interaction_count: number;
  languages: string[];
  mode: 'Q&A' | 'Inquiry';
  topics: string[];
}

export interface InteractionData {
  id: number;
  time: string;
  session: number;
  question: string;
  answer: string;
  lang: string;
  type: QuestionType;
  topic: TopicCategory;
  latency: number;
  accuracy: AccuracyRating;
  anomalies: AnomalyType[];
  sensitivity: SensitivityLevel;
  audioId: string;
  opening: string;
  vip: string | null;
  is_greeting: boolean;
}

// ─── ENUMS ──────────────────────────────────────────────────────────────────

export type HealthStatus = '🟢' | '🟡' | '🔴';

export type QuestionType =
  | 'Closed questions'
  | 'Open questions'
  | 'Generic questions'
  | 'Statement / Clarification'
  | 'Personal advice or current event questions';

export type TopicCategory =
  | 'Haredi / Army / Draft'
  | 'Interfaith'
  | 'Shabbat / Halacha'
  | 'Personal / Lifestyle'
  | 'Modern Politics'
  | 'Sports / Leadership'
  | 'Jewish Sects'
  | 'Meta / Museum'
  | 'Science / Medicine'
  | 'Torah Study'
  | 'Daily Practice'
  | 'General Question'
  | 'Uncategorized';

export type AccuracyRating =
  | 'correct'
  | 'partial'
  | 'incorrect'
  | 'guardrail'
  | 'fallback'
  | 'pending';

export type SensitivityLevel = 'low' | 'medium' | 'high' | 'critical';

export type AnomalyType =
  | 'LANG_UNKNOWN'
  | 'LLM_ERROR'
  | 'PERSONA_BREAK'
  | 'NON_200_CODE'
  | 'FALLBACK_TRIGGERED'
  | 'LATENCY_SPIKE_WARN'
  | 'LATENCY_SPIKE_CRITICAL'
  | 'STT_TRUNCATION'
  | 'STT_DROPPED'
  | 'EMPTY_RESPONSE'
  | 'INCOMPLETE_RESPONSE';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

export const ACCURACY_COLORS: Record<AccuracyRating, string> = {
  correct: '#34d399',
  partial: '#fbbf24',
  incorrect: '#f87171',
  guardrail: '#60a5fa',
  fallback: '#a78bfa',
  pending: '#6b7280',
};

export const ACCURACY_LABELS: Record<AccuracyRating, string> = {
  correct: '✅ Correct',
  partial: '⚠️ Partial',
  incorrect: '❌ Incorrect',
  guardrail: '🛡️ Guardrail',
  fallback: '↩️ Fallback',
  pending: '⏳ Pending',
};

export const SENSITIVITY_COLORS: Record<SensitivityLevel, string> = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

export const TOPIC_COLORS: Record<string, string> = {
  'Haredi / Army / Draft': '#ef4444',
  'Interfaith': '#f59e0b',
  'Personal / Lifestyle': '#6b7280',
  'Shabbat / Halacha': '#34d399',
  'Modern Politics': '#a78bfa',
  'Sports / Leadership': '#60a5fa',
  'Jewish Sects': '#f472b6',
  'Meta / Museum': '#c8a961',
  'Science / Medicine': '#14b8a6',
  'Torah Study': '#818cf8',
  'Daily Practice': '#a3a3a3',
  'General Question': '#94a3b8',
  'Uncategorized': '#525252',
};

export const ANOMALY_SEVERITY: Record<AnomalyType, 'critical' | 'warning'> = {
  LANG_UNKNOWN: 'critical',
  LLM_ERROR: 'critical',
  PERSONA_BREAK: 'critical',
  NON_200_CODE: 'critical',
  FALLBACK_TRIGGERED: 'warning',
  LATENCY_SPIKE_WARN: 'warning',
  LATENCY_SPIKE_CRITICAL: 'critical',
  STT_TRUNCATION: 'warning',
  STT_DROPPED: 'warning',
  EMPTY_RESPONSE: 'warning',
  INCOMPLETE_RESPONSE: 'warning',
};

export const LANG_LABELS: Record<string, string> = {
  'he-IL': '🇮🇱 Hebrew',
  'en-US': '🇬🇧 English',
  'he': '🇮🇱 Hebrew',
  'en': '🇬🇧 English',
  'unknown': '❓ Unknown',
};

// Latency thresholds (milliseconds)
export const LATENCY_THRESHOLDS = {
  classification_good: 2000,
  classification_warn: 3000,
  generation_good: 3000,
  generation_warn: 5000,
  generation_critical: 6000,
  total_critical: 10000,
} as const;
