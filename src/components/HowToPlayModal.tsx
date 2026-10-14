import React, { useEffect } from 'react'
import { sound } from '../utils/audio'

interface HowToPlayModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div
        className="modal-container ancient-codex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ornate corner ornaments */}
        <div className="corner c-top-left">✦</div>
        <div className="corner c-top-right">✦</div>
        <div className="corner c-bottom-left">✦</div>
        <div className="corner c-bottom-right">✦</div>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-eyebrow">
            <span className="eyebrow-line"></span>
            <span>ANCIENT CODEX OF ESCAPE</span>
            <span className="eyebrow-line"></span>
          </div>
          <h2 id="modal-title" className="modal-title">
            HOW TO PLAY & SURVIVE
          </h2>
          <p className="modal-subtitle">
            College Science Expo 2026 • AI Vision & Gesture Challenge
          </p>
          <button
            className="modal-close-btn"
            onClick={onClose}
            onMouseEnter={() => sound.playHover()}
            aria-label="Close rules codex"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="modal-body custom-scrollbar">
          {/* Objective Banner */}
          <div className="rule-card objective-card">
            <div className="card-icon">⏳</div>
            <div className="card-info">
              <h3>The 5-Minute Time Paradox</h3>
              <p>
                The castle dimensional rifts are collapsing! You and your team have exactly{' '}
                <strong>5 minutes (300 seconds)</strong> to solve the mystical riddles, unlock the ancient seals, and escape through the Astral Portal.
              </p>
            </div>
          </div>

          {/* 3 Step Progression */}
          <div className="rules-grid">
            <div className="rule-card">
              <div className="card-step-badge">STEP 1</div>
              <div className="card-icon-sm">📜</div>
              <h4>Decipher The Riddles</h4>
              <p>
                Examine ancient wall inscriptions and celestial stone tablets in each chamber. Each puzzle holds a vital clue fragment.
              </p>
            </div>

            <div className="rule-card">
              <div className="card-step-badge">STEP 2</div>
              <div className="card-icon-sm">🖐️</div>
              <h4>Steer With Hand Wave</h4>
              <p>
                Hold your hand in front of the webcam. Move your hand left and right to steer the coin bowl, gate runner, and trap dodger!
              </p>
            </div>

            <div className="rule-card">
              <div className="card-step-badge">STEP 3</div>
              <div className="card-icon-sm">🤏</div>
              <h4>Pinch To Select & Confirm</h4>
              <p>
                Pinch your thumb and index finger together to confirm gate choices, duck in funny trap, or submit riddle deductions!
              </p>
            </div>
          </div>

          {/* Hand Tracking Mechanics Preview */}
          <div className="gesture-showcase-box">
            <div className="showcase-title">
              <span className="sparkle-icon">✨</span>
              <span>AI HAND GESTURE & PINCH CONTROLS</span>
            </div>
            <div className="gesture-tags-grid">
              <div className="gesture-item">
                <span className="gesture-glyph">🖐️</span>
                <div>
                  <strong>Open Palm</strong>
                  <span>Keep hand visible • Guides real-time cursor</span>
                </div>
              </div>
              <div className="gesture-item">
                <span className="gesture-glyph">↔️</span>
                <div>
                  <strong>Wave Left / Right</strong>
                  <span>Move hand sideways • Steers all mini-games</span>
                </div>
              </div>
              <div className="gesture-item">
                <span className="gesture-glyph">🤏</span>
                <div>
                  <strong>Deliberate Pinch</strong>
                  <span>Thumb + Index touch • Confirms gates & answers</span>
                </div>
              </div>
              <div className="gesture-item">
                <span className="gesture-glyph">🦆</span>
                <div>
                  <strong>Pinch Duck</strong>
                  <span>Pinch in Funny Trap • Duck under high hazards</span>
                </div>
              </div>
              <div className="gesture-item">
                <span className="gesture-glyph">🖱️</span>
                <div>
                  <strong>Mouse / Touch</strong>
                  <span>Click, tap, or drag anytime as seamless fallback</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expo Innovation note */}
          <div className="expo-footer-note">
            <span className="info-icon">💡</span>
            <span>
              <strong>Science Expo Note:</strong> Powered by MediaPipe HandLandmarker, 21 real-time 3D hand joints, pinch hysteresis, and WebGL!
            </span>
          </div>
        </div>

        {/* Modal Action footer */}
        <div className="modal-footer">
          <button
            className="modal-action-btn"
            onClick={onClose}
            onMouseEnter={() => sound.playHover()}
          >
            I UNDERSTAND • RETURN TO ARENA
          </button>
        </div>
      </div>
    </div>
  )
}
