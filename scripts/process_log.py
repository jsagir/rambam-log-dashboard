#!/usr/bin/env python3
"""Parse a single raw Rambam log file into structured JSON."""

import json
import sys
import os
import re
import time as _time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

try:
    from deep_translator import GoogleTranslator
    _translator = GoogleTranslator(source='iw', target='en')
    HAS_TRANSLATOR = True
except ImportError:
    HAS_TRANSLATOR = False


def translate_he_to_en(text):
    """Translate Hebrew text to English. Returns empty string on failure."""
    if not HAS_TRANSLATOR or not text or not text.strip():
        return ''
    # Skip if no Hebrew characters
    if not any('\u0590' <= c <= '\u05FF' for c in text):
        return ''
    try:
        result = _translator.translate(text[:2000])  # cap at 2000 chars
        _time.sleep(0.15)  # rate limit
        return result or ''
    except Exception:
        return ''

ISRAEL_TZ = ZoneInfo('Asia/Jerusalem')

# Estimated opening audio duration in ms (average pre-recorded clip ~3s)
ESTIMATED_OPENING_DURATION_MS = 3000

# Topic classification keywords (Hebrew + English)
TOPIC_RULES = {
    'Kashrut':           ['בשר', 'חלב', 'כשר', 'meat', 'dairy', 'kosher', 'טרף', 'שחיטה'],
    'Military & Draft':  ['צבא', 'גיוס', 'חרדי', 'army', 'military', 'draft', 'haredi', 'ultra-orthodox', 'yeshiva', 'ישיבות', 'חיילות', 'soldiers', 'חייל'],
    'Theology':          ['אלוהים', 'אלהים', 'god', 'השגחה', 'שכינה', 'divine', 'creator', 'נשמה', 'soul', 'miracle', 'נס'],
    'Torah & Text':      ['פרשת', 'תורה', 'torah', 'parsha', 'בראשית', 'ספר', 'פסוק', 'verse', 'scripture', 'תלמוד', 'talmud', 'גמרא'],
    'Jewish Law':        ['הלכה', 'halacha', 'mitzvah', 'מצוו', 'נדר', 'shabbat', 'שבת', 'נביא', 'צדיק', 'משיח', 'תשובה'],
    'Philosophy':        ['חכמה', 'wisdom', 'מוסר', 'ethics', 'virtue', 'truth', 'אמת', 'tolerance', 'סובלנות', 'justice', 'צדק', 'meaning of life'],
    'Interfaith':        ['נצרות', 'christian', 'islam', 'מוסלמ', 'ישו', 'jesus', 'church', 'כנסייה', 'mosque', 'מסגד', 'עבודה זרה', 'idolatry'],
    'Personal Life':     ['ילד', 'child', 'education', 'חינוך', 'medicine', 'רפואה', 'doctor', 'family', 'משפחה', 'advice', 'anger', 'כעס'],
    'History':           ['egypt', 'מצרים', 'spain', 'ספרד', 'where did you live', 'ארץ ישראל', 'holocaust', 'born', 'נולד'],
    'Relationships':     ['אהבה', 'זוגיות', 'love', 'marriage', 'נישואין', 'couple'],
    'Meta':              ['מוזיאון', 'museum', 'הולוגרמ', 'hologram', 'robot', 'ai', 'artificial intelligence', 'בינה מלאכותית', 'technology', 'טכנולוגיה'],
    'Blessings':         ['ברכ', 'bless', 'תברך', 'prayer', 'תפילה'],
    'Daily Life':        ['קפה', 'coffee', 'sleep', 'שנת', 'רחץ', 'wash', 'tea', 'walk', 'הליכ', 'breakfast', 'morning routine'],
    'Greetings':         ['בוקר טוב', 'good morning', 'שלום', 'hello', 'thank you', 'תודה', 'bye', 'להתראות'],
}

# Topic priority order (higher index = lower priority)
TOPIC_PRIORITY = [
    'Kashrut', 'Military & Draft', 'Interfaith', 'Theology', 'Torah & Text',
    'Jewish Law', 'Philosophy', 'Personal Life', 'History', 'Relationships',
    'Meta', 'Blessings', 'Daily Life', 'Greetings'
]

GREETING_PATTERNS = [
    'שלום', 'היי', 'הי ', 'בוקר טוב', 'ערב טוב', 'מה שלומך', 'מה נשמע',
    'hello', 'hi ', 'hey', 'good morning', 'good evening', 'how are you',
    'תודה', 'thank', 'bye', 'להתראות', 'שלום רב',
]

