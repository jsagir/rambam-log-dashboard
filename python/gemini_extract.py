#!/usr/bin/env python3
"""
Gemini-Powered Log Extraction Script for Rambam Dashboard

Uses Google's Gemini API to intelligently:
- Parse log files with natural language understanding
- Classify questions by topic and type
- Detect sensitivity levels
- Extract VIP names from greetings
- Identify anomalies and issues
- Output TypeScript code ready to paste into simple-dashboard/page.tsx

Usage:
    python python/gemini_extract.py logs/20260224.txt

Requirements:
    pip install google-generativeai python-dotenv

    Create .env file with:
    GOOGLE_AI_API_KEY=your-api-key-here
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    import google.generativeai as genai
except ImportError:
    print("❌ Error: google-generativeai not installed")
    print("Run: pip install google-generativeai python-dotenv")
    sys.exit(1)

# Configure Gemini
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
if not GOOGLE_AI_API_KEY:
    print("❌ Error: GOOGLE_AI_API_KEY not found in environment")
    print("Create a .env file with: GOOGLE_AI_API_KEY=your-api-key-here")
    sys.exit(1)

genai.configure(api_key=GOOGLE_AI_API_KEY)

# Gemini model configuration
MODEL_NAME = "gemini-2.5-flash"  # Latest Flash model with best performance
GENERATION_CONFIG = {
    "temperature": 0.3,  # Lower for more consistent classification
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}

EXTRACTION_PROMPT = """You are an expert at analyzing interaction logs from the Rambam AI holographic installation at the Museum of Tolerance Jerusalem.

The log contains newline-delimited JSON objects representing visitor interactions with an AI Maimonides (Rambam).

Your task is to extract and classify each interaction intelligently. For each interaction, determine:

1. **Question Type**: Classify as one of:
   - "Closed questions" - Yes/no, factual answers
   - "Open ended questions" - Complex, discussion-worthy
   - "Generic questions" - General info requests
   - "Personal advice or current event questions" - Seeking guidance
   - "Statement / Clarification" - Not a question, a statement
   - "Greeting" - Hello, goodbye, introductions

2. **Topic**: Classify the main topic:
   - "Kashrut" - Kosher food laws
   - "Daily Practice" - Morning routines, washing, prayers
   - "Science / Medicine" - Health, astronomy, Rambam as physician
   - "Torah Study" - Learning, Talmud, religious texts
   - "Jewish Sects" - Karaites, Reform, Conservative
   - "Meta / Museum" - About the museum, installation, tolerance
   - "Interfaith" - Christianity, Islam, other religions
   - "Haredi / Army / Draft" - Ultra-orthodox military service
   - "Sports / Leadership" - Team captains, leadership
   - "Personal / Lifestyle" - Clothing, jewelry, personal items
   - "Modern Politics" - Netanyahu, government, current events
   - "Shabbat / Halacha" - Sabbath laws, Jewish law
   - "Uncategorized" - Doesn't fit other categories

3. **Sensitivity Level**:
   - "low" - Non-controversial
   - "medium" - Requires care but not explosive
   - "high" - Politically or religiously sensitive
   - "critical" - Extremely sensitive (idolatry, interfaith theology)

4. **Accuracy**: Based on the response quality:
   - "correct" - Accurate, well-formed answer
   - "partial" - Incomplete or partially correct
   - "incorrect" - Wrong information
   - "guardrail" - Properly refused to answer (post-1204 topics)
   - "fallback" - Asked for clarification

5. **VIP Detection**: If the question mentions a named person with title (Professor, Editor, Minister), extract the name and title.

6. **Anomalies**: Detect issues:
   - "LATENCY_SPIKE_WARN" - Response time > 3000ms
   - "FALLBACK_TRIGGERED" - Clarification requested
   - "SENSITIVE_TOPIC" - Critical sensitivity detected

7. **Is Greeting**: Boolean - is this a greeting/farewell?

Output the data as a JSON array of objects with this exact structure:
{
  "id": <interaction_number>,
  "time": "HH:MM",
  "session": <session_number>,
  "question": "the question text",
  "answer": "the answer text",
  "lang": "he-IL" or "en-US",
  "type": "question type",
  "topic": "topic name",
  "latency": <milliseconds>,
  "accuracy": "accuracy level",
  "anomalies": ["anomaly1", "anomaly2"],
  "audioId": "audio_id_from_log",
  "opening": "opening sentence from response",
  "sensitivity": "sensitivity level",
  "vip": "VIP Name (Title)" or null,
  "is_greeting": true/false
}

CRITICAL JSON FORMATTING RULES:
- ALL string values MUST have quotes escaped with backslash (\" not ")
- Hebrew text MUST be properly escaped
- Line breaks MUST be escaped as \\n
- Return ONLY valid, parseable JSON
- No markdown formatting, no code blocks, no explanations
- Test your JSON mentally before returning it

Analyze the log file below and extract ALL interactions in this format.

LOG FILE:
"""


def read_log_file(file_path: str) -> str:
    """Read and return log file contents."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)


def extract_with_gemini(log_content: str) -> List[Dict[str, Any]]:
    """Use Gemini to extract and classify interactions."""
    print("🤖 Analyzing log with Gemini...")

    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        generation_config=GENERATION_CONFIG
    )

    prompt = EXTRACTION_PROMPT + log_content

    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()

        # Remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
            result_text = result_text.strip()

        # Parse JSON
        interactions = json.loads(result_text)

        if not isinstance(interactions, list):
            raise ValueError("Expected JSON array")

        print(f"✅ Extracted {len(interactions)} interactions")
        return interactions

    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        print(f"Response: {result_text[:500]}...")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        sys.exit(1)


