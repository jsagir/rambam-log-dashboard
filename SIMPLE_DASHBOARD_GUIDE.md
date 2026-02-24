# Simple Dashboard Guide

## Overview

The simple standalone dashboard is located at `/simple-dashboard` and uses **hardcoded data** with no file dependencies or build complexity.

**URL:** https://rambam-log-dashboard.onrender.com/simple-dashboard

## Current Log Files in Repo

```
logs/
├── 20260215.txt (6.2K)
├── 20260216.txt (29K)
├── 20260217.txt (72K)
├── 20260218.txt (22K)
├── 20260219.txt (16K)
├── 20260222.txt (37K)
├── 20260222-2.txt (37K)
└── 20260223.txt (20K)
```

## How to Add New Log Files

When you have new log files, follow these steps:

### 1. Add the log file to the repo

```bash
# Copy new log file to logs directory
cp /path/to/new-log.txt logs/

# Add to git
git add logs/new-log.txt
git commit -m "Add log file for [DATE]"
git push
```

### 2. Process the log and extract interactions

Tell me: **"Add new log file `logs/FILENAME.txt` to simple dashboard"**

I will:
1. Parse the log file using Python scripts
2. Extract the interactions
3. Add them to the hardcoded data in `/src/app/simple-dashboard/page.tsx`
4. Update the DAILY_TREND and TOPIC_TREND data
5. Commit and push the changes

### 3. The dashboard auto-updates

Once pushed, the dashboard will show the new data (no rebuild needed on localhost, just refresh).

For production (Render/Vercel), the deployment will auto-trigger on push.

## Dashboard Features

**Cumulative Mode:**
- KPI cards (interactions, languages, latency, issues, VIP visits)
- Engagement trend chart (Hebrew/English over time)
- Topic trends (stacked bar chart)
- Question type distribution (pie chart)
- Latency by type (horizontal bar)
- Sensitivity radar
- Content accuracy breakdown
- Critical issues log
- Engagement depth trend

**Drill-Down Mode:**
- Filters (search, type, topic, sensitivity, anomaly)
- Latency timeline
- Expandable question cards with full details

## File Location

**Dashboard file:** `/src/app/simple-dashboard/page.tsx`

**Data structure:**
```typescript
const INTERACTIONS = [
  {
    id: 1,
    time: "07:02",
    session: 1,
    question: "...",
    answer: "...",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Kashrut",
    latency: 2020,
    accuracy: "correct",
    anomalies: [],
    audioId: "27",
    opening: "...",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  // ... more interactions
];

const DAILY_TREND = [
  {
    date: "Feb 15",
    interactions: 8,
    questions: 6,
    hebrew: 5,
    english: 3,
    avgLatency: 1200,
    anomalies: 0,
    critical: 0,
    inquiryPct: 25,
    depthPct: 40
  },
  // ... more days
];
```

## Benefits of This Approach

✅ **No build complexity** - No Python processing required
✅ **Fast deployment** - Just push and it works
✅ **No data file dependencies** - Everything is self-contained
✅ **Easy to update** - Just add new interaction objects
✅ **Works on all platforms** - Render, Vercel, localhost

## Workflow Summary

1. You get a new log file from the museum
2. You say: "Add `logs/20260224.txt` to simple dashboard"
3. I extract the data and add it to the hardcoded arrays
4. I commit and push
5. Dashboard auto-updates with new data

That's it! Simple and reliable. 🎉
