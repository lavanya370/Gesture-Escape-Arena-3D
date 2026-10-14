import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useGame } from '../context/GameContext'
import { sound } from '../utils/audio'
import { ParticleCanvas } from './ParticleCanvas'
import { CameraStatusBadge } from './CameraStatusBadge'
import { gestureDetector } from '../vision/gestureDetector'

interface GateOption {
  id: 'gate-a' | 'gate-b'
  label: string
  operation: string
  calcResult: (n: number) => number
  isCorrect: boolean
  color: 'green' | 'red'
  explanation: string
}

interface NumberChallenge {
  stageNumber: number
  startNumber: number
  targetNumber: number
  gates: [GateOption, GateOption]
}

const CHALLENGES: NumberChallenge[] = [
  {
    stageNumber: 1,
    startNumber: 4,
    targetNumber: 9,
    gates: [
      {
        id: 'gate-a',
        label: 'GATE A',
        operation: '+5',
        calcResult: (n) => n + 5,
        isCorrect: true,
        color: 'green',
        explanation: '4 + 5 = 9! Exact match for target 9!',
      },
      {
        id: 'gate-b',
        label: 'GATE B',
        operation: '-2',
        calcResult: (n) => n - 2,
        isCorrect: false,
        color: 'red',
        explanation: '4 - 2 = 2. But we need 9 to unlock the barrier!',
      },
    ],
  },
  {
    stageNumber: 2,
    startNumber: 7,
    targetNumber: 14,
    gates: [
      {
        id: 'gate-a',
        label: 'GATE A',
        operation: '+4',
        calcResult: (n) => n + 4,
        isCorrect: false,
        color: 'red',
        explanation: '7 + 4 = 11. That misses our target 14!',
      },
      {
        id: 'gate-b',
        label: 'GATE B',
        operation: '×2',
        calcResult: (n) => n * 2,
        isCorrect: true,
        color: 'green',
        explanation: '7 × 2 = 14! Double power breaks the barrier!',
      },
    ],
  },
  {
    stageNumber: 3,
    startNumber: 10,
    targetNumber: 13,
    gates: [
      {
        id: 'gate-a',
        label: 'GATE A',
        operation: '+3',
        calcResult: (n) => n + 3,
        isCorrect: true,
        color: 'green',
        explanation: '10 + 3 = 13! Perfect calculation to clear the gate!',
      },
      {
        id: 'gate-b',
        label: 'GATE B',
        operation: '-4',
        calcResult: (n) => n - 4,
        isCorrect: false,
        color: 'red',
        explanation: '10 - 4 = 6. Way too small to unlock the gate!',
      },
    ],
  },
]

