# Log Ingestion Pipeline

Complete guide for processing new Rambam museum log files into the dashboard.

## Pipeline Overview

```
logs/raw/YYYYMMDD.txt          Raw log from museum (newline-delimited JSON)
    |
    v
scripts/process_log.py         Parse, classify, detect anomalies, translate
    |
    v
logs/processed/YYYYMMDD.json   Enriched interactions + daily summary
    |
    v
scripts/build_accumulated.py   Merge all days, deduplicate, aggregate KPIs
    |
    v
public/data/accumulated.json   Single source of truth for dashboard
    |
    v
Dashboard (Vite + React 19)    Fetches accumulated.json at runtime
    |
    v
https://rambam-dash-v2.onrender.com   Auto-deploys on push to main
```

---

## Step-by-Step Instructions

### Step 1: Add the raw log file

```bash
cp /path/to/new-log.txt logs/raw/YYYYMMDD.txt
```

**Naming rules:**
- Format: `YYYYMMDD.txt` (e.g., `20260225.txt`)
- Multiple logs same day: add suffix `-2`, `-3` (e.g., `20260225-2.txt`)
- Extension: always `.txt` even though content is JSON

### Step 2: Process all new logs

```bash
python3 scripts/process_all_new.py
```

This runs three things automatically:

1. **Finds unprocessed files** — compares `logs/raw/*.txt` stems against `logs/processed/*.json`
2. **Runs `process_log.py`** on each new file:
   - Reads newline-delimited JSON (STT events + AI message events)
   - Groups events by `msg.id` into conversations
   - Computes the two-latency model (opening latency, AI think time, stream duration)
   - Classifies topics (15 categories with priority ordering)
   - Detects anomalies (latency spikes, language unknown, out-of-order, think overflow)
   - Detects STOP commands (English "Thank you" = kill switch, Hebrew "todah" = polite)
   - Translates Hebrew questions and answers to English
   - Rates sensitivity (low / medium / high / critical)
   - Detects VIP visitors from greetings
   - Outputs `logs/processed/YYYYMMDD.json`
3. **Runs `build_accumulated.py`**:
   - Merges all processed files into one structure
   - Deduplicates overlapping IDs (appends `_1`, `_2` suffixes)
   - Computes aggregate KPIs across all days
   - Builds topic trends, anomaly log, daily stats
   - Outputs `public/data/accumulated.json`

### Step 3: Validate with swarm (mandatory)

Run the three validation gates in order:

| Gate | File | What it checks |
|------|------|---------------|
| 1 | `swarm/rambam-log-extractor.md` | Parsing quality, topic classification, anomaly detection |
| 2 | `swarm/rambam-viz-shaper.md` | Data contract compliance, latency integrity, chart renderability |
| 3 | `swarm/dataviz-consultant.md` | Visualization effectiveness |

**Report after validation:**
- Total conversations extracted
- Topic distribution (flag if "General" > 40%)
- Anomalies found (count + types)
- Latency stats (avg, P95, spikes)
- Any data contract violations

### Step 4: Verify locally

```bash
npm run dev
# Open http://localhost:5173
```

Check:
- New day appears in Day Drill-Down dropdown
- KPI numbers updated (total conversations, latency, anomaly rate)
- New conversations visible in the feed
- No broken charts or missing data
- Two-latency cards show updated numbers

### Step 5: Commit and deploy

```bash
git add logs/raw/YYYYMMDD.txt logs/processed/YYYYMMDD.json public/data/accumulated.json
git commit -m "feat: Add log data for YYYY-MM-DD (N interactions)"
git push origin main
```

Render auto-deploys in 2-3 minutes. Verify at https://rambam-dash-v2.onrender.com

### Step 6: Notify if critical

If processing flagged any of these, notify Daniel and museum management:
- **Critical sensitivity** items (idolatry, interfaith theology, modern politics)
- **VIP visitors** (named/important people)
- **System failures** (OUT_OF_ORDER bugs, high failure rates)

---

## Raw Log Format

Each line in the `.txt` file is a JSON object with a `type` field:

**STT event** (visitor speaks):
```json
{"type": "stt", "time": "2026/2/25 13:45:02", "msg": "visitor question text"}
```

**AI message — opening sentence** (T1 timestamp):
```json
{"type": "ai_message", "time": "2026/2/25 13:45:04", "msg": {
  "id": "UUID",
  "code": 200,
  "type": "waiting_audio",
  "timestamp": 1771131225054,
  "data": {
    "question_type": "Closed questions",
    "language": "he-IL",
    "audio_id": "31",
    "opening_text": "The matter is simple, and I will clarify it at once."
  }
}}
```

**AI message — response chunk** (T2 first, T3 last):
```json
{"type": "ai_message", "time": "2026/2/25 13:45:06", "msg": {
  "id": "UUID",
  "code": 200,
  "type": "stream_chunk",
  "timestamp": 1771131228026,
  "data": {
    "result": "response text chunk...",
    "language": "he-IL",
    "finished": false
  }
}}
```

Events are grouped by `msg.id`. Multiple `stream_chunk` events per conversation — concatenate all `result` fields. The chunk with `"finished": true` marks the end.

---

## Two-Latency Model

The Rambam system hides AI latency behind a pre-recorded opening sentence.

```
Visitor speaks → [SILENCE] → Opening sentence plays → [AI thinks behind it] → Answer plays
                  ^^^^^^^                               ^^^^^^^^^^^^^^^^
                  Opening Latency (T1-T0)               AI Think Time (T2-T1)
```

