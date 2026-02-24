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

## 📋 NEW LOG WORKFLOW: What to Do with Every Log File

### The Complete Process (Start to Finish)

When you receive a new log file from the museum (typically from Jonathan@motj.org.il or the daily QA process), follow this workflow:

#### **Step 1: Add Log to Repository**

```bash
# Copy the log file to the logs/ directory with date-based naming
cp /path/to/log-file.txt logs/YYYYMMDD.txt

# Examples:
# logs/20260224.txt  (single log for Feb 24, 2026)
# logs/20260224-2.txt (second log same day)
```

**File Naming Convention:**
- Format: `YYYYMMDD.txt` (e.g., `20260224.txt`)
- Multiple logs same day: add suffix `-2`, `-3` (e.g., `20260224-2.txt`)
- Always use `.txt` extension even if content is newline-delimited JSON

**Git Location:**
```
rambam-log-dashboard/
└── logs/
    ├── 20260215.txt
    ├── 20260216.txt
    └── 20260224.txt  ← Your new log goes here
```

#### **Step 2: Extract Data Using Gemini AI (RECOMMENDED)**

Use the Gemini-powered extraction script for intelligent classification:

```bash
# Run Gemini extraction
python3 python/gemini_extract.py logs/20260224.txt

# This will output:
# - Ready-to-paste TypeScript code for INTERACTIONS array
# - DAILY_TREND entry with statistics
# - Instructions for TOPIC_TREND (manual step)
```

**What Gemini Extracts Automatically:**

1. **Question Classification** (6 types)
   - Closed questions (yes/no, factual)
   - Open ended questions (complex, discussion-worthy)
   - Generic questions (general info)
   - Personal advice or current event questions
   - Statement / Clarification (not questions)
   - Greeting (hello, goodbye, introductions)

2. **Topic Categorization** (13 domains)
   - **Kashrut** - Kosher food laws, dietary restrictions
   - **Daily Practice** - Morning routines, washing, prayers
   - **Science / Medicine** - Health, astronomy, Rambam as physician
   - **Torah Study** - Learning, Talmud, religious texts
   - **Jewish Sects** - Karaites, Reform, Conservative movements
   - **Meta / Museum** - About the installation, tolerance, museum mission
   - **Interfaith** - Christianity, Islam, other religions (HIGH SENSITIVITY)
   - **Haredi / Army / Draft** - Ultra-orthodox military service (POLITICAL)
   - **Sports / Leadership** - Team captains, leadership questions
   - **Personal / Lifestyle** - Clothing, jewelry, personal items
   - **Modern Politics** - Netanyahu, government, current events (CRITICAL)
   - **Shabbat / Halacha** - Sabbath laws, Jewish law
   - **Uncategorized** - Doesn't fit other categories

3. **Sensitivity Detection** (4 levels)
   - **low** - Non-controversial general questions
   - **medium** - Requires care but not explosive (e.g., dietary laws)
   - **high** - Politically or religiously sensitive (e.g., Jewish movements)
   - **critical** - Extremely sensitive (idolatry, interfaith theology, modern politics)

4. **Content Accuracy Assessment** (5 ratings)
   - **correct** - Accurate, well-formed answer aligned with Rambam's writings
   - **partial** - Incomplete or partially correct information
   - **incorrect** - Wrong information or factual errors
   - **guardrail** - Properly refused to answer (post-1204 topics, out of scope)
   - **fallback** - Asked for clarification, couldn't understand question

5. **VIP Detection**
   - Extracts names and titles from greetings (e.g., "Professor Cohen", "Editor Sarah")
   - Format: `"Name (Title)"` or `null` if no VIP mentioned
   - **Why critical:** Named visitors are high-stakes, museum management must be notified

6. **Anomaly Identification** (3 types)
   - **LATENCY_SPIKE_WARN** - Response time > 3000ms (user experience issue)
   - **FALLBACK_TRIGGERED** - Clarification requested (understanding failure)
   - **SENSITIVE_TOPIC** - Critical sensitivity detected (political/interfaith)

7. **Technical Metadata**
   - Time of interaction (HH:MM format)
   - Session number (groups related interactions)
   - Language (he-IL, en-US)
   - Latency in milliseconds
   - Audio ID for correlation with TTS logs
   - Opening sentence from response (for repetition detection)

**Gemini Output Format:**

