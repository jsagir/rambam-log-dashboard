#!/usr/bin/env python3
"""
Batch Extract All Logs for Simple Dashboard

Processes all log files in logs/ directory and generates:
1. All interactions with real data
2. Daily trend stats
3. Topic distribution

Output: Real data ready to paste into simple-dashboard/page.tsx
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from collections import Counter

def parse_log_file(log_file):
    """Run parse_log.py on a file and return the JSON."""
    print(f"\n📄 Processing: {log_file}")

    # Run parser
    output_file = f"/tmp/parsed_{Path(log_file).stem}.json"
    cmd = f"python3 python/parse_log.py {log_file} --output {output_file}"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"❌ Parse failed: {result.stderr}")
        return None

    # Read output
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"❌ Error reading output: {e}")
        return None


def interaction_to_dashboard_format(interaction, log_date, session_id, interaction_id):
    """Convert parsed interaction to dashboard format."""

    # Extract fields
    question = interaction.get("question", "")
    answer_text = interaction.get("full_answer", "")  # Fixed: full_answer not answer_text
    stt_time = interaction.get("stt_timestamp_parsed", "")

    # Time (HH:MM)
    try:
        dt = datetime.fromisoformat(stt_time)
        time_str = dt.strftime("%H:%M")
    except:
        time_str = "00:00"

    # Get classification data (nested)
    classification = interaction.get("classification", {})

    # Language
    lang = classification.get("language", interaction.get("response_language", "he-IL"))
    if not lang or lang == "unknown":
        lang = "he-IL"

    # Question type from parser
    question_type = classification.get("question_type", "Generic questions")

    # Latency (generation start time)
    latency_stats = interaction.get("latencies", {})
    latency = latency_stats.get("generation_start_ms", 0)

    # Audio ID
    audio_id = classification.get("audio_id", "unknown")

    # Opening text
    opening = classification.get("opening_text", "")

    # Greeting flag
    is_greeting = interaction.get("is_greeting", False)

    # Build interaction object (with placeholders for Gemini classification)
    # Clean answer: replace newlines with spaces to avoid TypeScript syntax errors
    clean_answer = answer_text.replace('\n', ' ').replace('\r', ' ') if answer_text else ""
    clean_answer = clean_answer[:500]  # Truncate long answers

    return {
        "id": interaction_id,
        "time": time_str,
        "session": session_id,
        "question": question,
        "answer": clean_answer,
        "lang": lang,
        "type": question_type,
        "topic": "Uncategorized",  # Will classify later if needed
        "latency": latency,
        "accuracy": "correct",  # Default
        "anomalies": [],  # Will add later
        "audioId": audio_id,
        "opening": opening,
        "sensitivity": "low",  # Default
        "vip": None,
        "is_greeting": is_greeting
    }


def main():
    # Find all log files
    log_files = sorted(Path("logs").glob("*.txt"))
    print(f"🔍 Found {len(log_files)} log files")

    all_interactions = []
    daily_stats = []
    interaction_id = 1

    for log_file in log_files:
        # Parse log
        parsed_data = parse_log_file(str(log_file))
        if not parsed_data:
            continue

        # Extract data
        log_date = parsed_data.get("log_date", "2026-01-01")
        summary = parsed_data.get("summary", {})
        interactions = parsed_data.get("interactions", [])
        sessions = parsed_data.get("sessions", [])

        print(f"  ✓ Found {len(interactions)} interactions")

        # Convert interactions
        for idx, interaction in enumerate(interactions, 1):
            dashboard_interaction = interaction_to_dashboard_format(
                interaction, log_date, 1, interaction_id
            )
            all_interactions.append(dashboard_interaction)
            interaction_id += 1

        # Daily stats
        total_interactions = len(interactions)
        questions = sum(1 for i in interactions if not i.get("is_greeting", False))

        # Language counts from classification or response_language
        hebrew_count = 0
        english_count = 0
        for i in interactions:
            classification = i.get("classification", {})
            lang = classification.get("language", i.get("response_language", "unknown")) or "unknown"
            if lang.startswith("he"):
                hebrew_count += 1
            elif lang.startswith("en"):
                english_count += 1

        # Average latency
        latencies = [i.get("latencies", {}).get("generation_start_ms", 0) for i in interactions]
        avg_latency = int(sum(latencies) / len(latencies)) if latencies else 0

        # Count anomalies from all interactions
        anomaly_count = 0
        critical_count = 0
        for i in interactions:
            # Check for latency spikes
            gen_latency = i.get("latencies", {}).get("generation_start_ms", 0)
            if gen_latency > 3000:
                anomaly_count += 1

            # Check for critical sensitivity in classification
            classification = i.get("classification", {})
            if classification.get("sensitivity") == "critical":
                critical_count += 1
                anomaly_count += 1

        # Format date as "Feb 15"
        try:
            dt = datetime.strptime(log_date, "%Y-%m-%d")
            date_str = dt.strftime("%b %d")
        except:
            date_str = log_date

        daily_stats.append({
            "date": date_str,
            "interactions": total_interactions,
            "questions": questions,
            "hebrew": hebrew_count,
            "english": english_count,
            "avgLatency": avg_latency,
            "anomalies": anomaly_count,
            "critical": critical_count,
            "inquiryPct": 30,  # Placeholder - would need mode detection
            "depthPct": 40  # Placeholder - would need depth analysis
        })

    # Output results
    print(f"\n✅ Total interactions extracted: {len(all_interactions)}")
    print(f"✅ Days covered: {len(daily_stats)}")

    # Save to file
    output_file = "/tmp/dashboard_real_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "interactions": all_interactions,
            "daily_trend": daily_stats
        }, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Saved to: {output_file}")
    print(f"\nℹ️  Next: Copy interactions and daily_trend arrays into src/app/simple-dashboard/page.tsx")


if __name__ == "__main__":
    main()
