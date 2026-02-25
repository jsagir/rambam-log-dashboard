import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Conversation } from '@/types/dashboard'
import { TOPIC_COLORS, SENSITIVITY_COLORS, LANG_FLAGS } from '@/types/dashboard'
import { formatLatency, extractTime, truncate, getLatencyColor } from '@/lib/utils'

interface ConversationCardProps {
  conversation: Conversation
  showTranslations: boolean
  isExpanded: boolean
  onToggle: () => void
}

export function ConversationCard({
  conversation: c,
  showTranslations,
  isExpanded,
  onToggle,
}: ConversationCardProps) {
  const isHebrew = c.language === 'he-IL'
  const flag = LANG_FLAGS[c.language] || '❓'
  const topicColor = TOPIC_COLORS[c.topic] || '#6B7280'
  const sensColor = SENSITIVITY_COLORS[c.sensitivity] || '#4A8F6F'
  const latColor = getLatencyColor(c.latency_ms)

  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden card-hover cursor-pointer"
      onClick={onToggle}
    >
      {/* Collapsed view */}
      <div className="p-4">
        {/* Meta row */}
        <div className="flex items-center gap-2.5 text-sm mb-2.5 flex-wrap">
          <span className="text-lg">{flag}</span>
          <span className="text-parchment font-mono">{extractTime(c.time)}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-semibold"
            style={{ backgroundColor: topicColor + '22', color: topicColor, border: `1px solid ${topicColor}33` }}
          >
            {c.topic}
          </span>
          {c.sensitivity !== 'low' && (
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{ backgroundColor: sensColor + '22', color: sensColor }}
            >
              {c.sensitivity}
            </span>
          )}
          {c.is_thank_you_interrupt && (
            <span
              className="px-2 py-0.5 rounded text-xs font-bold tracking-wide"
              style={{ backgroundColor: '#D4A84333', color: '#D4A843', border: '1px solid #D4A84355' }}
            >
              STOP
            </span>
          )}
          {c.vip && (
            <span className="text-gold text-sm font-bold">★ VIP: {c.vip}</span>
          )}
          <span className="ml-auto font-mono text-sm font-semibold" style={{ color: latColor }}>
            {formatLatency(c.latency_ms)}
          </span>
          {c.is_anomaly && (
            <span className="text-critical text-base">⚠</span>
          )}
          {isExpanded ? <ChevronUp size={18} className="text-parchment-dim" /> : <ChevronDown size={18} className="text-parchment-dim" />}
        </div>

        {/* Question */}
        <div dir={isHebrew ? 'rtl' : 'ltr'} className={`text-base text-parchment leading-relaxed ${isHebrew ? 'font-hebrew' : ''}`}>
          {isExpanded ? c.question : truncate(c.question, 100)}
        </div>

        {/* Translation (collapsed) */}
        {showTranslations && isHebrew && !isExpanded && (
          c.question_en ? (
            <div className="translation-text mt-1.5 text-sm">
              ┈ {truncate(c.question_en, 100)}
            </div>
          ) : (
            <div className="mt-1.5 text-sm text-text-dim italic">
              ┈ Translation not available
            </div>
          )
        )}
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-border p-4 bg-background/50">
          {/* Full question with translation */}
          {showTranslations && isHebrew && (
            c.question_en ? (
              <div className="translation-text text-base mb-3">
                ┈ {c.question_en}
              </div>
            ) : (
              <div className="text-base mb-3 text-text-dim italic">
                ┈ Question translation not available
              </div>
            )
          )}

          {/* Divider */}
          <div className="flex items-center gap-2 my-4 text-gold/70 text-sm">
            <div className="flex-1 h-px bg-gold/20" />
            <span className="font-medium">✦ Rambam responds</span>
            <div className="flex-1 h-px bg-gold/20" />
          </div>

          {/* Opening line */}
          {c.opening_text && (
            <div className="text-base text-gold italic mb-3">
              "{c.opening_text}"
            </div>
          )}

          {/* Full answer */}
          <div dir={isHebrew ? 'rtl' : 'ltr'} className={`text-base text-parchment leading-relaxed ${isHebrew ? 'font-hebrew' : ''}`}>
            {c.answer || <span className="text-critical italic">No answer generated</span>}
          </div>

          {/* Answer translation */}
          {showTranslations && isHebrew && (
            c.answer_en ? (
              <div className="translation-text text-base mt-2">
                ┈ {c.answer_en}
              </div>
            ) : (
              <div className="text-base mt-2 text-text-dim italic">
                ┈ Answer translation not available
              </div>
            )
          )}

          {/* Footer meta */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50 text-sm text-parchment-dim flex-wrap">
            <span>Latency: <span className="font-mono font-semibold" style={{ color: latColor }}>{c.latency_ms.toLocaleString()}ms</span></span>
            <span>{c.chunk_count} chunks</span>
            <span>{c.is_complete ? '✓ Complete' : '✗ Incomplete'}</span>
            <span>Type: {c.question_type}</span>
            {c.audio_id && <span>Audio: #{c.audio_id}</span>}
            {c.anomalies.length > 0 && (
              <span className="text-critical font-semibold">
                Anomalies: {c.anomalies.join(', ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
