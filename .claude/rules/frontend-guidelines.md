# Rambam Dashboard — Frontend Guidelines

> These rules govern all UI implementation for the Rambam System Dashboard.

---

## 1. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | TypeScript strict mode |
| Styling | Tailwind CSS | Utility-first, custom theme in `tailwind.config.ts` |
| Components | shadcn/ui | Consistent primitives |
| Charts | Recharts | All data visualization |
| Icons | Lucide React | No other icon packages |

---

## 2. File Organization

```
src/
├── app/              # Next.js App Router pages + API routes
│   ├── page.tsx      # Main dashboard
│   ├── layout.tsx    # Root layout
│   └── api/          # API routes (analyze, upload)
├── components/
│   ├── dashboard/    # Dashboard views (ExecutiveDashboard, TimelineChart, etc.)
│   ├── analytics/    # Analysis displays
│   ├── shared/       # Reusable components (Badge, StatCard, SectionTitle)
│   └── ui/           # shadcn/ui primitives
├── lib/
│   └── utils.ts      # cn() utility, helpers
└── types/            # TypeScript type definitions
```

### Import Rules

- Use `@/` path alias for all imports
- No relative imports beyond parent directory
- Group: React → third-party → internal → types

---

## 3. Component Patterns

### TypeScript Required
```tsx
// Always .tsx, always typed props
interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  // ...
}
```

### Named Exports (not default)
```tsx
// Preferred
export function MyComponent() { ... }

// Avoid
export default function MyComponent() { ... }
```

### Composition Over Inheritance
- Build complex components from smaller ones
- Use shadcn/ui primitives (Card, Badge, Table, Alert) as building blocks
- Reuse existing shared components: `Badge`, `StatCard`, `SectionTitle`

---

## 4. Design System

### Color Semantics

| Context | Color | Tailwind |
|---------|-------|----------|
| Critical errors | Red #EF4444 | `text-red-500`, `bg-red-50` |
| Warnings | Amber #F59E0B | `text-amber-500`, `bg-amber-50` |
| Healthy/Success | Green #10B981 | `text-emerald-500`, `bg-emerald-50` |
| Info | Blue #3B82F6 | `text-blue-500`, `bg-blue-50` |
| Neutral | Slate grays | `text-slate-*`, `bg-slate-*` |

### Status Indicators

Health status uses emoji + text (never color alone):
- `🟢 Healthy` — system operating normally
- `🟡 Issues` — warnings present
- `🔴 Critical` — critical errors detected

### Typography

- Headings: `font-semibold` or `font-bold`
- Body: default weight
- Data values: `font-mono` for numbers, timestamps, counts
- Labels: `text-sm text-muted-foreground`

---

## 5. Chart Guidelines (Recharts)

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Always wrap in ResponsiveContainer
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="time" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#3B82F6" />
  </LineChart>
</ResponsiveContainer>
```

Rules:
- Always use `ResponsiveContainer` for responsive charts
- Use semantic colors (blue for info, red for critical, amber for warning)
- Include tooltips for interactive data
- Label axes clearly in plain English
- Prefer line charts for time series, bar charts for comparisons

---

## 6. Accessibility

- All interactive elements focusable via Tab
- Color never the sole indicator — always pair with text/icon
- `aria-label` on icon-only buttons
- WCAG AA contrast minimum (4.5:1 for text)
- `prefers-reduced-motion` respected

---

## 7. Performance

- Optimize for large log files (10K+ interactions)
- Use `useMemo` / `useCallback` for expensive computations
- Lazy load heavy components (charts, large tables)
- Paginate or virtualize long lists

---

## 8. Key Existing Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ExecutiveDashboard` | `dashboard/ExecutiveDashboard.tsx` | Main overview panel |
| `TimelineChart` | `dashboard/TimelineChart.tsx` | Hourly activity chart |
| `AccumulativeKPIs` | `dashboard/AccumulativeKPIs.tsx` | Multi-day aggregate KPIs |
| `MultiDayComparison` | `dashboard/MultiDayComparison.tsx` | Cross-day trend analysis |
| `ConversationFeed` | `dashboard/ConversationFeed.tsx` | Q&A pairs display |
| `SessionFlowMap` | `dashboard/SessionFlowMap.tsx` | Session timeline |
| `DrillDownView` | `dashboard/DrillDownView.tsx` | Detailed interaction view |
| `QuestionCard` | `dashboard/QuestionCard.tsx` | Individual Q&A card |
| `LogViewer` | `dashboard/LogViewer.tsx` | Raw log viewer |
| `CumulativeView` | `dashboard/CumulativeView.tsx` | Cumulative metrics |
| `StatCard` | `shared/StatCard.tsx` | KPI metric card |
| `Badge` | `shared/Badge.tsx` | Status badge |
| `SectionTitle` | `shared/SectionTitle.tsx` | Section heading |

Always check existing components before creating new ones.
