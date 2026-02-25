import { useState } from 'react'
import { MessageCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

const RAMBAM_URL = 'https://kind-mud-0c893d403.1.azurestaticapps.net'

export function TalkWithRambam() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="mb-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between bg-card border border-gold/30 rounded-lg px-5 py-4 hover:border-gold/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-gold" />
          <div className="text-left">
            <h2 className="font-serif text-xl text-gold">Talk with the Rambam</h2>
            <p className="text-parchment-dim text-sm">Live API demo — ask Rambam a question via text</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={RAMBAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-parchment-dim hover:text-gold transition-colors flex items-center gap-1"
          >
            Open in new tab <ExternalLink size={12} />
          </a>
          {expanded ? (
            <ChevronUp size={18} className="text-parchment-dim group-hover:text-gold transition-colors" />
          ) : (
            <ChevronDown size={18} className="text-parchment-dim group-hover:text-gold transition-colors" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-1 border border-gold/20 rounded-lg overflow-hidden bg-card">
          <iframe
            src={RAMBAM_URL}
            title="Talk with the Rambam — Live API"
            className="w-full border-0"
            style={{ height: '600px' }}
            allow="microphone"
          />
        </div>
      )}
    </section>
  )
}
