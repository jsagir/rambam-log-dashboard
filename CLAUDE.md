# Rambam System Dashboard

## Project Overview

A clean, visual dashboard showing activity and performance data from the Rambam (Maimonides) AI holographic experience at the Museum of Tolerance Jerusalem.

**Key Design Principles:**
- **No uploads** - Logs are pre-loaded in the `/logs` folder
- **Data visualization** - Charts and graphs instead of raw numbers
- **Simple English** - No technical jargon, plain language for all audiences
- **Executive focus** - Key insights and trends, not detailed technical data

## How It Works

1. **Add Logs** — Place Rambam log files (`.txt` or `.json`) in the `/logs` folder
2. **Auto-Load** — Dashboard automatically processes all logs on startup
3. **Visualize** — Data is transformed into simple charts and graphs
4. **Insights** — Key findings displayed in plain English

## What You See

- **Visitor engagement** - How many people are talking to Rambam
- **Language preferences** - Hebrew vs English conversations
- **Activity trends** - Are visits increasing or decreasing?
- **Response speed** - How fast Rambam answers
- **System health** - Is everything working well?
- **Items to review** - Any issues that need attention

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, React, Tailwind CSS
- **Components**: shadcn/ui for consistent design system
- **Data Visualization**: Recharts or similar for metrics/charts
- **Real-time Updates**: Server-sent events or WebSocket for live log streaming
- **Backend**: Next.js API routes for log processing
- **Analysis Engine**: Python scripts (from skill) exposed via API

## 🚨 CRITICAL RULES

### 1. Chronological Ordering is MANDATORY

**ALL log analysis MUST maintain chronological order by timestamp.**

- **Parser requirement**: Interactions MUST be sorted by `timestamps.stt` in ascending order
- **Reason**: Trend analysis, daily patterns, and session grouping depend on correct time sequencing
- **Implementation**: `parse_log.py` sorts interactions after parsing: `interactions.sort(key=lambda x: x['timestamps'].get('stt'))`
- **Display**: Dashboard MUST show log date prominently at the top
- **Validation**: Always verify first interaction timestamp < last interaction timestamp

**Why this matters:**
- Boris and team need to see patterns throughout the day (morning peak, afternoon lull, etc.)
- Performance degradation over time becomes visible
- Session boundaries are time-based (30min gaps)
- Correlating with museum events requires accurate timing
- Multi-day trend analysis depends on correct ordering

**Testing checklist:**
- ✅ Parse log and verify interactions are time-ordered
- ✅ Check first interaction is earliest timestamp
- ✅ Check last interaction is latest timestamp
- ✅ Timeline chart shows smooth progression
- ✅ No timestamp jumps backwards

### 2. Date Extraction and Display

Every parsed log MUST include:
- `log_date`: YYYY-MM-DD format extracted from first interaction
- `time_range`: Start and end times for the log
- Dashboard banner showing date prominently

This enables:
- Multi-log comparison (yesterday vs today)
- Historical trend analysis
- Daily reports with correct dates
- SOP compliance (daily log verification)

### 3. Multi-Day Analysis (NEW)

The dashboard supports two modes:
- **Single Day**: Analyze one log file in detail
- **Multi-Day Comparison**: Upload multiple log files for trend analysis

**Multi-day features:**
- Batch upload API (`/api/analyze-batch`)
- Chronological sorting by log_date across all files
- Week-over-week comparison charts
- Daily summary table with health scores
- Trend detection (increasing/decreasing patterns)

**Use cases:**
- Compare weekday vs weekend activity
- Identify performance degradation over time
- Track improvement after system updates
- Generate weekly reports for management
- Correlate issues with specific dates/events

**Implementation rules:**
- All logs sorted by date in multi-day view
- Each log processed independently then combined
- Failed logs reported but don't block batch
- Charts show trends across all dates
- Health scores computed per day for comparison

### 4. Accumulative KPIs (EXECUTIVE SUMMARY)

**Purpose**: Provide high-level metrics aggregated across all uploaded logs for management reporting and trend analysis.

