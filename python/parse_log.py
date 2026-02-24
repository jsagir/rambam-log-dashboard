#!/usr/bin/env python3
"""
Rambam Log Parser — Extracts structured interactions from raw log files.

Usage:
    python3 parse_log.py <log_file_path> --output <output_json_path>
"""

import json
import sys
import argparse
import re
from datetime import datetime
from collections import defaultdict


def parse_time(time_str):
    """Parse the non-zero-padded time format used in Rambam logs."""
    try:
        return datetime.strptime(time_str, "%Y/%m/%d %H:%M:%S")
    except ValueError:
        # Handle single-digit components: "2026/2/22 7:2:12"
        parts = time_str.split(" ")
        date_parts = parts[0].split("/")
        time_parts = parts[1].split(":")
        normalized = f"{date_parts[0]}/{int(date_parts[1]):02d}/{int(date_parts[2]):02d} " \
                     f"{int(time_parts[0]):02d}:{int(time_parts[1]):02d}:{int(time_parts[2]):02d}"
        return datetime.strptime(normalized, "%Y/%m/%d %H:%M:%S")


def parse_time_with_ms(time_str):
    """Parse time that may include milliseconds (from stress test logs)."""
    if ":" in time_str and time_str.count(":") > 2:
        # Format like "09.42.37:741" — non-standard, handle gracefully
        pass
    return parse_time(time_str)


GREETING_PATTERNS = [
    r"^thank\s*you",
    r"^thanks",
    r"^תודה",
    r"^שלום",
    r"^shalom",
    r"^good\s*morning",
    r"^בוקר\s*טוב",
    r"^hello",
    r"^hi\b",
    r"^hey\b",
]


def is_greeting(text):
    """Check if text is a simple greeting/thanks (not a real question)."""
    text_lower = text.strip().lower()
    for pattern in GREETING_PATTERNS:
        if re.match(pattern, text_lower, re.IGNORECASE):
            return True
    return False


def detect_language_from_text(text):
    """Heuristic language detection from text content."""
    hebrew_chars = len(re.findall(r'[\u0590-\u05FF]', text))
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    cyrillic_chars = len(re.findall(r'[\u0400-\u04FF]', text))
    latin_chars = len(re.findall(r'[a-zA-Z]', text))
    total = hebrew_chars + arabic_chars + cyrillic_chars + latin_chars
    if total == 0:
        return "unknown"
    if hebrew_chars / max(total, 1) > 0.3:
        return "he"
    if arabic_chars / max(total, 1) > 0.3:
        return "ar"
    if cyrillic_chars / max(total, 1) > 0.3:
        return "ru"
    if latin_chars / max(total, 1) > 0.3:
        return "en"
    return "unknown"


PERSONA_BREAK_PATTERNS = [
    r"I only support (Hebrew and English|English and Hebrew)",
    r"System error",
    r"Error processing",
]

FALLBACK_PATTERNS = [
    r"I want to make sure I understand you correctly",
    r"Could you please rephrase your question",
    r"אני רוצה לוודא שהבנתי אותך נכון",
    r"אפשר לנסח את השאלה שוב",
]


def check_persona_break(text):
    """Check if response text contains system-level messages breaking persona."""
    for pattern in PERSONA_BREAK_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def check_fallback(text):
    """Check if response is a fallback/rephrase request."""
    for pattern in FALLBACK_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def parse_log_file(filepath):
    """Parse a Rambam log file and return structured entries."""
    entries = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                entry["_line_num"] = line_num
                entries.append(entry)
            except json.JSONDecodeError:
                entries.append({
                    "_line_num": line_num,
                    "_parse_error": True,
                    "_raw": line
                })
    return entries