```typescript
// Ready-to-paste into src/app/simple-dashboard/page.tsx

// INTERACTIONS array entry:
{
  id: 47,
  time: "14:23",
  session: 12,
  question: "האם יכול מוסלמי להיות צדיק?",
  answer: "בהחלט. הרמב\"ם כותב בהלכות מלכים...",
  lang: "he-IL",
  type: "Open ended questions",
  topic: "Interfaith",
  latency: 4235,
  accuracy: "correct",
  anomalies: ["LATENCY_SPIKE_WARN", "SENSITIVE_TOPIC"],
  audioId: "152",
  opening: "Indeed, my friend. The Rambam writes...",
  sensitivity: "critical",
  vip: null,
  is_greeting: false
}

// DAILY_TREND entry:
{
  date: "Feb 24",
  interactions: 23,
  questions: 19,
  hebrew: 15,
  english: 8,
  avgLatency: 2145,
  anomalies: 5,
  critical: 2,
  inquiryPct: 35,
  depthPct: 55
}
```

#### **Step 3: Update Simple Dashboard**

```bash
# Edit the dashboard file
nano src/app/simple-dashboard/page.tsx

# 1. Add the INTERACTIONS entries to the INTERACTIONS array
# 2. Add the DAILY_TREND entry to the DAILY_TREND array
# 3. Manually update TOPIC_TREND based on topic counts
```

**Manual Step - TOPIC_TREND:**
Count occurrences of each topic from the extracted interactions and add entry:

```typescript
{
  date: "Feb 24",
  Kashrut: 5,
  "Daily Practice": 3,
  "Torah Study": 7,
  Interfaith: 2,
  "Haredi/Army": 0,
  "Meta/Museum": 4,
  Other: 2
}
```

#### **Step 4: Commit and Deploy**

```bash
# Stage the changes
git add logs/20260224.txt src/app/simple-dashboard/page.tsx

# Commit with descriptive message
git commit -m "feat: Add log data for 2026-02-24

- 23 interactions (15 Hebrew, 8 English)
- 2 critical sensitivity items (interfaith questions)
- Average latency 2145ms
- 5 anomalies detected

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub (triggers auto-deploy to Render/Vercel)
git push origin main
```

**Deployment Confirmation:**
- Check Render dashboard: https://dashboard.render.com
- Verify dashboard updates: https://rambam-log-dashboard.onrender.com/simple-dashboard
- Typically takes 2-3 minutes for deployment

#### **Step 5: Notify Stakeholders (if Critical Issues)**

If Gemini extraction flagged **critical** sensitivity or **VIP** visitors:

1. Review the flagged interactions manually
2. Screenshot relevant Q&A pairs
3. Notify Daniel and museum management
4. Document in WhatsApp "Rambam – Tech&Ops" group if needed

---

### Alternative: Manual Extraction (Fallback)

If Gemini is unavailable or you prefer manual control:

```bash
# Parse log file to see raw interactions
python3 python/parse_log.py logs/20260224.txt --output json

# Manually classify and add to dashboard
# (More time-consuming, but no API dependencies)
```

---

### What Data Can Be Extracted: The Complete Intelligence Layer

**From the dual-audience dashboard perspective**, each log file is a rich data source serving both **content quality teams** (museum management, educators) and **technical monitoring teams** (developers, QA, operations).

#### **Qualitative Data (Content Layer)**

1. **Visitor Curiosity Patterns**
   - What topics are visitors asking about?
   - Are questions shallow or deep?
   - Do visitors ask follow-up questions (inquiry mode)?
   - Which topics generate the most engagement?

2. **Content Quality Indicators**
   - Halachic accuracy (alignment with Mishneh Torah)
   - Persona consistency (first-person historical voice)
   - Knowledge boundary violations (post-1204 questions)
   - Museum appropriateness (interfaith sensitivity)
   - Political balance (neutrality on Israeli topics)

3. **Conversation Depth Metrics**
   - Question type distribution (closed vs open-ended)
   - Session length (number of interactions per visit)
   - Language switches (Hebrew ↔ English mid-conversation)
   - Greeting vs substantive questions ratio
   - Inquiry mode percentage (deep engagement)

4. **Sensitive Content Flags**
   - Interfaith theology questions
   - Modern political discussions
   - Controversial halachic debates
   - VIP visitor names and affiliations

#### **Quantitative Data (Performance Layer)**

1. **System Performance Metrics**
   - End-to-end latency (STT → classification → LLM → TTS → playback)
   - Opening sentence latency (first response speed)
   - Real answer latency (full response generation)
   - Latency trends over time (degradation detection)
   - Peak vs off-peak performance comparison

2. **Volume and Activity Patterns**
   - Total interactions per day
   - Interactions per hour (temporal heatmap)
   - Sessions per day (unique visitor count proxy)
   - Questions vs greetings ratio
   - Weekday vs weekend patterns
   - Holiday effects on visitor volume

