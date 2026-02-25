#!/usr/bin/env python3
"""Merge all processed log JSONs into a single accumulated.json for the dashboard."""

import json
import sys
from datetime import datetime
from pathlib import Path


def build_accumulated():
    project_root = Path(__file__).parent.parent
    processed_dir = project_root / 'logs' / 'processed'
    out_path = project_root / 'public' / 'data' / 'accumulated.json'

    if not processed_dir.exists():
        print("No processed logs found. Run process_log.py first.")
        sys.exit(1)

    # Load all processed files
    all_files = sorted(processed_dir.glob('*.json'))
    if not all_files:
        print("No processed JSON files found.")
        sys.exit(1)

    all_interactions = []
    daily_stats = []
    topic_trend = []
    anomaly_log = []
    dates = []

    for f in all_files:
        with open(f, 'r', encoding='utf-8') as fh:
            data = json.load(fh)

        date_str = data.get('date', '')
        interactions = data.get('interactions', [])
        summary = data.get('summary', {})

        if date_str:
            dates.append(date_str)

        # Add interactions with sequential IDs
        for inter in interactions:
            inter['_source_file'] = f.name
            all_interactions.append(inter)

        # Daily stats
        if summary:
            daily_stats.append(summary)

        # Topic trend entry
        topics = summary.get('topic_distribution', {})
        if date_str:
            topic_entry = {'date': date_str}
            topic_entry.update(topics)
            topic_trend.append(topic_entry)

        # Anomaly log
        for inter in interactions:
            if inter.get('is_anomaly'):
                for anom in inter.get('anomalies', []):
                    anomaly_log.append({
                        'date': inter.get('date', date_str),
                        'time': inter.get('time', ''),
                        'type': anom,
                        'question': inter.get('question', '')[:80],
                        'latency_ms': inter.get('latency_ms', 0),
                        'language': inter.get('language', ''),
                        'interaction_id': inter.get('id', ''),
                    })

    # Sort everything
    all_interactions.sort(key=lambda x: x.get('time', ''))
    daily_stats.sort(key=lambda x: x.get('date', ''))
    dates.sort()

    # Deduplicate IDs — overlapping logs can produce identical msg IDs
    seen_ids = {}
    for inter in all_interactions:
        cid = inter['id']
        if cid in seen_ids:
            seen_ids[cid] += 1
            inter['id'] = f'{cid}_{seen_ids[cid]}'
        else:
            seen_ids[cid] = 0

    # Compute aggregate KPIs
    total = len(all_interactions)
    latencies = [i['latency_ms'] for i in all_interactions if i['latency_ms'] > 0]
    total_days = len(daily_stats)

    # Language counts
    lang_counts = {}
    for i in all_interactions:
        lang = i.get('language', 'unknown')
        lang_counts[lang] = lang_counts.get(lang, 0) + 1

    # Topic counts
    topic_counts = {}
    for i in all_interactions:
        topic = i.get('topic', 'General')
        topic_counts[topic] = topic_counts.get(topic, 0) + 1

    # Accuracy / quality
    anomaly_total = sum(1 for i in all_interactions if i.get('is_anomaly'))
    failure_total = sum(1 for i in all_interactions if i.get('is_comprehension_failure'))
    out_of_order_total = sum(1 for i in all_interactions if i.get('is_out_of_order'))

    # Two-Latency Model aggregations (using actual audio durations per interaction)
    opening_lats = [i['opening_latency_ms'] for i in all_interactions if i.get('opening_latency_ms') and i['opening_latency_ms'] > 0]
    think_times = [i['ai_think_ms'] for i in all_interactions if i.get('ai_think_ms') and i['ai_think_ms'] > 0]
    # Seamless = AI finishes before actual opening audio ends (per-interaction check)
    seamless_count = sum(
        1 for i in all_interactions
        if i.get('ai_think_ms') is not None and i.get('opening_audio_duration_ms')
        and i['ai_think_ms'] < i['opening_audio_duration_ms']
    )
    net_gaps = [i['net_gap_ms'] for i in all_interactions if i.get('net_gap_ms') is not None]
    avg_net_gap = int(sum(net_gaps) / len(net_gaps)) if net_gaps else 0

    kpi = {
        'total_interactions': total,
        'total_days': total_days,
        'avg_interactions_per_day': round(total / total_days, 1) if total_days else 0,
        'avg_latency_ms': int(sum(latencies) / len(latencies)) if latencies else 0,
        'max_latency_ms': max(latencies) if latencies else 0,
        'avg_opening_latency_ms': int(sum(opening_lats) / len(opening_lats)) if opening_lats else 0,
        'avg_ai_think_ms': int(sum(think_times) / len(think_times)) if think_times else 0,
        'seamless_response_rate': round(seamless_count / len(think_times) * 100, 1) if think_times else 0,
        'avg_net_gap_ms': avg_net_gap,
        'out_of_order_count': out_of_order_total,
        'anomaly_count': anomaly_total,
        'anomaly_rate': round(anomaly_total / total * 100, 1) if total else 0,
        'failure_count': failure_total,
        'failure_rate': round(failure_total / total * 100, 1) if total else 0,
        'language_distribution': lang_counts,
        'topic_distribution': topic_counts,
    }

    # Build final structure
    accumulated = {
        'meta': {
            'last_updated': datetime.now().isoformat() + 'Z',
            'total_days': total_days,
            'total_conversations': total,
            'date_range': [dates[0], dates[-1]] if dates else [],
            'generated_by': 'build_accumulated.py v2',
        },
        'kpi': kpi,
        'daily_stats': daily_stats,
        'topic_trend': topic_trend,
        'anomaly_log': anomaly_log,
        'conversations': all_interactions,
    }

    # Write output
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(accumulated, f, ensure_ascii=False, indent=2)

    print(f"Built accumulated.json: {total} interactions across {total_days} days")
    print(f"  Date range: {dates[0] if dates else '?'} → {dates[-1] if dates else '?'}")
    print(f"  Anomalies: {anomaly_total} ({kpi['anomaly_rate']}%)")
    print(f"  Avg latency: {kpi['avg_latency_ms']}ms")
    print(f"  Output: {out_path}")


if __name__ == '__main__':
    build_accumulated()