def group_interactions(entries):
    """Group log entries into complete interactions (question + classification + answer).

    Strategy: Work from ai_message groups backward to find the triggering STT.
    Each unique msg.id represents one AI response. We find the closest preceding STT
    that hasn't already been claimed by another ai_message group.

    STT entries that don't trigger any AI response (e.g., "Thank you") are recorded
    as standalone greetings with no response.
    """
    interactions = []
    ai_messages_by_id = defaultdict(list)

    # First pass: group all ai_messages by their msg.id
    unique_msg_ids_ordered = []
    seen_ids = set()
    for entry in entries:
        if entry.get("type") == "ai_message" and isinstance(entry.get("msg"), dict):
            msg_id = entry["msg"].get("id", "unknown")
            ai_messages_by_id[msg_id].append(entry)
            if msg_id not in seen_ids:
                unique_msg_ids_ordered.append(msg_id)
                seen_ids.add(msg_id)

    # Second pass: for each AI response group, find the closest preceding STT
    # that is between the previous AI group's first message and this group's first message
    claimed_stt_lines = set()
    ai_to_stt = {}  # msg_id -> stt_entry

    all_stt = [e for e in entries if e.get("type") == "stt"]

    for msg_id in unique_msg_ids_ordered:
        ai_group = ai_messages_by_id[msg_id]
        first_ai_line = min(e["_line_num"] for e in ai_group)

        # Find the closest preceding STT that hasn't been claimed
        best_stt = None
        for stt in reversed(all_stt):
            if stt["_line_num"] < first_ai_line and stt["_line_num"] not in claimed_stt_lines:
                best_stt = stt
                break

        if best_stt:
            claimed_stt_lines.add(best_stt["_line_num"])
            ai_to_stt[msg_id] = best_stt

    # Third pass: build interactions for each AI response group
    for msg_id in unique_msg_ids_ordered:
        ai_group = ai_messages_by_id[msg_id]
        stt = ai_to_stt.get(msg_id)

        if stt:
            question_text = stt.get("msg", "")
            stt_time_str = stt["time"]
            stt_time = parse_time(stt_time_str)
        else:
            question_text = "[no STT captured]"
            stt_time_str = ai_group[0]["time"]
            stt_time = parse_time(stt_time_str)

        # Extract classification (waiting_audio)
        waiting_audio = None
        stream_chunks = []
        for ai_entry in ai_group:
            msg_type = ai_entry["msg"].get("type")
            if msg_type == "waiting_audio":
                waiting_audio = ai_entry
            elif msg_type == "stream_chunk":
                stream_chunks.append(ai_entry)

        # Reconstruct full answer
        answer_parts = []
        for chunk in stream_chunks:
            result = chunk["msg"].get("data", {}).get("result", "")
            if result:
                answer_parts.append(result)

        full_answer = "".join(answer_parts).strip()

        # Extract metadata
        classification = {}
        if waiting_audio:
            data = waiting_audio["msg"].get("data", {})
            classification = {
                "question_type": data.get("question_type", "unknown"),
                "language": data.get("language", "unknown"),
                "audio_id": data.get("audio_id", "unknown"),
                "opening_text": data.get("opening_text", ""),
            }

        # Compute latencies (using msg.timestamp in milliseconds)
        latencies = {}
        if waiting_audio:
            wa_ts = waiting_audio["msg"].get("timestamp", 0)
            if stream_chunks:
                first_chunk_ts = stream_chunks[0]["msg"].get("timestamp", 0)
                last_chunk_ts = stream_chunks[-1]["msg"].get("timestamp", 0)
                latencies["classification_to_first_chunk_ms"] = first_chunk_ts - wa_ts
                latencies["classification_to_last_chunk_ms"] = last_chunk_ts - wa_ts
                latencies["generation_duration_ms"] = last_chunk_ts - first_chunk_ts

        # Check for anomalies
        anomalies = []
        if classification.get("language") == "unknown":
            anomalies.append("LANG_UNKNOWN")
        if waiting_audio and not stream_chunks:
            anomalies.append("LLM_ERROR")
        if check_persona_break(full_answer):
            anomalies.append("PERSONA_BREAK")
        if check_fallback(full_answer):
            anomalies.append("FALLBACK_TRIGGERED")
        if not full_answer and stream_chunks:
            anomalies.append("EMPTY_RESPONSE")
        if stream_chunks and not stream_chunks[-1]["msg"].get("data", {}).get("finished", False):
            anomalies.append("INCOMPLETE_RESPONSE")
        if len(question_text.split()) < 4 and not is_greeting(question_text):
            anomalies.append("STT_TRUNCATION")
        if ai_group and ai_group[0]["msg"].get("code") != 200:
            anomalies.append("NON_200_CODE")

        # Check latency thresholds
        gen_start = latencies.get("classification_to_first_chunk_ms", 0)
        if gen_start > 6000:
            anomalies.append("LATENCY_SPIKE_CRITICAL")
        elif gen_start > 3000:
            anomalies.append("LATENCY_SPIKE_WARN")

        # Response language from chunks
        response_language = "unknown"
        if stream_chunks:
            response_language = stream_chunks[0]["msg"].get("data", {}).get("language", "unknown")

        interaction = {
            "index": len(interactions) + 1,
            "msg_id": msg_id,
            "stt_time": stt_time_str,
            "stt_timestamp_parsed": stt_time.isoformat(),
            "question": question_text,
            "question_language_detected": detect_language_from_text(question_text),
            "is_greeting": is_greeting(question_text),
            "word_count": len(question_text.split()),
            "classification": classification,
            "response_language": response_language,
            "full_answer": full_answer,
            "answer_chunk_count": len(stream_chunks),
            "latencies": latencies,
            "anomalies": anomalies,
        }

        interactions.append(interaction)

    # Fourth pass: add unclaimed STT entries as standalone greetings/orphans
    for stt in all_stt:
        if stt["_line_num"] not in claimed_stt_lines:
            question_text = stt.get("msg", "")
            stt_time = parse_time(stt["time"])
            anomalies = []
            if not is_greeting(question_text):
                anomalies.append("STT_DROPPED")

            interactions.append({
                "index": len(interactions) + 1,
                "msg_id": None,
                "stt_time": stt["time"],
                "stt_timestamp_parsed": stt_time.isoformat(),
                "question": question_text,
                "question_language_detected": detect_language_from_text(question_text),
                "is_greeting": is_greeting(question_text),
                "word_count": len(question_text.split()),
                "classification": {},
                "response_language": None,
                "full_answer": None,
                "answer_chunk_count": 0,
                "latencies": {},
                "anomalies": anomalies,
            })

    # Sort all interactions by time
    interactions.sort(key=lambda x: parse_time(x["stt_time"]))

    # Re-index
    for idx, interaction in enumerate(interactions):
        interaction["index"] = idx + 1

    return interactions


