---
name: rambam-log-extractor
description: >
  Rambam AI Log Extraction & Classification Agent. Parses raw Museum of Tolerance holographic
  Rambam interaction logs (.txt JSON-lines files) into structured conversation records.
  ALWAYS use this skill when: processing a new Rambam log file, parsing hologram interaction data,
  debugging raw log format issues, adding new topic categories, or fixing classification rules.
  This skill runs FIRST in the pipeline. Its output feeds into rambam-viz-shaper.
  Triggers: "process log", "new log file", "parse rambam", "extract conversations",
  "20260225.txt", any .txt file with STT/ai_message events.
---

# Rambam Log Extractor

*"I turn raw event streams into clean conversation records."*

The first agent in the Rambam Dashboard processing pipeline. Reads raw log files and produces structured, classified conversation records.

**Pipeline position:** `Raw .txt → [THIS SKILL] → Clean Records → [rambam-viz-shaper] → accumulated.json → Dashboard`

**Stack context:** This project uses Vite + React + Recharts. Data flows through Python scripts → `public/data/accumulated.json` → fetched by React dashboard. No Supabase — all data is file-based.

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

## Parsing Rules (implemented in scripts/process_log.py)

1. Group events: each STT starts a conversation, followed by ai_messages with same ID
2. Extract classification from `waiting_audio`: language, question_type, opening_text, audio_id
3. Concatenate all stream_chunk results into full answer
4. Compute `latency_ms = last_timestamp - first_timestamp` from ai_message timestamps
5. Classify topic via keyword matching (13 categories + General + Greetings)
6. Detect anomalies: LANG_UNKNOWN, EMPTY_RESPONSE, LATENCY_SPIKE_WARN (>3s), LATENCY_SPIKE_CRITICAL (>6s), NON_200_CODE, FALLBACK_TRIGGERED
7. Sort all interactions chronologically

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

## Output Schema (per conversation)

```json
{
  "id": "UUID",
  "date": "2026-02-15",
  "time": "2026/2/15 6:53:43",
  "hour": 6,
  "question": "האם אלוהים ישב באוהל המשכן?",
  "answer": "אל תחשוב כלל...",
  "question_en": "",
  "answer_en": "",
  "language": "he-IL",
  "question_type": "Closed questions",
  "topic": "Theology",
  "opening_text": "The matter is simple...",
  "latency_ms": 3733,
  "answer_length": 487,
  "chunk_count": 8,
  "is_complete": true,
  "is_greeting": false,
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