**Key KPIs displayed:**
- **Total interactions** across all days (grand total)
- **Average interactions per day** (mean daily volume)
- **Overall health score** (weighted average across all days)
- **Activity trend** (first half vs second half comparison: up/down/stable with %)
- **Language distribution** (Hebrew/English/Unknown with percentages)
- **Average response time** (weighted by interaction count for accuracy)
- **Total sessions** across all logs
- **Critical issues and warnings** (cumulative counts)
- **Best/worst/busiest days** (performance highlights)

**Calculation principles:**
- **Weighted averages**: Response time weighted by interaction count (not simple mean)
- **Trend detection**: Compares first half of date range vs second half to identify growth/decline
- **Health scoring**: Per-day scores based on critical/warning counts, then averaged
- **Date range display**: Shows "YYYY-MM-DD to YYYY-MM-DD" with day count

**Visual components:**
- Executive summary banner (gradient blue) with top-line metrics
- KPI cards with icons (Activity, Clock, Users, etc.)
- Performance highlights section with best/worst/busiest days
- Quick insights box with emoji-formatted bullet points

**Use cases:**
- Weekly management reports showing overall system performance
- Identifying long-term trends (week-over-week growth)
- Spotting performance degradation patterns
- Demonstrating improvement after optimizations
- Comparing different time periods (holiday vs regular days)

**Implementation**: `src/components/dashboard/AccumulativeKPIs.tsx` integrated into multi-day view

## Architecture Rules

### File Structure
```
rambam-log-dashboard/
├── CLAUDE.md (this file)
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Main dashboard
│   │   ├── layout.tsx
│   │   └── api/          # API routes
│   │       ├── analyze/  # Log analysis endpoints
│   │       └── upload/   # Log upload endpoint
│   ├── components/       # React components
│   │   ├── dashboard/    # Dashboard views
│   │   ├── analytics/    # Analysis displays
│   │   └── ui/           # shadcn components
│   ├── lib/              # Utilities
│   │   ├── analysis.ts   # Analysis logic (TypeScript port)
│   │   └── utils.ts
│   └── types/            # TypeScript types
├── python/               # Python analysis scripts
│   ├── parse_log.py      # Log parser
│   ├── detect_anomalies.py  # Anomaly detection
│   └── content_quality.py   # Content evaluation
├── public/
└── package.json
```

### Analysis Pipeline Integration

The dashboard integrates the existing Rambam log analysis skill:

1. **Log Upload** → User uploads .txt or .json log file
2. **Parse** → Python script extracts structured interactions **IN CHRONOLOGICAL ORDER**
3. **Extract Date** → Identify log date and time range for trend analysis
4. **Detect Anomalies** → Automated technical issue detection
5. **Content Review** → AI-assisted quality evaluation
6. **Visualize** → Real-time dashboard with insights and timeline trends

**CRITICAL**: Step 2 MUST sort all interactions by timestamp before proceeding to analysis.

### Dashboard Views

#### 1. Overview Panel
- **Log Date Banner** - Prominently displays date and time range (CRITICAL for daily logs)
- Total interactions count
- Languages breakdown (Hebrew/English/Unknown)
- Session count and duration
- Overall health status (🟢 Healthy | 🟡 Issues | 🔴 Critical)

#### 1.5. Timeline Trend Chart (NEW)
- Hourly interaction volume throughout the day
- Average latency trends over time
- Visual identification of peak hours
- Performance degradation detection
- **Use case**: "Is the system slower in the afternoon?" "What are our peak visitor hours?"

#### 2. Technical Health Monitor
- Real-time anomaly alerts (Critical, Warning, Operational)
- Latency metrics with baselines:
  - Opening sentence: baseline 691ms, alert > 3000ms
  - Real answer: baseline 3759ms, alert > 6000ms
  - Total E2E: alert > 10000ms
- Known bug pattern detection
- Performance graphs over time

#### 3. Content Quality View
- Q&A pairs table with:
  - Question text
  - Answer summary
  - Accuracy rating (✅ Correct | ⚠️ Partial | ❌ Incorrect | 🛡️ Guardrail)
  - Persona consistency score
  - Museum appropriateness flag
- Sensitive topics highlighting
- VIP interaction alerts

#### 4. Session Timeline
- Interactive timeline of all sessions
- Mode labels (Q&A vs Inquiry)
- Language switches
- Gap analysis

#### 5. Reports
- Exportable markdown reports
- Scheduled daily digests
- Historical comparisons