def group_into_sessions(interactions, gap_minutes=30):
    """Group interactions into sessions based on time gaps."""
    if not interactions:
        return []

    sessions = []
    current_session = {
        "session_id": 1,
        "interactions": [interactions[0]],
        "start_time": interactions[0]["stt_time"],
    }

    for i in range(1, len(interactions)):
        prev_time = parse_time(interactions[i - 1]["stt_time"])
        curr_time = parse_time(interactions[i]["stt_time"])
        gap = (curr_time - prev_time).total_seconds() / 60

        if gap > gap_minutes:
            current_session["end_time"] = interactions[i - 1]["stt_time"]
            current_session["interaction_count"] = len(current_session["interactions"])
            sessions.append(current_session)
            current_session = {
                "session_id": len(sessions) + 1,
                "interactions": [interactions[i]],
                "start_time": interactions[i]["stt_time"],
            }
        else:
            current_session["interactions"].append(interactions[i])

    # Close last session
    current_session["end_time"] = interactions[-1]["stt_time"]
    current_session["interaction_count"] = len(current_session["interactions"])
    sessions.append(current_session)

    return sessions


def compute_summary(interactions, sessions):
    """Compute overall summary statistics."""
    total = len(interactions)
    questions_only = [i for i in interactions if not i.get("is_greeting")]
    languages = set()
    for i in interactions:
        lang = i.get("classification", {}).get("language", i.get("question_language_detected", "unknown"))
        if lang != "unknown":
            languages.add(lang)

    # Latency stats
    gen_latencies = [i["latencies"]["classification_to_first_chunk_ms"]
                     for i in interactions
                     if i.get("latencies", {}).get("classification_to_first_chunk_ms")]

    latency_stats = {}
    if gen_latencies:
        latency_stats = {
            "generation_start_ms": {
                "min": min(gen_latencies),
                "max": max(gen_latencies),
                "avg": round(sum(gen_latencies) / len(gen_latencies)),
                "samples": len(gen_latencies),
            }
        }

    # Question type distribution
    q_types = defaultdict(int)
    for i in interactions:
        qt = i.get("classification", {}).get("question_type", "unknown")
        q_types[qt] += 1

    # Anomaly summary
    all_anomalies = defaultdict(int)
    for i in interactions:
        for a in i.get("anomalies", []):
            all_anomalies[a] += 1

    # Audio ID distribution
    audio_ids = defaultdict(int)
    for i in interactions:
        aid = i.get("classification", {}).get("audio_id", "unknown")
        audio_ids[aid] += 1

    critical_anomalies = {k: v for k, v in all_anomalies.items()
                          if k in ("LANG_UNKNOWN", "LLM_ERROR", "PERSONA_BREAK", "NON_200_CODE")}
    warning_anomalies = {k: v for k, v in all_anomalies.items()
                         if k not in critical_anomalies}

    return {
        "total_interactions": total,
        "total_questions": len(questions_only),
        "total_greetings": total - len(questions_only),
        "languages": sorted(languages),
        "time_span": {
            "first": interactions[0]["stt_time"] if interactions else None,
            "last": interactions[-1]["stt_time"] if interactions else None,
        },
        "sessions": len(sessions),
        "latency_stats": latency_stats,
        "question_type_distribution": dict(q_types),
        "audio_id_distribution": dict(audio_ids),
        "anomaly_summary": {
            "critical": dict(critical_anomalies),
            "warnings": dict(warning_anomalies),
            "total_anomalies": sum(all_anomalies.values()),
        },
        "health": "🔴 Critical" if critical_anomalies else ("🟡 Warnings" if warning_anomalies else "🟢 Healthy"),
    }


