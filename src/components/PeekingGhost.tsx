import React, { useState, useEffect } from 'react'
import { sound } from '../utils/audio'

interface PeekingGhostProps {
  position?: 'left' | 'right'
}

const GHOST_QUOTES = [
  '👻 BOO! ...Wait, did I scare ya? No? Aww!',
  '👀 PSSST! Have you claimed your hints yet?',
  '🎭 Don’t look at me! I only haunt on weekends!',
  '🕵️‍♂️ The butler looks awfully suspicious today...',
  '✨ Think everyday objects, detective! Everyday!',
  '🍬 Just passing through for free ectoplasm!',
]

export const PeekingGhost: React.FC<PeekingGhostProps> = ({ position = 'right' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [isSpun, setIsSpun] = useState(false)

  useEffect(() => {
    // Initial peek after 6 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true)
      setQuoteIndex(Math.floor(Math.random() * GHOST_QUOTES.length))
    }, 6000)

    // Periodic peek every 22 seconds
    const interval = setInterval(() => {
      setIsVisible(true)
      setQuoteIndex((prev) => (prev + 1) % GHOST_QUOTES.length)
      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false)
      }, 5000)
    }, 22000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [])

  const handleGhostClick = () => {
    sound.playHover()
    setIsSpun(true)
    setQuoteIndex(Math.floor(Math.random() * GHOST_QUOTES.length))
    setTimeout(() => {
      setIsSpun(false)
      setIsVisible(false)
    }, 1200)
  }

  if (!isVisible) return null

  return (
    <div
      className={`peeking-ghost-wrap peeking-ghost-${position} ${isSpun ? 'ghost-spin' : ''}`}
      onClick={handleGhostClick}
      title="Click the mischievous ghost!"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleGhostClick()
      }}
    >
      <div className="ghost-speech-bubble">
        <span>{GHOST_QUOTES[quoteIndex]}</span>
      </div>

      <svg
        viewBox="0 0 100 120"
        className="peeking-ghost-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="ghostEtherealGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="ghostSheetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#e0e7ff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Floating Ghost Sheet Body */}
        <path
          d="M 50 15 C 28 15 20 38 20 65 C 20 85 15 105 24 105 C 32 105 35 95 43 95 C 50 95 53 105 60 105 C 68 105 70 95 78 95 C 85 95 88 105 95 105 C 102 105 98 85 98 65 C 98 38 72 15 50 15 Z"
          fill="url(#ghostSheetGrad)"
          stroke="#818cf8"
          strokeWidth="2"
          filter="url(#ghostEtherealGlow)"
        />

        {/* Mischievous Big Eyes */}
        <ellipse cx="40" cy="45" rx="6" ry="8" fill="#1e1b4b" />
        <ellipse cx="62" cy="45" rx="6" ry="8" fill="#1e1b4b" />

        {/* Eye Sparkle Highlights */}
        <circle cx="38" cy="42" r="2.5" fill="#ffffff" />
        <circle cx="60" cy="42" r="2.5" fill="#ffffff" />
        <circle cx="42" cy="47" r="1.2" fill="#ffffff" />
        <circle cx="64" cy="47" r="1.2" fill="#ffffff" />

        {/* Cute Smirk / Gasp Mouth */}
        <path
          d="M 46 62 Q 51 68 56 62"
          fill="none"
          stroke="#1e1b4b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Rosy Cheeks */}
        <circle cx="32" cy="54" r="4" fill="#f43f5e" opacity="0.4" />
        <circle cx="70" cy="54" r="4" fill="#f43f5e" opacity="0.4" />

        {/* Waving Little Arm */}
        <path
          d={position === 'right' ? 'M 22 55 Q 10 48 14 38' : 'M 96 55 Q 108 48 104 38'}
          fill="none"
          stroke="#818cf8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
