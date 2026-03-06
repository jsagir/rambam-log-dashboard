import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react'

interface TourStep {
  /** CSS selector for the target element */
  target: string
  /** Step title */
  title: string
  /** Step description */
  content: string
  /** Optional placement hint */
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="kpi-band"]',
    title: 'Key Performance Indicators',
    content: 'These cards give you the big picture at a glance — how many questions, response speed, system health, and language breakdown. Hover over any card for a detailed explanation.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="kpi-stt"]',
    title: 'STT → Opening (Segment 1)',
    content: 'The first silence the visitor feels after asking a question. The system processes their speech, classifies the question, selects an opening sentence, and fires the audio. Under 2 seconds is ideal.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="kpi-audio"]',
    title: 'Opening Duration (Segment 2)',
    content: 'How long the opening sentence plays — this is the "filler" audio that buys time while the AI generates the real answer behind the scenes. Hebrew openings are shorter than English ones.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="kpi-seamless"]',
    title: 'Opening → Response (Segment 3)',
    content: 'After the opening finishes, is the AI answer ready? "Seamless" means zero second gap — the answer plays immediately. If not seamless, the visitor hears another silence gap.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="content-tabs"]',
    title: 'What Visitors Are Asking',
    content: 'Four tabs to explore visitor interactions: Visitor Questions (full feed with filters), Hot Topics (content classification), Opening Sentences (which openings Rambam uses), and Topics & Trends (patterns over time).',
    placement: 'bottom',
  },
  {
    target: '[data-tour="latency-pipeline"]',
    title: 'Response Speed Pipeline',
    content: 'The visual timeline shows exactly where time goes in each response. The bar widths are proportional to actual durations. Purple = silence, green = opening audio, red = gap, gold = answer streaming.',
    placement: 'top',
  },
  {
    target: '[data-tour="hebrew-calendar"]',
    title: 'לוח פעילות · Activity Calendar',
    content: 'Shows which days the system was active. Offline days are explained: purple for Shabbat, gold for Jewish holidays, red for unexpected closures. Uptime % excludes expected closures.',
    placement: 'top',
  },
  {
    target: '[data-tour="ask-panel"]',
    title: 'Ask the Data',
    content: 'Ask questions in plain language. Try: "Show me the slowest Hebrew conversations", "What topics have the highest latency?", "How many unknown language questions?", "Show conversations about Christianity", or "Compare Hebrew vs English speed". Uses GPT-4o-mini with local fallback.',
    placement: 'left',
  },
]

const STORAGE_KEY = 'rambam-tour-seen'

