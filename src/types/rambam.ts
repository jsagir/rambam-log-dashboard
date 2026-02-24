/**
 * Type definitions for Rambam log analysis
 */

export interface Timestamps {
  stt: string | null;
  waiting_audio: string | null;
  first_chunk: string | null;
  last_chunk: string | null;
  finished: string | null;
}

export interface Latencies {
  classification?: number;  // ms
  first_response?: number;  // ms
  total?: number;           // ms
}

export interface ErrorEntry {
  code: number;
  type: string;
  timestamp: string;
  entry: any;
}

export interface Interaction {
  question_text: string;
  question_type: string | null;
  language: string | null;
  response_chunks: string[];
  response_text: string;
  audio_id: string | null;
  style: string | null;
  style_degree: number | null;
  timestamps: Timestamps;
  latencies: Latencies;
  errors: ErrorEntry[];
  msg_codes: number[];
  raw_entries: any[];
}

export interface Session {
  session_number: number;
  interaction_count: number;
  start_time: string;
  end_time: string;
  interactions: Interaction[];
}

export interface ParsedLog {
  total_interactions: number;
  interactions: Interaction[];
  sessions?: Session[];
}

export type AnomalySeverity = 'critical' | 'warning' | 'operational';

export interface Anomaly {
  type: string;
  severity: AnomalySeverity;
  interaction_id?: number;
  timestamp?: string;
  description: string;
  [key: string]: any;  // Additional fields specific to anomaly type
}

export interface MetricsSummary {
  min: number;
  max: number;
  avg: number;
  count: number;
  values: number[];
}

export interface AnomalyReport {
  critical: Anomaly[];
  warning: Anomaly[];
  operational: Anomaly[];
  summary: {
    total_interactions: number;
    critical_count: number;
    warning_count: number;
    operational_count: number;
  };
  metrics: {
    latencies: {
      classification?: MetricsSummary;
      first_response?: MetricsSummary;
      total?: MetricsSummary;
    };
    languages: Record<string, number>;
    question_types: Record<string, number>;
  };
}

export type AccuracyRating = '✅ Correct' | '⚠️ Partial' | '❌ Incorrect' | '🛡️ Guardrail';

export interface ContentQualityAssessment {
  interaction_id: number;
  accuracy: AccuracyRating;
  persona_consistency: number;  // 0-100
  museum_appropriateness: boolean;
  notes: string;
  sensitive_topic: boolean;
  vip_interaction: boolean;
}

export interface DashboardStats {
  totalInteractions: number;
  languages: Record<string, number>;
  sessionCount: number;
  healthStatus: '🟢 Healthy' | '🟡 Issues Found' | '🔴 Critical Issues';
  criticalCount: number;
  warningCount: number;
}
