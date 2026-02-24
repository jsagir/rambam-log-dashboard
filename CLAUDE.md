# Rambam Log Analytics Dashboard

## Project Overview

A live web dashboard for analyzing interaction logs from the Rambam (Maimonides) AI holographic system at the Museum of Tolerance Jerusalem.

## Purpose

This dashboard provides **real-time log analysis** with dual-layer evaluation:

1. **Content Quality Analysis** — Evaluating answer accuracy against Rambam's actual writings, persona consistency, guardrail effectiveness, and halachic correctness
2. **Technical Anomaly Detection** — Identifying language detection failures, LLM errors, TTS issues, latency spikes, persona breaks, and session health problems

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, React, Tailwind CSS
- **Components**: shadcn/ui for consistent design system
- **Data Visualization**: Recharts or similar for metrics/charts
- **Real-time Updates**: Server-sent events or WebSocket for live log streaming
- **Backend**: Next.js API routes for log processing
- **Analysis Engine**: Python scripts (from skill) exposed via API

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
2. **Parse** → Python script extracts structured interactions
3. **Detect Anomalies** → Automated technical issue detection
4. **Content Review** → AI-assisted quality evaluation
5. **Visualize** → Real-time dashboard with insights

### Dashboard Views

#### 1. Overview Panel
- Total interactions count
- Languages breakdown (Hebrew/English/Unknown)
- Session count and duration
- Overall health status (🟢 Healthy | 🟡 Issues | 🔴 Critical)

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
- **Production**: Deploy to Vercel/Render with environment variables
- **Python**: Ensure Python 3.9+ available in deployment environment
- **Dependencies**: Requirements.txt for Python, package.json for Node

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
