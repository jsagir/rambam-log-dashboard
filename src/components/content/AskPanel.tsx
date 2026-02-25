import { useState } from 'react'
import { MessageSquareText, X, Minimize2, Maximize2 } from 'lucide-react'
import { AskTheData } from './AskTheData'
import type { Conversation } from '@/types/dashboard'

interface AskPanelProps {
  conversations: Conversation[]
}

type PanelSize = 'compact' | 'normal' | 'large'

const PANEL_WIDTHS: Record<PanelSize, string> = {
  compact: 'w-[380px]',
  normal: 'w-[440px]',
  large: 'w-[560px]',
}

const PANEL_HEIGHTS: Record<PanelSize, string> = {
  compact: 'max-h-[50vh]',
  normal: 'max-h-[70vh]',
  large: 'max-h-[85vh]',
}

export function AskPanel({ conversations }: AskPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [size, setSize] = useState<PanelSize>('normal')

  function cycleSize() {
    const sizes: PanelSize[] = ['compact', 'normal', 'large']
    const idx = sizes.indexOf(size)
    setSize(sizes[(idx + 1) % sizes.length])
  }

  // Collapsed — floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #C8A961 0%, #A88B3E 100%)',
          color: '#1C1914',
          boxShadow: '0 4px 20px rgba(200, 169, 97, 0.3)',
        }}
        title="Ask the Data"
      >
        <MessageSquareText size={20} />
        <span className="text-sm font-semibold">Ask the Data</span>
      </button>
    )
  }

  // Open — sticky panel
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 ${PANEL_WIDTHS[size]} flex flex-col rounded-xl shadow-2xl border border-gold/20 overflow-hidden`}
      style={{
        backgroundColor: '#1C1914',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(200, 169, 97, 0.1)',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-gold/15 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(200, 169, 97, 0.12) 0%, rgba(200, 169, 97, 0.04) 100%)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-gold text-sm">✦</span>
          <span className="text-gold text-sm font-semibold">Ask the Data</span>
          <span className="text-parchment-dim/40 text-xs">{conversations.length} conversations</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={cycleSize}
            className="p-1.5 rounded-md text-parchment-dim/50 hover:text-parchment hover:bg-gold/10 transition-colors"
            title={`Size: ${size} — click to cycle`}
          >
            {size === 'large' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md text-parchment-dim/50 hover:text-parchment hover:bg-gold/10 transition-colors"
            title="Close panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content — scrollable */}
      <div className={`flex-1 overflow-y-auto p-4 ${PANEL_HEIGHTS[size]}`}>
        <AskTheData conversations={conversations} />
      </div>
    </div>
  )
}
