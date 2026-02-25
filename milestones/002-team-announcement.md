# Milestone 002: Dashboard Launch and Feature Guide

**Status:** DONE
**Date:** February 25, 2026


## What Was Deployed

Full Rambam Visitor Dashboard at https://rambam-dash-v2.onrender.com

Render static site, auto-deploys from main branch. Not always-on (cold start takes 1-2 minutes).


## Features Launched

- Cumulative Trends / Day Drill-Down navigation
- KPI band with 5 stat cards and sparklines
- Visitor Questions feed with faceted filters (topic, language, sensitivity, speed, anomalies, stops)
- Sort modes: Most Interesting, Latest, Needs Attention, Search
- Topics and Trends tab with 5 chart types
- Ask the Data tab with ILR-based natural language query engine (12 query categories, Hebrew support)
- Response Speed deep-dive with 8 stat cards and 7 charts
- System Issues section (collapsible) with scatter plot, daily trend, problem types, recent issues
- STOP safe word detection (English "Thank you" = kill switch, Hebrew "todah" = polite)
- Hover explanations on every badge and icon
- Color legend: Green = good, Yellow = attention, Red = problem
- Translation toggle for Hebrew conversations


## Team Communication

Jonathan sent announcement to full team explaining:
- What the dashboard is
- How to navigate (Cumulative Trends vs Day Drill-Down)
- What each section shows
- What each team member should look for (Boris daily, Daniel/Sharon weekly, Amit/Diana content, David/Guy technical)


## Who Needs What

Boris (daily QA): System Status green? New STOP badges? New anomalies?
Daniel/Sharon (weekly review): Visitor growth, topic trends, Hebrew vs English, slowest answers
Amit/Diana (content quality): Sensitive conversations, interfaith/military answers, comprehension failures
David/Guy (technical): P95/P99 trends, OUT_OF_ORDER events, afternoon degradation, topic speed
