import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useGame } from '../context/GameContext'
import { useCamera } from '../context/CameraContext'
import { sound } from '../utils/audio'
import { ParticleCanvas } from './ParticleCanvas'
import { CameraStatusBadge } from './CameraStatusBadge'
import { gestureDetector } from '../vision/gestureDetector'
import cryptBg from '../assets/crypt-bg.jpg'
import { getFunDareForRiddle, type FunDare } from '../data/funDares'
import { RIDDLES_POOL } from '../data/riddlesPool'
import {
  verifyDareAction,
  resetActionMotionHistory,
  type DareDebugDetails,
} from '../vision/handActionVerifier'

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

export type DareFeedbackState = 'NO_HAND' | 'WAITING' | 'DETECTED' | 'VERIFYING' | 'COMPLETED'

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

  const { status: cameraStatus, startCamera, captureWebcamSnapshot, setIsMinimized } = useCamera()

  // Collapse camera HUD into compact corner widget to guarantee options are fully visible
  useEffect(() => {
    setIsMinimized(true)
  }, [setIsMinimized])

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
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [incorrectSelection, setIncorrectSelection] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const isSubmittingRef = useRef<boolean>(false)
  const wrongDareTimeoutRef = useRef<number | null>(null)

  // Find mystery case index to display sanitized Case File number (never leaks answer)
  const riddleIndex = RIDDLES_POOL.findIndex((r) => r.id === riddle.id)
  const caseNum = riddleIndex >= 0 ? String(riddleIndex + 1).padStart(2, '0') : '01'

  // Clean up any pending wrong answer transition timer
  useEffect(() => {
    return () => {
      if (wrongDareTimeoutRef.current) {
        clearTimeout(wrongDareTimeoutRef.current)
      }
    }
  }, [])


  // Celebration & Fun Dare states
  const [celebrationActive, setCelebrationActive] = useState<boolean>(isCompleted)
  const [isFunDareActive, setIsFunDareActive] = useState<boolean>(false)
  const [isDareCompleted, setIsDareCompleted] = useState<boolean>(false)
  const [dareHoldProgress, setDareHoldProgress] = useState<number>(0)
  const [dareRetryMsg, setDareRetryMsg] = useState<string>('')
  const [dareFeedbackText, setDareFeedbackText] = useState<string>('')
  const [dareDebugDetails, setDareDebugDetails] = useState<DareDebugDetails | null>(null)
  const [dareState, setDareState] = useState<DareFeedbackState>('NO_HAND')
  const [snapshotSaved, setSnapshotSaved] = useState<boolean>(false)

  // Timing and verification tracking refs (avoids frame-by-frame React state thrashing)
  const dareStartTimeRef = useRef<number>(0)
  const gestureHoldStartTimeRef = useRef<number>(0)
  const consecutiveMatchFramesRef = useRef<number>(0)
  const hasCompletedDareRef = useRef<boolean>(false)
  const lastProgressRef = useRef<number>(0)
  const lastDebugUpdateRef = useRef<number>(0)
  const TARGET_VERIFICATION_MS = 650 // ~0.65 seconds (in 0.5-0.8s requirement range)
  const MIN_MATCH_FRAMES = 8 // At least 8 consecutive valid frames (~260ms)

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

  // Clean reset helper for dare tracking state (fresh frames, zero progress, clean timers)
  const resetDareState = useCallback(() => {
    resetActionMotionHistory()
    gestureDetector.reset()
    dareStartTimeRef.current = performance.now()
    gestureHoldStartTimeRef.current = 0
    consecutiveMatchFramesRef.current = 0
    hasCompletedDareRef.current = false
    lastProgressRef.current = 0
    setDareHoldProgress(0)
    setDareState('NO_HAND')
    setDareRetryMsg('')
    setDareFeedbackText('Show your hand clearly to the camera.')
  }, [])

  // Intentional screenshot snapshot capture (does not alter dare completion)
  const handleTakeSnapshot = useCallback(() => {
    sound.playHover()
    const dataUrl = captureWebcamSnapshot()
    if (!dataUrl) return

    try {
      const link = document.createElement('a')
      link.download = `gesture-dare-${riddle.id}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      setSnapshotSaved(true)
      setTimeout(() => setSnapshotSaved(false), 2500)
    } catch (e) {
      console.warn('Failed to save snapshot:', e)
    }
  }, [captureWebcamSnapshot, riddle.id])

  // Handle selecting / submitting an option
  const handleOptionChosen = useCallback(
    (chosen: string) => {
      if (isCompletedRef.current || isSubmittingRef.current) return

      const now = Date.now()
      if (
        lastChoiceTimeRef.current.choice === chosen &&
        now - lastChoiceTimeRef.current.time < 500
      ) {
        return // Ignore rapid duplicate call
      }
      lastChoiceTimeRef.current = { choice: chosen, time: now }

      sound.playHover()
      setSelectedOption(chosen)
      setAnswerInput(chosen)

      const result = submitAnswer(chosen)

      if (result.isCorrect) {
        isSubmittingRef.current = true
        setIsSubmitting(true)
        setAnswerStatus('correct')
        setIncorrectSelection(null)
        sound.playCorrectRiddle()
        sound.playLevelComplete()
        setCelebrationActive(true)
        setIsFunDareActive(false)
        setIsDareCompleted(false)
        setDareHoldProgress(0)
      } else {
        setAnswerStatus('incorrect')
        setIncorrectSelection(chosen)
        sound.playWrongAnswer()
        sound.playGuardianDareAlert()

        // Give player a brief moment to clearly observe the "NOT QUITE! TRY AGAIN!" feedback before entering Fun Dare
        if (wrongDareTimeoutRef.current) {
          clearTimeout(wrongDareTimeoutRef.current)
        }
        wrongDareTimeoutRef.current = window.setTimeout(() => {
          resetDareState()
          setIsFunDareActive(true)
          setIsDareCompleted(false)
          setCelebrationActive(false)
        }, 1100)
      }
    },
    [submitAnswer, resetDareState]
  )

  // Submit Answer validation handler from input form
  const handleSubmitInput = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      if (isCompleted || !isOptionsRevealed || isSubmittingRef.current) return

      const finalGuess = (answerInput.trim() || selectedOption || '').trim()
      if (!finalGuess) return

      handleOptionChosen(finalGuess)
    },
    [answerInput, selectedOption, isCompleted, isOptionsRevealed, handleOptionChosen]
  )

  // Retry action dare if not detected or player wants another attempt
  const handleRetryDareAction = useCallback(() => {
    sound.playHover()
    resetDareState()
    setDareState('WAITING')
    setDareRetryMsg('Pose reset. Perform the required action in front of the camera!')
  }, [resetDareState])

  // Return to the SAME riddle with question and answer options visible
  const handleReturnToRiddleAfterDare = useCallback(() => {
    sound.playStartSpell()
    resetDareState()
    setIsFunDareActive(false)
    setIsDareCompleted(false)
    setAnswerInput('')
    setSelectedOption(null)
    setAnswerStatus('idle')
    setIncorrectSelection(null)
    setIsSubmitting(false)
    isSubmittingRef.current = false
    if (wrongDareTimeoutRef.current) {
      clearTimeout(wrongDareTimeoutRef.current)
    }
  }, [resetDareState])

  // Return to Start Screen cleanly resetting temporary session state
  const handleBackToStartMenu = useCallback(() => {
    sound.playHover()
    resetDareState()
    setSelectedOption(null)
    setAnswerInput('')
    setAnswerStatus('idle')
    setIncorrectSelection(null)
    setIsSubmitting(false)
    isSubmittingRef.current = false
    if (wrongDareTimeoutRef.current) {
      clearTimeout(wrongDareTimeoutRef.current)
    }
    setCelebrationActive(false)
    setIsFunDareActive(false)
    setIsDareCompleted(false)
    setShowResetConfirm(false)
    returnToStartMenu()
  }, [returnToStartMenu, resetDareState])

  const handleExitToStart = handleBackToStartMenu

  // Start fresh case
  const handleStartNewCase = useCallback(() => {
    sound.playStartSpell()
    resetDareState()
    startNewRiddleSession()
    setSelectedOption(null)
    setAnswerInput('')
    setAnswerStatus('idle')
    setIncorrectSelection(null)
    setIsSubmitting(false)
    isSubmittingRef.current = false
    if (wrongDareTimeoutRef.current) {
      clearTimeout(wrongDareTimeoutRef.current)
    }
    setCelebrationActive(false)
    setIsFunDareActive(false)
    setIsDareCompleted(false)
    setShowResetConfirm(false)
  }, [startNewRiddleSession, resetDareState])

  // Restart case
  const handleResetCase = useCallback(() => {
    sound.playStartSpell()
    resetDareState()
    resetGameProgress()
    setSelectedOption(null)
    setAnswerInput('')
    setAnswerStatus('idle')
    setIncorrectSelection(null)
    setIsSubmitting(false)
    isSubmittingRef.current = false
    if (wrongDareTimeoutRef.current) {
      clearTimeout(wrongDareTimeoutRef.current)
    }
    setCelebrationActive(false)
    setIsFunDareActive(false)
    setIsDareCompleted(false)
    setShowResetConfirm(false)
  }, [resetGameProgress, resetDareState])

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

        // When in Fun Dare, smoothly decay hold progress and provide clear camera guidance
        if (isFunDareActiveRef.current && !isDareCompletedRef.current) {
          gestureHoldStartTimeRef.current = 0
          consecutiveMatchFramesRef.current = 0
          if (lastProgressRef.current > 0) {
            lastProgressRef.current = 0
            setDareHoldProgress(0)
          }
          setDareState('NO_HAND')
          setDareFeedbackText('Show your hand clearly to the camera.')
          setDareRetryMsg('No hand detected by camera yet. Position your hand in front of the lens!')
          setDareDebugDetails({
            actionType: currentDareRef.current.actionType,
            handsCount: 0,
            landmarksReceived: false,
            reason: 'Waiting for hand to enter camera view',
          })
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

        // When dare is already completed, allow clicking/pinching RETURN TO RIDDLE button
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

        const now = performance.now()

        // Fresh frames guarantee: ignore frames during the first 250ms of dare activation
        // to prevent reusing stale gestures or frames from the answer submission click
        if (now - dareStartTimeRef.current < 250) {
          return
        }

        // Camera Action Verification for Fun Dare
        if (data.landmarksList && data.landmarksList.length > 0) {
          const dareAction = currentDareRef.current.actionType
          const verification = verifyDareAction(dareAction, data.landmarksList)

          // Throttle diagnostic updates to keep frame rate high
          if (now - lastDebugUpdateRef.current > 150) {
            lastDebugUpdateRef.current = now
            setDareDebugDetails(verification.debugDetails)
          }

          if (verification.isMatch) {
            consecutiveMatchFramesRef.current++
            if (gestureHoldStartTimeRef.current === 0) {
              gestureHoldStartTimeRef.current = now
            }

            const elapsedMs = now - gestureHoldStartTimeRef.current
            const progress = Math.min(100, Math.round((elapsedMs / TARGET_VERIFICATION_MS) * 100))

            // Only update progress state if changed by >= 2% or reached 100%
            if (Math.abs(progress - lastProgressRef.current) >= 2 || progress === 100) {
              lastProgressRef.current = progress
              setDareHoldProgress(progress)
            }

            // Immediate feedback: GESTURE DETECTED on first frames, VERIFYING while holding
            if (consecutiveMatchFramesRef.current <= 2) {
              setDareState('DETECTED')
            } else {
              setDareState('VERIFYING')
            }
            setDareFeedbackText(verification.feedbackTip)
            setDareRetryMsg('')

            // Complete ONLY when verified for required duration AND consecutive valid frames
            if (
              elapsedMs >= TARGET_VERIFICATION_MS &&
              consecutiveMatchFramesRef.current >= MIN_MATCH_FRAMES &&
              !hasCompletedDareRef.current
            ) {
              hasCompletedDareRef.current = true
              sound.playVictoryFanfare()
              recordDareCompleted(riddle.id)
              setDareHoldProgress(100)
              setDareState('COMPLETED')
              setIsDareCompleted(true)
              resetActionMotionHistory()
            }
          } else {
            // Wrong gesture or tracking error
            gestureHoldStartTimeRef.current = 0
            consecutiveMatchFramesRef.current = 0
            if (lastProgressRef.current > 0) {
              lastProgressRef.current = 0
              setDareHoldProgress(0)
            }
            setDareState('WAITING')
            setDareFeedbackText(verification.feedbackTip)
            setDareRetryMsg(`Waiting for ${currentDareRef.current.title}: ${verification.debugDetails.reason}`)
          }
        } else {
          // No hand detected by camera
          gestureHoldStartTimeRef.current = 0
          consecutiveMatchFramesRef.current = 0
          if (lastProgressRef.current > 0) {
            lastProgressRef.current = 0
            setDareHoldProgress(0)
          }
          setDareState('NO_HAND')
          setDareFeedbackText('Show your hand clearly to the camera.')
          if (now - lastDebugUpdateRef.current > 150) {
            lastDebugUpdateRef.current = now
            setDareDebugDetails({
              actionType: currentDareRef.current.actionType,
              handsCount: 0,
              landmarksReceived: false,
              reason: 'No hand detected in camera view',
            })
          }
          setDareRetryMsg('No hand detected by camera yet. Position your hand in front of the lens!')
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

      // One-shot Pinch Selection: Dispatched directly to chosen option with latch to prevent duplicate triggers
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
              <span className="case-id-badge">CASE FILE #{caseNum}</span>
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

              {/* Answer Validation Status Banner */}
              {answerStatus === 'correct' && (
                <div className="answer-validation-banner success" role="alert">
                  <span className="validation-banner-icon">✨</span>
                  <div className="validation-banner-text-group">
                    <span className="validation-banner-title">CORRECT ANSWER!</span>
                    <span className="validation-banner-sub">Outstanding deduction! +500 PTS added to your score.</span>
                  </div>
                  <span className="validation-banner-badge">+500 PTS</span>
                </div>
              )}

              {answerStatus === 'incorrect' && (
                <div className="answer-validation-banner error animate-shake" role="alert">
                  <span className="validation-banner-icon">⚡</span>
                  <div className="validation-banner-text-group">
                    <span className="validation-banner-title">NOT QUITE! TRY AGAIN!</span>
                    <span className="validation-banner-sub">That deduction missed the mark. Prepare for the Fun Dare!</span>
                  </div>
                  <span className="validation-banner-badge">RETRY</span>
                </div>
              )}

              {/* STAGE 2: Four Large Clickable Answer Cards (A, B, C, D) in Spacious 2-Column Grid */}
              <div className="options-grid-split large-grid">
                {riddle.options.map((option, idx) => {
                  const letters = ['A', 'B', 'C', 'D']
                  const letter = letters[idx] || '?'
                  const isSelected = selectedOption === option
                  const isIncorrect = incorrectSelection === option
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
                        isIncorrect ? 'incorrect' : ''
                      } ${isFocused ? 'hand-focused' : ''}`}
                      onClick={() => handleOptionChosen(option)}
                      data-selectable="true"
                      aria-label={`Option ${letter}: ${option}`}
                      disabled={celebrationActive || isCompleted || isSubmitting}
                    >
                      <div className="large-card-letter-badge">{letter}</div>
                      <div className="large-card-body">
                        <span className="large-card-name">{option}</span>
                        <span className="large-card-status">
                          {isSelected
                            ? isIncorrect
                              ? '✗ NOT QUITE'
                              : '★ SELECTED'
                            : isFocused
                            ? isPinching
                              ? '🤏 PINCHING...'
                              : '🎯 TARGETED'
                            : 'CLICK TO CHOOSE'}
                        </span>
                      </div>
                      <span className="large-card-action-icon">
                        {isSelected ? (isIncorrect ? '✗' : '✓') : isFocused ? '🖐️' : '→'}
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
                    disabled={(!answerInput.trim() && !selectedOption) || celebrationActive || isCompleted || isSubmitting}
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
              <span className="celebration-wow-tag">🎉 CORRECT ANSWER! 🎉</span>
              <h2 className="celebration-title">MYSTERY SOLVED!</h2>
              <p className="celebration-subtext">Outstanding deduction! +500 Points awarded to your score.</p>
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
                AWESOME! DARE COMPLETED!
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
                  id="dare-success-snap-btn"
                  className="btn-fullscreen-dare-snap"
                  onClick={handleTakeSnapshot}
                  data-selectable="true"
                  aria-label="Take Victory Photo"
                  title="Snap a photo of your victory"
                >
                  <span className="btn-glyph">📸</span>
                  <span>{snapshotSaved ? 'PHOTO SAVED!' : 'SNAP VICTORY PHOTO'}</span>
                </button>

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
                <div className="fun-dare-tag-pill warning">
                  <span className="fun-sparkle-glyph">✦</span>
                  <span className="fun-tag-text">NOT QUITE! TRY AGAIN!</span>
                  <span className="fun-sparkle-glyph">✦</span>
                </div>
                <h2 className="fun-dare-main-title">&ldquo;Complete the Fun Dare to unlock your retry!&rdquo;</h2>
                <p className="fun-dare-sub-guidance">
                  Perform the gesture in front of your camera to unlock your retry!
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
                        background:
                          dareState === 'NO_HAND'
                            ? '#ef4444'
                            : dareState === 'WAITING'
                            ? '#f59e0b'
                            : dareState === 'DETECTED'
                            ? '#10b981'
                            : dareState === 'VERIFYING'
                            ? '#06b6d4'
                            : '#22c55e',
                      }}
                    />
                    <span
                      className="dare-tracking-status-text"
                      style={{
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        color:
                          dareState === 'NO_HAND'
                            ? '#fca5a5'
                            : dareState === 'WAITING'
                            ? '#fde68a'
                            : dareState === 'DETECTED'
                            ? '#86efac'
                            : dareState === 'VERIFYING'
                            ? '#67e8f9'
                            : '#86efac',
                      }}
                    >
                      {dareState === 'NO_HAND' && 'Show your hand clearly to the camera.'}
                      {dareState === 'WAITING' && 'WAITING FOR GESTURE'}
                      {dareState === 'DETECTED' && 'GESTURE DETECTED'}
                      {dareState === 'VERIFYING' && `VERIFYING... (${dareHoldProgress}%)`}
                      {dareState === 'COMPLETED' && 'AWESOME! DARE COMPLETED!'}
                    </span>
                  </div>
                  <div className="dare-progress-bar-track">
                    <div
                      className="dare-progress-bar-fill"
                      style={{
                        width: `${dareHoldProgress}%`,
                        background:
                          dareState === 'VERIFYING'
                            ? 'linear-gradient(90deg, #06b6d4, #10b981)'
                            : dareState === 'DETECTED'
                            ? '#10b981'
                            : 'linear-gradient(90deg, #f59e0b, #10b981)',
                        boxShadow:
                          dareHoldProgress > 0
                            ? '0 0 12px rgba(16, 185, 129, 0.65)'
                            : 'none',
                        transition: 'width 0.12s linear',
                      }}
                    />
                  </div>
                </div>

                {/* Sub-status guidance line */}
                <div
                  className="dare-feedback-sub-line"
                  style={{
                    marginTop: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    color: '#cbd5e1',
                  }}
                >
                  {dareState === 'NO_HAND' && 'Position your hand inside the webcam view to start.'}
                  {dareState === 'WAITING' && (dareFeedbackText || currentDare.hint)}
                  {dareState === 'DETECTED' && '⚡ Pose recognized! Hold steady for ~0.6 seconds to verify...'}
                  {dareState === 'VERIFYING' && '⏳ Verifying pose... Keep holding steady!'}
                  {dareState === 'COMPLETED' && '🎉 Verification finished!'}
                </div>

                {/* Real-time Retry Guidance message if action is not detected */}
                {dareRetryMsg && dareState === 'WAITING' && (
                  <div className="dare-retry-guidance-pill" role="status">
                    <span className="guidance-icon">💡</span>
                    <span className="guidance-text">{dareRetryMsg}</span>
                  </div>
                )}

                {/* Verifier Diagnostics HUD */}
                {dareDebugDetails && (
                  <div
                    className="dare-debug-hud"
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: '#94a3b8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span>
                        <strong style={{ color: '#38bdf8' }}>DARE:</strong> {dareDebugDetails.actionType}
                      </span>
                      <span>
                        <strong style={{ color: '#38bdf8' }}>HANDS:</strong> {dareDebugDetails.handsCount}
                      </span>
                      <span>
                        <strong style={{ color: '#38bdf8' }}>LANDMARKS:</strong>{' '}
                        <span style={{ color: dareDebugDetails.landmarksReceived ? '#4ade80' : '#f87171' }}>
                          {dareDebugDetails.landmarksReceived ? 'RECEIVED' : 'NONE'}
                        </span>
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#fbbf24' }}>STATUS:</strong>{' '}
                      <span style={{ color: '#e2e8f0' }}>{dareDebugDetails.reason}</span>
                    </div>
                    {dareDebugDetails.actionType === 'wave_hands' && (
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>
                          <strong style={{ color: '#a78bfa' }}>TRAVEL:</strong>{' '}
                          {(dareDebugDetails.waveTravelDistance ?? 0).toFixed(3)} / 0.075
                        </span>
                        <span>
                          <strong style={{ color: '#a78bfa' }}>REVERSALS:</strong>{' '}
                          {dareDebugDetails.waveReversals ?? 0} / 2
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons (Genuine Camera Verification Required - No Skip) */}
              <div className="fullscreen-dare-actions">
                <button
                  type="button"
                  id="dare-snap-btn"
                  className="btn-fullscreen-dare-snap"
                  onClick={handleTakeSnapshot}
                  data-selectable="true"
                  aria-label="Take Photo"
                  title="Snap a photo of your pose"
                >
                  <span className="btn-glyph">📸</span>
                  <span>{snapshotSaved ? 'PHOTO SAVED!' : 'SNAP PHOTO'}</span>
                </button>

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
                  id="dare-back-to-riddle-btn"
                  className="btn-fullscreen-dare-retry btn-fun-return"
                  onClick={handleReturnToRiddleAfterDare}
                  data-selectable="true"
                  aria-label="Return to Riddle to Retry"
                >
                  <span className="btn-glyph">🔮</span>
                  <span>RETURN TO RIDDLE</span>
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
