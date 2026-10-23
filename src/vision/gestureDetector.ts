import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type GestureState =
  | 'NO_HAND'
  | 'PALM_OPEN'
  | 'HOVERING'
  | 'PINCHING'
  | 'PINCH_HOLD'

export type FeedbackType = 'none' | 'correct' | 'incorrect'

export interface GestureData {
  handDetected: boolean
  cursorX: number
  cursorY: number
  rawX: number
  rawY: number
  isPinching: boolean
  justPinched: boolean
  isPalmOpen: boolean
  gestureState: GestureState
  statusMessage: string
  hoveredElement: HTMLElement | null
  feedback: FeedbackType
  pinchDistance: number
  landmarksList?: NormalizedLandmark[][]
}

type GestureListener = (data: GestureData) => void

class GestureDetector {
  private listeners: Set<GestureListener> = new Set()

  // Cursor smoothing state
  private smoothX: number = typeof window !== 'undefined' ? window.innerWidth / 2 : 640
  private smoothY: number = typeof window !== 'undefined' ? window.innerHeight / 2 : 360
  private hasPrevPos: boolean = false
  private prevTargetX: number = 0
  private prevTargetY: number = 0

  // Multi-hand tracking continuity (prevent jumping when 2 hands are visible)
  private lastTrackedWrist: { x: number; y: number } | null = null
  private lastLandmarks: NormalizedLandmark[][] | null = null

  // Pinch stabilization state (keeps cursor locked to target during click pinch)
  private pinchAnchorX: number = 0
  private pinchAnchorY: number = 0

  // Pinch & gesture state with temporal confirmation & one-shot latch
  private isPinching: boolean = false
  private wasPinching: boolean = false
  private hasPinchTriggered: boolean = false
  private pinchConfirmFrames: number = 0
  private releaseConfirmFrames: number = 0
  private lastPinchTimestamp: number = 0
  private readonly pinchCooldownMs: number = 450

  // Hover tracking with pre-pinch latching
  private currentHoveredElement: HTMLElement | null = null
  private latchedHoveredElement: HTMLElement | null = null
  private latchedHoverTime: number = 0

  // Feedback state
  private currentFeedback: FeedbackType = 'none'
  private feedbackTimer: number | null = null

  // Separate hysteresis thresholds (normalized by 3D palm scale)
  private readonly PINCH_DOWN_THRESHOLD = 0.38
  private readonly PINCH_UP_THRESHOLD = 0.52


