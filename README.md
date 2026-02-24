# Rambam Log Analytics Dashboard

A real-time web dashboard for analyzing interaction logs from the Rambam (Maimonides) AI holographic system at the Museum of Tolerance Jerusalem.

## Features

- **Dual-Layer Analysis**
  - Content Quality: Evaluates answer accuracy, persona consistency, and museum appropriateness
  - Technical Anomaly Detection: Identifies system issues, latency spikes, and errors

- **Real-Time Insights**
  - Interactive dashboard with critical metrics
  - Language distribution visualization
  - Performance metrics tracking
  - Anomaly alerts (Critical, Warning, Operational)

- **Comprehensive Reporting**
  - Session grouping and timeline analysis
  - Q&A pair evaluation
  - Latency baselines and threshold monitoring
  - Known bug pattern detection

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Analysis Engine**: Python 3 scripts
- **Data Visualization**: Recharts, Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+

### Installation

1. Clone or navigate to the project directory:
```bash
cd ~/rambam-log-dashboard
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
pip install -r python/requirements.txt
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. Click "Choose File" and upload a Rambam log file (.txt or .json)
2. Click "Analyze" to process the log
3. View the dashboard with:
   - Overall health status
   - Language distribution
   - Critical issues and warnings
   - Performance metrics
   - Session timeline

## Project Structure

```
rambam-log-dashboard/
├── CLAUDE.md              # Project rules and architecture
├── README.md              # This file
├── src/
│   ├── app/
│   │   ├── page.tsx       # Main dashboard
│   │   ├── layout.tsx     # Root layout
│   │   ├── globals.css    # Global styles
│   │   └── api/
│   │       └── analyze/   # Log analysis endpoint
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   │   └── utils.ts       # Helper functions
│   └── types/
│       └── rambam.ts      # TypeScript definitions
├── python/
│   ├── parse_log.py       # Log parser
│   ├── detect_anomalies.py # Anomaly detector
│   └── requirements.txt   # Python dependencies
├── public/                # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Analysis Pipeline

1. **Parse Log** (`parse_log.py`)
   - Extracts structured interactions from newline-delimited JSON
   - Groups interactions into sessions
   - Computes latencies

2. **Detect Anomalies** (`detect_anomalies.py`)
   - Identifies critical issues (language failures, LLM errors, persona breaks)
   - Flags warnings (latency spikes, truncation, empty responses)
   - Tracks operational patterns (language switches, session gaps)

3. **Visualize Dashboard**
   - Displays real-time metrics
   - Shows anomaly alerts with severity levels
   - Provides performance analytics

## Anomaly Categories

### 🔴 Critical
- `LANG_UNKNOWN`: Language detection failed
- `LLM_ERROR`: No response after classification
- `PERSONA_BREAK`: System messages in response
- `NON_200_CODE`: HTTP error codes

### 🟡 Warning
- `LATENCY_SPIKE`: Response time exceeds threshold
- `STT_TRUNCATION`: Short, incomplete questions
- `EMPTY_RESPONSE`: No content in response
- `STYLE_ANOMALY`: Non-neutral styling

### 🟢 Operational
- `LANGUAGE_SWITCH`: Language changed mid-session
- `QUESTION_TYPE_SKEW`: Uneven question distribution
- `SESSION_GAP`: Long pause between interactions

## Performance Baselines

- **Opening sentence latency**: 691ms baseline, alert > 3000ms
- **Real answer latency**: 3759ms baseline, alert > 6000ms
- **Total E2E**: alert > 10000ms

## Context

The Rambam AI system:
- Interactive holographic Maimonides (1138-1204 CE)
- Located at Museum of Tolerance Jerusalem
- Pipeline: visitor speech → STT → AI classification → LLM → TTS → hologram
- Built by KPMG (AI/LLM) and Starcloud/David (Unreal Engine, TTS)

## Deployment

### Deploy to Render

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete deployment instructions.

Quick steps:
```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/rambam-log-dashboard.git
git push -u origin main

# 2. Deploy to Render
# - Go to https://dashboard.render.com
# - Click "New" → "Blueprint"
# - Connect your GitHub repo
# - Render auto-configures from render.yaml
```

Your dashboard will be live at: `https://rambam-log-dashboard.onrender.com`

**Note**: This requires a **Web Service** deployment (not static site) because it runs Python scripts server-side.

## Development Notes

- See `CLAUDE.md` for detailed architecture rules
- Python scripts use newline-delimited JSON format
- API handles file uploads up to 10MB
- Temp files auto-cleaned after analysis
- TypeScript strict mode enabled

## Future Enhancements

- [ ] Real-time log streaming from museum system
- [ ] Historical trend analysis and comparisons
- [ ] Automated daily reports via email
- [ ] Multi-language UI support
- [ ] Advanced filtering and search capabilities
- [ ] PDF/Excel export functionality
- [ ] Integration with WhatsApp alerts

## Team

- Daniel (project lead)
- Talya/KPMG (AI/LLM)
- David/Starcloud (infrastructure)
- Boris (daily QA)
- Guy (hardware/IT)

## License

Internal use - Museum of Tolerance Jerusalem
