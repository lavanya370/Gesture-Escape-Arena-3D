import React, { useState, useCallback, useEffect } from 'react'
import castleBg from '../assets/castle-bg.jpg'
import { ParticleCanvas } from './ParticleCanvas'
import { CameraStatusBadge } from './CameraStatusBadge'
import { useCamera } from '../context/CameraContext'
import { sound } from '../utils/audio'
import { PORTALS_DATA, type PortalsCompletionState, type PortalConfig } from '../types/game'
import type { ScienceMystery, MysteryProgressState } from '../types/scienceMystery'

interface PortalHubProps {
  totalScore: number
  highScore: number
  portalsCompleted: PortalsCompletionState
  onSelectPortal: (portalId: 'portal1' | 'portal2' | 'portal3' | 'portal4') => void
  onReturnToStart: () => void
  currentMystery?: ScienceMystery
  mysteryProgress?: MysteryProgressState
}

export const PortalHub: React.FC<PortalHubProps> = ({
  totalScore,
  highScore,
  portalsCompleted,
  onSelectPortal,
  onReturnToStart,
  currentMystery,
  mysteryProgress,
}) => {
  const { detectedHandsCount: handsCount } = useCamera()
  const [isAudioActive, setIsAudioActive] = useState(() => sound.getAmbientState())
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Portal transition effect
  const [isWarping, setIsWarping] = useState(false)
  const [warpingPortal, setWarpingPortal] = useState<PortalConfig | null>(null)

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr))
    }, 2800)
  }, [])

  const toggleAudio = () => {
    const newState = sound.toggleAmbient()
    setIsAudioActive(newState)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Keyboard shortcut 'U' for rapid expo demonstration feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'u' || e.key === 'U') {
        sound.playPortalUnlock()
        showToast('⚡ EXPO EXPLORATION MODE: All Chambers Ready!')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showToast])

  // Check portal accessibility
  // In the Science Mystery escape arena, all 4 chambers are accessible
  // so players can challenge mini-games, gather hints, and crack the riddle anytime
  const isPortalUnlocked = (_portalId: PortalConfig['id']): boolean => {
    return true
  }

  // Handle portal card interaction (gesture pinch or mouse click)
  const handlePortalClick = (portal: PortalConfig) => {
    const unlocked = isPortalUnlocked(portal.id)

    if (!unlocked) {
      sound.playErrorFizzle()
      if (portal.id === 'portal2') {
        showToast('🔒 Portal 2 is sealed! Solve Portal 1: Riddle Realm to break the ancient barrier.')
      } else if (portal.id === 'portal3') {
        showToast('🔒 Portal 3 is sealed! Complete Portal 2: Magic Coin Catcher to unlock the trial.')
      } else {
        showToast('🔒 Final Boss Portal is sealed! Complete all three preceding portals to challenge the Guardian.')
      }
      return
    }

    // Trigger warp transition
    sound.playPortalWarp()
    setWarpingPortal(portal)
    setIsWarping(true)

    setTimeout(() => {
      setIsWarping(false)
      setWarpingPortal(null)
      onSelectPortal(portal.id)
    }, 650)
  }

  // Count cleared portals
  const clearedCount = Object.values(portalsCompleted).filter(Boolean).length

  return (
    <div className="arena-root portal-hub-root">
      {/* Layered Background with atmospheric mist & vignetting */}
      <div
        className="castle-background-layer hub-bg"
        style={{ backgroundImage: `url(${castleBg})` }}
      >
        <div className="castle-vignette"></div>
        <div className="castle-mist-overlay"></div>
        <div className="castle-torch-flicker torch-left"></div>
        <div className="castle-torch-flicker torch-right"></div>
      </div>

      {/* Floating Sparkles & Particles Canvas */}
      <ParticleCanvas />

      {/* Dynamic Toast Notification */}
      {toastMessage && (
        <div className="hub-toast-banner" role="alert">
          <span className="toast-sparkle">✦</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <header className="arena-header hub-header">
        <div className="header-left-actions">
          <button
            className="control-btn back-btn"
            onClick={() => {
              sound.playHover()
              onReturnToStart()
            }}
            data-selectable="true"
            role="button"
            title="Return to Arena Entrance"
          >
            <span className="btn-icon">←</span>
            <span className="btn-label">ARENA ENTRANCE</span>
          </button>

          <div className="expo-badge-container">
            <span className="expo-pulsing-crystal">✦</span>
            <div className="expo-badge-text">
              <span className="expo-title">COLLEGE SCIENCE EXPO 2026</span>
              <span className="expo-sub">MAGIC PORTAL HUB</span>
            </div>
          </div>
        </div>

        {/* HUD Score & Progress Pills */}
        <div className="header-meta-tags">
          <div className="meta-pill score-pill" title="Current Session Score">
            <span className="pill-icon">⭐</span>
            <span className="pill-text">SCORE: <strong>{totalScore} PTS</strong></span>
          </div>

          <div className="meta-pill clues-pill" title="Science Mystery Clues Found">
            <span className="pill-icon">🔍</span>
            <span className="pill-text">
              CLUES: <strong>{
                (mysteryProgress?.hint1Unlocked ? 1 : 0) +
                (mysteryProgress?.hint2Unlocked ? 1 : 0) +
                (mysteryProgress?.finalClueUnlocked ? 1 : 0)
              }/3</strong>
            </span>
          </div>

          <div className="meta-pill highscore-pill" title="Personal Best Record">
            <span className="pill-icon">👑</span>
            <span className="pill-text">RECORD: <strong>{highScore} PTS</strong></span>
          </div>

          <div className="meta-pill portals-pill" title="Completed Portals">
            <span className="pill-icon">🌀</span>
            <span className="pill-text">PORTALS: <strong>{clearedCount}/4 CLEARED</strong></span>
          </div>
        </div>

        {/* Controls: Vision HUD, Audio, Fullscreen */}
        <div className="header-controls">
          <CameraStatusBadge />

          <button
            className={`control-btn audio-btn ${isAudioActive ? 'active' : ''}`}
            onClick={toggleAudio}
            data-selectable="true"
            role="button"
            title={isAudioActive ? 'Mute Sound' : 'Play Ambience'}
          >
            <span className="btn-icon">{isAudioActive ? '🔊' : '🔇'}</span>
            <span className="btn-label">{isAudioActive ? 'SOUND ON' : 'MUTED'}</span>
          </button>

          <button
            className="control-btn fullscreen-btn"
            onClick={toggleFullscreen}
            data-selectable="true"
            role="button"
            title="Toggle Fullscreen"
          >
            <span className="btn-icon">{isFullscreen ? '⛶' : '🗖'}</span>
            <span className="btn-label">{isFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}</span>
          </button>
        </div>
      </header>

      {/* Main Hub Stage */}
      <main className="portal-hub-stage">
        {/* Hub Hero Banner */}
        <section className="hub-hero-banner">
          <div className="hub-tagline-crest">
            <span className="crest-rune">᚛</span>
            <span className="crest-tag">YOUR HANDS. YOUR MOVES. YOUR SURVIVAL!</span>
            <span className="crest-rune">᚜</span>
          </div>

          <h1 className="hub-main-title">
            <span className="title-word word-magic">THE MAGIC</span>{' '}
            <span className="title-word word-portal">PORTAL</span>{' '}
            <span className="title-word word-hub">HUB</span>
          </h1>

          {/* Active Science Mystery Mission Strip */}
          <div className="hub-active-mystery-strip">
            <div className="strip-left">
              <span className="strip-crystal">🔮</span>
              <div className="strip-info">
                <span className="strip-tag">ACTIVE SCIENCE MYSTERY:</span>
                <span className="strip-title">{currentMystery?.title || 'THE INVISIBLE FORCE'}</span>
              </div>
            </div>

            <div className="strip-clues-group">
              <div
                className={`strip-clue-badge ${mysteryProgress?.hint1Unlocked ? 'unlocked' : 'locked'}`}
                title="Hint 1: Unlocked in Portal 2 (200 PTS)"
              >
                <span>{mysteryProgress?.hint1Unlocked ? '✓ HINT 1' : '🔒 HINT 1'}</span>
              </div>
              <div
                className={`strip-clue-badge ${mysteryProgress?.hint2Unlocked ? 'unlocked' : 'locked'}`}
                title="Hint 2: Unlocked in Portal 3 (Survive 15s)"
              >
                <span>{mysteryProgress?.hint2Unlocked ? '✓ HINT 2' : '🔒 HINT 2'}</span>
              </div>
              <div
                className={`strip-clue-badge ${mysteryProgress?.finalClueUnlocked ? 'unlocked gold-clue' : 'locked'}`}
                title="Final Clue: Unlocked in Portal 4 (Defeat Boss)"
              >
                <span>{mysteryProgress?.finalClueUnlocked ? '👑 FINAL CLUE' : '🔒 FINAL CLUE'}</span>
              </div>
            </div>

            {mysteryProgress?.isSolved && (
              <div className="strip-solved-badge">
                <span>{mysteryProgress.solvedMethod === 'independent' ? '✓ SOLVED INDEPENDENTLY' : '✓ REVEALED VIA CLUES'}</span>
              </div>
            )}
          </div>

          <p className="hub-instructions-text">
            <span>🖐️ <strong>Gesture Controls:</strong> Move hand cursor over any unlocked portal card • </span>
            <span>🤏 <strong>Pinch thumb & index finger</strong> or click to step through the rift!</span>
          </p>

          {clearedCount === 4 && (
            <div className="champion-celebration-banner" role="status">
              <span className="champ-crown">👑</span>
              <div className="champ-text">
                <h3 className="champ-heading">ARENA CHAMPION! THE GRAND TREASURE IS UNSEALED!</h3>
                <p className="champ-desc">
                  All 4 Portals Conquered • Session Score: <strong>{totalScore} PTS</strong> • Record: <strong>{highScore} PTS</strong>
                </p>
              </div>
              <span className="champ-crown">👑</span>
            </div>
          )}
        </section>

        {/* 2.5D Magic Portals Grid */}
        <section className="portal-cards-grid" aria-label="Magical Portals">
          {PORTALS_DATA.map((portal) => {
            const unlocked = isPortalUnlocked(portal.id)
            const cleared = portalsCompleted[portal.id]

            return (
              <div
                key={portal.id}
                className={`hub-portal-card theme-${portal.theme} ${
                  unlocked ? 'is-unlocked' : 'is-locked'
                } ${cleared ? 'is-cleared' : ''}`}
                onClick={() => handlePortalClick(portal)}
                onMouseEnter={() => sound.playHover()}
                data-selectable="true"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handlePortalClick(portal)
                  }
                }}
              >
                {/* Glowing Outer Aura */}
                <div className="card-ambient-aura"></div>

                {/* Keystone Arch Top */}
                <div className="card-keystone-arch">
                  <div className="keystone-badge">
                    <span className="keystone-glyph">{portal.runeLetter}</span>
                  </div>
                  <span className="portal-number-tag">
                    PORTAL 0{portal.portalNumber}
                  </span>
                </div>

                {/* Animated 2.5D Vortex Window */}
                <div className="card-vortex-window">
                  {/* Rotating Rune Ring 1 (Clockwise) */}
                  <div className="vortex-rune-ring ring-cw">
                    <svg viewBox="0 0 160 160" className="vortex-svg">
                      <circle
                        cx="80"
                        cy="80"
                        r="72"
                        fill="none"
                        stroke={portal.color}
                        strokeWidth="1.5"
                        strokeDasharray="4 6"
                        opacity={unlocked ? '0.75' : '0.25'}
                      />
                    </svg>
                    <div className="ring-runes">
                      <span>᚛</span>
                      <span>ᚦ</span>
                      <span>ᚱ</span>
                      <span>ᛉ</span>
                      <span>ᛟ</span>
                      <span>✦</span>
                    </div>
                  </div>

                  {/* Rotating Rune Ring 2 (Counter-Clockwise) */}
                  <div className="vortex-rune-ring ring-ccw">
                    <div className="ring-runes-inner">
                      <span>✧</span>
                      <span>✶</span>
                      <span>𐫰</span>
                      <span>✵</span>
                    </div>
                  </div>

                  {/* Deep Swirling Vortex Core */}
                  <div className="vortex-core">
                    <div className="vortex-swirl swirl-1"></div>
                    <div className="vortex-swirl swirl-2"></div>
                    <div className="vortex-flare">
                      <span className="vortex-symbol">
                        {unlocked ? (cleared ? '👑' : '✦') : '🔒'}
                      </span>
                    </div>
                  </div>

                  {/* Atmospheric Sparks */}
                  {unlocked && (
                    <div className="vortex-sparks">
                      <span className="v-spark v1"></span>
                      <span className="v-spark v2"></span>
                      <span className="v-spark v3"></span>
                    </div>
                  )}

                  {/* Locked Overlay Badge */}
                  {!unlocked && (
                    <div className="locked-vortex-lock">
                      <span className="lock-icon">🔒</span>
                      <span className="lock-label">SEALED</span>
                    </div>
                  )}
                </div>

                {/* Portal Details & Metadata */}
                <div className="card-info-content">
                  <div className="card-category-tag">
                    <span className="category-dot"></span>
                    <span>{portal.tag}</span>
                  </div>

                  <h2 className="card-portal-title">{portal.title}</h2>
                  <p className="card-portal-subtitle">{portal.subtitle}</p>
                  <p className="card-portal-description">{portal.description}</p>

                  {/* Reward Preview Badge */}
                  <div className="card-reward-preview">
                    <span className="reward-icon">🎁</span>
                    <span className="reward-text">
                      <strong>REWARD:</strong> {portal.reward}
                    </span>
                  </div>

                  {/* Action / State Button */}
                  <div className="card-action-wrap">
                    {cleared ? (
                      <div className="portal-status-btn status-cleared">
                        <span className="status-sparkle">👑</span>
                        <span>CLEARED • RE-ENTER</span>
                        <span className="status-arrow">→</span>
                      </div>
                    ) : unlocked ? (
                      <div className="portal-status-btn status-unlocked">
                        <span className="status-sparkle">⚡</span>
                        <span>ENTER PORTAL</span>
                        <span className="status-arrow">→</span>
                      </div>
                    ) : (
                      <div className="portal-status-btn status-locked">
                        <span className="status-lock-icon">🔒</span>
                        <span>
                          {portal.id === 'portal2'
                            ? 'UNLOCKS AFTER PORTAL 1'
                            : portal.id === 'portal3'
                            ? 'UNLOCKS AFTER PORTAL 2'
                            : 'UNLOCKS AFTER PORTAL 3'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Light Pool */}
                <div className="card-ground-pool"></div>
              </div>
            )
          })}
        </section>
      </main>


      {/* Bottom Status / Footer Bar */}
      <footer className="arena-footer hub-footer">
        <div className="footer-left">
          <span className={`status-indicator ${handsCount > 0 ? 'tracking' : ''}`}></span>
          <span>
            {handsCount > 0
              ? `VISION ACTIVE • ${handsCount} HAND(S) TRACKED`
              : 'VISION STANDBY • WAVE HAND IN FRONT OF WEBCAM'}
          </span>
        </div>
        <div className="footer-center">
          <span>
            {clearedCount === 0
              ? '✨ STEP 1: ENTER PORTAL 1 TO SOLVE THE RIDDLE REALM'
              : clearedCount === 1
              ? '✨ PORTAL 1 CLEARED! READY FOR PORTAL 2: MAGIC COIN CATCHER'
              : `✨ ${clearedCount}/4 PORTALS COMPLETED! UNLOCKING ESCAPE TREASURE`}
          </span>
        </div>
        <div className="footer-right">
          <span>INTERACTIVE FANTASY ESCAPE ARENA 3D</span>
        </div>
      </footer>

      {/* Warp Transition Overlay */}
      {isWarping && (
        <div className="starting-warp-overlay portal-warp-active" role="dialog" aria-modal="true">
          <div className="warp-radial-flare"></div>
          <div className="warp-content">
            <div className="warp-spinner">
              <div className="spinner-ring ring-1"></div>
              <div className="spinner-ring ring-2"></div>
              <div className="spinner-core">
                {warpingPortal?.runeLetter || '⚡'}
              </div>
            </div>
            <h2 className="warp-title">
              WARPING TO {warpingPortal?.title.toUpperCase()}...
            </h2>
            <p className="warp-desc">
              {warpingPortal?.subtitle} • Calibrating Hand Sensors...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
