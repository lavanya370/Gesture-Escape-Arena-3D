import React, { useState, useEffect, useRef, useCallback } from 'react'
import castleBg from '../assets/castle-bg.jpg'
import { ParticleCanvas } from './ParticleCanvas'
import { WebcamPreview } from './WebcamPreview'
import { gestureDetector } from '../vision/gestureDetector'
import { sound } from '../utils/audio'

import type { ScienceMystery } from '../types/scienceMystery'

interface BossEscapeProps {
  onReturnToHub: () => void
  onCompleteBossEscape: (stats: {
    score: number
    livesLeft: number
    timeTaken: number
  }) => void
  currentMystery?: ScienceMystery
  finalClueUnlocked?: boolean
  onUnlockFinalClue?: () => void
}

interface BossProjectile {
  id: number
  type: 'fireball' | 'chaos'
  x: number // percentage
  y: number // percentage
  vx: number
  vy: number
  rotation: number
  size: number
}

interface EnergyOrb {
  id: number
  x: number
  y: number
  collected: boolean
}

interface BossParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
}

interface ComicPopup {
  id: number
  text: string
  color: string
  x: number
  y: number
}

export const BossEscape: React.FC<BossEscapeProps> = ({
  onReturnToHub,
  onCompleteBossEscape,
  currentMystery,
  finalClueUnlocked = false,
  onUnlockFinalClue,
}) => {
  // Game lifecycle
  const [gameStage, setGameStage] = useState<'ready' | 'playing' | 'gameover' | 'victory'>('ready')
  const [countdownStart, setCountdownStart] = useState<number>(3)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [finalClueClaimedLocal, setFinalClueClaimedLocal] = useState<boolean>(false)

  // Boss State
  const [bossHp, setBossHp] = useState<number>(100)
  const [bossExpression, setBossExpression] = useState<'idle' | 'attacking' | 'hurt' | 'defeated'>('idle')
  const [bossHitFlash, setBossHitFlash] = useState<boolean>(false)

  // Player State
  const [playerX, setPlayerX] = useState<number>(50)
  const [playerY, setPlayerY] = useState<number>(75)
  const [lives, setLives] = useState<number>(3)
  const [isInvulnerable, setIsInvulnerable] = useState<boolean>(false)
  const [powerCharge, setPowerCharge] = useState<number>(0) // 0 to 100%
  const [isFiringBeam, setIsFiringBeam] = useState<boolean>(false)

  // Vision & Control
  const [controlMode, setControlMode] = useState<'hand' | 'mouse'>('mouse')
  const [isHandActive, setIsHandActive] = useState<boolean>(false)
  const [screenShake, setScreenShake] = useState<boolean>(false)

  // Objects & Visuals
  const [projectiles, setProjectiles] = useState<BossProjectile[]>([])
  const [energyOrbs, setEnergyOrbs] = useState<EnergyOrb[]>([])
  const [particles, setParticles] = useState<BossParticle[]>([])
  const [popups, setPopups] = useState<ComicPopup[]>([])

  // Header HUD
  const [isVisionHUDOpen, setIsVisionHUDOpen] = useState<boolean>(true)
  const [isAudioActive, setIsAudioActive] = useState<boolean>(() => sound.getAmbientState())
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [handsDetected, setHandsDetected] = useState<number>(0)

  // Refs for 60fps loop & synchronization
  const stageRef = useRef<HTMLDivElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const projectileTimerRef = useRef<number>(0)
  const orbSpawnTimerRef = useRef<number>(0)
  const nextProjIdRef = useRef<number>(1)
  const nextOrbIdRef = useRef<number>(1)
  const nextPartIdRef = useRef<number>(1)
  const nextPopupIdRef = useRef<number>(1)

  const projectilesRef = useRef<BossProjectile[]>([])
  const energyOrbsRef = useRef<EnergyOrb[]>([])
  const playerXRef = useRef<number>(50)
  const playerYRef = useRef<number>(75)
  const bossHpRef = useRef<number>(100)
  const powerChargeRef = useRef<number>(0)
  const isInvulnerableRef = useRef<boolean>(false)
  const livesRef = useRef<number>(3)

  // Sync state to refs in effects to satisfy React purity
  useEffect(() => {
    projectilesRef.current = projectiles
  }, [projectiles])

  useEffect(() => {
    energyOrbsRef.current = energyOrbs
  }, [energyOrbs])

  useEffect(() => {
    playerXRef.current = playerX
    playerYRef.current = playerY
  }, [playerX, playerY])

  useEffect(() => {
    bossHpRef.current = bossHp
  }, [bossHp])

  useEffect(() => {
    powerChargeRef.current = powerCharge
  }, [powerCharge])

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

      if (data.handDetected && stageRef.current) {
        setControlMode('hand')
        const rect = stageRef.current.getBoundingClientRect()
        const relX = ((data.cursorX - rect.left) / rect.width) * 100
        const relY = ((data.cursorY - rect.top) / rect.height) * 100

        setPlayerX(Math.max(6, Math.min(94, relX)))
        setPlayerY(Math.max(38, Math.min(92, relY)))
      }
    })

    return () => unsubscribe()
  }, [])

  // Mouse movement fallback
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * 100
    const relY = ((e.clientY - rect.top) / rect.height) * 100

    setPlayerX(Math.max(6, Math.min(94, relX)))
    setPlayerY(Math.max(38, Math.min(92, relY)))
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

  // Ready countdown (3, 2, 1, ENGAGE!)
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

  // Stopwatch timer during battle
  useEffect(() => {
    if (gameStage !== 'playing') return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStage])

  // Particle & popup helper
  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParts: BossParticle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5)
      const speed = 8 + Math.random() * 15
      newParts.push({
        id: nextPartIdRef.current++,
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

  const addComicPopup = useCallback((text: string, color: string, x: number, y: number) => {
    const id = nextPopupIdRef.current++
    setPopups((prev) => [...prev, { id, text, color, x, y }])
    setTimeout(() => {
      setPopups((curr) => curr.filter((p) => p.id !== id))
    }, 850)
  }, [])

  // Player Damage Routine
  const handlePlayerDamage = useCallback((x: number, y: number) => {
    if (isInvulnerableRef.current) return

    setIsInvulnerable(true)
    setTimeout(() => {
      setIsInvulnerable(false)
    }, 1500)

    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 380)

    sound.playLifeLost()
    sound.playPlayerHurt()
    addComicPopup('🔥 OUCH! -1 HEART', '#ef4444', x, y)
    spawnParticles(x, y, '#ef4444', 16)

    setLives((prev) => {
      const next = prev - 1
      if (next <= 0) {
        sound.playDefeatTone()
        setGameStage('gameover')
      }
      return next
    })
  }, [addComicPopup, spawnParticles])

  // Fire Celestial Counter-Beam at Boss
  const triggerCounterAttack = useCallback(() => {
    setIsFiringBeam(true)
    sound.playBossLaserBlast()
    sound.playBossHurt()

    // Boss hit animation
    setBossHitFlash(true)
    setBossExpression('hurt')
    setScreenShake(true)

    spawnParticles(50, 22, '#38bdf8', 24)
    spawnParticles(50, 22, '#f59e0b', 24)
    addComicPopup('⚡ -25 HP CRITICAL BLAST!', '#38bdf8', 50, 26)

    setTimeout(() => {
      setIsFiringBeam(false)
      setBossHitFlash(false)
      setScreenShake(false)
      if (bossHpRef.current - 25 > 0) {
        setBossExpression('idle')
      }
    }, 600)

    setBossHp((prevHp) => {
      const nextHp = Math.max(0, prevHp - 25)
      if (nextHp <= 0) {
        // Boss Defeated!
        setBossExpression('defeated')
        sound.playLevelComplete()
        setTimeout(() => {
          setGameStage('victory')
        }, 1200)
      }
      return nextHp
    })

    setPowerCharge(0)
  }, [addComicPopup, spawnParticles])

  // 60fps Game & Physics Loop
  useEffect(() => {
    if (gameStage !== 'playing') return

    lastTimeRef.current = performance.now()
    projectileTimerRef.current = 0
    orbSpawnTimerRef.current = 0

    const updateBossGame = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = now

      const currentHp = bossHpRef.current

      // Attack Pattern Intervals based on Boss HP
      // HP 100-75: 1.2s | HP 75-50: 0.9s | HP 50-25: 0.7s | HP < 25: 0.5s
      const attackInterval =
        currentHp > 75 ? 1.2 : currentHp > 50 ? 0.9 : currentHp > 25 ? 0.7 : 0.5

      // 1. Spawning Projectiles from Boss
      projectileTimerRef.current += dt
      if (projectileTimerRef.current >= attackInterval) {
        projectileTimerRef.current = 0
        setBossExpression('attacking')
        setTimeout(() => {
          if (bossHpRef.current > 0) setBossExpression('idle')
        }, 300)

        const px = playerXRef.current
        const py = playerYRef.current

        // Angle from Boss mouth (approx x: 50%, y: 22%) toward player
        const dx = px - 50
        const dy = py - 22
        const angle = Math.atan2(dy, dx)
        const speed = currentHp < 50 ? 42 : 34

        const newProj: BossProjectile = {
          id: nextProjIdRef.current++,
          type: Math.random() > 0.65 ? 'chaos' : 'fireball',
          x: 50,
          y: 22,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rotation: Math.random() * 360,
          size: 6.5,
        }

        // If HP is below 50, spawn a twin spread projectile!
        const twinProj: BossProjectile[] = []
        if (currentHp <= 50) {
          const spreadAngle = angle + (Math.random() > 0.5 ? 0.28 : -0.28)
          twinProj.push({
            id: nextProjIdRef.current++,
            type: 'chaos',
            x: 50,
            y: 22,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            rotation: Math.random() * 360,
            size: 6.5,
          })
        }

        projectilesRef.current = [...projectilesRef.current, newProj, ...twinProj]
      }

      // 2. Spawning Stellar Energy Orbs
      orbSpawnTimerRef.current += dt
      if (orbSpawnTimerRef.current >= 1.5 && energyOrbsRef.current.length < 3) {
        orbSpawnTimerRef.current = 0
        const newOrb: EnergyOrb = {
          id: nextOrbIdRef.current++,
          x: 12 + Math.random() * 76,
          y: 42 + Math.random() * 44,
          collected: false,
        }
        energyOrbsRef.current = [...energyOrbsRef.current, newOrb]
      }

      // 3. Projectile Movement & Collision Check
      const px = playerXRef.current
      const py = playerYRef.current
      const playerRadius = 4.5

      const remainingProj: BossProjectile[] = []
      for (const proj of projectilesRef.current) {
        proj.x += proj.vx * dt
        proj.y += proj.vy * dt
        proj.rotation += 180 * dt

        const dist = Math.hypot(proj.x - px, proj.y - py)
        if (dist < playerRadius + (proj.size / 2)) {
          handlePlayerDamage(proj.x, proj.y)
          continue
        }

        // Keep inside bounds
        if (proj.x >= -10 && proj.x <= 110 && proj.y <= 108) {
          remainingProj.push(proj)
        } else {
          // Boss projectile safely dodged / avoided
          sound.playTrapEscape()
        }
      }
      projectilesRef.current = remainingProj
      setProjectiles([...remainingProj])

      // 4. Energy Orb Collection Check
      const remainingOrbs: EnergyOrb[] = []
      for (const orb of energyOrbsRef.current) {
        if (orb.collected) continue

        const dist = Math.hypot(orb.x - px, orb.y - py)
        if (dist < playerRadius + 4.0) {
          orb.collected = true
          sound.playDiamondCatch()
          spawnParticles(orb.x, orb.y, '#38bdf8', 12)
          addComicPopup('+25% POWER!', '#38bdf8', orb.x, orb.y)

          // Increase Power by 25%
          setPowerCharge((prev) => {
            const next = Math.min(100, prev + 25)
            if (next >= 100) {
              // Auto-trigger Counter-Beam!
              setTimeout(() => {
                triggerCounterAttack()
              }, 200)
            }
            return next
          })
          continue
        }
        remainingOrbs.push(orb)
      }
      energyOrbsRef.current = remainingOrbs
      setEnergyOrbs([...remainingOrbs])

      // 5. Update Particle Physics
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

      animFrameRef.current = requestAnimationFrame(updateBossGame)
    }

    animFrameRef.current = requestAnimationFrame(updateBossGame)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [gameStage, handlePlayerDamage, triggerCounterAttack, spawnParticles, addComicPopup])

  // Retry Boss Battle
  const handleRetry = () => {
    sound.playStartSpell()
    setBossHp(100)
    setLives(3)
    setPowerCharge(0)
    setElapsedTime(0)
    setCountdownStart(3)
    setFinalClueClaimedLocal(false)
    setProjectiles([])
    projectilesRef.current = []
    setEnergyOrbs([])
    energyOrbsRef.current = []
    setParticles([])
    setPopups([])
    setPlayerX(50)
    setPlayerY(75)
    setBossExpression('idle')
    setGameStage('ready')
  }

  // Claim Grand Champion Reward (+1,000 PTS + Heart bonus)
  const handleClaimFinalReward = () => {
    sound.playVictoryFanfare()
    if (!finalClueUnlocked && !finalClueClaimedLocal) {
      setFinalClueClaimedLocal(true)
      onUnlockFinalClue?.()
    }
    const finalScore = 1000 + (lives * 100)
    onCompleteBossEscape({
      score: finalScore,
      livesLeft: lives,
      timeTaken: elapsedTime,
    })
  }

  return (
    <div className={`arena-root boss-escape-root ${screenShake ? 'screen-shake' : ''}`}>
      {/* Background layer */}
      <div
        className="castle-background-layer boss-bg"
        style={{ backgroundImage: `url(${castleBg})` }}
      >
        <div className="castle-vignette"></div>
        <div className="castle-mist-overlay ruby-mist"></div>
        <div className="castle-torch-flicker torch-left"></div>
        <div className="castle-torch-flicker torch-right"></div>
      </div>

      <ParticleCanvas />

      {/* Top Header Navigation */}
      <header className="arena-header boss-header">
        <div className="header-left-actions">
          <button
            className="control-btn back-btn"
            onClick={() => {
              sound.playHover()
              onReturnToHub()
            }}
            data-selectable="true"
            role="button"
            title="Return to Portal Hub"
          >
            <span className="btn-icon">←</span>
            <span className="btn-label">PORTAL HUB</span>
          </button>

          <div className="expo-badge-container">
            <span className="expo-pulsing-crystal ruby-crystal">ᛟ</span>
            <div className="expo-badge-text">
              <span className="expo-title">FINAL PORTAL: BOSS ESCAPE</span>
              <span className="expo-sub">ARCH-GUARDIAN IGNIS SANCTUM</span>
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

          {/* Power Meter Pill */}
          <div className="meta-pill power-pill" title="Collect Energy Orbs to fire special beam">
            <span className="pill-icon">⚡</span>
            <span className="pill-text">
              POWER: <strong>{powerCharge}%</strong>
            </span>
          </div>

          {/* Timer Stopwatch */}
          <div className="meta-pill timer-pill" title="Battle Duration">
            <span className="pill-icon">⏱️</span>
            <span className="pill-text">
              TIME: <strong>00:{elapsedTime < 10 ? `0${elapsedTime}` : elapsedTime}</strong>
            </span>
          </div>

          {/* Active Control Mode Indicator */}
          <div
            className={`meta-pill control-pill ${controlMode === 'hand' ? 'hand-active' : 'mouse-active'}`}
            title="Current Input Device"
          >
            <span className="pill-icon">{controlMode === 'hand' ? '🖐️' : '🖱️'}</span>
            <span className="pill-text">
              {controlMode === 'hand'
                ? isHandActive
                  ? 'HAND TRACKING'
                  : 'HAND LOST (USE MOUSE)'
                : 'MOUSE CONTROL'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="header-controls">
          <button
            className={`control-btn vision-btn ${isVisionHUDOpen ? 'active' : ''}`}
            onClick={() => {
              sound.playHover()
              setIsVisionHUDOpen((prev) => !prev)
            }}
            data-selectable="true"
            role="button"
            title={isVisionHUDOpen ? 'Hide Camera HUD' : 'Show Camera HUD'}
          >
            <span className="btn-icon">🖐️</span>
            <span className="btn-label">
              {isVisionHUDOpen
                ? handsDetected > 0
                  ? `HANDS: ${handsDetected}`
                  : 'VISION ON'
                : 'VISION HUD'}
            </span>
          </button>

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

      {/* Main Boss Battle Stage */}
      <main
        className="boss-battle-arena-stage"
        ref={stageRef}
        onMouseMove={handleMouseMove}
      >
        {/* Boss Health Bar Display */}
        <div className="boss-hud-health-card">
          <div className="boss-name-row">
            <span className="boss-title-tag">FINAL BOSS</span>
            <span className="boss-name-text">ARCH-GUARDIAN IGNIS</span>
            <span className="boss-hp-number">{bossHp} / 100 HP</span>
          </div>
          <div className="boss-hp-track">
            <div
              className={`boss-hp-fill ${bossHp <= 25 ? 'hp-critical' : ''}`}
              style={{ width: `${bossHp}%` }}
            ></div>
          </div>
        </div>

        {/* Giant Animated Boss: Arch-Guardian Ignis */}
        <div className={`boss-character-vessel ${bossHitFlash ? 'boss-flash-white' : ''}`}>
          {/* Animated Crown */}
          <div className="boss-crown">
            <span className="crown-gem">✦</span>
            <span className="crown-gem center-gem">👑</span>
            <span className="crown-gem">✦</span>
          </div>

          {/* Boss Head & Expressions */}
          <div className={`boss-head-sprite expression-${bossExpression}`}>
            <div className="boss-eyes">
              {bossExpression === 'hurt' ? (
                <>
                  <span className="eye spiral">🌀</span>
                  <span className="eye spiral">🌀</span>
                </>
              ) : bossExpression === 'defeated' ? (
                <>
                  <span className="eye dead">✖</span>
                  <span className="eye dead">✖</span>
                </>
              ) : bossExpression === 'attacking' ? (
                <>
                  <span className="eye attack">🔥</span>
                  <span className="eye attack">🔥</span>
                </>
              ) : (
                <>
                  <span className="eye normal">👁️</span>
                  <span className="eye normal">👁️</span>
                </>
              )}
            </div>

            <div className="boss-mouth">
              {bossExpression === 'hurt' ? (
                <span className="mouth-wobble">〰️</span>
              ) : bossExpression === 'attacking' ? (
                <span className="mouth-roar">👄</span>
              ) : bossExpression === 'defeated' ? (
                <span className="mouth-ko">👅</span>
              ) : (
                <span className="mouth-smug">😼</span>
              )}
            </div>

            {/* Dizzy stars on hit */}
            {bossExpression === 'hurt' && (
              <div className="dizzy-stars-ring">
                <span>💫</span>
                <span>⭐</span>
                <span>💫</span>
              </div>
            )}
          </div>

          {/* Boss Armor & Floating Claws */}
          <div className="boss-torso-plate">
            <div className="boss-chest-rune">ᛟ</div>
            <div className="boss-claw claw-left">
              <span>🔥</span>
            </div>
            <div className="boss-claw claw-right">
              <span>🔥</span>
            </div>
          </div>
        </div>

        {/* Counter-Beam Laser Blast (when power is 100%) */}
        {isFiringBeam && (
          <div
            className="celestial-counter-beam"
            style={{
              left: `${playerX}%`,
              bottom: `${100 - playerY}%`,
            }}
          >
            <div className="beam-core-flare"></div>
          </div>
        )}

        {/* Falling Projectiles Layer */}
        <div className="boss-projectiles-layer">
          {projectiles.map((proj) => (
            <div
              key={proj.id}
              className={`boss-projectile proj-${proj.type}`}
              style={{
                left: `${proj.x}%`,
                top: `${proj.y}%`,
                transform: `translate(-50%, -50%) rotate(${proj.rotation}deg)`,
              }}
            >
              {proj.type === 'fireball' ? (
                <div className="fireball-visual">
                  <div className="fireball-flame">🔥</div>
                  <div className="fireball-tail"></div>
                </div>
              ) : (
                <div className="chaos-orb-visual">
                  <div className="chaos-orb-core">⚡</div>
                  <div className="chaos-orb-halo"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Collectible Energy Orbs */}
        <div className="energy-orbs-layer">
          {energyOrbs.map((orb) => (
            <div
              key={orb.id}
              className="energy-orb-item"
              style={{ left: `${orb.x}%`, top: `${orb.y}%` }}
            >
              <div className="energy-orb-glow"></div>
              <div className="energy-orb-crystal">✦</div>
            </div>
          ))}
        </div>

        {/* Comic Popups */}
        <div className="floating-popups-layer">
          {popups.map((p) => (
            <div
              key={p.id}
              className="floating-popup boss-comic-popup"
              style={{ left: `${p.x}%`, top: `${p.y}%`, color: p.color }}
            >
              {p.text}
            </div>
          ))}
        </div>

        {/* Particles Layer */}
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

        {/* Player Shield & Hero Vessel */}
        <div
          className={`player-boss-shield ${isInvulnerable ? 'player-invulnerable' : ''}`}
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Invulnerability Bubble */}
          {isInvulnerable && <div className="player-shield-bubble"></div>}

          {/* Hero Celestial Aegis Shield */}
          <div className="hero-shield-vessel">
            <div className="shield-outer-crest">
              <span className="crest-glyph">✦</span>
            </div>
            <div className="shield-core-disc">
              <span className="disc-rune">🛡️</span>
            </div>
          </div>

          {/* Power Bar over player */}
          <div className="player-charge-bar">
            <div
              className={`charge-fill ${powerCharge >= 100 ? 'charge-ready' : ''}`}
              style={{ width: `${powerCharge}%` }}
            ></div>
          </div>

          <div className="player-guide-label">
            {powerCharge >= 100
              ? '⚡ COUNTER-BEAM READY!'
              : `GATHER ORBS (${powerCharge}%)`}
          </div>
        </div>

        {/* Instructions / Ready Modal */}
        {gameStage === 'ready' && (
          <div className="catcher-ready-overlay">
            <div className="ready-modal-card boss-ready-card">
              <div className="ready-portal-icon">👑</div>
              <h2 className="ready-title">FINAL BOSS: ARCH-GUARDIAN IGNIS</h2>
              <p className="ready-instructions">
                <span>Arch-Guardian Ignis guards the <strong>Final Clue</strong> to the Grand Science Vault! Dodge his chaos projectiles, collect glowing <strong>Stellar Orbs</strong> to charge your Celestial Counter-Beam, and defeat him to unlock the final answer-reveal power!</span>
              </p>

              <div className="ready-scoring-rules">
                <div className="rule-item red">
                  <span className="rule-icon">🔥</span>
                  <span>Projectiles: <strong>DODGE!</strong></span>
                </div>
                <div className="rule-item cyan">
                  <span className="rule-icon">✦</span>
                  <span>Energy Orbs: <strong>COLLECT (+25%)</strong></span>
                </div>
                <div className="rule-item gold">
                  <span className="rule-icon">⚡</span>
                  <span>Full Charge: <strong>-25 HP BLAST!</strong></span>
                </div>
              </div>

              <div className="ready-countdown-big">
                {countdownStart > 0 ? countdownStart : 'ENGAGE!'}
              </div>
            </div>
          </div>
        )}

        {/* Defeat / Game Over Modal */}
        {gameStage === 'gameover' && (
          <div className="modal-backdrop gameover-backdrop" role="dialog" aria-modal="true">
            <div className="modal-container ancient-codex results-modal">
              <div className="modal-header">
                <span className="defeat-skull">💀</span>
                <span className="header-eyebrow red">DEFEATED IN THE SANCTUM</span>
                <h2 className="modal-title" style={{ color: '#fca5a5' }}>
                  ARCH-GUARDIAN IGNIS OVERWHELMED YOU
                </h2>
              </div>

              <div className="modal-body custom-scrollbar">
                <p className="defeat-desc">
                  The final guardian&apos;s chaos barrage shattered your defenses! Refocus your hand movements and retaliate with the celestial counter-beam.
                </p>

                <div className="defeat-stats-card">
                  <div>Boss Health Left: <strong>{bossHp} / 100 HP</strong></div>
                  <div>Battle Duration: <strong>{elapsedTime} seconds</strong></div>
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
                    🔄 RETRY BOSS BATTLE
                  </button>
                  <button
                    className="modal-action-btn abandon-btn"
                    onClick={onReturnToHub}
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

        {/* Spectacular Victory Modal (Boss HP = 0) */}
        {gameStage === 'victory' && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-container ancient-codex results-modal champion-results-card">
              <div className="modal-header">
                <span className="victory-crown champion-crown">👑</span>
                <span className="header-eyebrow gold">THE ESCAPE ARENA IS CONQUERED!</span>
                <h2 className="modal-title champion-title">ARENA CHAMPION!</h2>
              </div>

              <div className="modal-body custom-scrollbar">
                <div className="results-total-score-card champion-score-card">
                  <span className="score-label">FINAL VICTORY REWARD</span>
                  <span className="score-big-number champion-number">+{1000 + (lives * 100)} PTS</span>
                  <span className="score-rank-title">
                    🏆 SUPREME GESTURE ESCAPE MASTER 🏆
                  </span>
                </div>

                <div className="results-breakdown-grid">
                  <div className="breakdown-stat-card gold">
                    <span className="b-icon">👑</span>
                    <span className="b-title">Arch-Guardian</span>
                    <span className="b-count">Ignis Vanquished</span>
                    <span className="b-pts">+1,000 PTS</span>
                  </div>

                  <div className="breakdown-stat-card heart">
                    <span className="b-icon">❤️</span>
                    <span className="b-title">Remaining Lives</span>
                    <span className="b-count">{lives}/3 Hearts</span>
                    <span className="b-pts">+{lives * 100} PTS</span>
                  </div>

                  <div className="breakdown-stat-card charm">
                    <span className="b-icon">💎</span>
                    <span className="b-title">Battle Time</span>
                    <span className="b-count">{elapsedTime} Seconds</span>
                    <span className="b-pts">S-RANK</span>
                  </div>
                </div>

                {/* Science Mystery Final Clue Panel */}
                <div className="clue-unlocked-card clue-earned final-clue-card">
                  <div className="clue-card-badge">
                    <span className="clue-badge-icon">👑</span>
                    <span className="clue-badge-label">FINAL CLUE UNLOCKED!</span>
                  </div>

                  <div className="clue-mystery-context">
                    MYSTERY: <strong>{currentMystery?.title || 'THE INVISIBLE FORCE'}</strong>
                  </div>

                  <div className="clue-text-revealed">
                    <p className="clue-quote">
                      "{currentMystery?.finalClue || "The answer describes a push or pull acting upon an object, formalized by Newton's Second Law: F = m · a."}"
                    </p>
                    <div className="clue-action-button-area">
                      {finalClueUnlocked || finalClueClaimedLocal ? (
                        <div className="clue-status-confirmed">
                          ✓ FINAL CLUE UNLOCKED • ANSWER REVEAL POWER ACTIVATED
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-claim-mystery-clue"
                          onClick={() => {
                            sound.playVictoryFanfare()
                            setFinalClueClaimedLocal(true)
                            onUnlockFinalClue?.()
                          }}
                        >
                          🔓 CLAIM FINAL CLUE & ENABLE REVEAL POWER
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="unsealed-treasure-preview">
                  <span className="unsealed-sparkle">✦</span>
                  <span className="unsealed-text">
                    <strong>THE ANCIENT RELIC CHEST IS FULLY UNSEALED!</strong> Return to the Portal Hub to claim your eternal triumph!
                  </span>
                  <span className="unsealed-sparkle">✦</span>
                </div>
              </div>

              <div className="modal-footer">
                <div className="results-actions-row">
                  <button
                    className="modal-action-btn retry-btn"
                    onClick={handleRetry}
                    data-selectable="true"
                    role="button"
                  >
                    🔄 RE-PLAY BOSS
                  </button>

                  <button
                    className="modal-action-btn victory-btn"
                    onClick={handleClaimFinalReward}
                    data-selectable="true"
                    role="button"
                  >
                    👑 RETURN TO SOLVE THE MYSTERY
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Docked Webcam Sensor Preview HUD */}
      {isVisionHUDOpen && (
        <aside className="vision-hud-dock" aria-label="Webcam Hand Tracking HUD">
          <WebcamPreview onHandsDetectedChange={setHandsDetected} />
        </aside>
      )}

      {/* Bottom Status Footer */}
      <footer className="arena-footer boss-footer">
        <div className="footer-left">
          <span className={`status-indicator ${isHandActive ? 'tracking' : ''}`}></span>
          <span>
            {isHandActive
              ? `HAND SENSORS TRACKING • STEERING SHIELD`
              : 'HAND NOT DETECTED • MOUSE CONTROL ACTIVE'}
          </span>
        </div>
        <div className="footer-center">
          <span>
            {bossHp <= 25
              ? '⚡ FRENZY OVERDRIVE! IGNIS IS UNLEASHING RAPID CHAOS!'
              : '✨ DODGE PROJECTILES • GATHER ORBS FOR THE CELESTIAL COUNTER-BEAM'}
          </span>
        </div>
        <div className="footer-right">
          <span>FINAL BOSS ESCAPE • EXPO 2026</span>
        </div>
      </footer>
    </div>
  )
}
