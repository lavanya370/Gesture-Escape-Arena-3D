import React, { useState, useEffect, useRef, useCallback } from 'react'
import castleBg from '../assets/castle-bg.jpg'
import { ParticleCanvas } from './ParticleCanvas'
import { CameraStatusBadge } from './CameraStatusBadge'
import { gestureDetector } from '../vision/gestureDetector'
import { sound } from '../utils/audio'
import { useGame } from '../context/GameContext'

import type { ScienceMystery } from '../types/scienceMystery'

interface GuardiansFunnyTrapProps {
  onReturnToHub?: () => void
  onCompleteFunnyTrap?: (stats?: {
    score: number
    livesLeft: number
    timeSurvived: number
  }) => void
  currentMystery?: ScienceMystery
  hint2Unlocked?: boolean
  onUnlockHint2?: () => void
}

interface Obstacle {
  id: number
  type: 'tomato' | 'bomb' | 'chicken'
  x: number // percentage 4% to 96%
  y: number // percentage 4% to 96%
  vx: number // percentage per second
  vy: number // percentage per second
  rotation: number
  rotSpeed: number
  size: number // diameter in percent (approx 6% to 9%)
}

interface FloatingBanner {
  id: number
  text: string
  color: string
  x: number
  y: number
}

interface TrapParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
}

