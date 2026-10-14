import React, { useState, useEffect, useRef, useCallback } from 'react'
import hauntedArenaReadyBg from '../assets/haunted-arena-ready-bg.jpg'
import { ParticleCanvas } from './ParticleCanvas'
import { CameraStatusBadge } from './CameraStatusBadge'
import { gestureDetector } from '../vision/gestureDetector'
import { sound } from '../utils/audio'
import { useGame } from '../context/GameContext'

interface FallingBall {
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

export interface MagicCoinCatcherProps {
  onReturnToHub?: () => void
}

export const MagicCoinCatcher: React.FC<MagicCoinCatcherProps> = ({ onReturnToHub }) => {
  const { revealOptions, recordCoinScore, setCurrentView } = useGame()

  const TARGET_SCORE = 200
  const TIME_LIMIT = 15

  // Game lifecycle: 'ready' | 'playing' | 'gameover'
  const [gameStage, setGameStage] = useState<'ready' | 'playing' | 'gameover'>('ready')
  const [secondsLeft, setSecondsLeft] = useState<number>(TIME_LIMIT)
  const [score, setScore] = useState<number>(0)
  const [ballsCaught, setBallsCaught] = useState<number>(0)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)

  // Catcher Position & Motion
  const [catcherX, setCatcherX] = useState<number>(50) // 8% to 92%
  const [catcherTilt, setCatcherTilt] = useState<number>(0)
  const [controlMode, setControlMode] = useState<'hand' | 'mouse' | 'touch'>('hand')
  const [isHandActive, setIsHandActive] = useState<boolean>(false)

  // Items & Visuals
  const [items, setItems] = useState<FallingBall[]>([])
  const [popups, setPopups] = useState<FloatingPopup[]>([])
  const [particles, setParticles] = useState<SparkleParticle[]>([])

  // Header controls
  const [isAudioActive, setIsAudioActive] = useState<boolean>(() => sound.getAmbientState())
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  // Refs for animation loop and collision physics
  const stageRef = useRef<HTMLDivElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const spawnTimerRef = useRef<number>(0)
  const nextItemIdRef = useRef<number>(1)
  const nextPopupIdRef = useRef<number>(1)
  const nextParticleIdRef = useRef<number>(1)
  const itemsRef = useRef<FallingBall[]>([])
  const catcherXRef = useRef<number>(50)
  const prevCatcherXRef = useRef<number>(50)
  const scoreRef = useRef<number>(0)
  const isSuccessRef = useRef<boolean>(false)
  const startChallengeBtnRef = useRef<HTMLButtonElement | null>(null)
  const exitEarlyBtnRef = useRef<HTMLButtonElement | null>(null)
  const selectOptionsBtnRef = useRef<HTMLButtonElement | null>(null)
  const retryBtnRef = useRef<HTMLButtonElement | null>(null)
  const exitGameBtnRef = useRef<HTMLButtonElement | null>(null)
  const gameStageRef = useRef<'ready' | 'playing' | 'gameover'>('ready')