### Design System Rules

#### Colors
- **Critical errors**: Red (#EF4444)
- **Warnings**: Amber (#F59E0B)
- **Success/Healthy**: Green (#10B981)
- **Info**: Blue (#3B82F6)
- **Neutral**: Slate grays

#### Components
- Use shadcn/ui components for consistency
- Card-based layout for insights
- Table component for Q&A pairs
- Badge component for status indicators
- Alert component for anomaly notifications

### Data Flow

```
User uploads log
    ↓
API endpoint receives file
    ↓
Python parser processes log → structured JSON
    ↓
Anomaly detector runs → flags issues
    ↓
Content analyzer evaluates → quality scores
    ↓
Dashboard receives analysis → updates UI
    ↓
Real-time metrics displayed
```

### Key Context

#### The Rambam System
- Interactive holographic Maimonides (1138-1204) at Museum of Tolerance Jerusalem
- Pipeline: visitor speech → STT → AI classification → LLM response → TTS → holographic playback
- Built by KPMG (AI/LLM) and Starcloud/David (Unreal Engine, TTS)
- Logs: newline-delimited JSON capturing every interaction

#### Team
- Daniel (project lead)
- Talya/KPMG (AI/LLM)
- David/Starcloud (on-prem infrastructure)
- Boris (daily QA)
- Guy (hardware/IT)
- Jonathan@motj.org.il (daily log recipient)

#### Critical Requirements

1. **Knowledge Boundary**: Rambam persona must maintain 1204 CE cutoff
2. **Museum Context**: This is Museum of Tolerance — interfaith sensitivity required
3. **VIP Handling**: Named visitors are high-stakes, always flag
4. **Political Balance**: Israeli topics need halachic accuracy + neutrality
5. **SOP Compliance**: Follow AV-B2 operations protocol

### Development Guidelines

- **TypeScript strict mode** — all types defined
- **Error boundaries** — graceful failure handling
- **Performance** — optimize for large log files (10K+ interactions)
- **Accessibility** — WCAG 2.1 AA compliance
- **Responsive** — mobile to desktop support
- **Testing** — Jest + React Testing Library for components
- **Python integration** — child_process or API calls to Python scripts

### Analysis Categories

#### Layer 1: Content Quality
1. **Halachic/Textual Accuracy** — alignment with Mishneh Torah, Moreh Nevuchim, Responsa
2. **Persona Consistency** — first-person historical voice, knowledge boundary
3. **Museum Appropriateness** — interfaith sensitivity, political balance
4. **Question Type Accuracy** — correct classification

#### Layer 2: Technical Anomalies
- 🔴 CRITICAL: LANG_UNKNOWN, LLM_ERROR, PERSONA_BREAK, NON_200_CODE
- 🟡 WARNING: LATENCY_SPIKE, SLOW_CLASSIFICATION, STT_TRUNCATION, HIGH_FALLBACK_RATE
- 🟢 OPERATIONAL: SESSION_GAP, LANGUAGE_SWITCH, OPENING_REPETITION

### Known Bugs to Monitor
1. V1 Language Bug (English detected but "only support Hebrew/English" response)
2. Unknown Language Fallback (Russian/Arabic → generic fallback)
3. TTS Ghost Silence (chunks delivered but no audio)
4. Dev/Prod Endpoint Mismatch (wrong version used)

### Security & Privacy

- No PII storage beyond session logs
- Secure file upload validation
- Rate limiting on API endpoints
- CORS configuration for production

### Deployment

- **Development**: `npm run dev` on localhost:3000
- **Production**: Deploy to Render as Web Service (see render.yaml)
- **Python**: Python 3.11 installed via build.sh
- **Dependencies**: Requirements.txt for Python, package.json for Node
- **Auto-deploy**: Render redeploys automatically on git push to main

## Getting Started

```bash
# Install dependencies
npm install

# Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run development server
npm run dev

# Open http://localhost:3000
```

## Future Enhancements

- [ ] Real-time log streaming from museum system
- [ ] Historical trend analysis
- [ ] Automated daily reports via email
- [ ] Multi-language support for dashboard UI
- [ ] Advanced filtering and search
- [ ] Export to PDF/Excel
- [ ] Integration with WhatsApp "Rambam – Tech&Ops" group for alerts
