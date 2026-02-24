#!/usr/bin/env python3
"""
Rambam Anomaly Detector
Identifies technical issues in parsed interaction logs
"""

import json
import argparse
import re
from typing import List, Dict, Any
from datetime import datetime


# Thresholds
LATENCY_THRESHOLDS = {
    'classification': 3000,  # ms - alert if > 3000ms
    'first_response': 6000,  # ms - alert if > 6000ms
    'total': 10000           # ms - alert if > 10000ms
}

LATENCY_BASELINES = {
    'classification': 691,    # ms - baseline from analysis
    'first_response': 3759    # ms - baseline from analysis
}

# Known bad phrases indicating persona breaks
PERSONA_BREAK_PATTERNS = [
    r"I only support",
    r"I don't have access",
    r"As an AI",
    r"I cannot provide",
    r"system error",
    r"technical issue"
]

# Greeting keywords for STT truncation detection
GREETINGS = [
    "shalom", "hello", "hi", "hey", "good morning", "good afternoon",
    "boker tov", "erev tov", "peace"
]


def detect_anomalies(interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze interactions and flag anomalies

    Returns:
        Dictionary with critical, warning, and operational anomalies
    """

    anomalies = {
        'critical': [],
        'warning': [],
        'operational': [],
        'summary': {
            'total_interactions': len(interactions),
            'critical_count': 0,
            'warning_count': 0,
            'operational_count': 0
        },
        'metrics': {
            'latencies': {
                'classification': [],
                'first_response': [],
                'total': []
            },
            'languages': {},
            'question_types': {}
        }
    }

    for idx, interaction in enumerate(interactions):
        interaction_id = idx + 1

        # Collect metrics
        for latency_type in ['classification', 'first_response', 'total']:
            if latency_type in interaction.get('latencies', {}):
                anomalies['metrics']['latencies'][latency_type].append(
                    interaction['latencies'][latency_type]
                )

        lang = interaction.get('language', 'unknown')
        anomalies['metrics']['languages'][lang] = anomalies['metrics']['languages'].get(lang, 0) + 1

        qtype = interaction.get('question_type', 'unknown')
        anomalies['metrics']['question_types'][qtype] = anomalies['metrics']['question_types'].get(qtype, 0) + 1

        # CRITICAL ANOMALIES

        # LANG_UNKNOWN
        if lang == 'unknown':
            anomalies['critical'].append({
                'type': 'LANG_UNKNOWN',
                'severity': 'critical',
                'interaction_id': interaction_id,
                'question': interaction.get('question_text', ''),
                'timestamp': interaction['timestamps']['stt'],
                'description': 'Language detection failed'
            })

        # LLM_ERROR - waiting_audio exists but no stream_chunk follows
        has_waiting = interaction['timestamps'].get('waiting_audio') is not None
        has_response = len(interaction.get('response_chunks', [])) > 0
        if has_waiting and not has_response:
            anomalies['critical'].append({
                'type': 'LLM_ERROR',
                'severity': 'critical',
                'interaction_id': interaction_id,
                'question': interaction.get('question_text', ''),
                'timestamp': interaction['timestamps']['stt'],
                'description': 'No LLM response received after classification'
            })

        # PERSONA_BREAK - check for system messages in response
        response_text = interaction.get('response_text', '')
        for pattern in PERSONA_BREAK_PATTERNS:
            if re.search(pattern, response_text, re.IGNORECASE):
                anomalies['critical'].append({
                    'type': 'PERSONA_BREAK',
                    'severity': 'critical',
                    'interaction_id': interaction_id,
                    'question': interaction.get('question_text', ''),
                    'response_snippet': response_text[:200],
                    'matched_pattern': pattern,
                    'timestamp': interaction['timestamps']['stt'],
                    'description': f'Persona break detected: "{pattern}" found in response'
                })
                break

        # NON_200_CODE
        non_200_codes = [c for c in interaction.get('msg_codes', []) if c != 200]
        if non_200_codes:
            anomalies['critical'].append({
                'type': 'NON_200_CODE',
                'severity': 'critical',
                'interaction_id': interaction_id,
                'codes': non_200_codes,
                'errors': interaction.get('errors', []),
                'timestamp': interaction['timestamps']['stt'],
                'description': f'Non-200 status codes: {non_200_codes}'
            })

        # WARNING ANOMALIES

        # LATENCY_SPIKE
        latencies = interaction.get('latencies', {})
        for latency_type, threshold in LATENCY_THRESHOLDS.items():
            if latency_type in latencies and latencies[latency_type] > threshold:
                baseline = LATENCY_BASELINES.get(latency_type, 0)
                anomalies['warning'].append({
                    'type': 'LATENCY_SPIKE',
                    'latency_type': latency_type,
                    'severity': 'warning',
                    'interaction_id': interaction_id,
                    'value_ms': latencies[latency_type],
                    'threshold_ms': threshold,
                    'baseline_ms': baseline,
                    'timestamp': interaction['timestamps']['stt'],
                    'description': f'{latency_type} latency {latencies[latency_type]:.0f}ms exceeds threshold {threshold}ms (baseline: {baseline}ms)'
                })

        # STT_TRUNCATION - very short question that's not a greeting
        question = interaction.get('question_text', '')
        word_count = len(question.split())
        is_greeting = any(greet.lower() in question.lower() for greet in GREETINGS)
        if word_count < 4 and not is_greeting:
            anomalies['warning'].append({
                'type': 'STT_TRUNCATION',
                'severity': 'warning',
                'interaction_id': interaction_id,
                'question': question,
                'word_count': word_count,
                'timestamp': interaction['timestamps']['stt'],
                'description': f'Possible STT truncation: only {word_count} words'
            })

        # EMPTY_RESPONSE
        if has_waiting and has_response and not response_text.strip():
            anomalies['warning'].append({
                'type': 'EMPTY_RESPONSE',
                'severity': 'warning',
                'interaction_id': interaction_id,
                'question': question,
                'chunk_count': len(interaction.get('response_chunks', [])),
                'timestamp': interaction['timestamps']['stt'],
                'description': 'All response chunks are empty'
            })

        # STYLE_ANOMALY - non-neutral style
        if interaction.get('style') and interaction['style'] != 'neutral':
            anomalies['warning'].append({
                'type': 'STYLE_ANOMALY',
                'severity': 'warning',
                'interaction_id': interaction_id,
                'style': interaction['style'],
                'style_degree': interaction.get('style_degree'),
                'timestamp': interaction['timestamps']['stt'],
                'description': f'Non-neutral style detected: {interaction["style"]}'
            })

    # Session-level anomalies
    _detect_session_anomalies(interactions, anomalies)

    # Update counts
    anomalies['summary']['critical_count'] = len(anomalies['critical'])
    anomalies['summary']['warning_count'] = len(anomalies['warning'])
    anomalies['summary']['operational_count'] = len(anomalies['operational'])

    # Compute metric summaries
    for latency_type, values in anomalies['metrics']['latencies'].items():
        if values:
            anomalies['metrics']['latencies'][latency_type] = {
                'min': min(values),
                'max': max(values),
                'avg': sum(values) / len(values),
                'count': len(values),
                'values': values
            }

    return anomalies


def _detect_session_anomalies(interactions: List[Dict], anomalies: Dict):
    """Detect session-level patterns"""

    if len(interactions) < 2:
        return

    # Track language switches
    prev_lang = interactions[0].get('language')
    for idx, interaction in enumerate(interactions[1:], 1):
        curr_lang = interaction.get('language')
        if curr_lang != prev_lang:
            anomalies['operational'].append({
                'type': 'LANGUAGE_SWITCH',
                'severity': 'operational',
                'interaction_id': idx + 1,
                'from_language': prev_lang,
                'to_language': curr_lang,
                'timestamp': interaction['timestamps']['stt'],
                'description': f'Language switched from {prev_lang} to {curr_lang}'
            })
        prev_lang = curr_lang

    # Track question type distribution
    total = len(interactions)
    for qtype, count in anomalies['metrics']['question_types'].items():
        if count / total > 0.7:
            anomalies['operational'].append({
                'type': 'QUESTION_TYPE_SKEW',
                'severity': 'operational',
                'question_type': qtype,
                'count': count,
                'percentage': (count / total) * 100,
                'description': f'{qtype} represents {(count/total)*100:.1f}% of interactions'
            })


def main():
    parser = argparse.ArgumentParser(description='Detect anomalies in Rambam logs')
    parser.add_argument('parsed_log', help='Path to parsed interactions JSON')
    parser.add_argument('--output', '-o', help='Output JSON file path')

    args = parser.parse_args()

    print(f"Loading {args.parsed_log}...")
    with open(args.parsed_log, 'r', encoding='utf-8') as f:
        data = json.load(f)

    interactions = data.get('interactions', [])
    print(f"Analyzing {len(interactions)} interactions...")

    anomalies = detect_anomalies(interactions)

    print(f"\nAnomaly Summary:")
    print(f"  🔴 Critical: {anomalies['summary']['critical_count']}")
    print(f"  🟡 Warning: {anomalies['summary']['warning_count']}")
    print(f"  🟢 Operational: {anomalies['summary']['operational_count']}")

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(anomalies, f, indent=2, ensure_ascii=False)
        print(f"\nOutput written to {args.output}")
    else:
        print(json.dumps(anomalies, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
