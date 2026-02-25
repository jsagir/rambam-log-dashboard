import { useState } from 'react'
import { ConversationFeed } from './ConversationFeed'
import { TopicCharts } from './TopicCharts'
import type { Conversation, DailyStat, TopicTrend, KPI } from '@/types/dashboard'

interface ContentIntelligenceProps {
  conversations: Conversation[]
  dailyStats: DailyStat[]
  topicTrend: TopicTrend[]
  kpi: KPI
  showTranslations: boolean
}

type Tab = 'feed' | 'charts'

export function ContentIntelligence({
  conversations,
  dailyStats,
  topicTrend,
  kpi,
  showTranslations,
}: ContentIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<Tab>('feed')

  return (
    <section className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="font-serif text-2xl text-gold" title="This shows what visitors are asking Rambam about. Browse individual conversations or see topic trends in the charts.">What Visitors Are Asking</h2>
        <div className="flex bg-card border border-border rounded-md overflow-hidden text-base">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-5 py-2 transition-colors ${
              activeTab === 'feed'
                ? 'bg-gold/20 text-gold'
                : 'text-text-dim hover:text-parchment'
            }`}
          >
            Visitor Questions
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-5 py-2 transition-colors ${
              activeTab === 'charts'
                ? 'bg-gold/20 text-gold'
                : 'text-text-dim hover:text-parchment'
            }`}
          >
            Topics & Trends
          </button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <ConversationFeed
          conversations={conversations}
          showTranslations={showTranslations}
        />
      ) : (
        <TopicCharts
          dailyStats={dailyStats}
          topicTrend={topicTrend}
          kpi={kpi}
        />
      )}
    </section>
  )
}