def format_as_typescript(interactions: List[Dict[str, Any]], log_date: str) -> str:
    """Format interactions as TypeScript code for simple dashboard."""

    ts_code = "// Generated from log file using Gemini extraction\n"
    ts_code += f"// Date: {log_date}\n"
    ts_code += f"// Interactions: {len(interactions)}\n\n"

    for i, item in enumerate(interactions):
        if i > 0:
            ts_code += ",\n"

        # Format each field
        ts_code += "  {\n"
        ts_code += f'    id: {item.get("id", i+1)},\n'
        ts_code += f'    time: "{item.get("time", "00:00")}",\n'
        ts_code += f'    session: {item.get("session", 1)},\n'
        ts_code += f'    question: "{item.get("question", "").replace('"', '\\"')}",\n'
        ts_code += f'    answer: "{item.get("answer", "").replace('"', '\\"')}",\n'
        ts_code += f'    lang: "{item.get("lang", "he-IL")}",\n'
        ts_code += f'    type: "{item.get("type", "Generic questions")}",\n'
        ts_code += f'    topic: "{item.get("topic", "Uncategorized")}",\n'
        ts_code += f'    latency: {item.get("latency", 0)},\n'
        ts_code += f'    accuracy: "{item.get("accuracy", "pending")}",\n'

        # Anomalies array
        anomalies = item.get("anomalies", [])
        if anomalies:
            ts_code += f'    anomalies: {json.dumps(anomalies)},\n'
        else:
            ts_code += '    anomalies: [],\n'

        ts_code += f'    audioId: "{item.get("audioId", "unknown")}",\n'
        ts_code += f'    opening: "{item.get("opening", "").replace('"', '\\"')}",\n'
        ts_code += f'    sensitivity: "{item.get("sensitivity", "low")}",\n'

        # VIP (can be null)
        vip = item.get("vip")
        if vip:
            ts_code += f'    vip: "{vip}",\n'
        else:
            ts_code += '    vip: null,\n'

        ts_code += f'    is_greeting: {str(item.get("is_greeting", False)).lower()}\n'
        ts_code += "  }"

    return ts_code


def calculate_daily_stats(interactions: List[Dict[str, Any]], log_date: str) -> str:
    """Generate DAILY_TREND entry for this log."""

    total = len(interactions)
    questions = len([i for i in interactions if not i.get("is_greeting", False)])
    hebrew = len([i for i in interactions if i.get("lang") == "he-IL"])
    english = len([i for i in interactions if i.get("lang") == "en-US"])

    latencies = [i.get("latency", 0) for i in interactions]
    avg_latency = int(sum(latencies) / len(latencies)) if latencies else 0

    anomalies = sum(len(i.get("anomalies", [])) for i in interactions)
    critical = len([i for i in interactions if i.get("sensitivity") == "critical"])

    # Format date as "Feb 24"
    try:
        dt = datetime.strptime(log_date, "%Y-%m-%d")
        date_str = dt.strftime("%b %d")
    except:
        date_str = log_date

    return f"""{{
    date: "{date_str}",
    interactions: {total},
    questions: {questions},
    hebrew: {hebrew},
    english: {english},
    avgLatency: {avg_latency},
    anomalies: {anomalies},
    critical: {critical},
    inquiryPct: 40,  // Manual: estimate inquiry mode percentage
    depthPct: 50     // Manual: estimate conversation depth
  }}"""


def main():
    parser = argparse.ArgumentParser(
        description="Extract Rambam log data using Gemini AI"
    )
    parser.add_argument(
        "log_file",
        help="Path to log file (e.g., logs/20260224.txt)"
    )
    parser.add_argument(
        "--output",
        help="Output file for TypeScript code (default: stdout)"
    )

    args = parser.parse_args()

    # Validate file exists
    if not os.path.exists(args.log_file):
        print(f"❌ File not found: {args.log_file}")
        sys.exit(1)

    # Extract date from filename
    filename = Path(args.log_file).stem
    try:
        # Assume format: YYYYMMDD.txt
        if len(filename) == 8 and filename.isdigit():
            log_date = f"{filename[:4]}-{filename[4:6]}-{filename[6:8]}"
        else:
            log_date = datetime.now().strftime("%Y-%m-%d")
    except:
        log_date = datetime.now().strftime("%Y-%m-%d")

    print(f"📄 Processing: {args.log_file}")
    print(f"📅 Log date: {log_date}")
    print()

    # Read log
    log_content = read_log_file(args.log_file)

    # Extract with Gemini
    interactions = extract_with_gemini(log_content)

    # Format as TypeScript
    ts_code = format_as_typescript(interactions, log_date)
    daily_stats = calculate_daily_stats(interactions, log_date)

    # Output
    output = f"""
╔═══════════════════════════════════════════════════════════════╗
║  RAMBAM LOG EXTRACTION - GEMINI POWERED                       ║
║  Log: {args.log_file:<55} ║
║  Date: {log_date:<54} ║
║  Interactions: {len(interactions):<47} ║
╚═══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 1: Add to INTERACTIONS array
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In src/app/simple-dashboard/page.tsx, add these to the INTERACTIONS array:

{ts_code}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 2: Add to DAILY_TREND array
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{daily_stats}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 3: Update TOPIC_TREND (manual)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Count topics from the interactions above and add entry to TOPIC_TREND.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 4: Commit and deploy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

git add src/app/simple-dashboard/page.tsx
git commit -m "feat: Add log data for {log_date}"
git push origin main

✅ Done! Dashboard will auto-update on next deployment.
"""

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"✅ Output saved to: {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()
