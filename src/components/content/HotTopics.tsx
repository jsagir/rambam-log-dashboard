import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Conversation } from '@/types/dashboard'

interface HotTopicsProps {
  conversations: Conversation[]
}

/**
 * Hot topic rules — museum-level content classification.
 * Extracted from actual visitor questions, not the broad system categories.
 * Priority ordered: first match wins.
 */
const HOT_TOPIC_RULES: { topic: string; color: string; keywords: RegExp }[] = [
  {
    topic: 'War & Peace',
    color: '#E74C3C',
    keywords: /war|peace|שלום|מלחמה|army|צבא|soldier|חייל|defend|enlist|draft|גיוס|recruit|military|haredi.*army|ultra.?orthodox.*army|yeshiva.*army|torah.*army|army.*torah|fight.*end|give up/i,
  },
  {
    topic: 'Politics',
    color: '#E84393',
    keywords: /netanyahu|נתניהו|government|ממשלה|politic|פוליטי|palestine|פלסטין|bibi|knesset|כנסת|minister|election|בחירות|state.*israel|ultra.?orthodox.*don.?t|חרד.*לא.*מתגייס/i,
  },
  {
    topic: 'Current Events',
    color: '#D63031',
    keywords: /yesterday|אתמול|today.*news|beat.*women.*soldier|news|חדשות|happened.*recently/i,
  },
  {
    topic: 'Halachic',
    color: '#E67E22',
    keywords: /meat.*milk|milk.*meat|בשר.*חלב|חלב.*בשר|kosher|kashrut|כשר|hours.*keep|shabbat|שבת|sabbath|saturday.*game|halacha|הלכה|mitzvah|מצוו|bar.?mitzvah|בר.?מצווה|שחיטה|טרף/i,
  },
  {
    topic: 'Religion',
    color: '#8E44AD',
    keywords: /christian|idolatry|נצרות|עבודה זרה|ישו|jesus|church|כנסייה|islam|מוסלמ|mosque|karaite|קראים|prayer|תפילה|prophet|נביא|messiah|משיח|sect|reform|conservative/i,
  },
  {
    topic: 'Faith',
    color: '#9B59B6',
    keywords: /\bgod\b|אלוהים|אלהים|divine|tabernacle|משכן|heaven|righteous|צדיק|soul|נשמה|miracle|נס|present.*everyday|believe|אמונה|faith|השגחה|שכינה|creator/i,
  },
  {
    topic: 'Philosophy',
    color: '#3498DB',
    keywords: /conscious|תודעה|meaning.*life|wisdom|חכמה|truth|אמת|justice|צדק|virtue|what is.*\?|essence|מהות/i,
  },
  {
    topic: 'Tolerance',
    color: '#1ABC9C',
    keywords: /tolerance|סובלנות|coexist|דו.?קיום|respect|כבוד|different.*people|accept|diversity/i,
  },
  {
    topic: 'Moral',
    color: '#2ECC71',
    keywords: /ethics|מוסר|moral|right.*wrong|advice.*give|should.*i|dilemma|צדק|fair|הוגן|lawsuit|sue|swindle/i,
  },
  {
    topic: 'Logic & Reason',
    color: '#2980B9',
    keywords: /logic|reason|הגיון|rational|proof|argue|debate|think.*about|opinion|contradic|paradox|why.*not|how.*can/i,
  },
  {
    topic: 'Family',
    color: '#E91E63',
    keywords: /family|משפחה|child|ילד|parent|הורה|son|daughter|brother|אח|sibling|education|חינוך|boy.*home|love.*relationship|marriage|נישואין|אהבה/i,
  },
  {
    topic: 'Historical',
    color: '#16A085',
    keywords: /born|נולד|where.*live|lived.*israel|ארץ ישראל|egypt|מצרים|spain|ספרד|biography|history|sultan|old testament|genesis|בראשית/i,
  },
  {
    topic: 'Medicine',
    color: '#00B894',
    keywords: /medicine|רפואה|doctor|רופא|health|בריאות|medical|cure|disease|weight loss|physician/i,
  },
  {
    topic: 'Science',
    color: '#00CEC9',
    keywords: /science|מדע|astronomy|כוכב|nature|טבע|universe|יקום|research|experiment/i,
  },
  {
    topic: 'Technology',
    color: '#6C5CE7',
    keywords: /technology|טכנולוגי|computer|מחשב|internet|artificial|hologram|robot|digital|AI\b/i,
  },
  {
    topic: 'Educational',
    color: '#FDCB6E',
    keywords: /study|ללמוד|learn|torah.*study|teach|book.*begin|verse|פסוק|parsha|פרשה|talmud|תלמוד|torah|תורה|key.*takeaway|scripture/i,
  },
  {
    topic: 'Environmental',
    color: '#55EFC4',
    keywords: /environment|סביבה|nature|climate|world|עולם|earth|planet|animal|חיה|sustainable/i,
  },
  {
    topic: 'Cynical',
    color: '#636E72',
    keywords: /blah|shoes.*wearing|jewelry|table|hummus|falafel|shawarma|coffee.*morning|nap|shower|wash.*face|walk.*morning|tea\b|what.*on.*table|feel.*the\b/i,
  },
  {
    topic: 'Personal',
    color: '#B2BEC3',
    keywords: /sport|team|captain|coach|police|משטרה|שוטר|law enforcement|planning department|weight|diet|routine|hobby/i,
  },
]