| Metric | Formula | What visitor experiences | Healthy | Critical |
|--------|---------|------------------------|---------|----------|
| Opening Latency | T1 - T0 | Silence before hearing anything | <2s | >5s |
| AI Think Time | T2 - T1 | Hidden behind opening (ideally invisible) | <3s | >5s |
| Stream Duration | T3 - T2 | Answer delivery time | varies | >5s |
| Seamless Rate | % where AI think < 3s | Zero perceived delay | >90% | <70% |

---

## Output: Per-Interaction Fields

Every conversation in `accumulated.json` has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique message UUID (deduplicated with `_1` suffix if overlapping) |
| `date` | string | YYYY-MM-DD |
| `time` | string | Full timestamp from STT event |
| `hour` | number | 0-23 for hourly analysis |
| `question` | string | Visitor's question (original language) |
| `answer` | string | Rambam's response (original language) |
| `question_en` | string | English translation (if Hebrew) |
| `answer_en` | string | English translation (if Hebrew) |
| `language` | string | `he-IL`, `en-US`, or `unknown` |
| `question_type` | string | Classification from AI pipeline |
| `topic` | string | One of 15 topics (Kashrut, Military & Draft, Theology, etc.) |
| `opening_text` | string | Pre-recorded opening sentence played |
| `audio_id` | string | Which opening clip was used |
| `latency_ms` | number | Total end-to-end response time |
| `opening_latency_ms` | number | Silence before opening plays (T1-T0) |
| `ai_think_ms` | number | LLM generation time (T2-T1) |
| `stream_duration_ms` | number | Answer delivery time (T3-T2) |
| `is_out_of_order` | boolean | Stream arrived before opening (bug) |
| `answer_length` | number | Character count of response |
| `chunk_count` | number | Number of stream chunks |
| `is_complete` | boolean | Response finished normally |
| `is_greeting` | boolean | Hello/goodbye, not a real question |
| `is_thank_you_interrupt` | boolean | English kill switch detected |
| `thank_you_type` | string | `stop` (English), `polite` (Hebrew), or `null` |
| `is_comprehension_failure` | boolean | Rambam couldn't understand |
| `is_no_answer` | boolean | No response generated |
| `is_anomaly` | boolean | Any anomaly detected |
| `anomaly_type` | string | Primary anomaly type |
| `anomalies` | string[] | All anomaly types for this interaction |
| `sensitivity` | string | `low`, `medium`, `high`, or `critical` |
| `vip` | string | Named visitor or `null` |
| `needs_translation` | boolean | Hebrew content needing translation |

---

## Output: accumulated.json Structure

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
    "avg_interactions_per_day": 20.7,
    "avg_latency_ms": 1903,
    "max_latency_ms": 4268,
    "avg_opening_latency_ms": 1873,
    "avg_ai_think_ms": 1552,
    "seamless_response_rate": 95.5,
    "anomaly_count": 86,
    "anomaly_rate": 46.2,
    "failure_count": 14,
    "failure_rate": 7.5,
    "language_distribution": { "he-IL": 78, "en-US": 50, "unknown": 58 },
    "topic_distribution": { "Greetings": 60, "General": 59, ... }
  },
  "daily_stats": [ { per-day summary objects } ],
  "topic_trend": [ { date + topic counts per day } ],
  "anomaly_log": [ { date, time, type, question, latency_ms, language, interaction_id } ],
  "conversations": [ { all interaction objects } ]
}
```

---

## Anomaly Types

| Type | Trigger | Severity |
|------|---------|----------|
| `LANG_UNKNOWN` | Language not detected | Critical |
| `EMPTY_RESPONSE` | No answer text generated | Critical |
| `OUT_OF_ORDER` | Stream chunk before opening (Starcloud bug) | Critical |
| `LATENCY_SPIKE_CRITICAL` | Response > 6 seconds | Critical |
| `LATENCY_SPIKE_WARN` | Response > 3 seconds | Warning |
| `OPENING_LATENCY_CRITICAL` | Silence > 5 seconds | Critical |
| `OPENING_LATENCY_WARN` | Silence > 3 seconds | Warning |
| `THINK_OVERFLOW` | AI took longer than opening covers | Warning |
| `FALLBACK_TRIGGERED` | Rambam asked to rephrase | Warning |
| `LLM_ERROR` | AI model error | Critical |

---

## Topic Classification (15 categories)

Topics are classified by keyword matching with priority ordering (first match wins):

1. **Kashrut** — meat, dairy, kosher, dietary laws
2. **Military & Draft** — army, haredi, ultra-orthodox service (politically sensitive)
3. **Interfaith** — Christianity, Islam, other religions (very sensitive at Museum of Tolerance)
4. **Theology** — God, soul, faith, divine
5. **Torah & Text** — Torah, Talmud, scripture study
6. **Jewish Law** — halacha, mitzvot, Shabbat
7. **Philosophy** — ethics, wisdom, meaning of life
8. **Personal Life** — family, health, education, advice
9. **History** — Maimonides biography, Egypt, Spain
10. **Relationships** — love, marriage
11. **Meta** — questions about the hologram, AI, museum
12. **Blessings** — prayer, blessings
13. **Daily Life** — coffee, sleep, routine
14. **Greetings** — hello, goodbye (not real questions)
15. **General** — fallback (flag if > 40% of conversations)

---

## Critical Rules

1. **Chronological order** — interactions MUST be sorted by timestamp ascending
2. **ID deduplication** — overlapping logs produce duplicate msg.ids. `build_accumulated.py` appends `_1`, `_2` suffixes automatically
3. **No negative latencies** — if T1 < T0, flag as `OUT_OF_ORDER` anomaly
4. **Topic quality gate** — if "General" exceeds 40%, add new keywords to `process_log.py`
5. **Translation required** — all Hebrew conversations get English translations
6. **Sensitivity escalation** — `critical` items require human review before deployment
7. **Three files committed** — always commit raw + processed + accumulated together