3. **Language Distribution**
   - Hebrew vs English preference
   - Language switches per session
   - Unknown language fallback rate (Russian, Arabic)
   - Language detection accuracy

4. **Technical Health Indicators**
   - HTTP status codes (200 vs errors)
   - LLM error rate
   - STT truncation frequency
   - TTS ghost silence incidents
   - Classification accuracy rate
   - Fallback trigger rate (clarification requests)

#### **Contextual Intelligence (Meta Layer)**

1. **Topic Trends Over Time**
   - Rising topics (what's becoming popular)
   - Declining topics (what's losing interest)
   - Seasonal patterns (holiday-related questions)
   - Event-driven spikes (news correlation)
   - Stacked area charts (ThemeRiver visualization)
   - Bump charts (ranking changes)

2. **Anomaly Narratives**
   - When did latency spike and why?
   - Which conversations triggered anomalies?
   - Correlation with system changes/deployments
   - Explain-by analysis (what dimensions explain the anomaly)
   - Critical issues requiring immediate attention

3. **Visitor Journey Insights**
   - Session gaps (30min+ inactivity → new visitor)
   - Mode transitions (Q&A → Inquiry → back to Q&A)
   - Engagement depth progression
   - Repeat visitor patterns (same session ID across days)

4. **Museum Operations Intelligence**
   - Best/worst/busiest days
   - Peak hours for staffing decisions
   - Content effectiveness by topic
   - VIP visit patterns
   - Multi-day trends (week-over-week growth)
   - Health score evolution

---

### The Dual-Audience Dashboard Architecture

**The dashboard serves both audiences through a layered "triad architecture":**

#### **Top Band: Executive KPIs (Museum Management)**
- Glanceable health status (🟢 🟡 🔴)
- Total interactions, sessions, languages
- Overall quality score, response time
- Trend arrows (↑ ↓ →)
- Sparklines showing 24-hour trajectory

#### **Middle Zone: Conversation Feed + Topic Charts (Content Team)**
- **Left side:** Compact conversation cards with:
  - Question snippet (first 80 characters)
  - Quality badge (color-coded: green/amber/red)
  - Topic chips, sensitivity icon
  - Latency tag
  - Expandable drawer for full Q&A on click
- **Right side:** Topic trends visualization:
  - Treemap (proportional topic distribution)
  - Stacked area chart (topic flow over time)
  - Bump chart (ranking changes)
  - Calendar heatmap (temporal patterns)

#### **Bottom Zone: Technical Deep-Dive (Developers & QA)**
- Performance time-series with anomaly annotations
- Latency breakdown (STT, classification, LLM, TTS)
- Known bug detection alerts
- Raw log access and filtering
- Anomaly log with "Explain by" analysis

**Key Design Principle:** Click any data point in any zone to navigate to relevant content in another zone. E.g., clicking a latency spike surfaces the conversations behind it; clicking a quality score reveals the actual AI answer.

---

### Museum-Grade Aesthetic Guidelines

**Colors (Warm, Sophisticated, Non-Clinical):**
- Background: Warm off-white (`#FAFAF7`)
- Cards: Pure white (`#FFFFFF`)
- Accents: Deep teal (`#2D6A7A`), golden amber (`#BD8C38`)
- Success: Muted forest green (`#4A8F6F`)
- Warning: Amber gold (`#D4A843`)
- Critical: Burnt sienna (`#C75B3A`)

**Typography:**
- Headings: Museum-grade serif or refined sans-serif
- Metrics: Large, readable numbers with trend context
- Body: Clear sans-serif for data tables

**Visualization Principles (Tufte, Few, Knaflic):**
- High data-ink ratio (no decorative elements)
- Direct labels on data points (no separate legends)
- Sparklines next to every KPI
- Bullet graphs for SLA compliance (not gauges)
- Annotations marking deployments and events
- Preattentive attributes: position > length > color hue > size

---

### Quick Reference: Complete Log Workflow

```bash
# 1. Receive log → Add to repo
cp ~/Downloads/rambam-log-2026-02-24.txt logs/20260224.txt

# 2. Extract with Gemini
python3 python/gemini_extract.py logs/20260224.txt

# 3. Copy output → Paste into dashboard
nano src/app/simple-dashboard/page.tsx

# 4. Commit and deploy
git add logs/20260224.txt src/app/simple-dashboard/page.tsx
git commit -m "feat: Add log data for 2026-02-24"
git push origin main

# 5. Verify deployment (2-3 minutes)
# https://rambam-log-dashboard.onrender.com/simple-dashboard
```

**Time estimate:** 5-10 minutes per log file with Gemini extraction.

---

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
