---
name: rambam-log-extractor
description: >
  Rambam AI Log Extraction & Classification Agent. Parses raw Museum of Tolerance holographic
  Rambam interaction logs (.txt JSON-lines files) into structured conversation records. Handles
  the specific event format (STT + waiting_audio + stream_chunks), computes latency, classifies
  topics, detects anomalies, translates Hebrew→English, and outputs clean JSON for dashboard.
  ALWAYS use this skill when: processing a new Rambam log file, parsing hologram interaction data,
  debugging raw log format issues, adding new topic categories, or fixing classification rules.
  This skill runs FIRST in the pipeline. Its output feeds into rambam-viz-shaper.
  Triggers: "process log", "new log file", "parse rambam", "extract conversations",
  "20260225.txt", any .txt file with STT/ai_message events.
---

# Rambam Log Extractor

*"I turn raw event streams into clean conversation records."*

The first agent in the Rambam Dashboard processing pipeline. Reads raw log files and produces structured, classified, translated conversation records.

**Pipeline position:** `Raw .txt → [THIS SKILL] → Clean Records → [rambam-viz-shaper] → accumulated.json → Dashboard`

**Stack context:** Vite + React + Recharts. Data flows through Python scripts → `public/data/accumulated.json` → fetched by React dashboard. No Supabase — all data is file-based.

## How To Process a New Log

```bash
# 1. Copy raw log to the right folder
cp ~/Downloads/20260225.txt logs/raw/

# 2. Process it (runs scripts/process_log.py)
python3 scripts/process_all_new.py

# 3. Output lands in:
#    logs/processed/20260225.json  (per-day structured data)
#    public/data/accumulated.json  (merged dataset for dashboard)

# 4. Verify the dashboard sees the new data
npm run dev
```

## Raw Log Format Specification

Each log file is named `YYYYMMDD.txt` (one file per day). Each line is a JSON object:

### Event Type 1: STT (Speech-to-Text)
```json
{"type": "stt", "time": "2026/2/15 6:53:43", "msg": "האם אלוהים ישב באוהל המשכן?"}
```
- `time`: Format `YYYY/M/D H:MM:SS` (NOT zero-padded)
- `msg`: Transcribed visitor utterance

### Event Type 2: ai_message
**Sub-type: waiting_audio** — Classification + opening line selection
```json
{"type": "ai_message", "time": "...", "msg": {"id": "UUID", "code": 200, "type": "waiting_audio", "timestamp": 1771131225054, "data": {"question_type": "Closed questions", "language": "he-IL", "audio_id": "31", "opening_text": "The matter is simple..."}}}
```

**Sub-type: stream_chunk** — Streamed LLM response text
```json
{"type": "ai_message", "time": "...", "msg": {"id": "UUID", "code": 200, "type": "stream_chunk", "timestamp": 1771131228026, "data": {"result": "אל תחשוב כלל...", "language": "he-IL", "finished": false}}}
```

**CRITICAL:** `msg.id` groups all events in one conversation turn. Concatenate all `result` fields from stream_chunks with same `id`.

## Two-Latency Model

The Rambam system uses a **latency-hiding architecture**: opening audio plays WHILE the LLM thinks.

| Latency | Computation | What It Means | Healthy | Critical |
|---------|-------------|---------------|---------|----------|
| **opening_latency_ms** | T1-T0 (waiting_audio - STT) | Silence gap visitor FEELS | <2s | >5s |
| **ai_think_ms** | T2-T1 (first_chunk - waiting_audio) | LLM thinking, HIDDEN behind opening | <3s | >5s |
| **stream_duration_ms** | T3-T2 (last_chunk - first_chunk) | Answer delivery time | varies | >5s |

**Precision note:** STT time has second precision only. msg.timestamp has millisecond precision. opening_latency_ms has ±1s uncertainty.

**Seamless Response Rate** = % where ai_think_time < opening_audio_duration (~3s). The killer executive metric.

## "Thank You" Stop Command Detection

**CRITICAL:** "Thank you" is a SAFE WORD that immediately kills Rambam mid-sentence.

### English Only Kill Switch

Only **English** "Thank you" (and variants: "thanks", "thank you very much") triggers the STOP.
Hebrew **"תודה"** does NOT stop Rambam — it's just polite conversation.

**The trigger word may change in the future.** The detection system is designed to analyze its effect regardless of what word is eventually chosen.

### Classification (implemented in process_log.py)

```python
classify_thank_you(text) → 'stop' | 'polite' | None

'stop'   = English kill switch (STOP badge, red)
'polite' = Hebrew thanks (Thanks badge, green)
None     = neither
```

### Edge Cases