def main():
    parser = argparse.ArgumentParser(description="Parse Rambam interaction logs")
    parser.add_argument("log_file", help="Path to the log file")
    parser.add_argument("--output", "-o", default="/home/claude/parsed_interactions.json",
                        help="Output JSON file path")
    args = parser.parse_args()

    print(f"Parsing log file: {args.log_file}")
    entries = parse_log_file(args.log_file)
    print(f"  Found {len(entries)} raw entries")

    parse_errors = [e for e in entries if e.get("_parse_error")]
    if parse_errors:
        print(f"  ⚠️ {len(parse_errors)} lines failed to parse as JSON")

    interactions = group_interactions(entries)
    print(f"  Grouped into {len(interactions)} interactions")

    sessions = group_into_sessions(interactions)
    print(f"  Identified {len(sessions)} sessions")

    summary = compute_summary(interactions, sessions)

    # Extract log date from first interaction
    log_date = None
    time_range = None
    if interactions:
        first_time = datetime.fromisoformat(interactions[0]["stt_timestamp_parsed"])
        last_time = datetime.fromisoformat(interactions[-1]["stt_timestamp_parsed"])
        log_date = first_time.strftime("%Y-%m-%d")
        time_range = f"{first_time.strftime('%H:%M')} - {last_time.strftime('%H:%M')}"

    report = {
        "log_file": args.log_file,
        "log_date": log_date,
        "time_range": time_range,
        "summary": summary,
        "sessions": [{
            "session_id": s["session_id"],
            "start_time": s["start_time"],
            "end_time": s["end_time"],
            "interaction_count": s["interaction_count"],
            "interaction_indices": [i["index"] for i in s["interactions"]],
        } for s in sessions],
        "interactions": interactions,
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n  Output written to: {args.output}")
    print(f"  Health: {summary['health']}")
    if summary['anomaly_summary']['critical']:
        print(f"  🔴 Critical: {summary['anomaly_summary']['critical']}")
    if summary['anomaly_summary']['warnings']:
        print(f"  🟡 Warnings: {summary['anomaly_summary']['warnings']}")


if __name__ == "__main__":
    main()
