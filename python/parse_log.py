#!/usr/bin/env python3
"""
Rambam Log Parser
Extracts structured interactions from raw newline-delimited JSON logs
"""

import json
import argparse
from datetime import datetime
from typing import List, Dict, Any
from collections import defaultdict


def parse_timestamp(ts_str: str) -> datetime:
    """Parse ISO timestamp string to datetime object"""
    if ts_str is None:
        return None
    return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))


def parse_unix_timestamp(ts_ms: int) -> str:
    """Convert Unix timestamp in milliseconds to ISO format"""
    if ts_ms is None:
        return None
    return datetime.fromtimestamp(ts_ms / 1000.0).isoformat() + 'Z'


def parse_log_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse newline-delimited JSON log file and group into interactions

    Returns list of interaction dictionaries with:
    - question_text: visitor question from STT
    - question_type: classification
    - language: detected language
    - response_text: concatenated LLM response
    - timestamps: various timing points
    - latencies: computed deltas
    - anomalies: detected issues
    """

    interactions = []
    current_interaction = None

    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            try:
                entry = json.loads(line)
            except json.JSONDecodeError as e:
                print(f"Warning: Failed to parse line {line_num}: {e}")
                continue

            # Handle both old format and new nested format
            msg_type = entry.get('type')

            # For new format: ai_message contains nested msg with type and data
            if msg_type == 'ai_message' and isinstance(entry.get('msg'), dict):
                inner_msg = entry['msg']
                inner_type = inner_msg.get('type')
                timestamp = parse_unix_timestamp(inner_msg.get('timestamp'))
                data = inner_msg.get('data', {})
                code = inner_msg.get('code', 200)
            else:
                # Old format
                inner_type = msg_type
                timestamp = entry.get('timestamp') or entry.get('time')
                data = entry
                code = entry.get('code', 200)

            # Start new interaction on STT
            if msg_type == 'stt':
                # Save previous interaction if exists
                if current_interaction:
                    interactions.append(current_interaction)

                # Convert time format if needed
                if 'time' in entry:
                    # Convert "2026/2/22 7:2:12" to ISO format
                    try:
                        time_str = entry['time']
                        dt = datetime.strptime(time_str, "%Y/%m/%d %H:%M:%S")
                        timestamp = dt.isoformat() + 'Z'
                    except:
                        timestamp = None
                else:
                    timestamp = entry.get('timestamp')

                current_interaction = {
                    'question_text': entry.get('msg', ''),
                    'question_type': None,
                    'language': None,
                    'response_chunks': [],
                    'response_text': '',
                    'audio_id': None,
                    'style': None,
                    'style_degree': None,
                    'timestamps': {
                        'stt': timestamp,
                        'waiting_audio': None,
                        'first_chunk': None,
                        'last_chunk': None,
                        'finished': None
                    },
                    'latencies': {},
                    'errors': [],
                    'msg_codes': [],
                    'raw_entries': [entry]
                }

            elif current_interaction is not None:
                current_interaction['raw_entries'].append(entry)

                # Waiting audio (question classification)
                if inner_type == 'waiting_audio':
                    current_interaction['question_type'] = data.get('question_type')
                    lang = data.get('language', 'unknown')
                    # Normalize language codes
                    if lang == 'he-IL':
                        lang = 'hebrew'
                    elif lang == 'en-US' or lang == 'english':
                        lang = 'english'
                    current_interaction['language'] = lang
                    current_interaction['audio_id'] = data.get('audio_id')
                    current_interaction['timestamps']['waiting_audio'] = timestamp

                # Stream chunks (LLM response)
                elif inner_type == 'stream_chunk':
                    result = data.get('result', '')
                    if result:
                        current_interaction['response_chunks'].append(result)
                        if not current_interaction['timestamps']['first_chunk']:
                            current_interaction['timestamps']['first_chunk'] = timestamp
                        current_interaction['timestamps']['last_chunk'] = timestamp

                    # Check if finished
                    if data.get('finished'):
                        current_interaction['timestamps']['finished'] = timestamp

                    # Style information from stream chunks
                    if 'style' in data:
                        current_interaction['style'] = data.get('style')
                    if 'styledegree' in data:
                        current_interaction['style_degree'] = data.get('styledegree')

                # Track message codes
                current_interaction['msg_codes'].append(code)
                if code != 200:
                    current_interaction['errors'].append({
                        'code': code,
                        'type': inner_type,
                        'timestamp': timestamp,
                        'entry': entry
                    })

    # Don't forget last interaction
    if current_interaction:
        interactions.append(current_interaction)

    # CRITICAL: Sort interactions by timestamp (chronological order)
    # This ensures trend analysis and daily patterns are accurate
    interactions.sort(key=lambda x: x['timestamps'].get('stt') or '9999-12-31')

    # Post-process: compute latencies and concatenate responses
    for interaction in interactions:
        # Concatenate response
        interaction['response_text'] = ''.join(interaction['response_chunks'])

        # Compute latencies
        ts = interaction['timestamps']
        if ts['stt'] and ts['waiting_audio']:
            interaction['latencies']['classification'] = (
                parse_timestamp(ts['waiting_audio']) - parse_timestamp(ts['stt'])
            ).total_seconds() * 1000

        if ts['stt'] and ts['first_chunk']:
            interaction['latencies']['first_response'] = (
                parse_timestamp(ts['first_chunk']) - parse_timestamp(ts['stt'])
            ).total_seconds() * 1000

        if ts['stt'] and ts['finished']:
            interaction['latencies']['total'] = (
                parse_timestamp(ts['finished']) - parse_timestamp(ts['stt'])
            ).total_seconds() * 1000

    return interactions


def group_into_sessions(interactions: List[Dict], gap_threshold_minutes: int = 30) -> List[List[Dict]]:
    """Group interactions into sessions based on time gaps"""
    if not interactions:
        return []

    # Filter out interactions without valid timestamps
    valid_interactions = [i for i in interactions if i['timestamps'].get('stt')]

    if not valid_interactions:
        return []

    sessions = []
    current_session = [valid_interactions[0]]

    for i in range(1, len(valid_interactions)):
        prev = valid_interactions[i-1]
        curr = valid_interactions[i]

        try:
            prev_ts = parse_timestamp(prev['timestamps']['stt'])
            curr_ts = parse_timestamp(curr['timestamps']['stt'])
            gap_minutes = (curr_ts - prev_ts).total_seconds() / 60

            if gap_minutes > gap_threshold_minutes:
                sessions.append(current_session)
                current_session = [curr]
            else:
                current_session.append(curr)
        except (ValueError, TypeError) as e:
            # If timestamp parsing fails, just add to current session
            current_session.append(curr)

    sessions.append(current_session)
    return sessions


def extract_log_date(interactions: List[Dict]) -> str:
    """Extract the date from the log file based on first interaction"""
    if not interactions:
        return None

    first_ts = interactions[0]['timestamps'].get('stt')
    if first_ts:
        try:
            dt = parse_timestamp(first_ts)
            return dt.strftime('%Y-%m-%d') if dt else None
        except:
            return None
    return None


def main():
    parser = argparse.ArgumentParser(description='Parse Rambam log files')
    parser.add_argument('log_file', help='Path to log file')
    parser.add_argument('--output', '-o', help='Output JSON file path')
    parser.add_argument('--sessions', action='store_true', help='Group into sessions')

    args = parser.parse_args()

    print(f"Parsing {args.log_file}...")
    interactions = parse_log_file(args.log_file)
    print(f"Found {len(interactions)} interactions")

    # Extract log date for trend analysis
    log_date = extract_log_date(interactions)
    if log_date:
        print(f"Log date: {log_date}")

    # Get time range
    time_range = {}
    if interactions:
        first_time = interactions[0]['timestamps'].get('stt')
        last_time = interactions[-1]['timestamps'].get('stt') or interactions[-1]['timestamps'].get('finished')
        if first_time and last_time:
            time_range = {
                'start': first_time,
                'end': last_time,
                'date': log_date
            }

    output_data = {
        'log_date': log_date,
        'time_range': time_range,
        'total_interactions': len(interactions),
        'interactions': interactions
    }

    if args.sessions:
        sessions = group_into_sessions(interactions)
        output_data['sessions'] = [
            {
                'session_number': i + 1,
                'interaction_count': len(session),
                'start_time': session[0]['timestamps']['stt'],
                'end_time': session[-1]['timestamps'].get('finished') or session[-1]['timestamps']['stt'],
                'interactions': session
            }
            for i, session in enumerate(sessions)
        ]
        print(f"Grouped into {len(sessions)} sessions")

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        print(f"Output written to {args.output}")
    else:
        print(json.dumps(output_data, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