export const GuardiansFunnyTrap: React.FC<GuardiansFunnyTrapProps> = ({
  onReturnToHub,
  onCompleteFunnyTrap,
}) => {
  const { hints, claimHint, completeFunnyTrap, setCurrentView, riddle } = useGame()

  // Game state
  const [gameStage, setGameStage] = useState<'ready' | 'playing' | 'gameover' | 'victory'>('ready')
  const [countdownStart, setCountdownStart] = useState<number>(1)
  const [secondsLeft, setSecondsLeft] = useState<number>(15)
  const [lives, setLives] = useState<number>(3)
  const [isInvulnerable, setIsInvulnerable] = useState<boolean>(false)
  const [screenShake, setScreenShake] = useState<boolean>(false)
  const [hint3ClaimedLocal, setHint3ClaimedLocal] = useState<boolean>(hints.hint3.claimed)

  // Player position (percentage 6% to 94%)
  const [playerX, setPlayerX] = useState<number>(50)
  const [playerY, setPlayerY] = useState<number>(65)
  const [controlMode, setControlMode] = useState<'hand' | 'mouse'>('hand')
  const [isHandActive, setIsHandActive] = useState<boolean>(false)
  const [isPinching, setIsPinching] = useState<boolean>(false)

  // Obstacles & Effects
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [floatingBanners, setFloatingBanners] = useState<FloatingBanner[]>([])
  const [particles, setParticles] = useState<TrapParticle[]>([])

  // Header controls
  const [isAudioActive, setIsAudioActive] = useState<boolean>(() => sound.getAmbientState())
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  // Refs
  const stageRef = useRef<HTMLDivElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const spawnTimerRef = useRef<number>(0)
  const nextObsIdRef = useRef<number>(1)
  const nextBannerIdRef = useRef<number>(1)
  const nextParticleIdRef = useRef<number>(1)

  const obstaclesRef = useRef<Obstacle[]>([])
  const playerXRef = useRef<number>(50)
  const playerYRef = useRef<number>(65)
  const isInvulnerableRef = useRef<boolean>(false)
  const livesRef = useRef<number>(3)

  // Sync state to refs in effects to satisfy React purity
  useEffect(() => {
    obstaclesRef.current = obstacles
  }, [obstacles])

  useEffect(() => {
    playerXRef.current = playerX
    playerYRef.current = playerY
  }, [playerX, playerY])

  useEffect(() => {
    isInvulnerableRef.current = isInvulnerable
  }, [isInvulnerable])

  useEffect(() => {
    livesRef.current = lives
  }, [lives])

  // Hand tracking subscription
  useEffect(() => {
    const unsubscribe = gestureDetector.subscribe((data) => {
      setIsHandActive(data.handDetected)
      setIsPinching(data.isPinching)

      if (data.handDetected && stageRef.current) {
        setControlMode('hand')
        const rect = stageRef.current.getBoundingClientRect()
        const relX = ((data.cursorX - rect.left) / rect.width) * 100
        const relY = ((data.cursorY - rect.top) / rect.height) * 100

        setPlayerX(Math.max(6, Math.min(94, relX)))
        // Hand gesture: pinch lowers/ducks the player to avoid hazards
        if (data.isPinching) {
          setPlayerY(Math.min(88, relY + 14))
        } else {
          setPlayerY(Math.max(12, Math.min(85, relY)))
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // Mouse fallback tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * 100
    const relY = ((e.clientY - rect.top) / rect.height) * 100

    setPlayerX(Math.max(6, Math.min(94, relX)))
    setPlayerY(Math.max(8, Math.min(92, relY)))
    setControlMode('mouse')
  }

  // Touch fallback tracking for mobile/tablets
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!stageRef.current || e.touches.length === 0) return
    const touch = e.touches[0]
    const rect = stageRef.current.getBoundingClientRect()
    const relX = ((touch.clientX - rect.left) / rect.width) * 100
    const relY = ((touch.clientY - rect.top) / rect.height) * 100

    setPlayerX(Math.max(6, Math.min(94, relX)))
    setPlayerY(Math.max(8, Math.min(92, relY)))
    setControlMode('mouse')
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

  // Ready countdown
  useEffect(() => {
    if (gameStage !== 'ready') return

    const timer = setInterval(() => {
      setCountdownStart((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          sound.playStartSpell()
          setGameStage('playing')
          return 0
        }
        sound.playHover()
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStage])

  // 15-Second Match Countdown
  useEffect(() => {
    if (gameStage !== 'playing') return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          sound.playTrapEscape()
          sound.playLevelComplete()
          setGameStage('victory')
          completeFunnyTrap()
          onCompleteFunnyTrap?.({
            score: 500 + (livesRef.current * 50),
            livesLeft: livesRef.current,
            timeSurvived: 15,
          })
          return 0
        }
        if (prev === 6) {
          sound.playPortalUnlock() // Frenzy audio alert in last 5s
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStage, completeFunnyTrap, onCompleteFunnyTrap])

  // Spawn visual particles
  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParts: TrapParticle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5)
      const speed = 8 + Math.random() * 14
      newParts.push({
        id: nextParticleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 5 + Math.random() * 5,
        life: 1.0,
      })
    }
    setParticles((prev) => [...prev.slice(-40), ...newParts])
  }, [])

  // Floating comic message
  const addFloatingBanner = useCallback((text: string, color: string, x: number, y: number) => {
    const id = nextBannerIdRef.current++
    setFloatingBanners((prev) => [...prev, { id, text, color, x, y }])
    setTimeout(() => {
      setFloatingBanners((curr) => curr.filter((b) => b.id !== id))
    }, 900)
  }, [])

  // Take Damage Routine
  const handleTakeDamage = useCallback((obstacleType: Obstacle['type'], obsX: number, obsY: number) => {
    if (isInvulnerableRef.current) return

    // Trigger invulnerability window (1.5 seconds)
    setIsInvulnerable(true)
    setTimeout(() => {
      setIsInvulnerable(false)
    }, 1500)

    // Screen shake
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 380)

    // Damage sound and comical effects based on obstacle
    if (obstacleType === 'tomato') {
      sound.playTomatoSplat()
      sound.playPlayerHurt()
      addFloatingBanner('🍅 SPLAT! -1 HEART', '#ef4444', obsX, obsY)
      spawnParticles(obsX, obsY, '#ef4444', 16)
    } else if (obstacleType === 'chicken') {
      sound.playChickenSquawk()
      sound.playPlayerHurt()
      addFloatingBanner('🐔 SQUAWK! -1 HEART', '#f59e0b', obsX, obsY)
      spawnParticles(obsX, obsY, '#fbbf24', 16)
    } else {
      sound.playBombHit()
      sound.playPlayerHurt()
      addFloatingBanner('💣 BOOM! -1 HEART', '#f87171', obsX, obsY)
      spawnParticles(obsX, obsY, '#94a3b8', 16)
    }

    // Decrement lives and play subtle warning sound
    sound.playLifeLost()
    setLives((prevLives) => {
      const nextLives = prevLives - 1
      if (nextLives <= 0) {
        // Game Over!
        sound.playDefeatTone()
        setGameStage('gameover')
      }
      return nextLives
    })
  }, [addFloatingBanner, spawnParticles])

  // Core 60fps Game Loop & Obstacle Movement
  useEffect(() => {
    if (gameStage !== 'playing') return

    lastTimeRef.current = performance.now()
    spawnTimerRef.current = 0.85 // Guarantees first obstacle spawns within ~0.2s of entering playing mode!

    const updateGame = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = now

      const isFrenzy = secondsLeft <= 5
      const spawnInterval = isFrenzy ? 0.65 : 0.95

      // 1. Spawning moving obstacles
      spawnTimerRef.current += dt
      if (spawnTimerRef.current >= spawnInterval && obstaclesRef.current.length < (isFrenzy ? 14 : 9)) {
        spawnTimerRef.current = 0

        // Type: 40% tomato, 35% chicken, 25% bomb
        const rand = Math.random()
        const type: Obstacle['type'] = rand > 0.75 ? 'bomb' : rand > 0.40 ? 'chicken' : 'tomato'

        // Spawn from random screen edge
        const side = Math.floor(Math.random() * 4) // 0: top, 1: right, 2: bottom, 3: left
        let startX = 50
        let startY = 50
        let vx = (Math.random() - 0.5) * 30
        let vy = (Math.random() - 0.5) * 30

        const baseSpeed = isFrenzy ? 32 + Math.random() * 18 : 22 + Math.random() * 14

        if (side === 0) {
          startX = 10 + Math.random() * 80
          startY = -5
          vy = baseSpeed
        } else if (side === 1) {
          startX = 105
          startY = 10 + Math.random() * 80
          vx = -baseSpeed
        } else if (side === 2) {
          startX = 10 + Math.random() * 80
          startY = 105
          vy = -baseSpeed
        } else {
          startX = -5
          startY = 10 + Math.random() * 80
          vx = baseSpeed
        }

        const newObs: Obstacle = {
          id: nextObsIdRef.current++,
          type,
          x: startX,
          y: startY,
          vx,
          vy,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 180,
          size: type === 'chicken' ? 7.5 : type === 'bomb' ? 6.8 : 6.0,
        }

        obstaclesRef.current = [...obstaclesRef.current, newObs]
      }

      // 2. Physics & Collision Loop
      const px = playerXRef.current
      const py = playerYRef.current
      const playerRadius = 4.0 // radius in percentage

      const updatedObstacles: Obstacle[] = []

      for (const obs of obstaclesRef.current) {
        // Update position
        obs.x += obs.vx * dt
        obs.y += obs.vy * dt
        obs.rotation += obs.rotSpeed * dt

        // Chickens bounce off arena boundaries playfully
        if (obs.type === 'chicken') {
          if (obs.x < 4 || obs.x > 96) obs.vx *= -1
          if (obs.y < 4 || obs.y > 96) obs.vy *= -1
        }

        // Collision check with player
        const dx = obs.x - px
        const dy = obs.y - py
        const distance = Math.hypot(dx, dy)
        const hitThreshold = playerRadius + (obs.size / 2)

        if (distance < hitThreshold) {
          handleTakeDamage(obs.type, obs.x, obs.y)
          // Deflect or remove obstacle after hitting
          continue
        }

        // Keep obstacle if inside arena or close by
        if (obs.x >= -12 && obs.x <= 112 && obs.y >= -12 && obs.y <= 112) {
          updatedObstacles.push(obs)
        } else {
          // Obstacle successfully avoided/escaped
          sound.playTrapEscape()
        }
      }

      obstaclesRef.current = updatedObstacles
      setObstacles([...updatedObstacles])

      // 3. Update particle physics
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

      animFrameRef.current = requestAnimationFrame(updateGame)
    }

    animFrameRef.current = requestAnimationFrame(updateGame)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [gameStage, secondsLeft, handleTakeDamage])

  // Restart match logic
  const handleRetry = () => {
    sound.playStartSpell()
    setLives(3)
    setSecondsLeft(15)
    setCountdownStart(1)
    setIsInvulnerable(false)
    setHint3ClaimedLocal(false)
    setObstacles([])
    obstaclesRef.current = []
    setParticles([])
    setFloatingBanners([])
    setPlayerX(50)
    setPlayerY(65)
    setGameStage('ready')
  }

  const isFrenzy = secondsLeft <= 5 && gameStage === 'playing'

  return (
    <div className={`arena-root funny-trap-root ${screenShake ? 'screen-shake' : ''}`}>
      {/* Background layer */}
      <div
        className="castle-background-layer trap-bg"
        style={{ backgroundImage: `url(${castleBg})` }}
      >
        <div className="castle-vignette"></div>
        <div className="castle-mist-overlay emerald-mist"></div>
        <div className="castle-torch-flicker torch-left"></div>
        <div className="castle-torch-flicker torch-right"></div>
      </div>

      <ParticleCanvas />

      {/* Top Header Navigation */}
      <header className="arena-header trap-header">
        <div className="header-left-actions">
          <button
            className="control-btn back-btn"
            onClick={() => {
              sound.playHover()
              setCurrentView('riddle-realm')
            }}
            data-selectable="true"
            role="button"
            title="Return to Riddle Realm"
          >
            <span className="btn-icon">←</span>
            <span className="btn-label">RIDDLE REALM</span>
          </button>

          <div className="expo-badge-container">
            <span className="expo-pulsing-crystal emerald-crystal">ᛉ</span>
            <div className="expo-badge-text">
              <span className="expo-title">GUARDIAN'S FUNNY TRAP</span>
              <span className="expo-sub">HINT 3 CHALLENGE • SURVIVE 15S</span>
            </div>
          </div>
        </div>

        {/* Live HUD Pills */}
        <div className="header-meta-tags">
          {/* Hearts / Lives Counter */}
          <div className="meta-pill hearts-pill" title="Player Lives">
            <span className="pill-icon">❤️</span>
            <span className="pill-text">
              LIVES:{' '}
              <strong className="hearts-display">
                {[1, 2, 3].map((heartIndex) => (
                  <span
                    key={heartIndex}
                    className={`heart-icon ${heartIndex <= lives ? 'heart-full' : 'heart-empty'}`}
                  >
                    {heartIndex <= lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </strong>
            </span>
          </div>

          {/* 15-Second Timer */}
          <div
            className={`meta-pill timer-pill ${isFrenzy ? 'timer-frenzy-pulse' : ''}`}
            title="Survive 15 Seconds"
          >
            <span className="pill-icon">⏱️</span>
            <span className="pill-text">SURVIVE: <strong>00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}</strong></span>
          </div>

          {/* Reward preview pill */}
          <div className="meta-pill reward-pill" title="Victory Reward">
            <span className="pill-icon">🎁</span>
            <span className="pill-text">REWARD: <strong>HINT 3 UNLOCKED</strong></span>
          </div>

          {/* Active Control Mode Indicator */}
          <div
            className={`meta-pill control-pill ${controlMode === 'hand' && isHandActive ? 'hand-active' : 'mouse-active'}`}
            title="Current Input Device"
          >
            <span className="pill-icon">{controlMode === 'hand' && isHandActive ? '🖐️' : '🖱️'}</span>
            <span className="pill-text">
              {controlMode === 'hand'
                ? isHandActive
                  ? isPinching
                    ? 'HAND TRACKING (PINCH DUCK)'
                    : 'HAND TRACKING ACTIVE (MOVE HAND TO DODGE)'
                  : 'HAND NOT DETECTED (USE MOUSE)'
                : 'MOUSE / TOUCH CONTROL'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="header-controls">
          <CameraStatusBadge />

          <button
            className={`control-btn audio-btn ${isAudioActive ? 'active' : ''}`}
            onClick={toggleAudio}
            data-selectable="true"
            role="button"
            title={isAudioActive ? 'Mute Audio' : 'Play Audio'}
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

      {/* Main Dodge Arena Stage */}
      <main
        className="funny-trap-arena-stage"
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchMove}
      >
        {/* Frenzy Alert Banner */}
        {isFrenzy && (
          <div className="frenzy-banner-overlay frenzy-trap" role="status">
            <span className="frenzy-sparkle">🐔</span>
            <span>CHAOS OVERDRIVE! OBSTACLE SWARM INCOMING!</span>
            <span className="frenzy-sparkle">🍅</span>
          </div>
        )}

        {/* Moving Obstacles Layer */}
        <div className="trap-obstacles-layer">
          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className={`trap-obstacle obstacle-${obs.type}`}
              style={{
                left: `${obs.x}%`,
                top: `${obs.y}%`,
                transform: `translate(-50%, -50%) rotate(${obs.rotation}deg)`,
              }}
            >
              {obs.type === 'tomato' && (
                <div className="tomato-visual">
                  <div className="tomato-body">
                    <span className="tomato-leaf">🌿</span>
                    <div className="tomato-shine"></div>
                  </div>
                </div>
              )}

              {obs.type === 'chicken' && (
                <div className="chicken-visual">
                  <div className="chicken-body">
                    <span className="chicken-crest">👑</span>
                    <span className="chicken-eyes">👀</span>
                    <span className="chicken-beak">🔻</span>
                    <div className="chicken-wing wing-l"></div>
                    <div className="chicken-wing wing-r"></div>
                  </div>
                </div>
              )}

              {obs.type === 'bomb' && (
                <div className="rolling-bomb-visual">
                  <div className="bomb-core">
                    <span className="bomb-icon">💣</span>
                    <span className="fuse-sparkle">💥</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Floating Comic Banners */}
        <div className="floating-popups-layer">
          {floatingBanners.map((b) => (
            <div
              key={b.id}
              className="floating-popup comic-banner"
              style={{ left: `${b.x}%`, top: `${b.y}%`, color: b.color }}
            >
              {b.text}
            </div>
          ))}
        </div>

        {/* Particle Bursts Layer */}
        <div className="sparkle-particles-layer">
          {particles.map((part) => (
            <div
              key={part.id}
              className="sparkle-particle"
              style={{
                left: `${part.x}%`,
                top: `${part.y}%`,
                backgroundColor: part.color,
                boxShadow: `0 0 8px ${part.color}`,
                width: `${part.size}px`,
                height: `${part.size}px`,
                opacity: part.life,
              }}
            ></div>
          ))}
        </div>

        {/* Player Character: Sir Pippin the Apprentice */}
        <div
          className={`trap-player-character ${isInvulnerable ? 'player-invulnerable' : ''}`}
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Invulnerability Shield */}
          {isInvulnerable && <div className="player-shield-bubble"></div>}

          {/* Cute Wizard Apprentice */}
          <div className="apprentice-sprite">
            <div className="wizard-hat">
              <span className="hat-star">✦</span>
            </div>
            <div className="wizard-face">
              <div className="face-eyes">
                <span className="eye">●</span>
                <span className="eye">●</span>
              </div>
              <div className="face-blush"></div>
            </div>
            <div className="wizard-robe">
              <span className="robe-rune">ᛉ</span>
            </div>
          </div>

          {/* Guide Reticle & Label */}
          <div className="player-reticle-ring"></div>
          <div className="player-name-tag">
            {controlMode === 'hand' && isHandActive ? '🖐️ YOU' : '🖱️ YOU'}
          </div>
        </div>

        {/* Instructions / Ready Modal */}
        {gameStage === 'ready' && (
          <div className="catcher-ready-overlay">
            <div className="ready-modal-card">
              <div className="ready-portal-icon">🐔</div>
              <h2 className="ready-title">GUARDIAN&apos;S FUNNY TRAP</h2>
              <p className="ready-instructions">
                <span>Dodge Sir Hop-A-Lot&apos;s silly chaotic traps! <strong>Move your hand left & right</strong> or <strong>steer your mouse</strong> to survive for 15 seconds. (Pinch your fingers to duck under high traps!)</span>
              </p>

              <div className="ready-scoring-rules">
                <div className="rule-item red">
                  <span className="rule-icon">🍅</span>
                  <span>Tomatoes: <strong>DODGE!</strong></span>
                </div>
                <div className="rule-item gold">
                  <span className="rule-icon">🐔</span>
                  <span>Chickens: <strong>DODGE!</strong></span>
                </div>
                <div className="rule-item dark">
                  <span className="rule-icon">💣</span>
                  <span>Bombs: <strong>DODGE!</strong></span>
                </div>
              </div>

              <div className="ready-lives-rule">
                <span>❤️ <strong>3 HEARTS:</strong> 1.5s Invulnerability Shield after getting hit.</span>
              </div>

              <div className="ready-countdown-big">
                {countdownStart > 0 ? countdownStart : 'SURVIVE!'}
              </div>
            </div>
          </div>
        )}

        {/* Game Over Modal (Lost all 3 hearts) */}
        {gameStage === 'gameover' && (
          <div className="modal-backdrop gameover-backdrop" role="dialog" aria-modal="true">
            <div className="modal-container ancient-codex results-modal">
              <div className="modal-header">
                <span className="defeat-skull">💀</span>
                <span className="header-eyebrow red">OUT OF LIVES</span>
                <h2 className="modal-title" style={{ color: '#fca5a5' }}>
                  THE TRAPS SQUAWKED YOU!
                </h2>
              </div>

              <div className="modal-body custom-scrollbar">
                <p className="defeat-desc">
                  You took 3 hits before the 15-second timer expired! Sir Hop-A-Lot celebrated with a silly victory pose.
                </p>

                <div className="defeat-stats-card">
                  <div>Time Survived: <strong>{15 - secondsLeft}s / 15s</strong></div>
                  <div>Remaining Lives: <strong>0 / 3 ❤️</strong></div>
                </div>
              </div>

              <div className="modal-footer">
                <div className="defeat-actions-row">
                  <button
                    className="modal-action-btn retry-btn"
                    onClick={handleRetry}
                    data-selectable="true"
                    role="button"
                  >
                    🔄 RETRY TRAP (15S)
                  </button>
                  <button
                    className="modal-action-btn abandon-btn"
                    onClick={() => {
                      sound.playHover()
                      if (onReturnToHub) onReturnToHub()
                      else setCurrentView('riddle-realm')
                    }}
                    data-selectable="true"
                    role="button"
                  >
                    RETURN TO PORTAL HUB
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Victory Modal (Survive 30 Seconds!) */}
        {gameStage === 'victory' && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-container ancient-codex results-modal">
              <div className="modal-header">
                <span className="victory-crown">👑</span>
                <span className="header-eyebrow emerald">CHALLENGE CONQUERED</span>
                <h2 className="modal-title">TRAP SURVIVAL VICTORY!</h2>
              </div>

              <div className="modal-body custom-scrollbar">
                <div className="results-total-score-card emerald-score-card">
                  <span className="score-label">SURVIVAL REWARD EARNED</span>
                  <span className="score-big-number emerald-number">+{500 + (lives * 50)} PTS</span>
                  <span className="score-rank-title">
                    {lives === 3
                      ? '🏆 FLAWLESS DODGE MASTER (3/3 HEARTS)'
                      : lives === 2
                      ? '⭐ AGILE SURVIVOR (2/3 HEARTS)'
                      : '✨ SCRAPPY SURVIVOR (1/3 HEARTS)'}
                  </span>
                </div>

                <div className="results-breakdown-grid">
                  <div className="breakdown-stat-card emerald">
                    <span className="b-icon">⏱️</span>
                    <span className="b-title">Survived</span>
                    <span className="b-count">Full 15s</span>
                    <span className="b-pts">+500 PTS</span>
                  </div>

                  <div className="breakdown-stat-card heart">
                    <span className="b-icon">❤️</span>
                    <span className="b-title">Hearts Left</span>
                    <span className="b-count">{lives}/3 Hearts</span>
                    <span className="b-pts">+{lives * 50} PTS</span>
                  </div>

                  <div className="breakdown-stat-card charm">
                    <span className="b-icon">🧿</span>
                    <span className="b-title">Relic Claimed</span>
                    <span className="b-count">Chaos Charm</span>
                    <span className="b-pts">UNLOCKED</span>
                  </div>
                </div>

                {/* Science Mystery Clue Discovery Panel */}
                <div className="clue-unlocked-card clue-earned">
                  <div className="clue-card-badge">
                    <span className="clue-badge-icon">💡</span>
                    <span className="clue-badge-label">GUARDIAN DEFEATED! HINT 3 UNLOCKED!</span>
                  </div>

                  <div className="clue-mystery-context">
                    MYSTERY: <strong>{riddle.title}</strong>
                  </div>

                  <div className="clue-text-revealed">
                    {hint3ClaimedLocal || hints.hint3.claimed ? (
                      <>
                        <p className="clue-quote">
                          "{hints.hint3.text}"
                        </p>
                        <div className="clue-action-button-area">
                          <div className="clue-status-confirmed">
                            ✓ HINT 3 CLAIMED & SAVED TO TREASURE BOX
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="clue-teaser">
                          Chaos survived for 15s! Click below to claim Hint 3 and unseal its mystery secret!
                        </p>
                        <div className="clue-action-button-area">
                          <button
                            type="button"
                            className="btn-claim-mystery-clue"
                            onClick={() => {
                              sound.playVictoryFanfare()
                              claimHint('hint3')
                              setHint3ClaimedLocal(true)
                            }}
                          >
                            🔓 CLAIM HINT 3 & SAVE TO RIDDLE REALM
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className="results-flavor-text">
                  Incredible agility! You dodged every chaotic trap Sir Hop-A-Lot threw at you. Hint 3 has been added to your Treasure Box!
                </p>
              </div>

              <div className="modal-footer">
                <div className="results-actions-row">
                  <button
                    className="modal-action-btn retry-btn"
                    onClick={handleRetry}
                    data-selectable="true"
                    role="button"
                  >
                    🔄 PLAY AGAIN
                  </button>

                  <button
                    className="modal-action-btn victory-btn"
                    onClick={() => {
                      completeFunnyTrap()
                      sound.playHover()
                      setCurrentView('riddle-realm')
                    }}
                    data-selectable="true"
                    role="button"
                  >
                    🏰 RETURN TO RIDDLE REALM →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Status Footer */}
      <footer className="arena-footer trap-footer">
        <div className="footer-left">
          <span className={`status-indicator ${isHandActive ? 'tracking' : ''}`}></span>
          <span>
            {isHandActive
              ? isPinching
                ? '🤏 PINCH DETECTED • DUCKING UNDER HIGH TRAPS'
                : '🖐️ HAND TRACKING ACTIVE • WAVE TO MOVE, PINCH TO DUCK'
              : 'HAND NOT DETECTED • MOUSE / TOUCH CONTROL ACTIVE'}
          </span>
        </div>
        <div className="footer-center">
          <span>
            {isFrenzy
              ? '⚡ CHAOS SWARM! MOVE HAND OR MOUSE TO DODGE TOMATOES & CHICKENS!'
              : '✨ MOVE HAND OR MOUSE TO DODGE OBSTACLES • 3 HEARTS AVAILABLE'}
          </span>
        </div>
        <div className="footer-right">
          <span>GUARDIAN&apos;S FUNNY TRAP • EXPO 2026</span>
        </div>
      </footer>
    </div>
  )
}