export const NumberGateChallenge: React.FC = () => {
  const { setCurrentView, completeNumberGate, claimHint, hints } = useGame()

  const [currentChallengeIndex, setCurrentChallengeIndex] = useState<number>(0)
  const [currentNumber, setCurrentNumber] = useState<number>(CHALLENGES[0].startNumber)
  const [secondsLeft, setSecondsLeft] = useState<number>(15)
  const [isDashing, setIsDashing] = useState<boolean>(false)
  const [chosenGateId, setChosenGateId] = useState<'gate-a' | 'gate-b' | null>(null)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'success' | 'fail' | 'victory'>('idle')
  const [failExplanation, setFailExplanation] = useState<string>('')
  const [claimedLocal, setClaimedLocal] = useState<boolean>(hints.hint2.claimed)

  // Hand position tracking state
  const [handX, setHandX] = useState<number>(0.5)
  const [isHandActive, setIsHandActive] = useState<boolean>(false)
  const [isPinching, setIsPinching] = useState<boolean>(false)
  const [targetedGate, setTargetedGate] = useState<'gate-a' | 'gate-b' | null>(null)

  const activeChallenge = CHALLENGES[currentChallengeIndex]
  const isLastChallenge = currentChallengeIndex >= CHALLENGES.length - 1

  // Keep ref for active challenge to prevent stale closure in callbacks
  const activeChallengeRef = useRef(activeChallenge)
  useEffect(() => {
    activeChallengeRef.current = activeChallenge
  }, [activeChallenge])

  const isDashingRef = useRef(isDashing)
  useEffect(() => {
    isDashingRef.current = isDashing
  }, [isDashing])

  const feedbackStateRef = useRef(feedbackState)
  useEffect(() => {
    feedbackStateRef.current = feedbackState
  }, [feedbackState])

  // 15-Second Match Countdown Timer
  useEffect(() => {
    if (feedbackState === 'victory' || feedbackState === 'fail') return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          sound.playErrorFizzle()
          setFeedbackState('fail')
          setFailExplanation('Time expired! You must clear all 3 Math Gates within 15 seconds.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [feedbackState])

  const handleSelectGate = useCallback(
    (gate: GateOption) => {
      if (isDashingRef.current || feedbackStateRef.current === 'fail' || feedbackStateRef.current === 'victory') return

      setIsDashing(true)
      setChosenGateId(gate.id)

      if (gate.isCorrect) {
        sound.playHover()
        setTimeout(() => {
          const nextVal = gate.calcResult(currentNumber)
          setCurrentNumber(nextVal)
          sound.playPortalUnlock()
          setFeedbackState('success')

          setTimeout(() => {
            if (isLastChallenge) {
              setFeedbackState('victory')
              sound.playVictoryFanfare()
              completeNumberGate()
            } else {
              setCurrentChallengeIndex((prev) => {
                const nextIdx = prev + 1
                setCurrentNumber(CHALLENGES[nextIdx].startNumber)
                return nextIdx
              })
              setFeedbackState('idle')
              setIsDashing(false)
              setChosenGateId(null)
            }
          }, 1100)
        }, 600)
      } else {
        sound.playErrorFizzle()
        setTimeout(() => {
          setFailExplanation(gate.explanation)
          setFeedbackState('fail')
          setIsDashing(false)
        }, 500)
      }
    },
    [currentNumber, isLastChallenge, completeNumberGate]
  )

  // Hand position subscription and gate selection trigger
  const gateSelectCooldownRef = useRef<number>(0)
  const zoneDwellTimerRef = useRef<{ gateId: 'gate-a' | 'gate-b'; startTime: number } | null>(null)
  const pinchLockRef = useRef<boolean>(false)

  useEffect(() => {
    const unsub = gestureDetector.subscribe((data) => {
      setIsHandActive(data.handDetected)
      setIsPinching(data.isPinching)

      if (!data.handDetected) {
        setTargetedGate(null)
        zoneDwellTimerRef.current = null
        return
      }

      // Normalized hand X position (0 = left edge, 1 = right edge)
      const normX = Math.max(
        0,
        Math.min(1, data.cursorX / (typeof window !== 'undefined' ? window.innerWidth : 1280))
      )
      setHandX(normX)

      if (isDashingRef.current || feedbackStateRef.current !== 'idle') {
        zoneDwellTimerRef.current = null
        return
      }

      const now = performance.now()
      if (now < gateSelectCooldownRef.current) return

      // Determine which gate is targeted based on hand horizontal position
      let currentTarget: 'gate-a' | 'gate-b' | null = null
      if (normX <= 0.42) {
        currentTarget = 'gate-a'
      } else if (normX >= 0.58) {
        currentTarget = 'gate-b'
      }
      setTargetedGate(currentTarget)

      // Deliberate pinch gesture confirmation: Pinch index & thumb to select targeted gate
      if (!data.isPinching) {
        pinchLockRef.current = false
      }

      if (data.isPinching && currentTarget && !pinchLockRef.current) {
        pinchLockRef.current = true
        gateSelectCooldownRef.current = now + 1400
        const chosen =
          currentTarget === 'gate-a'
            ? activeChallengeRef.current.gates[0]
            : activeChallengeRef.current.gates[1]
        handleSelectGate(chosen)
        return
      }

      // Interaction zone crossing & dwell threshold (deep reach or dwelling for > 380ms)
      if (currentTarget) {
        const isDeepCrossing =
          (currentTarget === 'gate-a' && normX <= 0.18) ||
          (currentTarget === 'gate-b' && normX >= 0.82)

        if (!zoneDwellTimerRef.current || zoneDwellTimerRef.current.gateId !== currentTarget) {
          zoneDwellTimerRef.current = { gateId: currentTarget, startTime: now }
        }

        const dwellDuration = now - zoneDwellTimerRef.current.startTime

        if (isDeepCrossing || dwellDuration >= 380) {
          gateSelectCooldownRef.current = now + 1400
          zoneDwellTimerRef.current = null
          const chosen =
            currentTarget === 'gate-a'
              ? activeChallengeRef.current.gates[0]
              : activeChallengeRef.current.gates[1]
          handleSelectGate(chosen)
        }
      } else {
        zoneDwellTimerRef.current = null
      }
    })

    return () => unsub()
  }, [handleSelectGate])

  const handleRetryChallenge = useCallback(() => {
    sound.playHover()
    setIsDashing(false)
    setChosenGateId(null)
    setFeedbackState('idle')
    setFailExplanation('')
    setCurrentChallengeIndex(0)
    setSecondsLeft(15)
    setCurrentNumber(CHALLENGES[0].startNumber)
  }, [])

  const handleClaimHint2 = () => {
    sound.playChestBell()
    claimHint('hint2')
    setClaimedLocal(true)
  }

  // Keyboard navigation fallback (1 / 2, Left / Right)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (feedbackState === 'fail') {
        if (e.key === 'r' || e.key === 'R' || e.key === 'Enter' || e.key === ' ') {
          handleRetryChallenge()
        }
        return
      }
      if (feedbackState === 'victory') return

      const challenge = activeChallengeRef.current
      if (e.key === '1' || e.key === 'ArrowLeft') {
        handleSelectGate(challenge.gates[0])
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        handleSelectGate(challenge.gates[1])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [feedbackState, handleSelectGate, handleRetryChallenge])

  return (
    <div className="number-gate-container">
      {/* Dynamic Cyber Aqua Backdrop */}
      <div className="number-gate-bg-grid"></div>
      <ParticleCanvas />

      {/* Floating Math Symbols */}
      <div className="floating-math-symbols" aria-hidden="true">
        <span className="math-sym sym-1">+</span>
        <span className="math-sym sym-2">×</span>
        <span className="math-sym sym-3">÷</span>
        <span className="math-sym sym-4">=</span>
        <span className="math-sym sym-5">%</span>
        <span className="math-sym sym-6">√</span>
        <span className="math-sym sym-7">+5</span>
        <span className="math-sym sym-8">×2</span>
      </div>

      {/* Header Bar */}
      <header className="number-gate-header">
        <div className="ng-header-left">
          <button
            type="button"
            className="ng-back-btn"
            onClick={() => setCurrentView('riddle-realm')}
            data-selectable="true"
          >
            ← RETURN TO RIDDLE REALM
          </button>
        </div>

        <div className="ng-header-center">
          <span className="ng-badge">HINT 2 MINI-GAME</span>
          <h1 className="ng-title">NUMBER GATE CHALLENGE</h1>
          <span className="ng-subtitle">Steer Stickman through 3 Math Gates in 15 seconds!</span>
        </div>

        <div className="ng-header-right">
          <CameraStatusBadge />
        </div>
      </header>

      {/* Main Track & Challenge Stage */}
      <main className="number-gate-stage">
        {/* Progress & Target HUD */}
        <div className="ng-hud-strip">
          <div className="ng-hud-item">
            <span className="hud-label">CHALLENGE</span>
            <span className="hud-val highlight">
              {currentChallengeIndex + 1} / {CHALLENGES.length}
            </span>
          </div>

          <div className="ng-hud-item timer-hud-item">
            <span className="hud-label">TIME LIMIT</span>
            <span
              className="hud-val highlight"
              style={{
                color: secondsLeft <= 5 ? '#ef4444' : '#38bdf8',
                fontWeight: 800,
              }}
            >
              ⏱️ 00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </span>
          </div>

          <div className="ng-hud-item">
            <span className="hud-label">CURRENT NUMBER</span>
            <span className="hud-val current-num">{currentNumber}</span>
          </div>

          <div className="ng-hud-divider">➔</div>

          <div className="ng-hud-item">
            <span className="hud-label">TARGET NUMBER</span>
            <span className="hud-val target-num">{activeChallenge.targetNumber}</span>
          </div>
        </div>

        {/* 3D Perspective Runway Stage */}
        <div className="ng-runway-arena">
          {/* Live Hand Gesture Guide HUD */}
          <div className="ng-body-lean-hud">
            <span className={`lean-zone-label left-zone ${targetedGate === 'gate-a' ? 'active' : ''}`}>
              ◀ GATE A (HAND LEFT)
            </span>
            <div className="lean-zone-track">
              <div className="lean-zone-center-mark" title="Center Runway"></div>
              <div
                className={`lean-zone-cursor ${isPinching ? 'arms-up' : ''} ${
                  isHandActive ? 'active' : 'inactive'
                }`}
                style={{ left: `${handX * 100}%` }}
                title={`Hand Position: ${Math.round(handX * 100)}%`}
              >
                <span className="cursor-icon">{isPinching ? '🤏' : '🖐️'}</span>
              </div>
            </div>
            <span className={`lean-zone-label right-zone ${targetedGate === 'gate-b' ? 'active' : ''}`}>
              (HAND RIGHT) GATE B ▶
            </span>
          </div>

          {/* Distant Cyber Horizon */}
          <div className="runway-horizon">
            <div className="horizon-glow"></div>
            <div className="target-beacon">
              <span className="beacon-icon">🎯 TARGET: {activeChallenge.targetNumber}</span>
            </div>
          </div>

          {/* The Gates Row */}
          <div className="runway-gates-row">
            {activeChallenge.gates.map((gate, idx) => {
              const isSelected = chosenGateId === gate.id
              const isGreen = gate.color === 'green'
              const isTargeted = targetedGate === gate.id

              return (
                <button
                  key={gate.id}
                  type="button"
                  className={`gate-arch-card ${gate.color} ${isSelected ? 'selected' : ''} ${
                    isTargeted ? 'body-targeted' : ''
                  } ${feedbackState === 'success' && isSelected ? 'gate-glow-success' : ''}`}
                  onClick={() => handleSelectGate(gate)}
                  data-selectable="true"
                  aria-label={`${gate.label}: ${gate.operation}`}
                  disabled={isDashing || feedbackState === 'victory'}
                >
                  <div className="gate-arch-top">
                    <span className="gate-num-key">[{idx + 1}]</span>
                    <span className="gate-label-badge">{gate.label}</span>
                    {isTargeted && !isSelected && (
                      <span className="gate-body-targeted-tag">
                        {isPinching ? '🤏 PINCHED!' : '🎯 PINCH TO CHOOSE'}
                      </span>
                    )}
                  </div>

                  <div className="gate-portal-face">
                    <div className="gate-energy-swirl"></div>
                    <span className="gate-op-text">{gate.operation}</span>
                    <span className="gate-preview-text">
                      {currentNumber} {gate.operation} = {gate.calcResult(currentNumber)}
                    </span>
                  </div>

                  <div className="gate-arch-bottom">
                    <span className="gate-action-prompt">
                      {isGreen ? '▲ ADVANCE' : '▼ CAUTION'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Stickman Track & Character */}
          <div className="runway-track">
            <div className="track-lines"></div>

            {/* Blue Stickman Character Positioned Horizontally by Hand Position */}
            <div
              className={`blue-stickman-runner ${isDashing ? 'dashing' : 'running'} ${
                feedbackState === 'fail' ? 'bonked' : ''
              } ${feedbackState === 'success' ? 'cheering' : ''} ${
                chosenGateId === 'gate-a' ? 'dash-left' : chosenGateId === 'gate-b' ? 'dash-right' : ''
              }`}
              style={{
                position: 'absolute',
                left: isDashing
                  ? chosenGateId === 'gate-a'
                    ? '25%'
                    : '75%'
                  : `${16 + handX * 68}%`,
                transform: 'translateX(-50%)',
                transition: isDashing
                  ? 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : 'left 0.05s ease-out',
              }}
            >
              {/* Floating Question Mark / Thought Bubble */}
              <div className="stickman-thought">
                <span className="thought-icon">{isPinching ? '🤏' : '❓'}</span>
                <span className="thought-bubble-text">
                  {isPinching
                    ? 'PINCHING!'
                    : targetedGate
                    ? `Steering to ${targetedGate === 'gate-a' ? 'Gate A' : 'Gate B'}!`
                    : `Need ${activeChallenge.targetNumber}!`}
                </span>
              </div>

              {/* Blue Stickman SVG Avatar */}
              <svg viewBox="0 0 100 120" className="stickman-svg" aria-label="Blue Stickman Character">
                {/* Stickman Head */}
                <circle cx="50" cy="24" r="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="3" />
                {/* Expressive Eyes */}
                {feedbackState === 'fail' ? (
                  <>
                    <text x="42" y="28" fill="#fff" fontSize="12" fontWeight="bold">✕</text>
                    <text x="52" y="28" fill="#fff" fontSize="12" fontWeight="bold">✕</text>
                  </>
                ) : (
                  <>
                    <circle cx="45" cy="23" r="2.5" fill="#ffffff" />
                    <circle cx="55" cy="23" r="2.5" fill="#ffffff" />
                  </>
                )}

                {/* Torso */}
                <line x1="50" y1="38" x2="50" y2="76" stroke="#0284c7" strokeWidth="6" strokeLinecap="round" />

                {/* Left Arm */}
                <line
                  x1="50"
                  y1="48"
                  x2={isDashing ? '25' : isPinching ? '26' : '30'}
                  y2={isDashing ? '40' : isPinching ? '45' : '62'}
                  stroke="#38bdf8"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="stickman-arm-left"
                />

                {/* Right Arm */}
                <line
                  x1="50"
                  y1="48"
                  x2={isDashing ? '75' : isPinching ? '74' : '70'}
                  y2={isDashing ? '38' : isPinching ? '45' : '62'}
                  stroke="#38bdf8"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="stickman-arm-right"
                />

                {/* Left Leg */}
                <line
                  x1="50"
                  y1="76"
                  x2={isDashing ? '32' : '36'}
                  y2={isDashing ? '106' : '108'}
                  stroke="#0284c7"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="stickman-leg-left"
                />

                {/* Right Leg */}
                <line
                  x1="50"
                  y1="76"
                  x2={isDashing ? '68' : '64'}
                  y2={isDashing ? '98' : '108'}
                  stroke="#0284c7"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="stickman-leg-right"
                />
              </svg>

              {/* Shadow underneath */}
              <div className="stickman-shadow"></div>
            </div>
          </div>
        </div>

        {/* Controls Instructions Footer */}
        <div className="ng-controls-bar">
          <div className="control-tip">
            <span className="tip-badge">🖐️ HAND GESTURES</span>
            <span>Move Hand Left / Right to Steer • Pinch to Select Gate</span>
          </div>
          <div className="control-tip">
            <span className="tip-badge">🖱️ MOUSE / TOUCH</span>
            <span>Click or Tap directly on Gate A or Gate B</span>
          </div>
          <div className="control-tip">
            <span className="tip-badge">⌨️ KEYS</span>
            <span>Press [1] or [←] for Gate A • [2] or [→] for Gate B</span>
          </div>
        </div>
      </main>

      {/* Failure Reaction Modal */}
      {feedbackState === 'fail' && (
        <div className="ng-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ng-fail-card">
            <div className="fail-header-icon">💥</div>
            <h2 className="fail-title">OUCH! WRONG NUMBER GATE!</h2>
            <p className="fail-desc">{failExplanation}</p>
            <div className="fail-hint">
              Don't worry! Stickman is tough. Choose the calculation that equals the target!
            </div>
            <div className="fail-actions">
              <button
                type="button"
                className="ng-retry-btn"
                onClick={handleRetryChallenge}
                data-selectable="true"
              >
                🔄 TRY AGAIN (PRESS ENTER / PINCH)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {feedbackState === 'victory' && (
        <div className="ng-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ng-victory-card">
            <div className="victory-crown">👑</div>
            <span className="victory-banner">NUMBER MASTER!</span>
            <h2 className="victory-title">ALL THREE CHALLENGES COMPLETED!</h2>
            <p className="victory-desc">
              Your mathematical agility steered the stickman through every single barrier!
            </p>

            <div className="victory-hint-box">
              <span className="hint-unlock-tag">🔓 HINT 2 UNLOCKED!</span>
              <p className="hint-teaser">
                {claimedLocal
                  ? `"${hints.hint2.text}"`
                  : 'Detective secret clue is now UNLOCKED! Claim your hint below.'}
              </p>
            </div>

            <div className="victory-actions">
              {!claimedLocal ? (
                <button
                  type="button"
                  className="ng-claim-btn"
                  onClick={handleClaimHint2}
                  data-selectable="true"
                >
                  ✨ CLAIM HINT 2 NOW
                </button>
              ) : (
                <div className="hint-claimed-badge">✓ HINT 2 CLAIMED & SAVED</div>
              )}

              <button
                type="button"
                className="ng-return-btn"
                onClick={() => setCurrentView('riddle-realm')}
                data-selectable="true"
              >
                🏰 RETURN TO RIDDLE REALM →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
