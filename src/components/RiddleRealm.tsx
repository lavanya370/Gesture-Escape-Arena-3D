import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useGame } from '../context/GameContext'
import { useCamera } from '../context/CameraContext'
import { sound } from '../utils/audio'
import { ParticleCanvas } from './ParticleCanvas'
import { CameraStatusBadge } from './CameraStatusBadge'
import { gestureDetector } from '../vision/gestureDetector'
import cryptBg from '../assets/crypt-bg.jpg'
import { getFunDareForRiddle, type FunDare } from '../data/funDares'
import { verifyDareAction, resetActionMotionHistory } from '../vision/handActionVerifier'

// Pure lightweight canvas celebration party-popper effect
const ConfettiBurst: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth || 500
    canvas.height = canvas.offsetHeight || 400

    const colors = [
      '#f59e0b', // Gold
      '#facc15', // Bright Amber
      '#06b6d4', // Cyan
      '#38bdf8', // Sky Blue
      '#a855f7', // Purple
      '#ec4899', // Pink
      '#ffffff', // White sparkle
    ]

    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      rotation: number
      vRot: number
      shape: 'rect' | 'circle' | 'star'
      life: number
    }[] = []

    const centerX = canvas.width / 2
    const centerY = canvas.height * 0.32

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 9
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 14,
        shape: Math.random() > 0.65 ? 'star' : Math.random() > 0.35 ? 'rect' : 'circle',
        life: 1.0,
      })
    }

    let animId: number
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let active = false

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.18 // gravity
        p.vx *= 0.985 // drag
        p.rotation += p.vRot
        p.life -= 0.007

        if (p.life > 0) {
          active = true
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate((p.rotation * Math.PI) / 180)
          ctx.globalAlpha = Math.max(0, p.life)
          ctx.fillStyle = p.color

          if (p.shape === 'circle') {
            ctx.beginPath()
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7)
          } else {
            // 5-point Star
            ctx.beginPath()
            for (let s = 0; s < 5; s++) {
              ctx.lineTo(
                Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size,
                -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size
              )
              ctx.lineTo(
                Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size / 2),
                -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size / 2)
              )
            }
            ctx.closePath()
            ctx.fill()
          }
          ctx.restore()
        }
      })

      if (active) {
        animId = requestAnimationFrame(render)
      }
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [])

  return <canvas ref={canvasRef} className="celebration-confetti-canvas" />
}

