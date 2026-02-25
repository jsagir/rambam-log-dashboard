import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import type { DailyStat, TopicTrend, KPI } from '@/types/dashboard'
import { TOPIC_COLORS, LANG_LABELS } from '@/types/dashboard'

interface TopicChartsProps {
  dailyStats: DailyStat[]
  topicTrend: TopicTrend[]
  kpi: KPI
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#1C1914',
    border: '1px solid #C8A961',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    opacity: 0.97,
  },
  labelStyle: { color: '#C8A961', fontWeight: 700 },
  itemStyle: { color: '#FFFFFF' },
}

export function TopicCharts({ dailyStats, topicTrend, kpi }: TopicChartsProps) {
  // Topic distribution for bar chart
  const topicData = useMemo(() => {
    return Object.entries(kpi.topic_distribution)
      .map(([topic, count]) => ({ topic, count: count as number, fill: TOPIC_COLORS[topic] || '#6B7280' }))
      .sort((a, b) => b.count - a.count)
  }, [kpi.topic_distribution])

  // Language pie data
  const langData = useMemo(() => {
    const colors: Record<string, string> = {
      'he-IL': '#3B82F6',
      'en-US': '#10B981',
      'unknown': '#6B7280',
    }
    return Object.entries(kpi.language_distribution).map(([lang, count]) => ({
      name: LANG_LABELS[lang] || lang,
      value: count as number,
      fill: colors[lang] || '#6B7280',
    }))
  }, [kpi.language_distribution])

  // Daily volume bar chart
  const dailyVolume = useMemo(() => {
    return dailyStats.map((d) => ({
      date: d.date.slice(5), // MM-DD
      total: d.total_conversations,
      anomalies: d.anomaly_count,
    }))
  }, [dailyStats])

  // Hourly heatmap data (aggregate all days)
  const hourlyData = useMemo(() => {
    const hourCounts: Record<number, number> = {}
    dailyStats.forEach((d) => {
      Object.entries(d.hourly_distribution).forEach(([h, count]) => {
        const hour = parseInt(h)
        hourCounts[hour] = (hourCounts[hour] || 0) + (count as number)
      })
    })
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: hourCounts[i] || 0,
    }))
  }, [dailyStats])

  // Top topics for stacked area
  const topTopics = useMemo(() => {
    const sorted = Object.entries(kpi.topic_distribution)
      .sort(([, a], [, b]) => (b as number) - (a as number))
    return sorted.slice(0, 6).map(([t]) => t)
  }, [kpi.topic_distribution])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Topic Distribution */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-base font-semibold text-parchment mb-4" title="This shows the most popular subjects visitors ask about. If 'General' is very high, it may mean some questions are not being classified well.">Most Popular Topics</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topicData} layout="vertical" margin={{ left: 100 }}>
            <XAxis type="number" stroke="#D0C8B8" fontSize={13} />
            <YAxis type="category" dataKey="topic" stroke="#D0C8B8" fontSize={13} width={95} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {topicData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Language Split */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-base font-semibold text-parchment mb-4" title="This shows which languages visitors speak. 'Unknown' usually means Russian or Arabic speakers that Rambam cannot understand yet.">Languages Spoken</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={langData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
              fontSize={13}
            >
              {langData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip {...CHART_TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Volume */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-base font-semibold text-parchment mb-4" title="This shows how many visitor questions Rambam received each day. Red bars are problems (errors or slow answers). Busy days often mean group tours.">Questions per Day</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyVolume}>
            <XAxis dataKey="date" stroke="#D0C8B8" fontSize={13} />
            <YAxis stroke="#D0C8B8" fontSize={13} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Bar dataKey="total" fill="#C8A961" radius={[4, 4, 0, 0]} name="Questions" />
            <Bar dataKey="anomalies" fill="#C75B3A" radius={[4, 4, 0, 0]} name="Problems" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Activity */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-base font-semibold text-parchment mb-4" title="This shows what time of day visitors talk to Rambam. Peaks usually match tour schedules. Helpful for planning maintenance or staffing.">Busiest Hours of the Day</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={hourlyData}>
            <XAxis dataKey="hour" stroke="#D0C8B8" fontSize={13} />
            <YAxis stroke="#D0C8B8" fontSize={13} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#C8A961"
              fill="#C8A961"
              fillOpacity={0.15}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Topic Trends Over Time */}
      <div className="bg-card border border-border rounded-lg p-4 lg:col-span-2">
        <h3 className="text-base font-semibold text-parchment mb-4" title="This shows how visitor interest in each topic changes day by day. A rising topic may mean a current event or new exhibit is drawing attention.">How Topics Change Day by Day</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={topicTrend}>
            <XAxis dataKey="date" stroke="#D0C8B8" fontSize={13} tickFormatter={(d) => d.slice(5)} />
            <YAxis stroke="#D0C8B8" fontSize={13} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            {topTopics.map((topic) => (
              <Area
                key={topic}
                type="monotone"
                dataKey={topic}
                stackId="1"
                stroke={TOPIC_COLORS[topic] || '#6B7280'}
                fill={TOPIC_COLORS[topic] || '#6B7280'}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2">
          {topTopics.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-sm text-parchment">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TOPIC_COLORS[t] }} />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