  useEffect(() => {
    gameStageRef.current = gameStage
  }, [gameStage])

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
    isSuccessRef.current = isSuccess
  }, [isSuccess])

  // Start the challenge (only starts countdown upon explicit player start)
  const handleStartChallenge = useCallback(() => {
    sound.playStartSpell()
    setScore(0)
    scoreRef.current = 0
    setBallsCaught(0)
    setSecondsLeft(TIME_LIMIT)
    setIsSuccess(false)
    isSuccessRef.current = false
    setItems([])
    itemsRef.current = []
    setPopups([])
    setParticles([])
    setGameStage('playing')
    lastTimeRef.current = performance.now()
  }, [TIME_LIMIT])

  // Restart / Retry match logic
  const handlePlayAgain = useCallback(() => {
    handleStartChallenge()
  }, [handleStartChallenge])

  // Return to Riddle Realm after achieving 200 points and reveal the riddle answer options
  const handleReturnSuccess = useCallback(() => {
    recordCoinScore(scoreRef.current)
    revealOptions()
    sound.playVictoryFanfare()
    setCurrentView('riddle-realm')
  }, [recordCoinScore, revealOptions, setCurrentView])

  // Return to Riddle Realm without revealing options (early exit)
  const handleReturnEarly = useCallback(() => {
    sound.playHover()
    if (onReturnToHub) {
      onReturnToHub()
    } else {
      setCurrentView('riddle-realm')
    }
  }, [onReturnToHub, setCurrentView])

  // Latch to strictly require release before allowing another pinch action
  const pinchLockRef = useRef<boolean>(false)

  // Re-arm latch when gameStage changes to prevent held pinch bleed-through
  useEffect(() => {
    pinchLockRef.current = true
  }, [gameStage])

  // Subscribe to MediaPipe Hand Landmark Tracking and Modal Pinch Gestures
  useEffect(() => {
    const unsubscribe = gestureDetector.subscribe((data) => {
      setIsHandActive(data.handDetected)

      // Reset pinch lock once user physically releases fingers
      if (!data.isPinching) {
        pinchLockRef.current = false
      }

      // 1. Ready modal pinch interaction
      if (gameStageRef.current === 'ready') {
        const startBtn = startChallengeBtnRef.current
        if (startBtn) {
          const rect = startBtn.getBoundingClientRect()
          const isOver =
            data.cursorX >= rect.left - 12 &&
            data.cursorX <= rect.right + 12 &&
            data.cursorY >= rect.top - 12 &&
            data.cursorY <= rect.bottom + 12
          if (isOver && data.isPinching && !pinchLockRef.current) {
            pinchLockRef.current = true
            handleStartChallenge()
            return
          }
        }
        const exitBtn = exitEarlyBtnRef.current
        if (exitBtn) {
          const rect = exitBtn.getBoundingClientRect()
          const isOver =
            data.cursorX >= rect.left - 12 &&
            data.cursorX <= rect.right + 12 &&
            data.cursorY >= rect.top - 12 &&
            data.cursorY <= rect.bottom + 12
          if (isOver && data.isPinching && !pinchLockRef.current) {
            pinchLockRef.current = true
            handleReturnEarly()
            return
          }
        }
        return
      }

      // 2. GameOver / Results modal pinch interaction (SHOW OPTIONS only if 200 pts reached)
      if (gameStageRef.current === 'gameover') {
        if (isSuccessRef.current) {
          const selectBtn = selectOptionsBtnRef.current
          if (selectBtn) {
            const rect = selectBtn.getBoundingClientRect()
            const isOver =
              data.cursorX >= rect.left - 12 &&
              data.cursorX <= rect.right + 12 &&
              data.cursorY >= rect.top - 12 &&
              data.cursorY <= rect.bottom + 12
            if (isOver && data.isPinching && !pinchLockRef.current) {
              pinchLockRef.current = true
              handleReturnSuccess()
              return
            }
          }
        }

        const retryBtn = retryBtnRef.current
        if (retryBtn) {
          const rect = retryBtn.getBoundingClientRect()
          const isOver =
            data.cursorX >= rect.left - 12 &&
            data.cursorX <= rect.right + 12 &&
            data.cursorY >= rect.top - 12 &&
            data.cursorY <= rect.bottom + 12
          if (isOver && data.isPinching && !pinchLockRef.current) {
            pinchLockRef.current = true
            handlePlayAgain()
            return
          }
        }

        const exitBtn = exitGameBtnRef.current
        if (exitBtn) {
          const rect = exitBtn.getBoundingClientRect()
          const isOver =
            data.cursorX >= rect.left - 12 &&
            data.cursorX <= rect.right + 12 &&
            data.cursorY >= rect.top - 12 &&
            data.cursorY <= rect.bottom + 12
          if (isOver && data.isPinching && !pinchLockRef.current) {
            pinchLockRef.current = true
            handleReturnEarly()
            return
          }
        }
        return
      }

      // 3. Active Playing Paddle Steering
      if (data.handDetected && stageRef.current && gameStageRef.current === 'playing') {
        setControlMode('hand')
        const rect = stageRef.current.getBoundingClientRect()
        const relativeX = ((data.cursorX - rect.left) / rect.width) * 100
        const clampedX = Math.max(8, Math.min(92, relativeX))

        const delta = clampedX - prevCatcherXRef.current
        prevCatcherXRef.current = clampedX
        setCatcherTilt(Math.max(-22, Math.min(22, delta * 3.8)))

        setCatcherX(clampedX)
      }
    })

    return () => unsubscribe()
  }, [handleStartChallenge, handleReturnSuccess, handlePlayAgain, handleReturnEarly])

  // Keyboard navigation fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStage === 'ready') {
        if (e.key === 'Enter' || e.key === ' ') {
          handleStartChallenge()
        } else if (e.key === 'Escape') {
          handleReturnEarly()
        }
      } else if (gameStage === 'gameover') {
        if (e.key === 'Enter' || e.key === ' ') {
          if (isSuccessRef.current) {
            handleReturnSuccess()
          } else {
            handlePlayAgain()
          }
        } else if (e.key === 'r' || e.key === 'R') {
          handlePlayAgain()
        } else if (e.key === 'Escape') {
          handleReturnEarly()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStage, handleStartChallenge, handleReturnEarly, handleReturnSuccess, handlePlayAgain])

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

  // Audio & Fullscreen helpers
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

  // Particles & Popups helpers
  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParts: SparkleParticle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5)
      const speed = 6 + Math.random() * 12
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

  // 20-Second Countdown Timer
  useEffect(() => {
    if (gameStage !== 'playing') return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (scoreRef.current >= TARGET_SCORE) {
            sound.playVictoryFanfare()
            setIsSuccess(true)
            setGameStage('gameover')
          } else {
            sound.playGuardianDareAlert()
            setIsSuccess(false)
            setGameStage('gameover')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStage, TARGET_SCORE])

  // Core 60fps Game Loop & Collision Detection
  useEffect(() => {
    if (gameStage !== 'playing') return

    lastTimeRef.current = performance.now()
    spawnTimerRef.current = 0

    const updateGame = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = now

      const isFrenzy = secondsLeft <= 6
      const spawnInterval = isFrenzy ? 0.3 : 0.38

      // Spawning falling balls
      spawnTimerRef.current += dt
      if (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current = 0

        const rand = Math.random()
        let type: 'blue-orb' | 'gold-star' | 'amethyst-rune' = 'blue-orb'
        let points = 20
        if (rand > 0.72) {
          type = 'gold-star'
          points = 40
        } else if (rand > 0.42) {
          type = 'amethyst-rune'
          points = 30
        }

        const newItem: FallingBall = {
          id: nextItemIdRef.current++,
          type,
          points,
          x: 10 + Math.random() * 80,
          y: -8,
          speed: isFrenzy ? 38 + Math.random() * 16 : 32 + Math.random() * 12,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 120,
          collected: false,
        }
        itemsRef.current = [...itemsRef.current, newItem]
      }

      // Physics & Collision Handling
      const catcherXVal = catcherXRef.current
      const catcherYVal = 86 // percentage height
      const catcherHalfWidth = 9.0
      const catcherHalfHeight = 7.0

      const remainingItems: FallingBall[] = []

      for (const item of itemsRef.current) {
        if (item.collected) continue

        item.y += item.speed * dt
        item.rotation += item.rotSpeed * dt

        const dx = Math.abs(item.x - catcherXVal)
        const dy = Math.abs(item.y - catcherYVal)

        if (dx < catcherHalfWidth && dy < catcherHalfHeight) {
          // HIT! Collect item exactly once (prevents duplicate scoring)
          item.collected = true

          if (item.type === 'gold-star') {
            sound.playDiamondCatch()
            spawnParticles(item.x, item.y, '#f59e0b', 14)
            addFloatingPopup(`+${item.points} Awesome!`, 'gold-star', item.x, item.y)
          } else if (item.type === 'amethyst-rune') {
            sound.playPortalUnlock()
            spawnParticles(item.x, item.y, '#c084fc', 12)
            addFloatingPopup(`+${item.points} Great Job!`, 'amethyst-rune', item.x, item.y)
          } else {
            sound.playCoinCatch()
            spawnParticles(item.x, item.y, '#38bdf8', 10)
            addFloatingPopup(`+${item.points}`, 'blue-orb', item.x, item.y)
          }

          setBallsCaught((prev) => prev + 1)

          setScore((prevScore) => {
            const nextScore = prevScore + item.points
            scoreRef.current = nextScore

            // Check if 200 points target achieved within time
            if (nextScore >= TARGET_SCORE && !isSuccessRef.current) {
              isSuccessRef.current = true
              setIsSuccess(true)
              sound.playLevelComplete()
              setGameStage('gameover')
            }
            return nextScore
          })

          continue
        }

        if (item.y <= 104) {
          remainingItems.push(item)
        } else if (!item.collected) {
          // Ball or coin missed and dropped off-screen
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
        animFrameRef.current = null
      }
    }
  }, [gameStage, secondsLeft, addFloatingPopup, spawnParticles, TARGET_SCORE])

  const progressPercent = Math.min(100, Math.round((score / TARGET_SCORE) * 100))
  const isFrenzy = secondsLeft <= 6 && gameStage === 'playing'

  return (
    <div className="arena-root coin-catcher-root">
      {/* 1. Immersive Haunted Horror-Fantasy Arena Background */}
      <div
        className="coin-catcher-bg-layer haunted-arena-bg"
        style={{ backgroundImage: `url(${hauntedArenaReadyBg})` }}
      >
        <div className="haunted-vignette" />
        <div className="haunted-moonlight-beam" />
        <div className="haunted-fog-purple" />
        <div className="haunted-fog-blue" />
        <div className="haunted-runic-energy" />
        <div className="haunted-energy-pulse" />
      </div>

      <ParticleCanvas />

      {/* Top Header Navigation */}
      <header className="arena-header catcher-header">
        <div className="header-left-actions">
          <button
            type="button"
            className="control-btn back-btn"
            onClick={handleReturnEarly}
            data-selectable="true"
            title="Back to Start Screen"
          >
            <span className="btn-icon">←</span>
            <span className="btn-label">BACK TO START</span>
          </button>

          <div className="expo-badge-container">
            <span className="expo-pulsing-crystal gold-crystal">⚡</span>
            <div className="expo-badge-text">
              <span className="expo-title">MAGIC COIN CATCHER</span>
              <span className="expo-sub">COLLECT 200 POINTS TO UNLOCK!</span>
            </div>
          </div>
        </div>

        {/* Live HUD Pills: Prominent Score & Countdown Timer */}
        <div className="header-meta-tags">
          <div className="meta-tag score-tag">
            <span className="tag-label">SCORE:</span>
            <span className="tag-value gold">{score} / {TARGET_SCORE}</span>
          </div>

          <div className={`meta-tag timer-tag ${isFrenzy ? 'urgent-timer' : ''}`}>
            <span className="tag-label">TIME:</span>
            <span className="tag-value cyan">{secondsLeft}s</span>
          </div>
        </div>

        <div className="header-right-actions">
          <CameraStatusBadge />

          <button
            type="button"
            className={`control-btn audio-btn ${isAudioActive ? 'active' : ''}`}
            onClick={toggleAudio}
            data-selectable="true"
            aria-label="Toggle Audio"
          >
            <span className="btn-icon">{isAudioActive ? '🔊' : '🔇'}</span>
          </button>

          <button
            type="button"
            className="control-btn fullscreen-btn"
            onClick={toggleFullscreen}
            data-selectable="true"
            aria-label="Toggle Fullscreen"
          >
            <span className="btn-icon">{isFullscreen ? '⛶' : '🗖'}</span>
          </button>
        </div>
      </header>

      {/* Progress Bar Across Top */}
      <div className="catcher-progress-track" aria-hidden="true">
        <div
          className={`catcher-progress-fill ${score >= TARGET_SCORE ? 'completed' : ''}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Full-Screen Game Arena */}
      <main
        ref={stageRef}
        className="game-arena catcher-stage"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        role="region"
        aria-label="Ball Catching Arena"
      >
        {/* Friendly Motivation Strip During Gameplay */}
        {gameStage === 'playing' && (
          <div className={`catcher-motivation-banner ${score >= TARGET_SCORE ? 'unlocked' : ''}`}>
            <span className="banner-icon">{score >= TARGET_SCORE ? '🎉' : '🖐️'}</span>
            <span className="banner-text">
              {score >= TARGET_SCORE
                ? 'Awesome! You unlocked the riddle question!'
                : score >= 140
                ? 'Almost There! Keep going!'
                : 'Keep going! Collect 200 points to reveal the riddle!'}
            </span>
          </div>
        )}

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

        {/* Falling Collectible Orbs */}
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

        {/* Player's Magic Catcher Paddle / Basket */}
        <div
          className={`arcane-catcher-vessel ${isHandActive ? 'hand-active' : ''}`}
          style={{
            left: `${catcherX}%`,
            transform: `translateX(-50%) rotate(${catcherTilt}deg)`,
          }}
          aria-hidden="true"
        >
          <div className="catcher-vessel-rim" />
          <div className="catcher-vessel-body">
            <span className="catcher-core-gem">✦</span>
          </div>
          <div className="catcher-vessel-wings left" />
          <div className="catcher-vessel-wings right" />
          <div className="catcher-vessel-aura" />
        </div>

        {/* 1. READY OVERLAY */}
        {gameStage === 'ready' && (
          <div className="catcher-ready-overlay">
            {/* Ambient floating magical sparks & particles specifically for the Ready Screen */}
            <ParticleCanvas />

            <div className="ready-modal-card">
              <div className="ready-portal-icon">⚡</div>
              <h2 className="ready-title">READY TO PLAY?</h2>
              <p className="ready-instructions">
                <span>
                  Move your hand to catch falling coins and stars! Collect at least <strong>200 points</strong> within{' '}
                  <strong>15 seconds</strong> to unlock the Riddle answer options!
                </span>
              </p>
              <div className="ready-scoring-rules">
                <div className="rule-item cyan">
                  <span className="rule-icon">🔵</span>
                  <span>Blue Orb: <strong>+20 PTS</strong></span>
                </div>
                <div className="rule-item gold">
                  <span className="rule-icon">⭐</span>
                  <span>Gold Star: <strong>+40 PTS</strong></span>
                </div>
                <div className="rule-item purple">
                  <span className="rule-icon">🟣</span>
                  <span>Magic Sphere: <strong>+30 PTS</strong></span>
                </div>
              </div>

              <div className="ready-actions-row">
                <button
                  ref={startChallengeBtnRef}
                  type="button"
                  className="btn-start-challenge-prominent"
                  onClick={handleStartChallenge}
                  data-selectable="true"
                  aria-label="Let's Catch Some Coins!"
                >
                  <span className="btn-icon">▶</span>
                  <span>LET&apos;S CATCH SOME COINS!</span>
                </button>
                <button
                  ref={exitEarlyBtnRef}
                  type="button"
                  className="btn-back-riddle-secondary"
                  onClick={handleReturnEarly}
                  data-selectable="true"
                  aria-label="Back to Start"
                >
                  ← BACK TO START
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. MATCH RESULTS / GAMEOVER OVERLAY */}
        {gameStage === 'gameover' && (
          <div className="modal-backdrop gameover-backdrop" role="dialog" aria-modal="true">
            <div className="modal-container ancient-codex results-modal">
              <div className="modal-header">
                <span className="victory-crown">{isSuccess ? '👑' : '⏳'}</span>
                <span className={`header-eyebrow ${isSuccess ? 'gold' : 'red'}`}>
                  {isSuccess ? 'GREAT JOB!' : 'KEEP GOING!'}
                </span>
                <h2 className="modal-title">
                  {isSuccess ? 'AWESOME! RIDDLE QUESTION UNLOCKED!' : "OOPS! TRY AGAIN!"}
                </h2>
              </div>

              <div className="modal-body custom-scrollbar">
                <div className="results-total-score-card">
                  <span className="score-label">YOUR SCORE</span>
                  <span className="score-big-number">
                    {score} <span className="score-denom">/ {TARGET_SCORE} PTS</span>
                  </span>
                  <span className={`score-rank-title ${isSuccess ? 'success' : 'failed'}`}>
                    {isSuccess
                      ? '🔓 AWESOME! RIDDLE OPTIONS UNLOCKED!'
                      : '🔒 COLLECT 200 POINTS TO UNLOCK OPTIONS!'}
                  </span>
                </div>

                <div className="results-breakdown-grid">
                  <div className="breakdown-stat-card coin">
                    <span className="b-icon">⚡</span>
                    <span className="b-title">Coins Caught</span>
                    <span className="b-count">{ballsCaught} coins</span>
                  </div>
                  <div className="breakdown-stat-card diamond">
                    <span className="b-icon">🎯</span>
                    <span className="b-title">Target Score</span>
                    <span className="b-count">200 PTS</span>
                  </div>
                  <div className="breakdown-stat-card">
                    <span className="b-icon">⏱️</span>
                    <span className="b-title">Time Limit</span>
                    <span className="b-count">15 Seconds</span>
                  </div>
                </div>

                {isSuccess ? (
                  <div className="challenge-success-box">
                    <span className="success-badge-icon">✨</span>
                    <p className="success-badge-text">
                      <strong>Awesome! Riddle Options Unlocked!</strong> Great reflexes!
                      You scored {score} points and reached the 200-point requirement. Click Return to Riddle below to choose your answer!
                    </p>
                  </div>
                ) : (
                  <div className="challenge-retry-box">
                    <span className="retry-badge-icon">💡</span>
                    <p className="retry-badge-text">
                      You scored {score} / 200 points. Keep going! Collect 200 points to unlock the four answer options!
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <div className="results-actions-row">
                  {isSuccess ? (
                    <>
                      <button
                        ref={selectOptionsBtnRef}
                        type="button"
                        className="modal-action-btn victory-btn"
                        onClick={handleReturnSuccess}
                        data-selectable="true"
                        aria-label="Return to Riddle"
                      >
                        RETURN TO RIDDLE →
                      </button>
                      <button
                        ref={retryBtnRef}
                        type="button"
                        className="modal-action-btn retry-btn"
                        onClick={handlePlayAgain}
                        data-selectable="true"
                        aria-label="Play Again"
                      >
                        ↺ PLAY AGAIN
                      </button>
                      <button
                        ref={exitGameBtnRef}
                        type="button"
                        className="modal-action-btn secondary-back-btn"
                        onClick={handleReturnEarly}
                        data-selectable="true"
                        aria-label="Back to Riddle"
                      >
                        ← BACK TO RIDDLE
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        ref={retryBtnRef}
                        type="button"
                        className="modal-action-btn retry-btn prominent-retry"
                        onClick={handlePlayAgain}
                        data-selectable="true"
                        aria-label="Try Again"
                      >
                        ▶ TRY AGAIN!
                      </button>
                      <button
                        type="button"
                        className="modal-action-btn locked-options-btn"
                        disabled
                        title="Collect 200 points to unlock options"
                      >
                        🔒 OPTIONS LOCKED (NEED 200 PTS)
                      </button>
                      <button
                        ref={exitGameBtnRef}
                        type="button"
                        className="modal-action-btn secondary-back-btn"
                        onClick={handleReturnEarly}
                        data-selectable="true"
                        aria-label="Back to Riddle"
                      >
                        ← BACK TO RIDDLE
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Status Footer */}
      <footer className="arena-footer catcher-footer">
        <div className="footer-left">
          <span className={`status-indicator ${isHandActive ? 'tracking' : ''}`} />
          <span>
            {isHandActive
              ? 'HAND SENSORS TRACKING • STEERING CATCHER'
              : controlMode === 'touch'
              ? 'TOUCH CONTROL ACTIVE • DRAG TO STEER'
              : 'MOUSE CONTROL ACTIVE • MOVE TO STEER'}
          </span>
        </div>
        <div className="footer-center">
          <span>
            {isFrenzy
              ? '⚡ FRENZY MODE SURGING • CATCH EVERY ORB IN SIGHT!'
              : '✨ CATCH FALLING ORBS TO REACH 200 POINTS IN 15 SECONDS'}
          </span>
        </div>
        <div className="footer-right">
          <span>BALL CATCHING CHALLENGE • EXPO 2026</span>
        </div>
      </footer>
    </div>
  )
}

export default MagicCoinCatcher