export const RiddleRealm: React.FC = () => {
  const {
    riddle,
    isOptionsRevealed,
    submitAnswer,
    isCompleted,
    totalScore,
    resetGameProgress,
    startNewRiddleSession,
    returnToStartMenu,
    setCurrentView,
    recordDareCompleted,
  } = useGame()

  const { status: cameraStatus, startCamera } = useCamera()

  // Auto-initiate camera if idle
  useEffect(() => {
    if (cameraStatus === 'idle') {
      startCamera().catch(() => {})
    }
  }, [cameraStatus, startCamera])

  // Answer selection, input, feedback, and reset states
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answerInput, setAnswerInput] = useState<string>('')
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false)

  // Celebration & Fun Dare states
  const [celebrationActive, setCelebrationActive] = useState<boolean>(isCompleted)
  const [isFunDareActive, setIsFunDareActive] = useState<boolean>(false)
  const [isDareCompleted, setIsDareCompleted] = useState<boolean>(false)
  const [dareHoldProgress, setDareHoldProgress] = useState<number>(0)
  const [dareRetryMsg, setDareRetryMsg] = useState<string>('')
  const [dareFeedbackText, setDareFeedbackText] = useState<string>('')
  const detectedFramesRef = useRef<number>(0)
  const TARGET_DARE_FRAMES = 12 // ~0.4s of consistent hand action in front of webcam

  // Predefined unique Fun Dare for the current riddle
  const currentDare: FunDare = useMemo(() => getFunDareForRiddle(riddle.id), [riddle.id])
  const currentDareRef = useRef<FunDare>(currentDare)
  useEffect(() => {
    currentDareRef.current = currentDare
  }, [currentDare])

  // Hand position tracking & 2D hit test refs for 4 answer cards and action buttons
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null)
  const [isHandActive, setIsHandActive] = useState<boolean>(false)
  const [isPinching, setIsPinching] = useState<boolean>(false)
  const [isVictoryBtnHovered, setIsVictoryBtnHovered] = useState<boolean>(false)

  const cardRef0 = useRef<HTMLButtonElement | null>(null)
  const cardRef1 = useRef<HTMLButtonElement | null>(null)
  const cardRef2 = useRef<HTMLButtonElement | null>(null)
  const cardRef3 = useRef<HTMLButtonElement | null>(null)
  const victoryBtnRef = useRef<HTMLButtonElement | null>(null)
  const dareRetryBtnRef = useRef<HTMLButtonElement | null>(null)
  const dareReturnBtnRef = useRef<HTMLButtonElement | null>(null)
  const playChallengeBtnRef = useRef<HTMLButtonElement | null>(null)

  // Keep refs for event listeners
  const optionsRef = useRef(riddle.options)
  useEffect(() => {
    optionsRef.current = riddle.options
  }, [riddle.options])

  const isOptionsRevealedRef = useRef(isOptionsRevealed)
  useEffect(() => {
    isOptionsRevealedRef.current = isOptionsRevealed
  }, [isOptionsRevealed])

  const isCompletedRef = useRef(isCompleted)
  useEffect(() => {
    isCompletedRef.current = isCompleted
  }, [isCompleted])

  const celebrationActiveRef = useRef(celebrationActive)
  useEffect(() => {
    celebrationActiveRef.current = celebrationActive
  }, [celebrationActive])

  const isFunDareActiveRef = useRef(isFunDareActive)
  useEffect(() => {
    isFunDareActiveRef.current = isFunDareActive
  }, [isFunDareActive])

  const isDareCompletedRef = useRef(isDareCompleted)
  useEffect(() => {
    isDareCompletedRef.current = isDareCompleted
  }, [isDareCompleted])

  // Dedup guard to prevent duplicate rapid submissions
  const lastChoiceTimeRef = useRef<{ choice: string; time: number }>({ choice: '', time: 0 })

  // Handle selecting / submitting an option
  const handleOptionChosen = useCallback(
    (chosen: string) => {
      if (isCompletedRef.current) return

      const now = Date.now()
      if (
        lastChoiceTimeRef.current.choice === chosen &&
        now - lastChoiceTimeRef.current.time < 450
      ) {
        return // Ignore rapid duplicate call
      }
      lastChoiceTimeRef.current = { choice: chosen, time: now }

      sound.playHover()
      setSelectedOption(chosen)
      setAnswerInput(chosen)

      const result = submitAnswer(chosen)

      if (result.isCorrect) {
        sound.playCorrectRiddle()
        sound.playLevelComplete()
        setCelebrationActive(true)
        setIsFunDareActive(false)
        setIsDareCompleted(false)
        setDareHoldProgress(0)
      } else {
        sound.playWrongAnswer()
        sound.playGuardianDareAlert()
        resetActionMotionHistory()
        detectedFramesRef.current = 0
        setDareHoldProgress(0)
        setDareRetryMsg('')
        setDareFeedbackText('')
        setIsFunDareActive(true)
        setIsDareCompleted(false)
        setCelebrationActive(false)
      }
    },
    [submitAnswer]
  )

  // Submit Answer validation handler from input form
  const handleSubmitInput = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      if (isCompleted || !isOptionsRevealed) return

      const finalGuess = (answerInput.trim() || selectedOption || '').trim()
      if (!finalGuess) return

      handleOptionChosen(finalGuess)
    },
    [answerInput, selectedOption, isCompleted, isOptionsRevealed, handleOptionChosen]
  )

  // Retry action dare if not detected or player wants another attempt
  const handleRetryDareAction = useCallback(() => {
    sound.playHover()
    resetActionMotionHistory()
    detectedFramesRef.current = 0
    setDareHoldProgress(0)
    setDareRetryMsg('Pose reset. Perform the required action in front of the camera!')
  }, [])

  // Return to the SAME riddle with question and answer options visible
  const handleReturnToRiddleAfterDare = useCallback(() => {
    sound.playStartSpell()
    resetActionMotionHistory()
    detectedFramesRef.current = 0
    setDareHoldProgress(0)
    setDareRetryMsg('')
    setDareFeedbackText('')
    setIsFunDareActive(false)
    setIsDareCompleted(false)
    setAnswerInput('')
    setSelectedOption(null)
  }, [])

  // Return to Start Screen cleanly resetting temporary session state
  const handleBackToStartMenu = useCallback(() => {
    sound.playHover()
    resetActionMotionHistory()
    detectedFramesRef.current = 0
    setDareHoldProgress(0)
    setDareRetryMsg('')
    setDareFeedbackText('')
    setSelectedOption(null)
    setAnswerInput('')
    setCelebrationActive(false)
    setIsFunDareActive(false)
    setIsDareCompleted(false)
    setShowResetConfirm(false)
    returnToStartMenu()
  }, [returnToStartMenu])

  const handleExitToStart = handleBackToStartMenu

  // Start fresh case
  const handleStartNewCase = useCallback(() => {
    sound.playStartSpell()
    resetActionMotionHistory()
    detectedFramesRef.current = 0
    setDareHoldProgress(0)
    setDareRetryMsg('')
    setDareFeedbackText('')
    startNewRiddleSession()
    setSelectedOption(null)
    setAnswerInput('')
    setCelebrationActive(false)
    setIsFunDareActive(false)
    setIsDareCompleted(false)
    setShowResetConfirm(false)
  }, [startNewRiddleSession])

  // Restart case
  const handleResetCase = useCallback(() => {
    sound.playStartSpell()
    resetActionMotionHistory()
    detectedFramesRef.current = 0
    setDareHoldProgress(0)
    setDareRetryMsg('')
    setDareFeedbackText('')
    resetGameProgress()
    setSelectedOption(null)
    setAnswerInput('')
    setCelebrationActive(false)
    setIsFunDareActive(false)
    setIsDareCompleted(false)
    setShowResetConfirm(false)
  }, [resetGameProgress])

  // Open Magic Coin Catcher to unlock the riddle answer options
  const handleEnterCoinCatcher = useCallback(() => {
    sound.playStartSpell()
    setCurrentView('coin-catcher')
  }, [setCurrentView])

  // Latch to strictly require release before allowing another pinch action
  const pinchLockRef = useRef<boolean>(false)
  const prevFocusedOptionIndexRef = useRef<number | null>(null)

  // Re-arm latch whenever modal or screen views transition to prevent held pinch bleed-through
  useEffect(() => {
    pinchLockRef.current = true
  }, [celebrationActive, isFunDareActive, isOptionsRevealed])

  // 2D Spatial Hand Gesture Tracking over cards and active modal buttons
  useEffect(() => {
    const unsub = gestureDetector.subscribe((data) => {
      // If hand is not detected, clear focus and return immediately to prevent stale interactions
      if (!data.handDetected) {
        setIsHandActive(false)
        setIsPinching(false)
        if (prevFocusedOptionIndexRef.current !== null) {
          prevFocusedOptionIndexRef.current = null
          setFocusedOptionIndex(null)
        }
        return
      }

      setIsHandActive(true)
      setIsPinching(data.isPinching)

      // Reset pinch lock once user physically releases their fingers
      if (!data.isPinching) {
        pinchLockRef.current = false
      }

      // 1. Victory Celebration Screen interaction
      if (celebrationActiveRef.current) {
        if (prevFocusedOptionIndexRef.current !== null) {
          prevFocusedOptionIndexRef.current = null
          setFocusedOptionIndex(null)
        }
        const btn = victoryBtnRef.current
        if (btn) {
          const rect = btn.getBoundingClientRect()
          const isOver =
            data.cursorX >= rect.left - 12 &&
            data.cursorX <= rect.right + 12 &&
            data.cursorY >= rect.top - 12 &&
            data.cursorY <= rect.bottom + 12
          setIsVictoryBtnHovered(isOver)

          if (isOver && data.isPinching && !pinchLockRef.current) {
            pinchLockRef.current = true
            handleBackToStartMenu()
          }
        }
        return
      }
      setIsVictoryBtnHovered(false)

      // 2. Fun Dare Screen interaction & Camera Verification
      if (isFunDareActiveRef.current) {
        if (prevFocusedOptionIndexRef.current !== null) {
          prevFocusedOptionIndexRef.current = null
          setFocusedOptionIndex(null)
        }

        if (isDareCompletedRef.current) {
          const returnBtn = dareReturnBtnRef.current
          if (returnBtn) {
            const rect = returnBtn.getBoundingClientRect()
            if (
              data.cursorX >= rect.left - 12 &&
              data.cursorX <= rect.right + 12 &&
              data.cursorY >= rect.top - 12 &&
              data.cursorY <= rect.bottom + 12
            ) {
              if (data.isPinching && !pinchLockRef.current) {
                pinchLockRef.current = true
                handleReturnToRiddleAfterDare()
              }
            }
          }
          return
        }

        // Camera Action Verification for Fun Dare
        if (data.landmarksList && data.landmarksList.length > 0) {
          const dareAction = currentDareRef.current.actionType
          const verification = verifyDareAction(dareAction, data.landmarksList)
          if (verification.isMatch) {
            setDareRetryMsg('')
            setDareFeedbackText(verification.feedbackTip)
            detectedFramesRef.current = Math.min(TARGET_DARE_FRAMES, detectedFramesRef.current + 1)
            const progress = Math.min(100, Math.round((detectedFramesRef.current / TARGET_DARE_FRAMES) * 100))
            setDareHoldProgress(progress)

            if (detectedFramesRef.current >= TARGET_DARE_FRAMES) {
              detectedFramesRef.current = 0
              sound.playVictoryFanfare()
              recordDareCompleted(riddle.id)
              setIsDareCompleted(true)
              setDareHoldProgress(100)
              resetActionMotionHistory()
            }
          } else {
            setDareFeedbackText(verification.feedbackTip)
            if (detectedFramesRef.current > 0) {
              detectedFramesRef.current = Math.max(0, detectedFramesRef.current - 1)
              const progress = Math.min(100, Math.round((detectedFramesRef.current / TARGET_DARE_FRAMES) * 100))
              setDareHoldProgress(progress)
            }
            setDareRetryMsg(`Action not detected yet: ${verification.feedbackTip} Keep trying!`)
          }
        } else {
          setDareFeedbackText('Hold your hand up in front of the camera!')
          if (detectedFramesRef.current > 0) {
            detectedFramesRef.current = Math.max(0, detectedFramesRef.current - 1)
            const progress = Math.min(100, Math.round((detectedFramesRef.current / TARGET_DARE_FRAMES) * 100))
            setDareHoldProgress(progress)
          }
          setDareRetryMsg('No hand detected by camera yet. Position your hand in front of the lens and retry!')
        }

        const retryBtn = dareRetryBtnRef.current
        if (retryBtn) {
          const rect = retryBtn.getBoundingClientRect()
          if (
            data.cursorX >= rect.left - 12 &&
            data.cursorX <= rect.right + 12 &&
            data.cursorY >= rect.top - 12 &&
            data.cursorY <= rect.bottom + 12
          ) {
            if (data.isPinching && !pinchLockRef.current) {
              pinchLockRef.current = true
              handleRetryDareAction()
            }
          }
        }
        return
      }

      // 3. Locked Challenge Card interaction (before options are revealed)
      if (!isOptionsRevealedRef.current && !isCompletedRef.current) {
        if (prevFocusedOptionIndexRef.current !== null) {
          prevFocusedOptionIndexRef.current = null
          setFocusedOptionIndex(null)
        }
        const playBtn = playChallengeBtnRef.current
        if (playBtn) {
          const rect = playBtn.getBoundingClientRect()
          const isOver =
            data.cursorX >= rect.left - 12 &&
            data.cursorX <= rect.right + 12 &&
            data.cursorY >= rect.top - 12 &&
            data.cursorY <= rect.bottom + 12

          if (isOver && data.isPinching && !pinchLockRef.current) {
            pinchLockRef.current = true
            handleEnterCoinCatcher()
          }
        }
        return
      }

      // 4. Riddle Options card interaction
      if (
        !data.handDetected ||
        !isOptionsRevealedRef.current ||
        isCompletedRef.current
      ) {
        if (prevFocusedOptionIndexRef.current !== null) {
          prevFocusedOptionIndexRef.current = null
          setFocusedOptionIndex(null)
        }
        return
      }

      const refs = [cardRef0, cardRef1, cardRef2, cardRef3]
      let hoveredIdx: number | null = null

      for (let i = 0; i < refs.length; i++) {
        const el = refs[i].current
        if (el) {
          const rect = el.getBoundingClientRect()
          if (
            data.cursorX >= rect.left - 8 &&
            data.cursorX <= rect.right + 8 &&
            data.cursorY >= rect.top - 8 &&
            data.cursorY <= rect.bottom + 8
          ) {
            hoveredIdx = i
            break
          }
        }
      }

      if (prevFocusedOptionIndexRef.current !== hoveredIdx) {
        prevFocusedOptionIndexRef.current = hoveredIdx
        setFocusedOptionIndex(hoveredIdx)
      }

      // One-shot Pinch Selection: Only triggers ONCE per pinch gesture
      if (hoveredIdx !== null && data.isPinching && !pinchLockRef.current) {
        pinchLockRef.current = true
        const chosen = optionsRef.current[hoveredIdx]
        if (chosen) {
          handleOptionChosen(chosen)
        }
      }
    })

    return () => unsub()
  }, [
    handleOptionChosen,
    handleBackToStartMenu,
    handleRetryDareAction,
    handleReturnToRiddleAfterDare,
    handleEnterCoinCatcher,
    riddle.id,
    recordDareCompleted,
  ])

  // Keyboard navigation fallback [1-4] or [A-D]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (celebrationActiveRef.current) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          handleBackToStartMenu()
        }
        return
      }

      if (isFunDareActiveRef.current) {
        if (isDareCompletedRef.current) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            handleReturnToRiddleAfterDare()
          }
          return
        }
        if (e.key === 'r' || e.key === 'R') {
          handleRetryDareAction()
        }
        return
      }

      if (!isOptionsRevealedRef.current) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'p' || e.key === 'P') {
          handleEnterCoinCatcher()
        }
        return
      }

      if (isCompletedRef.current) return

      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Enter') {
          handleSubmitInput()
        }
        return
      }

      const options = optionsRef.current
      if (e.key === '1' || e.key === 'a' || e.key === 'A') {
        if (options[0]) handleOptionChosen(options[0])
      } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
        if (options[1]) handleOptionChosen(options[1])
      } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
        if (options[2]) handleOptionChosen(options[2])
      } else if (e.key === '4' || e.key === 'd' || e.key === 'D') {
        if (options[3]) handleOptionChosen(options[3])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handleOptionChosen,
    handleSubmitInput,
    handleBackToStartMenu,
    handleReturnToRiddleAfterDare,
    handleRetryDareAction,
    handleEnterCoinCatcher,
  ])
  return (
    <div className="riddle-realm-root">
      {/* Mystical Vault Crypt Backdrop */}
      <div className="riddle-realm-bg" style={{ backgroundImage: `url(${cryptBg})` }}>
        <div className="crypt-vignette" />
        <div className="crypt-runic-mist" />
      </div>

      <ParticleCanvas />

      {/* ================= COMPACT HEADER ================= */}
      <header className="riddle-header">
        <div className="riddle-header-left">
          <button
            type="button"
            className="riddle-nav-btn"
            onClick={handleExitToStart}
            data-selectable="true"
            title="Exit game and return to Start Screen"
          >
            ← BACK TO START
          </button>
          <button
            type="button"
            className="riddle-nav-btn"
            onClick={handleStartNewCase}
            data-selectable="true"
            title="Load a different mystery case"
          >
            🎲 NEW CASE
          </button>
          <button
            type="button"
            className="riddle-nav-btn secondary"
            onClick={() => setShowResetConfirm((prev) => !prev)}
            data-selectable="true"
            title="Reset progress for this case"
          >
            ↻ RESET
          </button>
        </div>

        <div className="riddle-header-center">
          <div className="riddle-title-pill" title={`Case: ${riddle.title}`}>
            <span className="pill-dot">🕵️</span>
            <span className="case-title-text">{riddle.title}</span>
          </div>
        </div>

        <div className="riddle-header-right">
          <div className="riddle-score-pill" title="Total Detective Score">
            <span className="score-icon">🏆</span>
            <span className="score-val">{totalScore} PTS</span>
          </div>
          <CameraStatusBadge />
        </div>
      </header>

      {/* Reset Confirmation Banner */}
      {showResetConfirm && (
        <div className="riddle-reset-banner" role="dialog" aria-label="Reset options">
          <div className="reset-banner-content">
            <span className="reset-banner-text">
              <strong>RESET PROGRESS?</strong> Choose whether to restart this mystery case or load a fresh one.
            </span>
            <div className="reset-banner-actions">
              <button
                type="button"
                className="btn-confirm-action"
                onClick={handleStartNewCase}
                data-selectable="true"
              >
                🎲 LOAD NEW CASE
              </button>
              <button
                type="button"
                className="btn-confirm-action secondary"
                onClick={handleResetCase}
                data-selectable="true"
              >
                🔄 RESTART CASE
              </button>
              <button
                type="button"
                className="btn-cancel-action"
                onClick={() => setShowResetConfirm(false)}
                data-selectable="true"
              >
                ✕ CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN BALANCED TWO-PANEL LAYOUT (100dvh, ZERO SCROLL) ================= */}
      <main
        className="riddle-dashboard-grid"
        style={{ display: isFunDareActive || celebrationActive ? 'none' : undefined }}
      >
        {/* ================= LEFT SIDE — RIDDLE PANEL (~60% WIDTH) ================= */}
        <section className="riddle-section-left" aria-labelledby="riddle-tablet-title">
          <div className="grand-riddle-tablet clean-focused">
            {/* Top Dossier Header Bar */}
            <div className="tablet-header">
              <div className="tablet-header-left">
                <span className="tablet-crest-glyph" aria-hidden="true">📜</span>
                <span className="tablet-title" id="riddle-tablet-title">
                  MYSTERY INVESTIGATION
                </span>
              </div>
              <span className="case-id-badge">CASE #{riddle.id.toUpperCase()}</span>
            </div>

            {/* Crime Scene Report Card */}
            {riddle.storyIntro && (
              <div className="tablet-case-report">
                <div className="report-header">
                  <span className="report-icon" aria-hidden="true">🔍</span>
                  <span className="report-label">CASE REPORT</span>
                </div>
                <p className="report-text">{riddle.storyIntro}</p>
              </div>
            )}

            {/* Complete Riddle Question (Revealed directly upon entering the riddle screen) */}
            <div className="tablet-riddle-content focused-center">
              {riddle.question.split('\n').map((line, idx, arr) => {
                const isQuestionPrompt =
                  idx === arr.length - 1 || line.trim().toUpperCase() === 'WHAT AM I?'
                return (
                  <p
                    key={idx}
                    className={
                      isQuestionPrompt ? 'riddle-verse-prompt clean' : 'riddle-verse-text clean'
                    }
                  >
                    {isQuestionPrompt ? (
                      <span className="prompt-highlight">
                        <span className="prompt-star" aria-hidden="true">✦</span>
                        {line}
                        <span className="prompt-star" aria-hidden="true">✦</span>
                      </span>
                    ) : (
                      `"${line}"`
                    )}
                  </p>
                )
              })}
            </div>
          </div>
        </section>

        {/* ================= RIGHT SIDE — LOCKED CHALLENGE / REVEALED OPTIONS (~40% WIDTH) ================= */}
        <section className="riddle-section-right" aria-labelledby="riddle-challenge-title">
          {/* 1. BEFORE CHALLENGE: Single Centered Challenge Card */}
          {!isOptionsRevealed ? (
            <div className="play-challenge-invitation-card" id="riddle-challenge-title">
              {/* Luminous Celestial Orb Illustration (Pure Vector SVG) */}
              <div className="invitation-orb-visual" aria-hidden="true">
                <svg viewBox="0 0 120 120" className="magic-orb-svg">
                  <defs>
                    <radialGradient id="invitationOrbAura" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                      <stop offset="45%" stopColor="#0284c7" stopOpacity="0.5" />
                      <stop offset="75%" stopColor="#1e1b4b" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="invitationCoreGlow" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="30%" stopColor="#7dd3fc" />
                      <stop offset="65%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#082f49" />
                    </radialGradient>
                    <linearGradient id="orbRingGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="54" fill="url(#invitationOrbAura)" className="orb-aura-pulse" />
                  <ellipse cx="60" cy="60" rx="48" ry="18" fill="none" stroke="url(#orbRingGold)" strokeWidth="1.8" strokeDasharray="5 3" className="orb-ring-spin-cw" />
                  <ellipse cx="60" cy="60" rx="46" ry="18" fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="6 4" className="orb-ring-spin-ccw" />
                  <circle cx="60" cy="60" r="28" fill="url(#invitationCoreGlow)" className="orb-core-sphere" />
                  <ellipse cx="50" cy="48" rx="8" ry="5" fill="#ffffff" opacity="0.85" />
                  <polygon points="60,42 63,57 78,60 63,63 60,78 57,63 42,60 57,57" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 6px #38bdf8)" />
                </svg>
              </div>

              {/* Card Title */}
              <h2 className="invitation-card-title">OPTIONS LOCKED</h2>

              {/* Description */}
              <p className="invitation-card-quote highlight-challenge-msg">
                &quot;Play Coin Catcher to Unlock Options&quot;
              </p>

              {/* Requirement & Locked Progress Chips */}
              <div className="invitation-meta-strip">
                <div className="meta-badge locked-status">
                  <span className="badge-icon">🔒</span>
                  <span className="badge-text">OPTIONS HIDDEN</span>
                </div>
                <div className="meta-badge target">
                  <span className="badge-icon">🪙</span>
                  <span className="badge-text">Magic Coin Catcher (200 Pts Required)</span>
                </div>
              </div>

              {/* Play Coin Catcher Button */}
              <button
                type="button"
                ref={playChallengeBtnRef}
                className="btn-play-reveal-options"
                onClick={handleEnterCoinCatcher}
                data-selectable="true"
                aria-label="Play Coin Catcher to Unlock Options"
              >
                <span className="btn-lightning-glyph">🪙</span>
                <span className="btn-play-label">PLAY COIN CATCHER TO UNLOCK OPTIONS →</span>
                <span className="btn-play-arrow">🔓</span>
              </button>
            </div>
          ) : (
            /* 2. AFTER WINNING: Four Large Answer Cards */
            <div className="riddle-answers-panel big-options-panel">
              {/* Header with Unlocked Status */}
              <div className="answers-panel-header">
                <span className="answers-crest">🔓</span>
                <div className="answers-heading-group">
                  <span className="challenge-unlocked-tag">✓ OPTIONS UNLOCKED • GREAT JOB!</span>
                  <h3 className="answers-title">CHOOSE YOUR ANSWER!</h3>
                  <span className="answers-subtitle">
                    {isHandActive
                      ? '🖐️ Move hand to target & pinch fingers to choose'
                      : '🖱️ Click any option or type your answer below'}
                  </span>
                </div>
              </div>

              {/* STAGE 2: Four Large Clickable Answer Cards (A, B, C, D) in Spacious 2-Column Grid */}
              <div className="options-grid-split large-grid">
                {riddle.options.map((option, idx) => {
                  const letters = ['A', 'B', 'C', 'D']
                  const letter = letters[idx] || '?'
                  const isSelected = selectedOption === option
                  const isFocused = focusedOptionIndex === idx
                  const cardRef =
                    idx === 0
                      ? cardRef0
                      : idx === 1
                      ? cardRef1
                      : idx === 2
                      ? cardRef2
                      : cardRef3

                  return (
                    <button
                      key={option}
                      ref={cardRef}
                      type="button"
                      className={`large-answer-card ${isSelected ? 'selected' : ''} ${
                        isFocused ? 'hand-focused' : ''
                      }`}
                      onClick={() => handleOptionChosen(option)}
                      data-selectable="true"
                      aria-label={`Option ${letter}: ${option}`}
                      disabled={celebrationActive}
                    >
                      <div className="large-card-letter-badge">{letter}</div>
                      <div className="large-card-body">
                        <span className="large-card-name">{option}</span>
                        <span className="large-card-status">
                          {isSelected
                            ? '★ SELECTED'
                            : isFocused
                            ? isPinching
                              ? '🤏 PINCHING...'
                              : '🎯 TARGETED'
                            : 'CLICK TO CHOOSE'}
                        </span>
                      </div>
                      <span className="large-card-action-icon">
                        {isSelected ? '✓' : isFocused ? '🖐️' : '→'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Direct Input & Submission Bar */}
              <div className="compact-answer-input-bar">
                <form className="write-input-display-row" onSubmit={handleSubmitInput}>
                  <div className="input-field-wrapper">
                    <span className="input-prefix-icon">🔮</span>
                    <input
                      type="text"
                      className="writing-input-display"
                      placeholder="Or type/confirm answer here..."
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      disabled={celebrationActive}
                      aria-label="Write or type your answer"
                    />
                    {answerInput && !celebrationActive && (
                      <button
                        type="button"
                        className="btn-clear-input"
                        onClick={() => {
                          setAnswerInput('')
                          setSelectedOption(null)
                        }}
                        title="Clear input"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn-submit-answer-prominent"
                    disabled={(!answerInput.trim() && !selectedOption) || celebrationActive}
                    data-selectable="true"
                  >
                    SUBMIT ANSWER →
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ================= 4. DEDICATED FULL-SCREEN CELEBRATION OVERLAY ================= */}
      {celebrationActive && (
        <section
          className="fullscreen-celebration-viewport"
          role="dialog"
          aria-modal="true"
          aria-label="Correct Answer Celebration"
        >
          <ConfettiBurst />
          <div className="fullscreen-celebration-card">
            <div className="celebration-trophy-emblem">🏆</div>
            <div className="celebration-headline-burst">
              <span className="celebration-wow-tag">AWESOME! CORRECT ANSWER! 🎉</span>
              <h2 className="celebration-title">YOU DID IT!</h2>
              <p className="celebration-subtext">Great job! You solved the riddle!</p>
            </div>

            <div className="celebration-answer-badge">
              <span className="badge-glow-star">✦</span>
              <span>ANSWER: {riddle.correctAnswer}</span>
              <span className="badge-glow-star">✦</span>
            </div>

            <p className="celebration-explanation-text">{riddle.explanation}</p>

            <div className="celebration-score-reward">
              <span className="score-reward-icon">⚡</span>
              <span className="score-reward-val">+500 BONUS PTS AWARDED!</span>
            </div>

            <div className="celebration-actions-row">
              <button
                type="button"
                id="btn-back-to-start-menu"
                ref={victoryBtnRef}
                className={`btn-back-to-start-menu ${isVictoryBtnHovered ? 'hand-focused' : ''}`}
                onClick={handleBackToStartMenu}
                data-selectable="true"
                role="button"
                aria-label="Back to Start"
              >
                <span className="btn-icon">🏠</span>
                <span className="btn-text">BACK TO START</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ================= 5. SIMPLE & FUN DARE SCREEN ================= */}
      {isFunDareActive && !celebrationActive && (
        <section
          className="fullscreen-dare-viewport"
          role="dialog"
          aria-modal="true"
          aria-label="Fun Dare Challenge"
        >
          {isDareCompleted ? (
            <div className="fullscreen-dare-card dare-success-card">
              <ConfettiBurst />
              <div className="fullscreen-dare-badge dare-success-badge">
                <span className="dare-warning-icon">🌟</span>
                <span className="dare-badge-text">ACTION VERIFIED!</span>
              </div>

              <div className="dare-theme-emblem-burst">
                <span className="dare-large-emoji">🎉</span>
              </div>

              <h2 className="fullscreen-dare-title dare-celebration-title">
                Awesome! Dare Completed!
              </h2>
              <p className="fullscreen-dare-subtitle dare-celebration-subtitle">
                Webcam verified your action! Ready to crack the riddle?
              </p>

              <div className="dare-encouragement-card">
                <span className="encouragement-star">✨</span>
                <span>Take another look at the clues and choose the right answer!</span>
                <span className="encouragement-star">✨</span>
              </div>

              <div className="fullscreen-dare-actions">
                <button
                  type="button"
                  id="dare-return-btn"
                  ref={dareReturnBtnRef}
                  className="btn-fullscreen-dare-retry btn-dare-done-primary"
                  onClick={handleReturnToRiddleAfterDare}
                  data-selectable="true"
                  aria-label="Return to Riddle"
                >
                  <span className="btn-glyph">🔮</span>
                  <span>RETURN TO RIDDLE →</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="fullscreen-dare-card fun-dare-card">
              {/* Header Badge */}
              <div className="fun-dare-header-burst">
                <div className="fun-dare-tag-pill">
                  <span className="fun-sparkle-glyph">✦</span>
                  <span className="fun-tag-text">FUN DARE!</span>
                  <span className="fun-sparkle-glyph">✦</span>
                </div>
                <h2 className="fun-dare-main-title">&ldquo;Wrong answer! Here is your Fun Dare!&rdquo;</h2>
                <p className="fun-dare-sub-guidance">
                  Use your webcam to perform the action and earn your retry!
                </p>
              </div>

              {/* Single Dare Display Card */}
              <div className="fun-action-display-box">
                <div className="fun-action-icon-circle">
                  <span className="fun-huge-emoji" role="img" aria-label="Fun Dare Icon">
                    {currentDare.icon}
                  </span>
                </div>

                <span className="fun-dare-counter-tag">
                  RIDDLE #{currentDare.riddleNumber} DARE
                </span>

                <h3 className="fun-action-instruction-text">
                  {currentDare.instruction}
                </h3>

                <p className="fun-action-hint-sub">
                  {currentDare.hint}
                </p>

                {/* Camera-Verified Hand Tracking Box */}
                <div className="dare-camera-tracking-box">
                  <div className="dare-tracking-status-row">
                    <span
                      className="dare-tracking-dot"
                      style={{
                        background: !isHandActive
                          ? '#ef4444'
                          : dareHoldProgress > 0
                          ? '#10b981'
                          : '#f59e0b',
                      }}
                    />
                    <span className="dare-tracking-status-text">
                      {!isHandActive
                        ? '📷 Camera active: Position your hand in front of the lens...'
                        : dareHoldProgress > 0
                        ? `⚡ ACTION DETECTED! HOLD TO VERIFY: ${dareHoldProgress}%`
                        : `👀 Watching camera... ${dareFeedbackText || 'Perform the required action now!'}`}
                    </span>
                  </div>
                  <div className="dare-progress-bar-track">
                    <div
                      className="dare-progress-bar-fill"
                      style={{ width: `${dareHoldProgress}%` }}
                    />
                  </div>
                </div>

                {/* Real-time Retry Guidance message if action is not detected */}
                {dareRetryMsg && (
                  <div className="dare-retry-guidance-pill" role="status">
                    <span className="guidance-icon">💡</span>
                    <span className="guidance-text">{dareRetryMsg}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons (Genuine Camera Verification Required - No Skip) */}
              <div className="fullscreen-dare-actions">
                <button
                  type="button"
                  id="dare-retry-btn"
                  ref={dareRetryBtnRef}
                  className="btn-fullscreen-dare-retry btn-fun-retry"
                  onClick={handleRetryDareAction}
                  data-selectable="true"
                  aria-label="Reset Pose"
                >
                  <span className="btn-glyph">🔄</span>
                  <span>RESET POSE</span>
                </button>

                <button
                  type="button"
                  id="dare-exit-btn"
                  className="btn-fullscreen-dare-exit"
                  onClick={handleExitToStart}
                  data-selectable="true"
                  aria-label="Back to Start Screen"
                >
                  <span className="btn-glyph">🏠</span>
                  <span>BACK TO START</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default RiddleRealm