function classifyHotTopic(conversation: Conversation): string | null {
  const text = (conversation.question_en || conversation.question || '').toLowerCase()
  if (!text || text.length < 3) return null
  if (conversation.is_greeting) return null
  if (conversation.language === 'unknown') return null

  for (const rule of HOT_TOPIC_RULES) {
    if (rule.keywords.test(text)) return rule.topic
  }

  return 'Miscellaneous'
}

const TOOLTIP_STYLE = {
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
}

export function HotTopics({ conversations }: HotTopicsProps) {
  const hotTopics = useMemo(() => {
    const counts: Record<string, { count: number; questions: string[]; color: string }> = {}

    for (const c of conversations) {
      const topic = classifyHotTopic(c)
      if (!topic) continue

      if (!counts[topic]) {
        const rule = HOT_TOPIC_RULES.find(r => r.topic === topic)
        counts[topic] = { count: 0, questions: [], color: rule?.color || '#6B7280' }
      }
      counts[topic].count++
      if (counts[topic].questions.length < 3) {
        const q = (c.question_en || c.question || '').slice(0, 80)
        if (q && !counts[topic].questions.includes(q)) {
          counts[topic].questions.push(q)
        }
      }
    }

    return Object.entries(counts)
      .map(([topic, data]) => ({ topic, ...data }))
      .sort((a, b) => b.count - a.count)
  }, [conversations])

  const classified = useMemo(() => {
    let count = 0
    for (const c of conversations) {
      if (classifyHotTopic(c)) count++
    }
    const nonGreeting = conversations.filter(c => !c.is_greeting && c.language !== 'unknown').length
    return { count, total: nonGreeting }
  }, [conversations])

  if (hotTopics.length === 0) return null

  const top12 = hotTopics.slice(0, 12)

  return (
    <div className="bg-card border border-gold/20 rounded-lg p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gold">Hot Topics</h3>
        <span className="text-xs text-parchment-dim">
          {classified.count} questions across {hotTopics.length} topics
        </span>
      </div>
      <p className="text-xs text-parchment-dim mb-4">
        Content-level classification from actual visitor questions — what people really ask Rambam.
      </p>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={Math.max(200, top12.length * 32)}>
        <BarChart data={top12} layout="vertical" margin={{ left: 120, right: 20 }}>
          <XAxis type="number" stroke="#D0C8B8" fontSize={12} />
          <YAxis
            type="category"
            dataKey="topic"
            stroke="#D0C8B8"
            fontSize={12}
            width={115}
            tick={{ fill: '#F5F0E8' }}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value: number) => [`${value} questions`, 'Count']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {top12.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Topic cards with sample questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {hotTopics.filter(t => t.topic !== 'Miscellaneous').slice(0, 9).map(({ topic, count, questions, color }) => (
          <div key={topic} className="bg-background rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-sm font-semibold text-parchment truncate">{topic}</span>
              <span className="ml-auto text-xs font-mono text-gold">{count}</span>
            </div>
            {questions.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {questions.map((q, i) => (
                  <p key={i} className="text-[11px] text-parchment-dim truncate" dir="auto">
                    &ldquo;{q}&rdquo;
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