| Scenario | Classification |
|----------|---------------|
| "Thank you" | `stop` (kill switch) |
| "Thank you, Rambam" | `stop` (polite stop) |
| "Thank you, thank you" | `stop` (emphatic stop) |
| "Thank you but what about..." | `None` (continuation, NOT a stop) |
| "Thank you. Tell me about..." | `None` (follow-up question) |
| "תודה רבה" | `polite` (Hebrew thanks, NOT a kill switch) |
| "תודה" | `polite` (Hebrew thanks) |
| "How do you feel today?" | `None` (no match — "toda" substring removed) |

### Fields on Conversation Records

- `is_thank_you_interrupt: bool` — true ONLY for English stop commands
- `thank_you_type: 'stop' | 'polite' | null` — full classification

### What the STOP Tells Us

- **Engagement quality**: Was the answer so long/boring the visitor cut it off?
- **Session ending**: Natural farewell vs mid-answer abort
- **Operator behavior**: Museum staff may use "thank you" to reset between visitors
- **Satisfaction signal**: Thank-you AFTER completed answer = satisfied. Mid-answer = possibly not.

## Topic Classification (Priority Order)

| Priority | Topic | Keywords |
|----------|-------|----------|
| 1 | Kashrut | בשר, חלב, כשר, meat, dairy, kosher |
| 2 | Military & Draft | צבא, גיוס, חרדי, army, military, draft |
| 3 | Interfaith | נצרות, christian, islam, מוסלמ, ישו, jesus |
| 4 | Theology | אלוהים, god, divine, נשמה, soul |
| 5 | Torah & Text | פרשת, תורה, torah, תלמוד |
| 6 | Jewish Law | הלכה, halacha, שבת, shabbat |
| 7 | Philosophy | חכמה, wisdom, ethics, tolerance |
| 8 | Personal Life | ילד, education, חינוך, medicine |
| 9 | History | egypt, מצרים, spain, ספרד |
| 10 | Relationships | אהבה, love, marriage |
| 11 | Meta | מוזיאון, museum, hologram, ai |
| 12 | Blessings | ברכ, bless, prayer |
| 13 | Daily Life | קפה, coffee, sleep, morning routine |
| 14 | Greetings | שלום, hello, תודה, bye |

If no match and question < 15 chars → "Greetings". Otherwise → "General".
When "General" exceeds 40%, review and add new keywords.

## Anomaly Detection

| Condition | Type | Severity |
|-----------|------|----------|
| `language == "unknown"` | LANG_UNKNOWN | Critical |
| No answer text | EMPTY_RESPONSE | Critical |
| Response code != 200 | NON_200_CODE | Critical |
| Answer contains "rephrase"/"לא הבנתי" | FALLBACK_TRIGGERED | Warning |
| latency_ms > 6000 | LATENCY_SPIKE_CRITICAL | Critical |
| latency_ms > 3000 | LATENCY_SPIKE_WARN | Warning |
| stream_chunk before waiting_audio | OUT_OF_ORDER | Critical |
| ai_think_ms > opening_duration | THINK_OVERFLOW | Warning |
| opening_latency_ms > 5000 | OPENING_LATENCY_CRITICAL | Critical |
| opening_latency_ms > 3000 | OPENING_LATENCY_WARN | Warning |

## Output Schema (per conversation)

```json
{
  "id": "UUID",
  "date": "2026-02-15",
  "time": "2026/2/15 6:53:43",
  "hour": 6,
  "question": "האם אלוהים ישב באוהל המשכן?",
  "answer": "אל תחשוב כלל...",
  "question_en": "Does God sit in the Tabernacle tent?",
  "answer_en": "Do not think at all...",
  "language": "he-IL",
  "question_type": "Closed questions",
  "topic": "Theology",
  "opening_text": "The matter is simple...",
  "audio_id": "31",
  "latency_ms": 5733,
  "opening_latency_ms": 2000,
  "ai_think_ms": 2972,
  "stream_duration_ms": 761,
  "is_out_of_order": false,
  "answer_length": 487,
  "chunk_count": 8,
  "is_complete": true,
  "is_greeting": false,
  "is_thank_you_interrupt": false,
  "thank_you_type": null,
  "is_comprehension_failure": false,
  "is_no_answer": false,
  "is_anomaly": false,
  "anomaly_type": null,
  "anomalies": [],
  "sensitivity": "medium",
  "vip": null,
  "needs_translation": true
}
```

## Quality Checks After Processing

- [ ] Total conversations ≈ count of STT events in raw file
- [ ] No conversation has empty question
- [ ] Latency values positive where present
- [ ] "General" topic < 40% of total
- [ ] All Hebrew conversations have `needs_translation: true`
- [ ] Interactions sorted chronologically (first.time < last.time)
- [ ] Daily summary matches interaction count
- [ ] English "Thank you" classified as `stop`, Hebrew "תודה" as `polite`
- [ ] STOP count: 34 English across 9 days (validates detection is working)
