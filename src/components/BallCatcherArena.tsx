import React, { useState, useEffect, useRef, useCallback } from 'react'
import { gestureDetector } from '../vision/gestureDetector'
import { sound } from '../utils/audio'

export interface BallCatcherArenaProps {
  targetScore?: number
  timeLimit?: number
  onTargetReached: (finalScore: number) => void
  isTargetReached: boolean
  onResetChallenge?: () => void
}

interface FallingItem {
  id: number
  type: 'blue-orb' | 'gold-star' | 'amethyst-rune'
  points: number
  x: number // percentage 8% to 92%
  y: number // percentage -8% to 108%
  speed: number // percentage per second
  rotation: number
  rotSpeed: number
  collected: boolean
}

interface FloatingPopup {
  id: number
  text: string
  type: 'blue-orb' | 'gold-star' | 'amethyst-rune'
  x: number
  y: number
}

interface SparkleParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
}

export const BallCatcherArena: React.FC<BallCatcherArenaProps> = ({
  targetScore = 200,
  timeLimit = 20,
  onTargetReached,
  isTargetReached,
  onResetChallenge,
}) => {
  // Game lifecycle: 'ready' | 'playing' | 'success' | 'failed'
  const [gameStage, setGameStage] = useState<'ready' | 'playing' | 'success' | 'failed'>(() =>
    isTargetReached ? 'success' : 'ready'
  )
  const [secondsLeft, setSecondsLeft] = useState<number>(timeLimit)
  const [score, setScore] = useState<number>(0)
  const [ballsCaught, setBallsCaught] = useState<number>(0)

  // Catcher Position & Motion
  const [catcherX, setCatcherX] = useState<number>(50) // percentage 8% to 92%
  const [catcherTilt, setCatcherTilt] = useState<number>(0)
  const [controlMode, setControlMode] = useState<'hand' | 'mouse' | 'touch'>('hand')
  const [isHandActive, setIsHandActive] = useState<boolean>(false)

  // Items & Visuals
  const [items, setItems] = useState<FallingItem[]>([])
  const [popups, setPopups] = useState<FloatingPopup[]>([])
  const [particles, setParticles] = useState<SparkleParticle[]>([])

  // Refs for animation loop and collision physics
  const stageRef = useRef<HTMLDivElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const spawnTimerRef = useRef<number>(0)
  const nextItemIdRef = useRef<number>(1)
  const nextPopupIdRef = useRef<number>(1)
  const nextParticleIdRef = useRef<number>(1)
  const itemsRef = useRef<FallingItem[]>([])
  const catcherXRef = useRef<number>(50)
  const prevCatcherXRef = useRef<number>(50)
  const scoreRef = useRef<number>(0)
  const isTargetReachedRef = useRef<boolean>(isTargetReached)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    catcherXRef.current = catcherX
  }, [catcherX])

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    isTargetReachedRef.current = isTargetReached
  }, [isTargetReached])

  // Subscribe to MediaPipe Hand Landmark Tracking
  useEffect(() => {
    const unsubscribe = gestureDetector.subscribe((data) => {
      setIsHandActive(data.handDetected)

      if (data.handDetected && stageRef.current) {
        setControlMode('hand')
        const rect = stageRef.current.getBoundingClientRect()
        // Map hand cursorX directly relative to the stage bounds:
        const relativeX = ((data.cursorX - rect.left) / rect.width) * 100
        const clampedX = Math.max(8, Math.min(92, relativeX))

        const delta = clampedX - prevCatcherXRef.current
        prevCatcherXRef.current = clampedX
        setCatcherTilt(Math.max(-22, Math.min(22, delta * 3.8)))
        setCatcherX(clampedX)
      }
    })

    return () => unsubscribe()
  }, [])

  // Mouse fallback handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const relativeX = ((e.clientX - rect.left) / rect.width) * 100
    const clampedX = Math.max(8, Math.min(92, relativeX))

    const delta = clampedX - prevCatcherXRef.current
    prevCatcherXRef.current = clampedX
    setCatcherTilt(Math.max(-20, Math.min(20, delta * 3.5)))

    setCatcherX(clampedX)
    setControlMode('mouse')
  }

  // Touch fallback handler
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!stageRef.current || e.touches.length === 0) return
    const touch = e.touches[0]
    const rect = stageRef.current.getBoundingClientRect()
    const relativeX = ((touch.clientX - rect.left) / rect.width) * 100
    const clampedX = Math.max(8, Math.min(92, relativeX))

    const delta = clampedX - prevCatcherXRef.current
    prevCatcherXRef.current = clampedX
    setCatcherTilt(Math.max(-20, Math.min(20, delta * 3.5)))

    setCatcherX(clampedX)
    setControlMode('touch')
  }

  // Particle & Popup helpers
  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParts: SparkleParticle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5)
      const speed = 5 + Math.random() * 10
      newParts.push({
        id: nextParticleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 4 + Math.random() * 4,
        life: 1.0,
      })
    }
    setParticles((prev) => [...prev.slice(-30), ...newParts])
  }, [])

  const addFloatingPopup = useCallback(
    (text: string, type: 'blue-orb' | 'gold-star' | 'amethyst-rune', x: number, y: number) => {
      const id = nextPopupIdRef.current++
      setPopups((prev) => [...prev, { id, text, type, x, y }])
      setTimeout(() => {
        setPopups((curr) => curr.filter((p) => p.id !== id))
      }, 750)
    },
    []
  )

  // Start the Mini-Game (Only start countdown upon explicit player start)
  const handleStartGame = () => {
    sound.playStartSpell()
    setScore(0)
    scoreRef.current = 0
    setBallsCaught(0)
    setSecondsLeft(timeLimit)
    itemsRef.current = []
    setItems([])
    setPopups([])
    setParticles([])
    setGameStage('playing')
    lastTimeRef.current = performance.now()
  }

  // Retry the Mini-Game (resets score, timer, and state)
  const handleRetryGame = () => {
    sound.playHover()
    if (onResetChallenge) {
      onResetChallenge()
    }
    handleStartGame()
  }

  // Countdown timer loop
  useEffect(() => {
    if (gameStage !== 'playing') return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Time expired check
          if (scoreRef.current >= targetScore) {
            sound.playVictoryFanfare()
            setGameStage('success')
            onTargetReached(scoreRef.current)
          } else {
            sound.playGuardianDareAlert()
            setGameStage('failed')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStage, targetScore, onTargetReached])

  // Core 60fps Game Loop & Collision Handling
  useEffect(() => {
    if (gameStage !== 'playing') return

    lastTimeRef.current = performance.now()
    spawnTimerRef.current = 0

    const updateGame = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = now

      // Spawning balls: dense frequent cascades tuned for 20 seconds
      spawnTimerRef.current += dt
      const spawnInterval = 0.38

      if (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current = 0

        const rand = Math.random()
        let type: 'blue-orb' | 'gold-star' | 'amethyst-rune' = 'blue-orb'
        let points = 20

        if (rand > 0.72) {
          type = 'gold-star'
          points = 40
        } else if (rand > 0.45) {
          type = 'amethyst-rune'
          points = 30
        }

        const newItem: FallingItem = {
          id: nextItemIdRef.current++,
          type,
          points,
          x: 10 + Math.random() * 80,
          y: -8,
          speed: 34 + Math.random() * 14,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 140,
          collected: false,
        }
        itemsRef.current = [...itemsRef.current, newItem]
      }

      // Physics & Collision with Catcher
      const catcherXVal = catcherXRef.current
      const catcherYVal = 86 // percentage height of catcher basket
      const hitToleranceX = 9.5
      const hitToleranceY = 7.0

      const remainingItems: FallingItem[] = []

      for (const item of itemsRef.current) {
        if (item.collected) continue

        item.y += item.speed * dt
        item.rotation += item.rotSpeed * dt

        const dx = Math.abs(item.x - catcherXVal)
        const dy = Math.abs(item.y - catcherYVal)

        if (dx < hitToleranceX && dy < hitToleranceY) {
          // HIT! Collect item exactly once (prevents duplicate scoring)
          item.collected = true

          if (item.type === 'gold-star') {
            sound.playDiamondCatch()
            spawnParticles(item.x, item.y, '#f59e0b', 14)
            addFloatingPopup(`+${item.points}`, 'gold-star', item.x, item.y)
          } else if (item.type === 'amethyst-rune') {
            sound.playPortalUnlock()
            spawnParticles(item.x, item.y, '#c084fc', 12)
            addFloatingPopup(`+${item.points}`, 'amethyst-rune', item.x, item.y)
          } else {
            sound.playCoinCatch()
            spawnParticles(item.x, item.y, '#38bdf8', 10)
            addFloatingPopup(`+${item.points}`, 'blue-orb', item.x, item.y)
          }

          setBallsCaught((prev) => prev + 1)

          setScore((prevScore) => {
            const nextScore = prevScore + item.points
            scoreRef.current = nextScore

            // Check if 200 points target achieved
            if (nextScore >= targetScore && !isTargetReachedRef.current) {
              isTargetReachedRef.current = true
              sound.playLevelComplete()
              setGameStage('success')
              onTargetReached(nextScore)
            }
            return nextScore
          })

          continue
        }

        // Keep item if not off-screen
        if (item.y <= 104) {
          remainingItems.push(item)
        } else if (!item.collected) {
          sound.playBallDrop()
        }
      }

      itemsRef.current = remainingItems
      setItems([...remainingItems])

      // Update particle physics
      setParticles((prevParts) =>
        prevParts
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt * 0.8,
            y: p.y + p.vy * dt * 0.8,
            life: p.life - dt * 2.2,
          }))
          .filter((p) => p.life > 0)
      )

      if (gameStage === 'playing') {
        animFrameRef.current = requestAnimationFrame(updateGame)
      }
    }

    animFrameRef.current = requestAnimationFrame(updateGame)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [gameStage, targetScore, onTargetReached, addFloatingPopup, spawnParticles])

  const progressPercent = Math.min(100, Math.round((score / targetScore) * 100))

  return (
    <div className="ball-catcher-panel">
      {/* 1. Header with Prominent Score & Countdown Timer */}
      <div className="ball-catcher-header">
        <div className="catcher-title-row">
          <span className="catcher-icon" aria-hidden="true">⚡</span>
          <span className="catcher-title">BALL-CATCHING CHALLENGE</span>
        </div>

        <div className="catcher-stats-bar">
          <div className="stat-pill score-pill" title="Current Score vs Target">
            <span className="stat-label">SCORE:</span>
            <span className="stat-val highlight">{score} / {targetScore}</span>
          </div>

          <div
            className={`stat-pill timer-pill ${secondsLeft <= 5 && gameStage === 'playing' ? 'urgent' : ''}`}
            title="Remaining Time in Challenge"
          >
            <span className="stat-label">TIME:</span>
            <span className="stat-val">{secondsLeft}s</span>
          </div>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="catcher-progress-track" aria-hidden="true">
        <div
          className={`catcher-progress-fill ${score >= targetScore ? 'completed' : ''}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. Interactive Ball Catching Stage */}
      <div
        ref={stageRef}
        className="ball-catcher-stage"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        role="region"
        aria-label="Ball Catching Interactive Arena"
      >
        {/* Subtle Background Nebula & Runes */}
        <div className="stage-nebula-glow" aria-hidden="true" />

        {/* Falling Collectible Objects */}
        {items.map((item) => (
          <div
            key={item.id}
            className={`falling-ball-item ${item.type}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
            }}
            aria-hidden="true"
          >
            {item.type === 'blue-orb' && (
              <div className="orb-ball blue">
                <div className="orb-inner-sparkle" />
              </div>
            )}
            {item.type === 'gold-star' && (
              <div className="orb-ball gold">
                <div className="orb-inner-sparkle" />
                <span className="star-glyph">✦</span>
              </div>
            )}
            {item.type === 'amethyst-rune' && (
              <div className="orb-ball purple">
                <div className="orb-inner-sparkle" />
                <span className="star-glyph">◆</span>
              </div>
            )}
          </div>
        ))}

        {/* Floating Point Popups */}
        {popups.map((popup) => (
          <div
            key={popup.id}
            className={`floating-popup ${popup.type}`}
            style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
            aria-hidden="true"
          >
            {popup.text}
          </div>
        ))}

        {/* Sparkle Particles Canvas */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="sparkle-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.life,
            }}
            aria-hidden="true"
          />
        ))}

        {/* Player's Catcher Basket / Paddle */}
        <div
          className={`magic-catcher-basket ${isHandActive ? 'hand-active' : ''}`}
          style={{
            left: `${catcherX}%`,
            transform: `translateX(-50%) rotate(${catcherTilt}deg)`,
          }}
          aria-hidden="true"
        >
          <div className="catcher-basket-rim" />
          <div className="catcher-basket-body">
            <span className="catcher-core-gem">✦</span>
          </div>
          <div className="catcher-aura-light" />
        </div>

        {/* Bottom Control Mode Indicator */}
        <div className="catcher-control-hint">
          <span>
            {isHandActive
              ? '🖐️ Hand Tracking Active • Wave hand left/right to move catcher'
              : controlMode === 'touch'
              ? '👆 Touch & Drag to Move Catcher'
              : '🖱️ Move Mouse to Steer Catcher'}
          </span>
        </div>

        {/* STAGE OVERLAYS */}

        {/* A. READY OVERLAY (Before starting) */}
        {gameStage === 'ready' && (
          <div className="stage-modal-overlay ready-overlay">
            <div className="modal-card">
              <div className="modal-crest">⚡</div>
              <h3 className="modal-title">BALL-CATCHING CHALLENGE</h3>
              <p className="modal-desc">
                Catch falling magic orbs and stars to score <strong>200 points</strong> within{' '}
                <strong>20 seconds</strong> to unlock the Riddle Answer options!
              </p>

              <div className="modal-meta-grid">
                <div className="meta-box">
                  <span className="meta-label">TARGET</span>
                  <span className="meta-value gold">200 PTS</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">TIME LIMIT</span>
                  <span className="meta-value cyan">20 SEC</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">CONTROLS</span>
                  <span className="meta-value green">Hand / Mouse</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-start-ball-game"
                onClick={handleStartGame}
                data-selectable="true"
                aria-label="Start Ball Catching Mini-Game"
              >
                <span className="btn-icon">▶</span>
                <span>START GAME</span>
              </button>
            </div>
          </div>
        )}

        {/* B. SUCCESS OVERLAY (Target 200 Reached!) */}
        {gameStage === 'success' && (
          <div className="stage-modal-overlay success-overlay">
            <div className="modal-card">
              <div className="modal-crest gold">👑</div>
              <h3 className="modal-title success">CHALLENGE PASSED!</h3>
              <p className="modal-desc">
                Magnificent! You scored <strong>{score} points</strong> and caught {ballsCaught} orbs.
              </p>
              <div className="unlocked-callout-pill">
                <span>🔓 RIDDLE ANSWERS REVEALED ON LEFT PANEL!</span>
              </div>
              <p className="modal-subtext">
                Look at the left panel to deduce the mystery riddle and choose your answer.
              </p>

              <button
                type="button"
                className="btn-replay-ball-game"
                onClick={handleRetryGame}
                data-selectable="true"
                aria-label="Play Challenge Again"
              >
                <span>PLAY AGAIN 🔄</span>
              </button>
            </div>
          </div>
        )}

        {/* C. FAILED OVERLAY (Time expired without 200 pts) */}
        {gameStage === 'failed' && (
          <div className="stage-modal-overlay failed-overlay">
            <div className="modal-card">
              <div className="modal-crest red">⏳</div>
              <h3 className="modal-title failed">TIME EXPIRED!</h3>
              <p className="modal-desc">
                You scored <strong>{score} / {targetScore} points</strong> before time ran out.
                Catch more orbs to reach the 200 points goal!
              </p>

              <button
                type="button"
                className="btn-retry-ball-game"
                onClick={handleRetryGame}
                data-selectable="true"
                aria-label="Retry Challenge"
              >
                <span className="btn-icon">↻</span>
                <span>RETRY CHALLENGE</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BallCatcherArena
