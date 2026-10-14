import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  gestureDetector,
  type GestureData,
  type GestureState,
  type FeedbackType,
} from '../vision/gestureDetector'

interface CursorDisplayState {
  handDetected: boolean
  isHovering: boolean
  isPinching: boolean
  gestureState: GestureState
  statusMessage: string
  feedback: FeedbackType
}

export const HandCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const [displayState, setDisplayState] = useState<CursorDisplayState>({
    handDetected: false,
    isHovering: false,
    isPinching: false,
    gestureState: 'NO_HAND',
    statusMessage: 'NO HAND DETECTED',
    feedback: 'none',
  })

  const prevDisplayRef = useRef<CursorDisplayState>(displayState)

  useEffect(() => {
    const unsubscribe = gestureDetector.subscribe((data: GestureData) => {
      posRef.current = { x: data.cursorX, y: data.cursorY }

      // Direct hardware-accelerated transform update within current animation frame
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${data.cursorX.toFixed(1)}px, ${data.cursorY.toFixed(1)}px, 0)`
      }

      // Only trigger React state updates when discrete visual states change
      const isHovering = Boolean(data.hoveredElement)
      const prev = prevDisplayRef.current

      if (
        data.handDetected !== prev.handDetected ||
        isHovering !== prev.isHovering ||
        data.isPinching !== prev.isPinching ||
        data.gestureState !== prev.gestureState ||
        data.statusMessage !== prev.statusMessage ||
        data.feedback !== prev.feedback
      ) {
        const next: CursorDisplayState = {
          handDetected: data.handDetected,
          isHovering,
          isPinching: data.isPinching,
          gestureState: data.gestureState,
          statusMessage: data.statusMessage,
          feedback: data.feedback,
        }
        prevDisplayRef.current = next
        setDisplayState(next)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const setCursorRef = useCallback((node: HTMLDivElement | null) => {
    cursorRef.current = node
    if (node) {
      const { x, y } = posRef.current
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    }
  }, [])

  if (!displayState.handDetected) {
    return null
  }

  const {
    isHovering,
    isPinching,
    gestureState,
    statusMessage,
    feedback,
  } = displayState

  // Cursor CSS state classes
  const stateClasses = [
    'hand-cursor-root',
    isHovering ? 'state-hover' : 'state-moving',
    isPinching ? 'state-pinching' : '',
    gestureState === 'PINCH_HOLD' ? 'state-pinch-hold' : '',
    feedback === 'correct' ? 'feedback-correct' : '',
    feedback === 'incorrect' ? 'feedback-incorrect' : '',
    gestureState === 'PALM_OPEN' ? 'palm-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={setCursorRef}
      className={stateClasses}
      aria-hidden="true"
    >
      {/* Outer Rotating Energy Ring */}
      <div className="cursor-outer-ring">
        <svg viewBox="0 0 60 60" className="ring-svg">
          <circle cx="30" cy="30" r="24" className="ring-track" />
          <circle cx="30" cy="30" r="24" className="ring-indicator" />
        </svg>
      </div>

      {/* Crosshair / Reticle Marks */}
      <div className="cursor-reticle-crosshair ch-top"></div>
      <div className="cursor-reticle-crosshair ch-bottom"></div>
      <div className="cursor-reticle-crosshair ch-left"></div>
      <div className="cursor-reticle-crosshair ch-right"></div>

      {/* Center Core Pointer Dot with Radiant Star Glyph */}
      <div className="cursor-core-dot">
        <span className="core-star-glyph" aria-hidden="true">✦</span>
        {isPinching && <div className="pinch-burst-wave"></div>}
      </div>

      {/* Dynamic Feedback Burst Rings */}
      {feedback === 'correct' && (
        <div className="feedback-ring correct-ring">
          <span className="feedback-icon">✓</span>
        </div>
      )}
      {feedback === 'incorrect' && (
        <div className="feedback-ring incorrect-ring">
          <span className="feedback-icon">✗</span>
        </div>
      )}

      {/* Floating Status / Action Tooltip */}
      <div className="cursor-action-tag">
        <span className="tag-sparkle">✦</span>
        <span className="tag-text">{statusMessage}</span>
      </div>
    </div>
  )
}
