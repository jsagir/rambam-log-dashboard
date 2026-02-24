#!/usr/bin/env python3
"""
Direct Log Parser + Gemini Classification for Rambam Dashboard

Reads log files (already in JSON format) and uses Gemini ONLY for classification,
not for JSON generation. Much more reliable than asking Gemini to output JSON.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

try:
    import google.generativeai as genai
except ImportError:
    print("❌ Error: google-generativeai not installed")
    sys.exit(1)

GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
if not GOOGLE_AI_API_KEY:
    print("❌ Error: GOOGLE_AI_API_KEY not found in environment")
    sys.exit(1)

genai.configure(api_key=GOOGLE_AI_API_KEY)

# Gemini for classification only
MODEL_NAME = "gemini-2.5-flash"
GENERATION_CONFIG = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 20,
    "max_output_tokens": 100,  # Short responses only
}

CLASSIFICATION_PROMPT_TEMPLATE = """Classify this interaction from the Rambam holographic system:

Question: {question}
Answer: {answer}

Return ONLY a single line with these classifications separated by |:
QuestionType|Topic|Sensitivity|Accuracy|IsGreeting|VIP

QuestionType: one of [Closed questions, Open ended questions, Generic questions, Personal advice or current event questions, Statement / Clarification, Greeting]
Topic: one of [Kashrut, Daily Practice, Science / Medicine, Torah Study, Jewish Sects, Meta / Museum, Interfaith, Haredi / Army / Draft, Sports / Leadership, Personal / Lifestyle, Modern Politics, Shabbat / Halacha, Uncategorized]
Sensitivity: one of [low, medium, high, critical]
Accuracy: one of [correct, partial, incorrect, guardrail, fallback]
IsGreeting: one of [true, false]
VIP: person name with title if mentioned, otherwise "null"

Example output: Closed questions|Kashrut|low|correct|false|null
"""


def parse_log_file(file_path: str) -> List[Dict]:
    """Parse newline-delimited JSON log file."""
    interactions = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                interaction = json.loads(line)
                interactions.append(interaction)
            except json.JSONDecodeError as e:
                print(f"⚠️  Line {line_num}: JSON parse error - {e}")
                continue
    return interactions


def classify_interaction(question: str, answer: str) -> Dict[str, Any]:
    """Use Gemini to classify a single interaction."""
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        generation_config=GENERATION_CONFIG
    )

    prompt = CLASSIFICATION_PROMPT_TEMPLATE.format(
        question=question[:500],  # Limit length
        answer=answer[:500]
    )

    try:
        response = model.generate_content(prompt)
        result = response.text.strip()

        # Parse the pipe-delimited response
        parts = result.split('|')
        if len(parts) != 6:
            # Fallback defaults
            return {
                "type": "Generic questions",
                "topic": "Uncategorized",
                "sensitivity": "low",
                "accuracy": "correct",
                "is_greeting": False,
                "vip": None
            }

        return {
            "type": parts[0].strip(),
            "topic": parts[1].strip(),
            "sensitivity": parts[2].strip(),
            "accuracy": parts[3].strip(),
            "is_greeting": parts[4].strip().lower() == "true",
            "vip": None if parts[5].strip().lower() == "null" else parts[5].strip()
        }
    except Exception as e:
        print(f"⚠️  Classification error: {e}")
        return {
            "type": "Generic questions",
            "topic": "Uncategorized",
            "sensitivity": "low",
            "accuracy": "correct",
            "is_greeting": False,
            "vip": None
        }


def extract_log_data(file_path: str) -> List[Dict[str, Any]]:
    """Extract and classify all interactions from a log file."""
    print(f"📄 Processing: {file_path}")

    # Parse the raw JSON log
    raw_interactions = parse_log_file(file_path)
    print(f"📊 Found {len(raw_interactions)} interactions")

    # Extract date from filename
    filename = Path(file_path).stem
    try:
        if len(filename) == 8 and filename.isdigit():
            log_date = f"{filename[:4]}-{filename[4:6]}-{filename[6:8]}"
        else:
            log_date = datetime.now().strftime("%Y-%m-%d")
    except:
        log_date = datetime.now().strftime("%Y-%m-%d")

    print(f"📅 Log date: {log_date}")
    print(f"🤖 Classifying interactions with Gemini...")

    extracted = []
    for idx, interaction in enumerate(raw_interactions, 1):
        # Extract basic fields from log
        question_text = interaction.get("question_text", "")
        answer_text = interaction.get("answer_text", "")

        if not question_text or not answer_text:
            continue

        # Get timestamps
        timestamps = interaction.get("timestamps", {})
        stt_time = timestamps.get("stt", 0)

        # Convert timestamp to HH:MM
        try:
            dt = datetime.fromtimestamp(stt_time / 1000)
            time_str = dt.strftime("%H:%M")
        except:
            time_str = "00:00"

        # Calculate latency
        tts_time = timestamps.get("tts", stt_time)
        latency = int(tts_time - stt_time) if tts_time > stt_time else 0

        # Detect language
        lang = interaction.get("language", "unknown")
        if lang == "he":
            lang = "he-IL"
        elif lang == "en":
            lang = "en-US"
        else:
            lang = "unknown"

        # Classify with Gemini
        classification = classify_interaction(question_text, answer_text)

        # Detect anomalies
        anomalies = []
        if latency > 3000:
            anomalies.append("LATENCY_SPIKE_WARN")
        if classification["sensitivity"] == "critical":
            anomalies.append("SENSITIVE_TOPIC")
        if "clarif" in answer_text.lower() or "understand" in answer_text.lower():
            anomalies.append("FALLBACK_TRIGGERED")

        # Build the interaction object
        extracted_interaction = {
            "id": idx,
            "time": time_str,
            "session": interaction.get("session_id", 1),
            "question": question_text,
            "answer": answer_text,
            "lang": lang,
            "type": classification["type"],
            "topic": classification["topic"],
            "latency": latency,
            "accuracy": classification["accuracy"],
            "anomalies": anomalies,
            "audioId": interaction.get("audio_id", "unknown"),
            "opening": answer_text.split('.')[0] if answer_text else "",
            "sensitivity": classification["sensitivity"],
            "vip": classification["vip"],
            "is_greeting": classification["is_greeting"]
        }

        extracted.append(extracted_interaction)

        if idx % 5 == 0:
            print(f"  ✓ Processed {idx}/{len(raw_interactions)} interactions")

    print(f"✅ Extracted {len(extracted)} interactions")
    return extracted


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_real_data.py <log_file>")
        sys.exit(1)

    log_file = sys.argv[1]
    if not os.path.exists(log_file):
        print(f"❌ File not found: {log_file}")
        sys.exit(1)

    # Extract data
    interactions = extract_log_data(log_file)

    # Output as JSON
    output_file = f"/tmp/extracted_{Path(log_file).stem}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(interactions, f, ensure_ascii=False, indent=2)

    print(f"✅ Saved to: {output_file}")


if __name__ == "__main__":
    main()
