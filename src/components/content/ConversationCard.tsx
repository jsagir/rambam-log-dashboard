import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Conversation } from '@/types/dashboard'
import { TOPIC_COLORS, SENSITIVITY_COLORS, LANG_FLAGS } from '@/types/dashboard'
import { formatLatency, extractTime, truncate, getLatencyColor } from '@/lib/utils'

// Human-readable anomaly explanations
const ANOMALY_EXPLANATIONS: Record<string, string> = {
  'LANG_UNKNOWN': 'Language not recognized — visitor may be speaking Russian, Arabic, or another unsupported language',
  'EMPTY_RESPONSE': 'Rambam gave no answer at all — the system failed to generate a response',
  'LLM_ERROR': 'The AI system encountered an error while generating the answer',
  'NON_200_CODE': 'Server returned an error code — the system was not working properly',
  'FALLBACK_TRIGGERED': 'Rambam asked the visitor to rephrase — could not understand the question',
  'LATENCY_SPIKE_WARN': 'Response took over 3 seconds — visitor had to wait noticeably',
  'LATENCY_SPIKE_CRITICAL': 'Response took over 6 seconds — unacceptable wait time',
  'OUT_OF_ORDER': 'System bug: answer arrived before Rambam was ready to speak (David/Starcloud issue)',
  'THINK_OVERFLOW': 'AI took longer to think than the opening sentence covers — visitor heard a silence gap',
  'OPENING_LATENCY_WARN': 'Visitor waited over 3 seconds before hearing anything',
  'OPENING_LATENCY_CRITICAL': 'Visitor waited over 5 seconds before hearing anything — very uncomfortable',
  'STT_DROPPED': 'Speech was recognized but the system never responded',
}

const SENSITIVITY_EXPLANATIONS: Record<string, string> = {
  'low': 'Non-controversial topic',
  'medium': 'Requires some care in the response',
  'high': 'Politically or religiously sensitive topic — review recommended',
  'critical': 'Extremely sensitive (interfaith theology, modern politics) — must review',
}

const LANG_EXPLANATIONS: Record<string, string> = {
  'he-IL': 'Visitor spoke Hebrew',
  'en-US': 'Visitor spoke English',
  'unknown': 'Language not detected — possibly Russian, Arabic, or unclear speech',
}

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
          <span className="text-lg" title={LANG_EXPLANATIONS[c.language] || `Language: ${c.language}`}>{flag}</span>
          <span className="text-parchment font-mono" title={`Full timestamp: ${c.time}`}>{extractTime(c.time)}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-semibold"
            style={{ backgroundColor: topicColor + '22', color: topicColor, border: `1px solid ${topicColor}33` }}
            title={`Topic: ${c.topic} — What this visitor asked about`}
          >
            {c.topic}
          </span>
          {c.sensitivity !== 'low' && (
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{ backgroundColor: sensColor + '22', color: sensColor }}
              title={SENSITIVITY_EXPLANATIONS[c.sensitivity] || c.sensitivity}
            >
              {c.sensitivity}
            </span>
          )}
          {c.is_thank_you_interrupt && (
            <span
              className="px-2 py-0.5 rounded text-xs font-bold tracking-wide"
              style={{ backgroundColor: '#C75B3A33', color: '#C75B3A', border: '1px solid #C75B3A55' }}
              title="KILL SWITCH — Visitor said 'Thank you' in English to stop Rambam mid-sentence. This is a system control signal, not a conversation."
            >
              ⏹ STOP
            </span>
          )}
          {c.thank_you_type === 'polite' && (
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{ backgroundColor: '#4A8F6F22', color: '#4A8F6F', border: '1px solid #4A8F6F33' }}
              title="Polite Hebrew thanks (תודה) — NOT a stop command. The visitor is just being polite."
            >
              🙏 Thanks
            </span>
          )}
          {c.vip && (
            <span className="text-gold text-sm font-bold" title="VIP visitor detected — named person, review this conversation">★ VIP: {c.vip}</span>
          )}
          <span
            className="ml-auto font-mono text-sm font-semibold"
            style={{ color: latColor }}
            title={`Response time: ${c.latency_ms.toLocaleString()}ms. ${c.latency_ms <= 2000 ? 'Fast (under 2s)' : c.latency_ms <= 3000 ? 'Acceptable (2-3s)' : 'Too slow (over 3s) — visitor waited too long'}`}
          >
            {formatLatency(c.latency_ms)}
          </span>
          {c.is_anomaly && (
            <span
              className="text-critical text-base cursor-help"
              title={c.anomalies.map((a) => `${a}: ${ANOMALY_EXPLANATIONS[a] || 'Unknown anomaly type'}`).join('\n')}
            >
              ⚠
            </span>
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
            <span title="Total time from visitor's question to complete answer delivery">Latency: <span className="font-mono font-semibold" style={{ color: latColor }}>{c.latency_ms.toLocaleString()}ms</span></span>
            <span title="Number of text chunks streamed from the AI">{c.chunk_count} chunks</span>
            <span title={c.is_complete ? 'Rambam finished the full answer' : 'Answer was cut short — may have been interrupted or errored'}>{c.is_complete ? '✓ Complete' : '✗ Incomplete'}</span>
            <span title="How the system classified this question">{c.question_type}</span>
            {c.audio_id && <span title="Which pre-recorded Rambam opening sentence was played">Opening #{c.audio_id}</span>}
            {c.anomalies.length > 0 && (
              <span className="text-critical font-semibold" title={c.anomalies.map((a) => `${a}: ${ANOMALY_EXPLANATIONS[a] || 'Unknown'}`).join('\n')}>
                {c.anomalies.map((a) => ANOMALY_EXPLANATIONS[a] ? `⚠ ${a}` : `⚠ ${a}`).join(' · ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