  public subscribe(listener: GestureListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(data: GestureData) {
    this.listeners.forEach((cb) => cb(data))
  }

  public triggerFeedback(type: 'correct' | 'incorrect') {
    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer)
    }
    this.currentFeedback = type
    this.feedbackTimer = window.setTimeout(() => {
      this.currentFeedback = 'none'
      this.feedbackTimer = null
    }, 1200)
  }

  /**
   * Process landmarks received from MediaPipe HandLandmarker.
   */
  public processFrame(
    landmarksList: NormalizedLandmark[][] | null | undefined,
    viewportWidth: number = typeof window !== 'undefined' ? window.innerWidth : 1280,
    viewportHeight: number = typeof window !== 'undefined' ? window.innerHeight : 720,
    videoWidth?: number,
    videoHeight?: number
  ): GestureData {
    const now = performance.now()

    // 1. Case: No hands detected
    if (!landmarksList || landmarksList.length === 0 || !landmarksList[0]) {
      this.lastLandmarks = null
      this.hasPrevPos = false
      this.lastTrackedWrist = null
      this.clearHover()
      this.isPinching = false
      this.wasPinching = false
      this.hasPinchTriggered = false
      this.pinchConfirmFrames = 0
      this.releaseConfirmFrames = 0
      this.latchedHoveredElement = null
      this.pinchAnchorX = 0
      this.pinchAnchorY = 0

      const data: GestureData = {
        handDetected: false,
        cursorX: -9999,
        cursorY: -9999,
        rawX: -9999,
        rawY: -9999,
        isPinching: false,
        justPinched: false,
        isPalmOpen: false,
        gestureState: 'NO_HAND',
        statusMessage: 'NO HAND DETECTED',
        hoveredElement: null,
        feedback: this.currentFeedback,
        pinchDistance: 1.0,
        landmarksList: [],
      }
      this.notify(data)
      return data
    }

    // 2. Consistent Hand Selection (prevent random jumping when 2 hands are detected)
    let selectedHandIndex = 0
    if (landmarksList.length > 1 && this.lastTrackedWrist) {
      let minDistance = Infinity
      for (let i = 0; i < landmarksList.length; i++) {
        const w = landmarksList[i][0]
        if (w) {
          const dist = Math.hypot(w.x - this.lastTrackedWrist.x, w.y - this.lastTrackedWrist.y)
          if (dist < minDistance) {
            minDistance = dist
            selectedHandIndex = i
          }
        }
      }
    }

    const landmarks = landmarksList[selectedHandIndex]
    if (!landmarks || landmarks.length < 21) {
      return this.processFrame(null, viewportWidth, viewportHeight, videoWidth, videoHeight)
    }

    // Key Landmarks:
    // 0: WRIST, 4: THUMB_TIP, 5: INDEX_FINGER_MCP, 8: INDEX_FINGER_TIP
    // 9: MIDDLE_FINGER_MCP, 12: MIDDLE_FINGER_TIP, 16: RING_FINGER_TIP, 17: PINKY_MCP, 20: PINKY_TIP
    const wrist = landmarks[0]
    const thumbTip = landmarks[4]
    const indexMcp = landmarks[5]
    const indexTip = landmarks[8]
    const middleMcp = landmarks[9]
    const middleTip = landmarks[12]
    const ringTip = landmarks[16]
    const pinkyMcp = landmarks[17]
    const pinkyTip = landmarks[20]

    if (!wrist || !thumbTip || !indexTip || !indexMcp || !middleMcp || !pinkyMcp) {
      return this.processFrame(null, viewportWidth, viewportHeight, videoWidth, videoHeight)
    }

    // Update wrist history to keep continuous tracking on this specific hand
    this.lastTrackedWrist = { x: wrist.x, y: wrist.y }

    // 3. Palm Scale Normalization (3D invariant reference)
    const palmHeight = Math.hypot(
      wrist.x - middleMcp.x,
      wrist.y - middleMcp.y,
      (wrist.z ?? 0) - (middleMcp.z ?? 0)
    )
    const palmWidth = Math.hypot(
      indexMcp.x - pinkyMcp.x,
      indexMcp.y - pinkyMcp.y,
      (indexMcp.z ?? 0) - (pinkyMcp.z ?? 0)
    )
    const handScale = Math.max(0.08, (palmHeight + palmWidth) / 2)

    // 4. Normalized Pinch Distance (primarily 2D Euclidean distance with slight z-depth contribution)
    const pdx = thumbTip.x - indexTip.x
    const pdy = thumbTip.y - indexTip.y
    const pdz = (thumbTip.z ?? 0) - (indexTip.z ?? 0)
    const rawPinchDist = Math.hypot(pdx, pdy, pdz * 0.4)
    const normalizedPinchDist = rawPinchDist / handScale

    // 5. Pinch State Machine with Adaptive Threshold & Temporal Confirmation
    if (!this.isPinching) {
      if (normalizedPinchDist < this.PINCH_DOWN_THRESHOLD) {
        this.pinchConfirmFrames++
        // Instant trigger on clear touch, or 2 frames for border contact
        if (normalizedPinchDist < 0.28 || this.pinchConfirmFrames >= 2) {
          this.isPinching = true
          this.pinchConfirmFrames = 0
          this.releaseConfirmFrames = 0
        }
      } else {
        this.pinchConfirmFrames = 0
      }
    } else {
      if (normalizedPinchDist > this.PINCH_UP_THRESHOLD) {
        this.releaseConfirmFrames++
        // Fast release when fingers separate clearly
        if (normalizedPinchDist > 0.60 || this.releaseConfirmFrames >= 2) {
          this.isPinching = false
          this.releaseConfirmFrames = 0
          this.pinchConfirmFrames = 0
          this.hasPinchTriggered = false // Reset latch on pinch release
        }
      } else {
        this.releaseConfirmFrames = 0
      }
    }

    // 6. Index-Finger-Centered Cursor Coordinate Calculation
    // Follow the index fingertip landmark (landmark 8) accurately
    const pointerX = indexTip.x
    const pointerY = indexTip.y

    // Horizontally mirrored mapping for natural webcam feedback (Mirror user's view)
    const mirroredX = 1 - pointerX
    const normY = pointerY

    // Aspect-ratio-aware interaction zone calibration:
    // In human ergonomics, users naturally gesture within a central interaction zone in front of their chest/face.
    // Base active boundaries ensure reaching all 4 screen edges without the hand exiting camera view.
    const videoAspect = (videoWidth && videoHeight && videoWidth > 0 && videoHeight > 0)
      ? videoWidth / videoHeight
      : 16 / 9
    const screenAspect = (viewportWidth > 0 && viewportHeight > 0)
      ? viewportWidth / viewportHeight
      : 16 / 9

    // Base horizontal span (0.72 of camera width corresponds to full screen width)
    const activeSpanX = 0.72
    // Scale vertical span according to aspect ratio ratio to prevent directional speed distortion
    const aspectCorrection = videoAspect / screenAspect
    const activeSpanY = Math.max(0.48, Math.min(0.66, 0.60 * aspectCorrection))

    // Ergonomic centers: X is centered (0.50); Y is centered at 0.46 (natural hand elevation)
    const centerX = 0.50
    const centerY = 0.46

    const xMin = centerX - activeSpanX / 2
    const xMax = centerX + activeSpanX / 2
    const yMin = centerY - activeSpanY / 2
    const yMax = centerY + activeSpanY / 2

    // Linear mapping with clean clamp to viewport bounds
    const normScreenX = Math.max(0, Math.min(1, (mirroredX - xMin) / (xMax - xMin)))
    const normScreenY = Math.max(0, Math.min(1, (normY - yMin) / (yMax - yMin)))

    let targetX = normScreenX * viewportWidth
    let targetY = normScreenY * viewportHeight

    // 7. Dynamic Adaptive Smoothing (Ultra-responsive tracking, noise-free resting)
    if (!this.hasPrevPos) {
      this.smoothX = targetX
      this.smoothY = targetY
      this.prevTargetX = targetX
      this.prevTargetY = targetY
      this.hasPrevPos = true
    } else {
      // Outlier jump suppression only for impossible single-frame teleports (> 75% of viewport)
      const maxJump = Math.max(viewportWidth, viewportHeight) * 0.75
      const jumpDist = Math.hypot(targetX - this.prevTargetX, targetY - this.prevTargetY)
      if (jumpDist > maxJump) {
        const angle = Math.atan2(targetY - this.prevTargetY, targetX - this.prevTargetX)
        targetX = this.prevTargetX + Math.cos(angle) * maxJump
        targetY = this.prevTargetY + Math.sin(angle) * maxJump
      }
      this.prevTargetX = targetX
      this.prevTargetY = targetY

      const deltaX = targetX - this.smoothX
      const deltaY = targetY - this.smoothY
      const dist = Math.hypot(deltaX, deltaY)

      // Continuous adaptive filter:
      // Sub-pixel noise (< 0.75px) is held still to prevent sensor jitter
      if (dist < 0.75) {
        // Zero drift / noise absorption at rest
      } else {
        // Smoothstep curve transitioning from gentle damping (0.35) at low speeds to instant tracking (0.95) at high speeds
        const t = Math.min(1, Math.max(0, (dist - 0.75) / 36))
        const ease = t * t * (3 - 2 * t)
        const lerpFactor = 0.35 + ease * 0.60

        this.smoothX += deltaX * lerpFactor
        this.smoothY += deltaY * lerpFactor
      }
    }

    // 8. Pinch Click Stabilization
    // Holding or beginning a pinch anchors the cursor so finger flexion doesn't wobble off target
    let cursorX = this.smoothX
    let cursorY = this.smoothY

    if (this.isPinching) {
      if (!this.wasPinching) {
        this.pinchAnchorX = this.smoothX
        this.pinchAnchorY = this.smoothY
      }
      const pinchDragDist = Math.hypot(this.smoothX - this.pinchAnchorX, this.smoothY - this.pinchAnchorY)
      if (pinchDragDist > 24) {
        // Intentional drag gesture while pinched
        this.pinchAnchorX = this.smoothX
        this.pinchAnchorY = this.smoothY
      } else {
        cursorX = this.pinchAnchorX
        cursorY = this.pinchAnchorY
      }
    }

    // Strictly clamp within viewport
    cursorX = Math.max(0, Math.min(viewportWidth, cursorX))
    cursorY = Math.max(0, Math.min(viewportHeight, cursorY))

    // 8. Open Palm Detection
    const distWristMiddle = Math.hypot(wrist.x - middleTip.x, wrist.y - middleTip.y)
    const distWristRing = Math.hypot(wrist.x - ringTip.x, wrist.y - ringTip.y)
    const distWristPinky = Math.hypot(wrist.x - pinkyTip.x, wrist.y - pinkyTip.y)
    const isPalmOpen =
      distWristMiddle > handScale * 1.25 &&
      distWristRing > handScale * 1.15 &&
      distWristPinky > handScale * 1.05

    // 9. Interactive Element Hit-Testing
    const hoveredEl = this.findElementUnderPoint(cursorX, cursorY)
    this.updateHoveredElement(hoveredEl)

    // Latch hovered element during pre-pinch window so minor jiggles on contact don't lose the click target
    if (hoveredEl) {
      this.latchedHoveredElement = hoveredEl
      this.latchedHoverTime = now
    } else if (now - this.latchedHoverTime > 300) {
      this.latchedHoveredElement = null
    }

    // 10. Gesture State Machine & Status
    let gestureState: GestureState = 'PALM_OPEN'
    let statusMessage = 'MOVE HAND TO NAVIGATE'

    if (hoveredEl) {
      gestureState = 'HOVERING'
      statusMessage = 'PINCH TO SELECT'
    }

    const justPinched = this.isPinching && !this.wasPinching
    const isHoldingPinch = this.isPinching && this.wasPinching

    if (this.isPinching) {
      gestureState = isHoldingPinch ? 'PINCH_HOLD' : 'PINCHING'
      statusMessage = isHoldingPinch ? 'PINCH HOLD' : 'PINCH DETECTED'
    } else if (!hoveredEl && !isPalmOpen) {
      gestureState = 'PALM_OPEN'
      statusMessage = 'HAND DETECTED'
    }

    // 11. Trigger Click ONCE per pinch gesture on the transition from released to pressed
    if (
      this.isPinching &&
      !this.hasPinchTriggered &&
      now - this.lastPinchTimestamp > this.pinchCooldownMs
    ) {
      this.hasPinchTriggered = true
      this.lastPinchTimestamp = now
      const targetElement = hoveredEl || this.latchedHoveredElement
      if (targetElement) {
        this.triggerClick(targetElement)
      }
    }

    if (!this.isPinching) {
      this.hasPinchTriggered = false
    }

    this.wasPinching = this.isPinching
    this.lastLandmarks = landmarksList

    const data: GestureData = {
      handDetected: true,
      cursorX,
      cursorY,
      rawX: targetX,
      rawY: targetY,
      isPinching: this.isPinching,
      justPinched,
      isPalmOpen,
      gestureState,
      statusMessage,
      hoveredElement: hoveredEl,
      feedback: this.currentFeedback,
      pinchDistance: normalizedPinchDist,
      landmarksList,
    }

    this.notify(data)
    return data
  }

  /**
   * Find closest interactive element beneath the cursor coordinates.
   * Uses elementsFromPoint to pierce non-interactive overlays and includes proximity fallback.
   */
  private findElementUnderPoint(x: number, y: number): HTMLElement | null {
    if (typeof document === 'undefined') return null

    const selector =
      'button, a, input, [role="button"], [data-selectable="true"], .btn-start-game, .btn-cinematic-start, .large-answer-card, .btn-play-reveal-options, .btn-submit-answer-prominent, .btn-fullscreen-dare-retry, .btn-fullscreen-dare-new, .btn-fullscreen-dare-exit, .btn-fullscreen-dare-snap, .btn-back-to-start-menu, .gate-arch-card, .riddle-nav-btn, .btn-confirm-action, .btn-cancel-action, .answer-choice-btn, .vault-hint-card'

    const testPoint = (px: number, py: number): HTMLElement | null => {
      const elements = document.elementsFromPoint
        ? document.elementsFromPoint(px, py)
        : [document.elementFromPoint(px, py)].filter(Boolean) as Element[]

      for (const el of elements) {
        if (!el || el === document.body || el === document.documentElement) continue
        // Exclude cursor, background particles, celebration confetti, and webcam HUD overlay (Requirement 3)
        if (
          el.closest('.hand-cursor-root') ||
          el.closest('.particle-canvas') ||
          el.closest('.celebration-confetti-canvas') ||
          el.closest('.vision-hud-dock') ||
          el.closest('.webcam-hud-container')
        ) {
          continue
        }

        // If a full-screen modal or dialog is open, do not hit-test background elements outside the modal
        const modalOverlay = document.querySelector('.fullscreen-dare-viewport, .fullscreen-celebration-viewport, .riddle-reset-banner, [role="dialog"]')
        if (
          modalOverlay &&
          !el.closest('.fullscreen-dare-viewport, .fullscreen-celebration-viewport, .riddle-reset-banner, [role="dialog"]')
        ) {
          continue
        }

        const interactive = el.closest<HTMLElement>(selector)
        if (interactive) {
          if ((interactive as HTMLButtonElement).disabled) return null
          return interactive
        }
      }
      return null
    }

    // 1. Direct point hit test
    const direct = testPoint(x, y)
    if (direct) return direct

    // 2. Proximity search (±14px cross) to make hand pointing over cards extra forgiving
    const offsets = [
      [0, -14],
      [0, 14],
      [-14, 0],
      [14, 0],
    ]
    for (const [ox, oy] of offsets) {
      const nearby = testPoint(x + ox, y + oy)
      if (nearby) return nearby
    }

    return null
  }

  /**
   * Update hovered element and maintain CSS classes.
   */
  private updateHoveredElement(target: HTMLElement | null) {
    if (this.currentHoveredElement === target) {
      return
    }

    if (this.currentHoveredElement) {
      this.currentHoveredElement.classList.remove('hand-hovered')
    }

    this.currentHoveredElement = target

    if (this.currentHoveredElement) {
      this.currentHoveredElement.classList.add('hand-hovered')
    }
  }

  private clearHover() {
    if (this.currentHoveredElement) {
      this.currentHoveredElement.classList.remove('hand-hovered')
      this.currentHoveredElement = null
    }
  }

  /**
   * Dispatches complete synthetic pointer, mouse, and native click events.
   */
  private triggerClick(element: HTMLElement) {
    try {
      element.focus?.()
      const rect = element.getBoundingClientRect()
      const clientX = rect.left + rect.width / 2
      const clientY = rect.top + rect.height / 2

      const eventInit: PointerEventInit = {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX,
        clientY,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      }
      element.dispatchEvent(new PointerEvent('pointerdown', eventInit))
      element.dispatchEvent(new MouseEvent('mousedown', eventInit))
      element.dispatchEvent(new PointerEvent('pointerup', eventInit))
      element.dispatchEvent(new MouseEvent('mouseup', eventInit))
      element.click()
    } catch (e) {
      console.warn('Error triggering hand gesture click:', e)
    }
  }

  public reset() {
    this.clearHover()
    this.hasPrevPos = false
    this.lastTrackedWrist = null
    this.isPinching = false
    this.wasPinching = false
    this.hasPinchTriggered = false
    this.pinchConfirmFrames = 0
    this.releaseConfirmFrames = 0
    this.latchedHoveredElement = null
    this.pinchAnchorX = 0
    this.pinchAnchorY = 0
    this.lastLandmarks = null
  }

  public getLastLandmarks(): NormalizedLandmark[][] | null {
    return this.lastLandmarks
  }
}

export const gestureDetector = new GestureDetector()
