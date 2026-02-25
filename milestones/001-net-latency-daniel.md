# Milestone 001: Net Latency — Daniel's Request

**Status:** WAITING ON DANIEL
**Priority:** High
**Requested by:** Daniel (project lead)
**Date:** February 2026
**Relevant to:** Sanhedrin / Beit 3 deliverable


## The Request

Daniel asked to split the single latency number into two separate metrics:
1. Latency until the opening sentence arrives (pre-recorded video filler)
2. Latency until the actual AI model answer arrives (real response)

Then calculate "net latency" — the gap the visitor actually experiences.


## Daniel's Key Insight

Both processes start at the same moment when a visitor sends a message:
- The opening sentence video arrives first and plays for the visitor
- The AI model generates the real answer in the background

The opening sentence masks the wait time. So if overall latency shows 3 seconds (red), but the opening video covers 2 seconds, the actual perceived wait is only 1 second — which is fine.

Net latency = AI think time - opening sentence duration

If net latency is zero or negative, the visitor experiences no wait at all.


## Current Status — What Is Already Built

DONE: Three separate latencies tracked per conversation
- Opening Latency (silence before opening plays)
- AI Think Time (model generation, hidden behind opening)
- Stream Duration (answer delivery time)

DONE: Seamless Response Rate
- Percentage of conversations where AI finished before opening ended
- This is Daniel's "net latency = zero" scenario
- Shown in KPI band and Ask the Data summary

DONE: Opening sentence tracking
- audio_id field records which opening was used per conversation
- "Ask the Data" supports "which openings work best?" query

PARTIALLY DONE: Net latency calculation
- Currently estimates opening coverage at ~3 seconds
- Needs exact durations per audio_id to be precise


## What Daniel Needs to Send

A list of opening sentence videos with their durations. Any format:

    audio_id | duration_seconds
    1        | 2.4
    2        | 3.1
    40       | 2.8

Spreadsheet, text file, WhatsApp message — anything works.


## Implementation Plan (once durations received)

1. Add OPENING_DURATIONS lookup table to scripts/process_log.py
2. Calculate net_latency_ms = ai_think_ms - opening_duration_ms per conversation
3. Add net_latency_ms field to Conversation type
4. Add "Net Latency" stat card to KPIBand
5. Add "Coverage Gap" chart to LatencyPanel — shows where visitors hear silence
6. Update seamless rate to use exact durations instead of ~3s estimate
7. Add "which openings provide best coverage?" to Ask the Data
8. Reprocess all existing logs with new durations
9. Push and deploy


## Connection to Sanhedrin / Beit 3

This latency tracking is a deliverable for Phase 3. Daniel wants to show latency trends over time as KPMG makes tuning improvements. The dashboard already supports:
- Cumulative Trends view for before/after comparison
- Day Drill-Down for picking specific dates
- Daily Speed Trend charts showing improvement over time
- Speed by Topic showing which subjects need tuning

Once net latency is live, Daniel can demonstrate: "On Feb 15, 40% of conversations had a perceived gap. After tuning, on Feb 24 it dropped to 15%."


## Three-Step Plan (agreed in meeting)

1. DONE — Jonathan adds two separate latency metrics to dashboard
2. WAITING — Daniel sends opening sentence video durations
3. TODO — Jonathan adds net latency calculation and coverage gap visualization