SENSITIVITY_MAP = {
    'Military & Draft': 'high',
    'Interfaith': 'critical',
    'Meta': 'low',
    'Greetings': 'low',
    'Daily Life': 'low',
    'Blessings': 'low',
    'Kashrut': 'medium',
    'Theology': 'medium',
    'Torah & Text': 'low',
    'Jewish Law': 'medium',
    'Philosophy': 'low',
    'Personal Life': 'low',
    'History': 'low',
    'Relationships': 'low',
}

CRITICAL_KEYWORDS = ['עבודה זרה', 'idolatry', 'נצרות', 'ישו', 'jesus', 'נתניהו', 'netanyahu', 'bibi', 'ביבי', 'government', 'ממשלה']


def parse_time(time_str):
    """Parse non-zero-padded time like '2026/2/15 6:53:43'."""
    try:
        return datetime.strptime(time_str, '%Y/%m/%d %H:%M:%S')
    except (ValueError, TypeError):
        return None


def stt_time_to_epoch_ms(time_str):
    """Convert STT time string (Israel local, second precision) to epoch ms."""
    try:
        dt = datetime.strptime(time_str, '%Y/%m/%d %H:%M:%S')
        dt_local = dt.replace(tzinfo=ISRAEL_TZ)
        return int(dt_local.timestamp() * 1000)
    except (ValueError, TypeError):
        return None


def is_greeting(text):
    """Check if text is a greeting/farewell."""
    text_lower = text.lower().strip()
    for p in GREETING_PATTERNS:
        if p in text_lower:
            return True
    return len(text.strip()) < 15


def detect_language(text):
    """Detect language from text characters."""
    hebrew = sum(1 for c in text if '\u0590' <= c <= '\u05FF')
    latin = sum(1 for c in text if 'a' <= c.lower() <= 'z')
    cyrillic = sum(1 for c in text if '\u0400' <= c <= '\u04FF')
    arabic = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    total = hebrew + latin + cyrillic + arabic
    if total == 0:
        return 'unknown'
    if hebrew / total > 0.4:
        return 'he'
    if latin / total > 0.4:
        return 'en'
    if cyrillic / total > 0.2:
        return 'ru'
    if arabic / total > 0.2:
        return 'ar'
    return 'unknown'


def classify_topic(question):
    """Classify question into a topic category."""
    q_lower = question.lower()
    matches = []
    for topic, keywords in TOPIC_RULES.items():
        for kw in keywords:
            if kw.lower() in q_lower:
                matches.append(topic)
                break
    if not matches:
        if len(question.strip()) < 15:
            return 'Greetings'
        return 'General'
    # Return highest priority match
    for topic in TOPIC_PRIORITY:
        if topic in matches:
            return topic
    return matches[0]


def rate_sensitivity(topic, question):
    """Rate sensitivity level."""
    q_lower = question.lower()
    for kw in CRITICAL_KEYWORDS:
        if kw.lower() in q_lower:
            return 'critical'
    return SENSITIVITY_MAP.get(topic, 'low')