export function GuidedTour() {
  const [isActive, setIsActive] = useState(false)
  const [step, setStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Show tour button. Auto-start on first visit.
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      // Delay to let dashboard render
      const timer = setTimeout(() => setIsActive(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const currentStep = TOUR_STEPS[step]

  const positionSpotlight = useCallback(() => {
    if (!isActive || !currentStep) return

    const el = document.querySelector(currentStep.target)
    if (!el) {
      // Target not found — skip to next
      if (step < TOUR_STEPS.length - 1) setStep(step + 1)
      else endTour()
      return
    }

    const rect = el.getBoundingClientRect()
    setSpotlightRect(rect)

    // Scroll element into view if needed
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
    if (!isVisible) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Re-measure after scroll
      setTimeout(() => {
        const newRect = el.getBoundingClientRect()
        setSpotlightRect(newRect)
        positionTooltip(newRect)
      }, 400)
    } else {
      positionTooltip(rect)
    }
  }, [isActive, currentStep, step])

  const positionTooltip = useCallback((rect: DOMRect) => {
    if (!currentStep) return

    const tooltipW = 340
    const tooltipH = 180 // approximate
    const padding = 16
    const placement = currentStep.placement || 'bottom'

    let top: number
    let left: number

    if (placement === 'bottom') {
      top = rect.bottom + padding
      left = rect.left + rect.width / 2 - tooltipW / 2
    } else if (placement === 'top') {
      top = rect.top - tooltipH - padding
      left = rect.left + rect.width / 2 - tooltipW / 2
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2 - tooltipH / 2
      left = rect.left - tooltipW - padding
    } else {
      top = rect.top + rect.height / 2 - tooltipH / 2
      left = rect.right + padding
    }

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipW - padding))
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipH - padding))

    setTooltipPos({ top, left })
  }, [currentStep])

  useEffect(() => {
    positionSpotlight()
  }, [positionSpotlight])

  // Reposition on resize
  useEffect(() => {
    if (!isActive) return
    const handler = () => positionSpotlight()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [isActive, positionSpotlight])

  function endTour() {
    setIsActive(false)
    setStep(0)
    setSpotlightRect(null)
    setTooltipPos(null)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  function goNext() {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1)
    else endTour()
  }

  function goPrev() {
    if (step > 0) setStep(step - 1)
  }

  function startTour() {
    setStep(0)
    setIsActive(true)
  }

  // Handle keyboard
  useEffect(() => {
    if (!isActive) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') endTour()
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isActive, step])

  return (
    <>
      {/* Tour trigger button — always visible */}
      <button
        onClick={startTour}
        className="fixed bottom-6 left-6 z-[9998] w-11 h-11 rounded-full bg-gold/90 hover:bg-gold text-background flex items-center justify-center shadow-lg transition-all hover:scale-110"
        title="Dashboard Tour — click to learn what each section shows"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <HelpCircle size={22} />
      </button>

      {/* Tour overlay */}
      {isActive && spotlightRect && tooltipPos && (
        <>
          {/* Backdrop with spotlight cutout — using CSS clip-path for the hole */}
          <div
            className="fixed inset-0 z-[9999] pointer-events-auto"
            onClick={endTour}
            style={{
              backgroundColor: 'rgba(12, 10, 8, 0.75)',
              clipPath: `polygon(
                0% 0%, 0% 100%, 100% 100%, 100% 0%,
                0% 0%,
                ${spotlightRect.left - 6}px ${spotlightRect.top - 6}px,
                ${spotlightRect.left - 6}px ${spotlightRect.bottom + 6}px,
                ${spotlightRect.right + 6}px ${spotlightRect.bottom + 6}px,
                ${spotlightRect.right + 6}px ${spotlightRect.top - 6}px,
                ${spotlightRect.left - 6}px ${spotlightRect.top - 6}px,
                0% 0%
              )`,
            }}
          />

          {/* Spotlight border glow */}
          <div
            className="fixed z-[10000] pointer-events-none rounded-lg"
            style={{
              top: spotlightRect.top - 6,
              left: spotlightRect.left - 6,
              width: spotlightRect.width + 12,
              height: spotlightRect.height + 12,
              border: '2px solid #C8A961',
              boxShadow: '0 0 0 4px rgba(200, 169, 97, 0.15), 0 0 24px rgba(200, 169, 97, 0.3)',
            }}
          />

          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className="fixed z-[10001] w-[340px] bg-[#1C1914] border border-gold/40 rounded-xl shadow-2xl"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(200,169,97,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gold/15 text-gold">
                  {step + 1}/{TOUR_STEPS.length}
                </span>
                <h4 className="text-sm font-semibold text-gold">{currentStep.title}</h4>
              </div>
              <button
                onClick={endTour}
                className="text-parchment-dim hover:text-parchment transition-colors p-1"
                title="Close tour (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
              <p className="text-sm text-parchment/90 leading-relaxed">{currentStep.content}</p>
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-2">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: i <= step ? '#C8A961' : '#2D2A24',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-4 pb-4 pt-1">
              <button
                onClick={endTour}
                className="text-xs text-parchment-dim hover:text-parchment transition-colors"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={goPrev}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-card border border-border text-parchment-dim hover:text-parchment transition-colors"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex items-center gap-1 text-xs px-4 py-1.5 rounded-md bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 transition-colors font-medium"
                >
                  {step < TOUR_STEPS.length - 1 ? (
                    <>Next <ChevronRight size={14} /></>
                  ) : (
                    'Finish'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
