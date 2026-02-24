#!/usr/bin/env python3
"""
Update Simple Dashboard with Real Data

Replaces mock INTERACTIONS and DAILY_TREND arrays in simple-dashboard/page.tsx
with real accumulated data from all processed logs.
"""

import json
import re

# Load real data
with open('/tmp/dashboard_real_data.json', 'r', encoding='utf-8') as f:
    real_data = json.load(f)

interactions = real_data['interactions']
daily_trend = real_data['daily_trend']

print(f"📊 Loaded {len(interactions)} interactions and {len(daily_trend)} days")

# Read dashboard file
dashboard_file = 'src/app/simple-dashboard/page.tsx'
with open(dashboard_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Convert to TypeScript format using JSON encoding (handles all escaping correctly)
def to_ts_value(v):
    if v is None:
        return 'null'
    elif isinstance(v, bool):
        return 'true' if v else 'false'
    else:
        # Use json.dumps for reliable escaping of strings, arrays, etc.
        return json.dumps(v, ensure_ascii=False)

# Build interactions array
interactions_ts = "const INTERACTIONS = [\n"
for i, interaction in enumerate(interactions):
    if i > 0:
        interactions_ts += ",\n"
    interactions_ts += "  {\n"
    for key, value in interaction.items():
        interactions_ts += f"    {key}: {to_ts_value(value)},\n"
    interactions_ts = interactions_ts.rstrip(',\n') + "\n"
    interactions_ts += "  }"
interactions_ts += "\n];\n"

# Build daily trend array
daily_trend_ts = "const DAILY_TREND = [\n"
for i, day in enumerate(daily_trend):
    if i > 0:
        daily_trend_ts += ",\n"
    daily_trend_ts += "  {\n"
    for key, value in day.items():
        daily_trend_ts += f"    {key}: {to_ts_value(value)},\n"
    daily_trend_ts = daily_trend_ts.rstrip(',\n') + "\n"
    daily_trend_ts += "  }"
daily_trend_ts += "\n];\n"

# Replace INTERACTIONS array
pattern_interactions = r'const INTERACTIONS = \[[\s\S]*?\];'
content = re.sub(pattern_interactions, interactions_ts.rstrip('\n'), content, count=1)

# Replace DAILY_TREND array
pattern_daily = r'const DAILY_TREND = \[[\s\S]*?\];'
content = re.sub(pattern_daily, daily_trend_ts.rstrip('\n'), content, count=1)

# Write back
with open(dashboard_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Updated {dashboard_file}")
print(f"✅ Replaced with {len(interactions)} real interactions")
print(f"✅ Replaced with {len(daily_trend)} days of real data")
print(f"\n🎯 100% REAL DATA - NO MOCK DATA!")