def detect_vip(question):
    """Detect VIP visitors from greeting text."""
    patterns = [
        r'(?:אני|שמי|קוראים לי)\s+(.+?)(?:\s*[,.]|$)',
        r'(?:my name is|i\'m|i am)\s+(.+?)(?:\s*[,.]|$)',
        r'(?:פרופסור|דוקטור|professor|doctor|dr\.?)\s+(\S+)',
    ]
    for pat in patterns:
        m = re.search(pat, question, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def parse_log_file(filepath):
    """Parse a raw log file into structured entries."""
    entries = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                entry['_line'] = line_num
                entries.append(entry)
            except json.JSONDecodeError:
                continue
    return entries


def group_interactions(entries):
    """Group log entries into complete interactions."""
    interactions = []
    stt_entries = []
    ai_groups = {}

    # Separate STT and AI messages, group AI by msg.id
    for entry in entries:
        if entry.get('type') == 'stt':
            stt_entries.append(entry)
        elif entry.get('type') == 'ai_message':
            msg = entry.get('msg', {})
            if isinstance(msg, dict):
                msg_id = msg.get('id', '')
                if msg_id not in ai_groups:
                    ai_groups[msg_id] = []
                ai_groups[msg_id].append(entry)

    # Match each AI group with preceding STT
    used_stt = set()
    for msg_id, ai_entries in ai_groups.items():
        # Find classification (waiting_audio) and decompose timestamps
        classification = None
        chunks = []
        waiting_audio_ts = None   # T1: opening sentence dispatched
        first_chunk_ts = None     # T2: first LLM stream chunk
        last_chunk_ts = None      # T3: final stream chunk

        for ae in ai_entries:
            msg = ae.get('msg', {})
            if not isinstance(msg, dict):
                continue
            msg_type = msg.get('type', '')
            ts = msg.get('timestamp')

            if msg_type == 'waiting_audio':
                classification = msg.get('data', {})
                if ts:
                    waiting_audio_ts = ts
            elif msg_type == 'stream_chunk':
                data = msg.get('data', {})
                if data.get('result'):
                    chunks.append(data['result'])
                if ts:
                    if first_chunk_ts is None or ts < first_chunk_ts:
                        first_chunk_ts = ts
                    if last_chunk_ts is None or ts > last_chunk_ts:
                        last_chunk_ts = ts

        # Backward-compatible first_ts/last_ts
        first_ts = waiting_audio_ts or first_chunk_ts
        last_ts = last_chunk_ts

        # Find the STT that triggered this AI group
        ai_time = parse_time(ai_entries[0].get('time', ''))
        best_stt = None
        best_idx = -1
        if ai_time:
            for i, stt in enumerate(stt_entries):
                if i in used_stt:
                    continue
                stt_time = parse_time(stt.get('time', ''))
                if stt_time and stt_time <= ai_time:
                    if best_stt is None or stt_time > parse_time(best_stt.get('time', '')):
                        best_stt = stt
                        best_idx = i

        if best_stt and best_idx >= 0:
            used_stt.add(best_idx)

        question = best_stt.get('msg', '') if best_stt else ''
        question_time = best_stt.get('time', '') if best_stt else ai_entries[0].get('time', '')
        full_answer = ''.join(chunks)

        # Compute three-latency decomposition (Two-Latency Model)
        stt_epoch_ms = stt_time_to_epoch_ms(question_time) if question_time else None

        # Opening Latency (T1-T0): silence gap visitor feels
        opening_latency_ms = None
        if stt_epoch_ms and waiting_audio_ts:
            opening_latency_ms = waiting_audio_ts - stt_epoch_ms
            if opening_latency_ms < 0:
                opening_latency_ms = None  # Clock skew

        # AI Think Time (T2-T1): hidden behind opening audio
        ai_think_ms = None
        if waiting_audio_ts and first_chunk_ts:
            ai_think_ms = first_chunk_ts - waiting_audio_ts

        # Stream Duration (T3-T2): answer delivery
        stream_duration_ms = None
        if first_chunk_ts and last_chunk_ts:
            stream_duration_ms = last_chunk_ts - first_chunk_ts

        # Out-of-order detection: stream_chunk arrived BEFORE waiting_audio
        # (David's bug: Rambam receives answer but doesn't speak it)
        is_out_of_order = False
        if waiting_audio_ts and first_chunk_ts and first_chunk_ts < waiting_audio_ts:
            is_out_of_order = True

        # Backward-compatible total latency (T3-T1)
        latency_ms = 0
        if first_ts and last_ts:
            latency_ms = last_ts - first_ts
        elif first_ts and ai_time:
            latency_ms = 0

        # Language from classification
        lang = 'unknown'
        question_type = 'General'
        opening_text = ''
        audio_id = ''
        if classification:
            lang = classification.get('language', 'unknown')
            question_type = classification.get('question_type', 'General')
            opening_text = classification.get('opening_text', '')
            audio_id = str(classification.get('audio_id', ''))

        # Detect anomalies
        anomalies = []
        if lang == 'unknown' or 'unknown' in lang.lower():
            anomalies.append('LANG_UNKNOWN')
        if not full_answer.strip():
            anomalies.append('EMPTY_RESPONSE')
        if latency_ms > 6000:
            anomalies.append('LATENCY_SPIKE_CRITICAL')
        elif latency_ms > 3000:
            anomalies.append('LATENCY_SPIKE_WARN')

        # Out-of-order: answer arrived before opening sentence ID
        # (David/Starcloud bug: Rambam receives answer but doesn't speak it)
        if is_out_of_order:
            anomalies.append('OUT_OF_ORDER')

        # Opening latency anomalies (visitor silence gap)
        if opening_latency_ms is not None:
            if opening_latency_ms > 5000:
                anomalies.append('OPENING_LATENCY_CRITICAL')
            elif opening_latency_ms > 3000:
                anomalies.append('OPENING_LATENCY_WARN')

        # Think time overflow: AI took longer than opening audio covers
        if ai_think_ms is not None and ai_think_ms > ESTIMATED_OPENING_DURATION_MS:
            anomalies.append('THINK_OVERFLOW')

        # Check for non-200 codes
        for ae in ai_entries:
            msg = ae.get('msg', {})
            if isinstance(msg, dict) and msg.get('code', 200) != 200:
                if 'NON_200_CODE' not in anomalies:
                    anomalies.append('NON_200_CODE')

        # Detect comprehension failure
        fallback_patterns = ['please rephrase', 'לא הבנתי', 'אנא נסח', 'could you repeat', 'i didn\'t understand']
        is_comprehension_failure = any(p in full_answer.lower() for p in fallback_patterns)
        if is_comprehension_failure:
            anomalies.append('FALLBACK_TRIGGERED')

        # Topic and sensitivity
        topic = classify_topic(question) if question else 'General'
        sensitivity = rate_sensitivity(topic, question) if question else 'low'
        vip = detect_vip(question) if question else None

        # Parse hour
        parsed_time = parse_time(question_time)
        hour = parsed_time.hour if parsed_time else 0

        interaction = {
            'id': msg_id,
            'date': parsed_time.strftime('%Y-%m-%d') if parsed_time else '',
            'time': question_time,
            'hour': hour,
            'question': question,
            'answer': full_answer,
            'question_en': question if detect_language(question) == 'en' else translate_he_to_en(question),
            'answer_en': translate_he_to_en(full_answer) if lang == 'he-IL' else '',
            'language': lang,
            'question_type': question_type,
            'topic': topic,
            'opening_text': opening_text,
            'audio_id': audio_id,
            'latency_ms': latency_ms,
            'opening_latency_ms': opening_latency_ms,
            'ai_think_ms': ai_think_ms,
            'stream_duration_ms': stream_duration_ms,
            'is_out_of_order': is_out_of_order,
            'answer_length': len(full_answer),
            'chunk_count': len(chunks),
            'is_complete': any(
                ae.get('msg', {}).get('data', {}).get('finished', False)
                for ae in ai_entries
                if isinstance(ae.get('msg', {}), dict) and isinstance(ae.get('msg', {}).get('data', {}), dict)
            ),
            'is_greeting': is_greeting(question) if question else False,
            'is_comprehension_failure': is_comprehension_failure,
            'is_no_answer': not full_answer.strip(),
            'is_anomaly': len(anomalies) > 0,
            'anomaly_type': anomalies[0] if anomalies else None,
            'anomalies': anomalies,
            'sensitivity': sensitivity,
            'vip': vip,
            'needs_translation': lang == 'he-IL',
        }
        interactions.append(interaction)

    # Handle orphaned STT entries (greetings with no AI response)
    for i, stt in enumerate(stt_entries):
        if i not in used_stt:
            parsed_time = parse_time(stt.get('time', ''))
            question = stt.get('msg', '')
            topic = classify_topic(question) if question else 'Greetings'
            interactions.append({
                'id': f'orphan_{i}',
                'date': parsed_time.strftime('%Y-%m-%d') if parsed_time else '',
                'time': stt.get('time', ''),
                'hour': parsed_time.hour if parsed_time else 0,
                'question': question,
                'answer': '',
                'question_en': question if detect_language(question) == 'en' else translate_he_to_en(question),
                'answer_en': '',
                'language': 'unknown',
                'question_type': 'Greeting' if is_greeting(question) else 'General',
                'topic': topic,
                'opening_text': '',
                'audio_id': '',
                'latency_ms': 0,
                'answer_length': 0,
                'chunk_count': 0,
                'is_complete': False,
                'is_greeting': is_greeting(question),
                'is_comprehension_failure': False,
                'is_no_answer': True,
                'is_anomaly': True,
                'anomaly_type': 'STT_DROPPED',
                'anomalies': ['STT_DROPPED'],
                'sensitivity': 'low',
                'vip': None,
                'needs_translation': detect_language(question) == 'he',
            })

    # Sort by time
    interactions.sort(key=lambda x: parse_time(x['time']) or datetime.min)

    return interactions


def compute_daily_summary(interactions, date_str):
    """Compute summary stats for a day."""
    total = len(interactions)
    if total == 0:
        return {}

    languages = {}
    topics = {}
    question_types = {}
    hourly = {}
    latencies = [i['latency_ms'] for i in interactions if i['latency_ms'] > 0]
    opening_lats = [i['opening_latency_ms'] for i in interactions if i.get('opening_latency_ms') and i['opening_latency_ms'] > 0]
    think_times = [i['ai_think_ms'] for i in interactions if i.get('ai_think_ms') and i['ai_think_ms'] > 0]
    stream_durs = [i['stream_duration_ms'] for i in interactions if i.get('stream_duration_ms') and i['stream_duration_ms'] > 0]
    failures = sum(1 for i in interactions if i['is_comprehension_failure'])
    no_answers = sum(1 for i in interactions if i['is_no_answer'])
    anomaly_count = sum(1 for i in interactions if i['is_anomaly'])
    out_of_order_count = sum(1 for i in interactions if i.get('is_out_of_order'))

    for inter in interactions:
        lang = inter['language']
        languages[lang] = languages.get(lang, 0) + 1
        topic = inter['topic']
        topics[topic] = topics.get(topic, 0) + 1
        qt = inter['question_type']
        question_types[qt] = question_types.get(qt, 0) + 1
        h = inter['hour']
        hourly[h] = hourly.get(h, 0) + 1

    # Day of week
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        dow = dt.strftime('%a')
    except ValueError:
        dow = ''

    times = [parse_time(i['time']) for i in interactions if parse_time(i['time'])]
    first_time = min(times).strftime('%H:%M') if times else ''
    last_time = max(times).strftime('%H:%M') if times else ''

    return {
        'date': date_str,
        'day_of_week': dow,
        'total_conversations': total,
        'avg_latency_ms': int(sum(latencies) / len(latencies)) if latencies else 0,
        'max_latency_ms': max(latencies) if latencies else 0,
        'min_latency_ms': min(latencies) if latencies else 0,
        'language_distribution': languages,
        'topic_distribution': topics,
        'question_type_distribution': question_types,
        'hourly_distribution': {str(k): v for k, v in sorted(hourly.items())},
        'failure_count': failures,
        'no_answer_count': no_answers,
        'anomaly_count': anomaly_count,
        'out_of_order_count': out_of_order_count,
        'avg_opening_latency_ms': int(sum(opening_lats) / len(opening_lats)) if opening_lats else 0,
        'avg_ai_think_ms': int(sum(think_times) / len(think_times)) if think_times else 0,
        'max_ai_think_ms': max(think_times) if think_times else 0,
        'avg_stream_duration_ms': int(sum(stream_durs) / len(stream_durs)) if stream_durs else 0,
        'seamless_rate': round(sum(1 for t in think_times if t < ESTIMATED_OPENING_DURATION_MS) / len(think_times) * 100, 1) if think_times else 0,
        'first_interaction': first_time,
        'last_interaction': last_time,
    }


def process_single_log(filepath):
    """Process a single log file and write processed JSON."""
    filepath = Path(filepath)
    if not filepath.exists():
        print(f"Error: {filepath} not found")
        sys.exit(1)

    # Extract date from filename
    stem = filepath.stem  # e.g., '20260215' or '20260222-2'
    date_part = stem.split('-')[0]  # '20260215'
    try:
        date_str = f"{date_part[:4]}-{date_part[4:6]}-{date_part[6:8]}"
    except (IndexError, ValueError):
        date_str = 'unknown'

    print(f"Processing {filepath.name}...")
    entries = parse_log_file(str(filepath))
    interactions = group_interactions(entries)

    # Set date on all interactions
    for inter in interactions:
        if not inter['date']:
            inter['date'] = date_str

    summary = compute_daily_summary(interactions, date_str)

    output = {
        'date': date_str,
        'filename': filepath.name,
        'summary': summary,
        'interactions': interactions,
    }

    # Write to logs/processed/
    project_root = Path(__file__).parent.parent
    out_dir = project_root / 'logs' / 'processed'
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{stem}.json"

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"  → {len(interactions)} interactions → {out_path.name}")
    return output


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 process_log.py <log_file.txt>")
        sys.exit(1)
    process_single_log(sys.argv[1])
