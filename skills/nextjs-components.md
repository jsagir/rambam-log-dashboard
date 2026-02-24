---
name: nextjs-components
category: frontend-development
description: Build production-ready React TypeScript components for the Rambam Dashboard using Next.js 14+, shadcn/ui, Tailwind CSS, and Recharts.
triggers:
  - "new component"
  - "dashboard component"
  - "create component"
  - "react component"
  - "tsx component"
  - "chart component"
  - "visualization"
---

# Next.js Component Builder Skill

Build production-ready React TypeScript components for the Rambam Dashboard.

## Overview

The Rambam Dashboard uses Next.js 14+ App Router with TypeScript, shadcn/ui, and Tailwind CSS. Components are placed in `src/components/` organized by domain.

---

## Component Template

```tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/shared/Badge";

interface MyComponentProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  onAction?: (item: string) => void;
}

export function MyComponent({ title, data, onAction }: MyComponentProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-mono">{total}</span>
        </p>
        {data.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-1"
          >
            <span>{item.label}</span>
            <Badge>{item.value}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

## Available Imports

### shadcn/ui Components

```tsx
// Layout
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Forms
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Feedback
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Data
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// Overlays
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
```

### Icons (Lucide React)

```tsx
import {
  Check, X, Plus, Minus, Edit, Trash, Save,
  Search, Settings, Menu, Home, User,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ArrowRight, ArrowLeft, ExternalLink,
  AlertCircle, AlertTriangle, Info, HelpCircle,
  Star, Heart, ThumbsUp, ThumbsDown,
  Clock, Loader2, RefreshCw,
  MessageCircle, Send, Sparkles,
  Activity, BarChart3, TrendingUp, TrendingDown,
  FileText, Upload, Download,
  Globe, Languages, Mic,
} from "lucide-react";
```

### Charts (Recharts)

```tsx
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
```

### React Hooks

```tsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
```

---

## Chart Component Template

```tsx
"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ChartData {
  label: string;
  value: number;
}

interface MyChartProps {
  title: string;
  data: ChartData[];
  color?: string;
}

export function MyChart({ title, data, color = "#3B82F6" }: MyChartProps) {
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## Existing Shared Components (Reuse These)

| Component | Import | Usage |
|-----------|--------|-------|
| `StatCard` | `@/components/shared/StatCard` | KPI metric display |
| `Badge` | `@/components/shared/Badge` | Status/category badge |
| `SectionTitle` | `@/components/shared/SectionTitle` | Section headings |

---

## Rambam Domain Context

### Data Structures

Log analysis results typically include:

```typescript
interface AnalysisResult {
  total_interactions: number;
  languages: { hebrew: number; english: number; unknown: number };
  sessions: SessionData[];
  anomalies: Anomaly[];
  latency: LatencyMetrics;
  health_score: number;
  log_date: string;
  time_range: { start: string; end: string };
}

interface Anomaly {
  type: "CRITICAL" | "WARNING" | "OPERATIONAL";
  category: string;
  description: string;
  timestamp: string;
  interaction_index: number;
}

interface LatencyMetrics {
  opening_avg_ms: number;
  answer_avg_ms: number;
  e2e_avg_ms: number;
}
```

### Health Status Colors

| Score | Status | Color |
|-------|--------|-------|
| 80-100 | Healthy | Green (`text-emerald-500`) |
| 50-79 | Issues | Amber (`text-amber-500`) |
| 0-49 | Critical | Red (`text-red-500`) |

---

## Best Practices

1. **TypeScript strict** — All props typed, no `any`
2. **"use client"** — Add directive for interactive components
3. **Memoize** expensive computations with `useMemo`
4. **Responsive** — Use `ResponsiveContainer` for charts, responsive Tailwind classes
5. **Loading states** — Show skeleton or spinner while data loads
6. **Error boundaries** — Graceful failure with user-friendly messages
7. **Plain English** — No technical jargon in user-facing text
8. **Accessible** — Color + text/icon for all indicators
9. **Performance** — Paginate large datasets (10K+ items)
10. **Check existing** — Always check `src/components/` before creating new ones

---

## Workflow

1. **Identify need** — What data? What interactions?
2. **Check existing** — Reuse shared components (StatCard, Badge, SectionTitle)
3. **Create component** — `src/components/{domain}/NewComponent.tsx`
4. **Type props** — Define interface with clear types
5. **Style with Tailwind** — Use semantic colors from the design system
6. **Test** — Verify with sample data, check responsiveness
