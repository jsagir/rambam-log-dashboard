# Rambam Visitor Dashboard

A visual dashboard for monitoring the Rambam (Maimonides) AI holographic experience at the Museum of Tolerance Jerusalem.

**Live:** https://rambam-dash-v2.onrender.com

> First-time loading: If the page takes a minute, the server is waking up (not always-on to save costs). Wait 1-2 minutes, then it works instantly.

## What It Shows

- How many visitors talked to Rambam each day
- Which languages they used (Hebrew / English)
- What topics they asked about (Kashrut, Theology, Military, Philosophy, etc.)
- How fast the system responded
- Whether everything is working properly
- Any issues that need attention

Green = good. Yellow = needs attention. Red = problem.

## How to Use

**Cumulative Trends** — Click to see overall performance across all days. Aggregated KPIs, topic trends, daily volume charts.

**Day Drill-Down** — Click to examine a specific day. Navigate between days with arrow buttons. Shows that day's conversations, KPIs, and performance.

**Visitor Questions tab** — Browse individual Q&A conversations. Filter by topic, language, sensitivity, speed, problems, or stop commands.

**Topics & Trends tab** — Charts showing topic distribution, language split, daily volume, hourly activity, and topic trends over time.

**Ask the Data tab** — Type natural language questions about the data. Supports English and Hebrew. Try: "kashrut", "slow responses", "compare Hebrew vs English", "busiest hour", "any problems?", "צבא", "כשרות".

**Response Speed section** — Detailed latency analysis: percentiles, SLA targets, speed by topic, speed by language, scatter plots, daily trends.

**System Issues section** — Click to expand. Shows every anomaly, latency scatter plot, daily speed trend, problem types, recent issues.

Hover over any icon or badge for a plain English explanation of what it means.

## Tech Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Data:** Static JSON (`public/data/accumulated.json`)
- **Deploy:** Render static site, auto-deploys on push to main
- **Processing:** Python scripts generate accumulated.json from raw museum logs

## Project Structure

```
rambam-log-dashboard/
├── src/
│   ├── App.tsx                          # Main layout + navigation
│   ├── main.tsx                         # React entry point
│   ├── index.css                        # Tailwind + custom theme
│   ├── components/
│   │   ├── kpi/KPIBand.tsx              # Top KPI stat cards with sparklines
│   │   ├── content/
│   │   │   ├── ContentIntelligence.tsx   # 3-tab container
│   │   │   ├── ConversationFeed.tsx      # Q&A list with sorting
│   │   │   ├── ConversationCard.tsx      # Individual conversation display
│   │   │   ├── FacetedFilters.tsx        # Multi-select filter controls
│   │   │   ├── TopicCharts.tsx           # Topic, language, volume charts
│   │   │   └── AskTheData.tsx            # Natural language query engine
│   │   └── health/
│   │       ├── LatencyPanel.tsx          # Response speed deep-dive
│   │       └── SystemHealth.tsx          # Anomaly tracking
│   ├── hooks/useAccumulatedData.ts       # Data loader
│   ├── lib/utils.ts                      # Formatters and helpers
│   └── types/dashboard.ts               # TypeScript interfaces
├── scripts/
│   ├── process_log.py                    # Single log processor
│   └── process_all_new.py               # Batch processor for new logs
├── logs/                                 # Raw museum log files
├── public/
│   └── data/accumulated.json             # Pre-processed dashboard data
├── swarm/                                # Validation skill definitions
│   ├── rambam-log-extractor.md
│   ├── rambam-viz-shaper.md
│   └── dataviz-consultant.md
├── CLAUDE.md                             # Architecture rules + dev guide
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Data Pipeline

1. **Receive logs** — Raw `.txt` files from the museum go into `logs/`
2. **Process** — `python3 scripts/process_all_new.py` extracts conversations, detects anomalies, classifies topics, computes latencies
3. **Validate** — Three swarm skills verify data quality (extractor, viz-shaper, dataviz)
4. **Output** — Generates `public/data/accumulated.json` with all conversations, daily stats, topic trends, anomaly log, and KPIs
5. **Deploy** — `git push` triggers Render auto-deploy. Dashboard reads the JSON client-side.

No API routes. No file uploads. No database. The JSON file is the single source of truth.

## Key Features

**Ask the Data** — Client-side natural language query engine using an Intermediate Logical Representation (ILR) pipeline. Supports 12 query categories: topic aliases, temporal queries (dates, "yesterday", "this week"), language filters, latency analysis, anomaly search, stop command analysis, comparisons ("Hebrew vs English"), FAQ detection, topic ranking, opening sentence analysis, summaries, and free-text search. Full Hebrew input support. Auto-enriches every result with contextual stats and pattern insights.

**STOP Safe Word Detection** — The Rambam hologram has a kill switch: saying "Thank you" in English stops Rambam mid-sentence. Hebrew "תודה" is polite thanks, NOT a stop. The dashboard tracks and distinguishes both. Dashboard shows red "STOP" badges for kill switches and green "🙏" for polite thanks.

**Two-Latency Model** — Rambam plays a pre-recorded opening sentence while the AI thinks. The dashboard tracks opening latency (silence the visitor feels), AI think time (hidden behind the opening), and stream duration separately. The "seamless response rate" measures how often the AI finishes before the opening ends.

**Faceted Filters** — Multi-select dropdowns for Topic, Language, and Sensitivity. Segmented control for latency range. Toggle buttons for anomalies-only and stop-commands-only. All composable.

**Hover Explanations** — Every icon, badge, and symbol has a tooltip explaining what it means in plain English. Chart tooltips use bright white text on dark backgrounds.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Production build to dist/
```

## Processing New Logs

```bash
# Add raw log file
cp ~/new-log.txt logs/YYYYMMDD.txt

# Process all new logs
python3 scripts/process_all_new.py

# Verify and deploy
npm run build
git add public/data/accumulated.json logs/
git commit -m "feat: Add log data for YYYY-MM-DD"
git push origin main
```

## Deployment

Render static site `rambam-dash-v2` (Service ID: srv-d6fbtsggjchc73fl612g). Auto-deploys from `main` branch.

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Environment:** `OPENAI_KEY` available for future LLM features

## The Rambam System

- Interactive holographic Maimonides (1138-1204 CE) at Museum of Tolerance Jerusalem
- Pipeline: visitor speech → STT → AI classification → LLM response → TTS → holographic playback
- Built by KPMG (AI/LLM) and Starcloud/David (Unreal Engine, TTS)
- Logs: newline-delimited JSON capturing every visitor interaction

## Team

- Daniel (project lead)
- Talya/KPMG (AI/LLM)
- David/Starcloud (on-prem infrastructure)
- Boris (daily QA)
- Guy (hardware/IT)
- Jonathan (dashboard, daily logs)

## License

Internal use — Museum of Tolerance Jerusalem
