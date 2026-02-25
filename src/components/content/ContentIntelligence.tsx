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
        <h2 className="font-serif text-2xl text-gold" title="What visitors are asking about and how well Rambam is responding. Use the tabs to browse conversations or see topic trends.">Content Intelligence</h2>
        <div className="flex bg-card border border-border rounded-md overflow-hidden text-base">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-5 py-2 transition-colors ${
              activeTab === 'feed'
                ? 'bg-gold/20 text-gold'
                : 'text-text-dim hover:text-parchment'
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-5 py-2 transition-colors ${
              activeTab === 'charts'
                ? 'bg-gold/20 text-gold'
                : 'text-text-dim hover:text-parchment'
            }`}
          >
            Topics & Charts
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
