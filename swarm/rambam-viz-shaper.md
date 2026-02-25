---
name: rambam-viz-shaper
description: >
  Rambam Dashboard Intelligence & Visualization Shaper. Takes extracted conversation records
  and shapes them for the Vite + React + Recharts dashboard: computes daily summaries,
  scores notability, detects repeated questions, identifies VIP interactions, validates data
  against dashboard component contracts. Runs AFTER rambam-log-extractor.
  Triggers: "shape for dashboard", "build summary", "validate data", "optimize for viz",
  "what's notable", "prepare dashboard data", "check accumulated.json".
---

# Rambam Viz Shaper

*"I turn clean data into dashboard intelligence."*

Takes structured conversation records (from `rambam-log-extractor`) and validates + enriches them for the React dashboard. Ensures every data point renders correctly in KPI cards, Recharts charts, and conversation feed.

**Pipeline:** `Raw .txt → [extractor] → Clean Records → [THIS SKILL] → accumulated.json → Vite Dashboard`

**Stack context:** Dashboard is Vite + React 19 + Recharts + Tailwind CSS. Data source is `public/data/accumulated.json` fetched at runtime. No database — all computation happens in Python scripts and React useMemo hooks.

## Data Contract: accumulated.json

The dashboard loads ONE file: `public/data/accumulated.json`. This is the schema every dashboard component expects:

```json
{
  "meta": {
    "last_updated": "ISO timestamp",
    "total_days": 9,
    "total_conversations": 186,
    "date_range": ["2026-02-15", "2026-02-24"],
    "generated_by": "build_accumulated.py v2"
  },
  "kpi": {
    "total_interactions": 186,
    "total_days": 9,
    "avg_interactions_per_day": 20.7,
    "avg_latency_ms": 1879,
    "max_latency_ms": 8234,
    "anomaly_count": 79,
    "anomaly_rate": 42.5,
    "failure_count": 13,
    "failure_rate": 7.0,
    "language_distribution": {"he-IL": 112, "en-US": 61, "unknown": 13},
    "topic_distribution": {"Greetings": 34, "Theology": 22, ...}
  },
  "daily_stats": [{ DailyStat per day }],
  "topic_trend": [{ date + topic counts per day }],
  "anomaly_log": [{ date, time, type, question, latency_ms, language }],
  "conversations": [{ full Conversation objects }]
}
```

## Dashboard Component Contracts

Each React component expects specific fields. If ANY are missing, the chart breaks.

### KPIBand.tsx expects:
- `kpi.total_interactions` (number)
- `kpi.avg_latency_ms` (number)
- `kpi.max_latency_ms` (number)
- `kpi.anomaly_rate` (number, percentage)
- `daily_stats[].total_conversations` (sparkline data)
- `daily_stats[].avg_latency_ms` (sparkline data)
- Each conversation: `.language`, `.is_anomaly`

### LatencyPanel.tsx expects (CRITICAL — Daniel's priority):
- Every conversation: `latency_ms` (number, 0 if unavailable)
- Every conversation: `topic`, `language`, `hour`, `time`
- `daily_stats[].avg_latency_ms`, `.max_latency_ms`, `.min_latency_ms`
- Latency distribution must be computable: needs enough non-zero values
- Per-topic latency averages must be derivable

### TopicCharts.tsx expects:
- `kpi.topic_distribution` (Record<string, number>)
- `kpi.language_distribution` (Record<string, number>)
- `daily_stats[].total_conversations`, `.anomaly_count`
- `daily_stats[].hourly_distribution` (Record<string, number>)
- `topic_trend[]` — array of `{date, TopicName: count, ...}`

### ConversationFeed.tsx expects:
- Each conversation: `id`, `question`, `answer`, `time`, `language`, `topic`, `question_type`, `opening_text`, `latency_ms`, `sensitivity`, `vip`, `is_anomaly`, `anomalies[]`, `is_comprehension_failure`, `is_no_answer`
- Notability scoring uses: `vip`, `anomalies.length`, `sensitivity`, `latency_ms`, `is_comprehension_failure`, `is_no_answer`

### SystemHealth.tsx expects:
- `anomaly_log[]` with: `date`, `time`, `type`, `question`, `latency_ms`, `language`
- Each conversation: `latency_ms`, `time` (for scatter plot)
- `daily_stats[].avg_latency_ms`, `.max_latency_ms` (for trend line)

## Notability Scoring

Every conversation gets an implicit score (computed in ConversationFeed.tsx):

```
score = 0
+ 100  if vip is not null
+ 10   per anomaly in anomalies[]
+ 50   if sensitivity == "critical"
+ 30   if sensitivity == "high"
+ 10   if sensitivity == "medium"
+ 20   if latency_ms > 3000
+ 10   if latency_ms > 2000
+ 40   if is_comprehension_failure
+ 30   if is_no_answer
```

Ensure VIP, sensitivity, and anomaly fields are correctly populated for this scoring to work.

## Validation Checklist (run after every new log)

### Data Completeness
- [ ] `meta.total_conversations` matches `conversations.length`
- [ ] `meta.total_days` matches `daily_stats.length`
- [ ] Every conversation has non-empty `id`, `date`, `time`, `question`
- [ ] Every conversation has valid `language` (he-IL, en-US, or unknown)
- [ ] Every conversation has valid `topic` (from the 15 recognized values)
- [ ] `daily_stats` dates are sorted ascending
- [ ] `topic_trend` dates match `daily_stats` dates

### Latency Integrity (CRITICAL)
- [ ] No negative latency values
- [ ] latency_ms == 0 only for no-answer/orphaned conversations
- [ ] `daily_stats[].avg_latency_ms` matches manual calculation
- [ ] `daily_stats[].max_latency_ms` ≥ `avg_latency_ms`
- [ ] `kpi.avg_latency_ms` is weighted average (not average of averages)

### Anomaly Consistency
- [ ] Every conversation with `is_anomaly: true` has at least one entry in `anomalies[]`
- [ ] `anomaly_log` entries reference valid conversation IDs
- [ ] `kpi.anomaly_count` matches count of conversations where `is_anomaly == true`

### Chart Renderability
- [ ] `hourly_distribution` keys are valid hour strings ("0"-"23")
- [ ] `topic_distribution` keys match TOPIC_COLORS keys in dashboard.ts
- [ ] `language_distribution` keys match LANG_LABELS keys in dashboard.ts
- [ ] Sparkline arrays have >1 data point (single points don't render)

## Repeated Question Detection

Known repeats in the dataset:
- "כמה שעות בין בשר לחלב" — meat/dairy waiting time (most asked)
- "מה שלומך" — "how are you" greeting variants
- Questions about coffee/daily routine

Flag these in processing. Dashboard value: "Asked 7× across 4 days" is a powerful insight.

## VIP Detection Patterns

```
Hebrew: "אני ___", "שמי ___", "קוראים לי ___", "פרופסור", "דוקטור"
English: "my name is", "I'm ___", "professor", "doctor"
Context: "שוטרים", "police", "הנהלה", "management", "editor"
```

## Error Recovery

If `accumulated.json` is malformed or a component crashes:
1. Check `logs/processed/*.json` — each day's data should be valid independently
2. Re-run `python3 scripts/build_accumulated.py` to rebuild from processed files
3. Verify with `python3 -c "import json; d=json.load(open('public/data/accumulated.json')); print(f'{len(d[\"conversations\"])} conversations, {len(d[\"daily_stats\"])} days')"``
