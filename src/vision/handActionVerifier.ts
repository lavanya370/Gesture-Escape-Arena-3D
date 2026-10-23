import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { HandActionType } from '../types/riddles'

// Landmark index constants (MediaPipe 21 Hand Landmarks)
export const WRIST = 0
export const THUMB_CMC = 1
export const THUMB_MCP = 2
export const THUMB_IP = 3
export const THUMB_TIP = 4

export const INDEX_MCP = 5
export const INDEX_PIP = 6
export const INDEX_DIP = 7
export const INDEX_TIP = 8

export const MIDDLE_MCP = 9
export const MIDDLE_PIP = 10
export const MIDDLE_DIP = 11
export const MIDDLE_TIP = 12

export const RING_MCP = 13
export const RING_PIP = 14
export const RING_DIP = 15
export const RING_TIP = 16

export const PINKY_MCP = 17
export const PINKY_PIP = 18
export const PINKY_DIP = 19
export const PINKY_TIP = 20

interface MotionSample {
  x: number
  y: number
  scale: number
  time: number
}

// Rolling motion history for horizontal wave detection
const recentWaveHistory: MotionSample[] = []
let waveCompletedUntil = 0
let lastWaveTotalTravel = 0
let lastWaveReversals = 0
let lastWaveReason = 'Waiting for hand motion'
let lastHandSeenTime = 0

// Temporal continuity counter for raised hands
let handsRaisedConsecutiveFrames = 0

// Recent fingertip relative speeds for wiggle detection
const recentWiggleVariances: number[] = []
let wiggleCompletedUntil = 0

/**
 * Resets all motion histories, reversal counters, and cached gesture states.
 * Must be called when a new dare starts, when tracking is lost, or on pose reset.
 */
export function resetActionMotionHistory() {
  recentWaveHistory.length = 0
  waveCompletedUntil = 0
  lastWaveTotalTravel = 0
  lastWaveReversals = 0
  lastWaveReason = 'History reset'
  lastHandSeenTime = 0
  recentWiggleVariances.length = 0
  wiggleCompletedUntil = 0
  handsRaisedConsecutiveFrames = 0
}

/**
 * Detailed finger state analysis for a single hand using 3D MediaPipe landmarks.
 * Calculates palm dimensions, finger joint angles, extension distances, and curl states.
 */
export interface HandFingerAnalysis {
  palmScale: number
  isIndexExtended: boolean
  isIndexCurled: boolean
  isMiddleExtended: boolean
  isMiddleCurled: boolean
  isRingExtended: boolean
  isRingCurled: boolean
  isPinkyExtended: boolean
  isPinkyCurled: boolean
  isThumbUp: boolean
  isThumbCurled: boolean
  isThumbExtended: boolean
  extendedFingersCount: number
  curledFingersCount: number
}

export function analyzeHandFingers(lm: NormalizedLandmark[]): HandFingerAnalysis | null {
  if (!lm || lm.length < 21) return null

  const wrist = lm[WRIST]
  const thumbTip = lm[THUMB_TIP]
  const thumbIp = lm[THUMB_IP]
  const thumbMcp = lm[THUMB_MCP]
  const indexMcp = lm[INDEX_MCP]
  const indexPip = lm[INDEX_PIP]
  const indexDip = lm[INDEX_DIP]
  const indexTip = lm[INDEX_TIP]
  const middleMcp = lm[MIDDLE_MCP]
  const middlePip = lm[MIDDLE_PIP]
  const middleDip = lm[MIDDLE_DIP]
  const middleTip = lm[MIDDLE_TIP]
  const ringMcp = lm[RING_MCP]
  const ringPip = lm[RING_PIP]
  const ringDip = lm[RING_DIP]
  const ringTip = lm[RING_TIP]
  const pinkyMcp = lm[PINKY_MCP]
  const pinkyPip = lm[PINKY_PIP]
  const pinkyDip = lm[PINKY_DIP]
  const pinkyTip = lm[PINKY_TIP]

  if (
    !wrist ||
    !thumbTip ||
    !thumbIp ||
    !thumbMcp ||
    !indexMcp ||
    !indexPip ||
    !indexTip ||
    !middleMcp ||
    !middlePip ||
    !middleTip ||
    !ringMcp ||
    !ringPip ||
    !ringTip ||
    !pinkyMcp ||
    !pinkyPip ||
    !pinkyTip
  ) {
    return null
  }

  // 3D palm scale normalization (distance from wrist to middle MCP & index to pinky MCP)
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
  const palmScale = Math.max(0.08, (palmHeight + palmWidth) / 2)

  // Helper for single 4-finger evaluation (Index, Middle, Ring, Pinky)
  const evalFinger = (
    tip: NormalizedLandmark,
    dip: NormalizedLandmark | undefined,
    pip: NormalizedLandmark,
    mcp: NormalizedLandmark
  ) => {
    const distTipWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y)
    const distPipWrist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y)
    const distMcpWrist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y)
    const distTipMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y)
    const distPipMcp = Math.hypot(pip.x - mcp.x, pip.y - mcp.y)

    // Extended criteria:
    // 1. Tip is physically higher in webcam view than PIP joint (with small tolerance)
    // 2. Tip is further from wrist and MCP than PIP
    // 3. Tip is further from wrist than MCP
    const dipY = dip ? dip.y : pip.y
    const isHigherThanPip = tip.y < pip.y - 0.012 && tip.y < dipY + 0.01
    const isHigherThanMcp = tip.y < mcp.y - 0.03
    const isRadiallyExtended = distTipWrist > distPipWrist * 1.10 && distTipMcp > distPipMcp * 1.30 && distTipWrist > distMcpWrist * 1.30

    const isExtended = (isHigherThanPip && isHigherThanMcp) || isRadiallyExtended

    // Curled criteria:
    // Tip is folded toward palm: tip is close to MCP or level/lower than PIP joint
    const isCurledDown = tip.y >= pip.y - 0.025
    const isCloseToMcp = distTipMcp < distPipMcp * 1.25 || distTipWrist <= distPipWrist * 1.06

    const isCurled = !isExtended && (isCurledDown || isCloseToMcp)

    return { isExtended, isCurled }
  }

  const indexState = evalFinger(indexTip, indexDip, indexPip, indexMcp)
  const middleState = evalFinger(middleTip, middleDip, middlePip, middleMcp)
  const ringState = evalFinger(ringTip, ringDip, ringPip, ringMcp)
  const pinkyState = evalFinger(pinkyTip, pinkyDip, pinkyPip, pinkyMcp)

  // Thumb evaluation:
  // Thumb pointing up: tip is clearly above IP and MCP joints, and above index MCP
  const isThumbUp =
    thumbTip.y < thumbIp.y - 0.025 &&
    thumbTip.y < thumbMcp.y - 0.035 &&
    thumbTip.y < indexMcp.y - 0.02

  const thumbDistFromIndex = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y)
  const isThumbExtended =
    Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y) >
    Math.hypot(thumbMcp.x - wrist.x, thumbMcp.y - wrist.y) * 1.15 &&
    thumbDistFromIndex > palmScale * 0.40

  const isThumbCurled = !isThumbUp && (thumbDistFromIndex < palmScale * 0.48 || thumbTip.y > thumbMcp.y - 0.01)

  const extendedFingersCount =
    (indexState.isExtended ? 1 : 0) +
    (middleState.isExtended ? 1 : 0) +
    (ringState.isExtended ? 1 : 0) +
    (pinkyState.isExtended ? 1 : 0)

  const curledFingersCount =
    (indexState.isCurled ? 1 : 0) +
    (middleState.isCurled ? 1 : 0) +
    (ringState.isCurled ? 1 : 0) +
    (pinkyState.isCurled ? 1 : 0)

  return {
    palmScale,
    isIndexExtended: indexState.isExtended,
    isIndexCurled: indexState.isCurled,
    isMiddleExtended: middleState.isExtended,
    isMiddleCurled: middleState.isCurled,
    isRingExtended: ringState.isExtended,
    isRingCurled: ringState.isCurled,
    isPinkyExtended: pinkyState.isExtended,
    isPinkyCurled: pinkyState.isCurled,
    isThumbUp,
    isThumbCurled,
    isThumbExtended,
    extendedFingersCount,
    curledFingersCount,
  }
}

/**
 * Checks for Middle Finger + Ring Finger extended together:
 * - Middle finger is extended
 * - Ring finger is extended
 * - Index finger is curled inward
 * - Pinky finger is curled inward
 * - Thumb is resting or folded
 * - Middle and Ring fingertips are in close proximity
 */
export function checkMiddleRingTogether(lm: NormalizedLandmark[]): { isMatch: boolean; reason: string } {
  const analysis = analyzeHandFingers(lm)
  if (!analysis) return { isMatch: false, reason: 'Missing hand landmarks' }

  const middleTip = lm[MIDDLE_TIP]
  const ringTip = lm[RING_TIP]
  const indexTip = lm[INDEX_TIP]
  const pinkyTip = lm[PINKY_TIP]

  if (!middleTip || !ringTip || !indexTip || !pinkyTip) {
    return { isMatch: false, reason: 'Missing fingertip landmarks' }
  }

  // Middle & Ring must be extended
  const bothActiveExtended = analysis.isMiddleExtended && analysis.isRingExtended
  // Index & Pinky must be curled (or not extended)
  const othersCurled =
    (analysis.isIndexCurled || !analysis.isIndexExtended) &&
    (analysis.isPinkyCurled || !analysis.isPinkyExtended)

  // Distance between middle and ring tips should be close together
  const distMiddleRing = Math.hypot(middleTip.x - ringTip.x, middleTip.y - ringTip.y)
  const isTipsTogether = distMiddleRing < analysis.palmScale * 0.65

  // Distance to index should be greater than distance between middle & ring
  const distIndexMiddle = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y)

  if (bothActiveExtended && othersCurled && !analysis.isThumbUp && isTipsTogether) {
    return {
      isMatch: true,
      reason: 'Middle & Ring fingers extended together verified',
    }
  }

  if (bothActiveExtended && (analysis.isIndexExtended || analysis.isPinkyExtended)) {
    return {
      isMatch: false,
      reason: 'Fold your index and pinky fingers down (only Middle + Ring up)',
    }
  }

  if (!analysis.isMiddleExtended || !analysis.isRingExtended) {
    return {
      isMatch: false,
      reason: 'Extend both middle and ring fingers straight up together',
    }
  }

  return {
    isMatch: false,
    reason: `Keep middle & ring together (dist: ${distMiddleRing.toFixed(2)}, idxMid: ${distIndexMiddle.toFixed(2)})`,
  }
}

/**
 * Checks for Index Finger + Middle Finger extended together (Peace Sign / V Sign):
 * - Index finger is extended
 * - Middle finger is extended
 * - Ring finger is curled inward
 * - Pinky finger is curled inward
 * - Thumb folded or resting
 */
export function checkIndexMiddleTogether(lm: NormalizedLandmark[]): { isMatch: boolean; reason: string } {
  const analysis = analyzeHandFingers(lm)
  if (!analysis) return { isMatch: false, reason: 'Missing hand landmarks' }

  const indexTip = lm[INDEX_TIP]
  const middleTip = lm[MIDDLE_TIP]
  if (!indexTip || !middleTip) return { isMatch: false, reason: 'Missing fingertip landmarks' }

  // Index & Middle extended
  const indexAndMiddleUp = analysis.isIndexExtended && analysis.isMiddleExtended
  // Ring & Pinky curled
  const ringAndPinkyDown =
    (analysis.isRingCurled || !analysis.isRingExtended) &&
    (analysis.isPinkyCurled || !analysis.isPinkyExtended)

  // Clear separation between index and middle fingertips (V shape)
  const tipSeparation = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y)
  const isVSpread = tipSeparation > 0.025

  if (indexAndMiddleUp && ringAndPinkyDown && !analysis.isThumbUp && isVSpread) {
    return {
      isMatch: true,
      reason: 'Index + Middle fingers (Peace sign) verified',
    }
  }

  if (indexAndMiddleUp && (analysis.isRingExtended || analysis.isPinkyExtended)) {
    return {
      isMatch: false,
      reason: 'Fold ring and pinky fingers down (only Index + Middle up)',
    }
  }

  if (analysis.isIndexExtended && !analysis.isMiddleExtended) {
    return {
      isMatch: false,
      reason: 'Extend your middle finger alongside your index finger',
    }
  }

  if (!analysis.isIndexExtended && analysis.isMiddleExtended) {
    return {
      isMatch: false,
      reason: 'Extend your index finger alongside your middle finger',
    }
  }

  return {
    isMatch: false,
    reason: 'Show two fingers (Index & Middle) pointing up in a V sign',
  }
}

/**
 * Checks for Open Palm:
 * - All 4 fingers (Index, Middle, Ring, Pinky) are extended
 * - Fingers are spread across the palm
 * - Thumb is open / relaxed
 * - Hand is facing the camera
 */
export function checkOpenPalm(lm: NormalizedLandmark[]): { isMatch: boolean; reason: string } {
  const analysis = analyzeHandFingers(lm)
  if (!analysis) return { isMatch: false, reason: 'Missing hand landmarks' }

  const indexTip = lm[INDEX_TIP]
  const pinkyTip = lm[PINKY_TIP]
  const wrist = lm[WRIST]

  if (!indexTip || !pinkyTip || !wrist) return { isMatch: false, reason: 'Missing landmarks' }

  // All 4 fingers must be extended (forgiving: at least 3 of 4 strictly extended if spread is large)
  const spreadDist = Math.hypot(indexTip.x - pinkyTip.x, indexTip.y - pinkyTip.y)
  const hasSpread = spreadDist > analysis.palmScale * 0.60

  const allFourExtended =
    analysis.isIndexExtended &&
    analysis.isMiddleExtended &&
    analysis.isRingExtended &&
    analysis.isPinkyExtended

  if (allFourExtended && hasSpread) {
    return {
      isMatch: true,
      reason: `Open palm verified (${analysis.extendedFingersCount}/4 extended, spread: ${spreadDist.toFixed(2)})`,
    }
  }

  if (analysis.extendedFingersCount === 3 && hasSpread && !analysis.isThumbUp) {
    // Forgiving for natural slight curl in pinky
    return {
      isMatch: true,
      reason: 'Open palm verified (3/4 fingers fully spread)',
    }
  }

  if (analysis.extendedFingersCount <= 2) {
    return {
      isMatch: false,
      reason: `Open all 5 fingers wide (${analysis.extendedFingersCount}/4 extended)`,
    }
  }

  return {
    isMatch: false,
    reason: 'Hold your palm flat and open toward the camera',
  }
}

/**
 * Checks for Thumbs-Up:
 * - Thumb pointing upwards (tip clearly above IP and MCP joints)
 * - All other 4 fingers curled inward into a fist
 * - Thumb tip is the highest point on the hand
 */
export function checkSingleThumbsUp(lm: NormalizedLandmark[]): { isMatch: boolean; reason: string } {
  const analysis = analyzeHandFingers(lm)
  if (!analysis) return { isMatch: false, reason: 'Missing hand landmarks' }

  const thumbTip = lm[THUMB_TIP]
  const indexMcp = lm[INDEX_MCP]
  const middleTip = lm[MIDDLE_TIP]
  const indexTip = lm[INDEX_TIP]

  if (!thumbTip || !indexMcp || !middleTip || !indexTip) {
    return { isMatch: false, reason: 'Missing thumb landmarks' }
  }

  // Thumb must be pointing straight up
  if (!analysis.isThumbUp) {
    return {
      isMatch: false,
      reason: 'Point your thumb straight up toward the ceiling',
    }
  }

  // All 4 fingers curled inward
  const curledCount = analysis.curledFingersCount
  const isThumbHighest = thumbTip.y < indexTip.y && thumbTip.y < middleTip.y

  if (analysis.isThumbUp && curledCount >= 3 && isThumbHighest) {
    return {
      isMatch: true,
      reason: `Thumbs-up verified (${curledCount}/4 fingers curled, thumb up)`,
    }
  }

  if (analysis.extendedFingersCount >= 2) {
    return {
      isMatch: false,
      reason: 'Curl your 4 fingers inward into a fist, thumb up',
    }
  }

  return {
    isMatch: false,
    reason: 'Show a clear thumbs-up with fingers curled',
  }
}

export interface WaveCheckResult {
  isMatch: boolean
  confidence: number
  feedbackTip: string
  reversals: number
  totalTravel: number
  reason: string
}

/**
 * Checks for genuine horizontal hand waving:
 * - Tracks weighted hand center (wrist + palm + fingertips) of primary hand across frames.
 * - Measures horizontal displacement over time.
 * - Detects genuine direction reversals (strokes), distinguishing waving from stationary hands.
 * - Ignores pushing hand toward/away from camera by analyzing scale stability.
 * - Resets tracking immediately when hand disappears or tracking is lost.
 * - Uses reasonable thresholds so user does not need to wave excessively.
 */
export function checkWaveMotion(landmarksList: NormalizedLandmark[][]): WaveCheckResult {
  const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()

  // 1. If tracking is lost (no hands detected in camera)
  if (!landmarksList || landmarksList.length === 0 || !landmarksList[0]) {
    // Only reset history if tracking has been lost continuously for > 450ms.
    // Avoid dropping wave history on a single dropped/jittered camera frame.
    if (lastHandSeenTime > 0 && now - lastHandSeenTime > 450) {
      recentWaveHistory.length = 0
      waveCompletedUntil = 0
      lastWaveReversals = 0
      lastWaveTotalTravel = 0
      lastWaveReason = 'No hand detected'
    }

    return {
      isMatch: false,
      confidence: 0,
      feedbackTip: 'Show your hand clearly to the camera.',
      reversals: lastWaveReversals,
      totalTravel: lastWaveTotalTravel,
      reason: 'No hand detected',
    }
  }

  lastHandSeenTime = now

  // 2. If hand was absent for > 500ms between valid detections, start fresh wave history
  if (recentWaveHistory.length > 0 && now - recentWaveHistory[recentWaveHistory.length - 1].time > 500) {
    recentWaveHistory.length = 0
  }

  // 3. Choose primary hand (if multiple hands, pick the one closest to previous sample)
  let chosenHand = landmarksList[0]
  if (landmarksList.length > 1 && recentWaveHistory.length > 0) {
    const prev = recentWaveHistory[recentWaveHistory.length - 1]
    let closestDist = Infinity
    for (const hand of landmarksList) {
      const w = hand[WRIST]
      if (w) {
        const mX = 1 - w.x
        const d = Math.hypot(mX - prev.x, w.y - prev.y)
        if (d < closestDist) {
          closestDist = d
          chosenHand = hand
        }
      }
    }
  }

  const wrist = chosenHand[WRIST]
  const middleMcp = chosenHand[MIDDLE_MCP]
  const middleTip = chosenHand[MIDDLE_TIP]

  if (!wrist || !middleMcp || !middleTip) {
    return {
      isMatch: false,
      confidence: 0,
      feedbackTip: 'Wave your hand side-to-side across the camera!',
      reversals: 0,
      totalTravel: 0,
      reason: 'Missing hand landmarks',
    }
  }

  // Hand should be elevated above desk resting height
  if (wrist.y > 0.90) {
    return {
      isMatch: false,
      confidence: 0.1,
      feedbackTip: 'Raise your hand higher in view of the camera!',
      reversals: 0,
      totalTravel: 0,
      reason: `Hand too low (wrist.y=${wrist.y.toFixed(2)} > 0.90)`,
    }
  }

  // 4. Mirrored horizontal coordinate calculation:
  // User views a mirrored webcam preview, so (1 - rawX) reflects horizontal position on screen (0=left, 1=right)
  const rawX = wrist.x * 0.20 + middleMcp.x * 0.35 + middleTip.x * 0.45
  const mirroredHandX = 1 - rawX
  const handY = wrist.y * 0.20 + middleMcp.y * 0.35 + middleTip.y * 0.45
  const handScale = Math.max(0.08, Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y))

  // Reject pushing hand directly toward camera:
  // If hand scale changes dramatically between recent frames while horizontal travel is minimal, reject push
  if (recentWaveHistory.length > 3) {
    const prev = recentWaveHistory[recentWaveHistory.length - 2]
    const scaleDiff = Math.abs(handScale - prev.scale)
    const xDiff = Math.abs(mirroredHandX - prev.x)
    if (scaleDiff > 0.045 && xDiff < 0.015) {
      return {
        isMatch: false,
        confidence: 0.2,
        feedbackTip: 'Wave side-to-side (not toward camera)!',
        reversals: lastWaveReversals,
        totalTravel: lastWaveTotalTravel,
        reason: 'Detected forward/backward push instead of horizontal wave',
      }
    }
  }

  recentWaveHistory.push({ x: mirroredHandX, y: handY, scale: handScale, time: now })

  // Keep last 1.6 seconds of wave motion
  while (recentWaveHistory.length > 0 && now - recentWaveHistory[0].time > 1600) {
    recentWaveHistory.shift()
  }

  // Need at least 4 sampled frames to analyze direction
  if (recentWaveHistory.length < 4) {
    return {
      isMatch: false,
      confidence: 0.2,
      feedbackTip: 'Wave your hand side-to-side across the camera!',
      reversals: 0,
      totalTravel: 0,
      reason: `Accumulating wave samples (${recentWaveHistory.length}/4)`,
    }
  }

  // Extrema and direction reversal analysis:
  // A stroke must travel at least minStrokeDelta (0.028 screen width) before reversing
  const minStrokeDelta = 0.028
  let reversals = 0
  let totalTravel = 0
  let currentDir = 0 // 1: moving right on screen, -1: moving left on screen
  let extremeX = recentWaveHistory[0].x

  for (let i = 1; i < recentWaveHistory.length; i++) {
    const curX = recentWaveHistory[i].x
    const stepDx = curX - recentWaveHistory[i - 1].x
    const absStep = Math.abs(stepDx)

    // Ignore tiny jitter fluctuations below sensor noise
    if (absStep >= 0.004) {
      totalTravel += absStep
    }

    if (currentDir === 0) {
      if (curX - extremeX > minStrokeDelta) {
        currentDir = 1
        extremeX = curX
      } else if (extremeX - curX > minStrokeDelta) {
        currentDir = -1
        extremeX = curX
      }
    } else if (currentDir === 1) {
      if (curX > extremeX) {
        extremeX = curX
      } else if (extremeX - curX >= minStrokeDelta) {
        reversals++
        currentDir = -1
        extremeX = curX
      }
    } else if (currentDir === -1) {
      if (curX < extremeX) {
        extremeX = curX
      } else if (curX - extremeX >= minStrokeDelta) {
        reversals++
        currentDir = 1
        extremeX = curX
      }
    }
  }

  lastWaveReversals = reversals
  lastWaveTotalTravel = totalTravel

  // A genuine horizontal wave has at least 2 reversals and cumulative travel >= 0.065
  if (reversals >= 2 && totalTravel >= 0.065) {
    // Hold confirmed match for 1.2s so verification progress easily reaches 100%
    waveCompletedUntil = Math.max(waveCompletedUntil, now + 1200)
  }

  if (now < waveCompletedUntil) {
    lastWaveReason = `Wave verified: ${reversals} reversals, travel ${totalTravel.toFixed(2)}`
    return {
      isMatch: true,
      confidence: 1.0,
      feedbackTip: '👋 Great wave detected! Verifying...',
      reversals: Math.max(2, reversals),
      totalTravel,
      reason: lastWaveReason,
    }
  }

  if (reversals === 1) {
    lastWaveReason = `1 reversal completed (${reversals}/2), total travel: ${totalTravel.toFixed(2)}`
    return {
      isMatch: false,
      confidence: 0.5,
      feedbackTip: '👋 1 wave stroke! Now wave back the other way...',
      reversals,
      totalTravel,
      reason: lastWaveReason,
    }
  }

  if (totalTravel >= 0.03) {
    lastWaveReason = `Moving hand, waiting for direction reversal (travel: ${totalTravel.toFixed(2)})`
    return {
      isMatch: false,
      confidence: 0.3,
      feedbackTip: 'Keep waving side-to-side across the camera...',
      reversals,
      totalTravel,
      reason: lastWaveReason,
    }
  }

  lastWaveReason = `Hand stationary (travel: ${totalTravel.toFixed(3)} < 0.065)`
  return {
    isMatch: false,
    confidence: 0.1,
    feedbackTip: 'Wave your hand side-to-side across the camera!',
    reversals,
    totalTravel,
    reason: lastWaveReason,
  }
}

/**
 * Checks for Pointing Gesture:
 * Index finger extended forward/up, other 3 fingers curled inward
 */
function checkPointing(lm: NormalizedLandmark[]): { isMatch: boolean; reason: string } {
  const analysis = analyzeHandFingers(lm)
  if (!analysis) return { isMatch: false, reason: 'Missing landmarks' }

  const indexTip = lm[INDEX_TIP]
  const middleTip = lm[MIDDLE_TIP]
  const wrist = lm[WRIST]
  if (!indexTip || !middleTip || !wrist) return { isMatch: false, reason: 'Missing landmarks' }

  const distIndex = Math.hypot(wrist.x - indexTip.x, wrist.y - indexTip.y)
  const distMiddle = Math.hypot(wrist.x - middleTip.x, wrist.y - middleTip.y)

  const isPointingForward =
    analysis.isIndexExtended &&
    (analysis.isMiddleCurled || !analysis.isMiddleExtended) &&
    (analysis.isRingCurled || !analysis.isRingExtended) &&
    (analysis.isPinkyCurled || !analysis.isPinkyExtended) &&
    distIndex > distMiddle + 0.03

  if (isPointingForward) {
    return {
      isMatch: true,
      reason: 'Pointing gesture verified',
    }
  }

  return {
    isMatch: false,
    reason: 'Point your index finger forward at the camera, curl other fingers',
  }
}

export interface HandRaisedCheckResult {
  isMatch: boolean
  confidence: number
  feedbackTip: string
  reason: string
}

function isSingleHandRaised(lm: NormalizedLandmark[]): boolean {
  if (!lm || lm.length < 21) return false
  const wrist = lm[WRIST]
  const middleTip = lm[MIDDLE_TIP]
  const indexTip = lm[INDEX_TIP]
  if (!wrist || !middleTip || !indexTip) return false

  const topTipY = Math.min(middleTip.y, indexTip.y)
  return wrist.y < 0.72 && topTipY < 0.54 && topTipY < wrist.y - 0.03
}

function verifyRaiseBothHands(landmarksList: NormalizedLandmark[][]): HandRaisedCheckResult {
  if (landmarksList.length === 0) {
    handsRaisedConsecutiveFrames = 0
    return {
      isMatch: false,
      confidence: 0,
      feedbackTip: 'Raise both hands up high in view of the camera!',
      reason: 'No hands detected',
    }
  }

  if (landmarksList.length === 1) {
    handsRaisedConsecutiveFrames = 0
    const singleRaised = isSingleHandRaised(landmarksList[0])
    return {
      isMatch: false,
      confidence: singleRaised ? 0.5 : 0.25,
      feedbackTip: 'Raise BOTH hands high in view of the camera!',
      reason: 'Only 1 hand detected (needs 2 hands raised)',
    }
  }

  const raisedCount = landmarksList.filter((lm) => isSingleHandRaised(lm)).length
  if (raisedCount >= 2) {
    handsRaisedConsecutiveFrames++
    return {
      isMatch: true,
      confidence: 1.0,
      feedbackTip: '🙌 Both hands raised! Hold them high...',
      reason: `Both hands raised high (${raisedCount} hands verified, hold frame ${handsRaisedConsecutiveFrames})`,
    }
  }

  handsRaisedConsecutiveFrames = 0
  return {
    isMatch: false,
    confidence: raisedCount === 1 ? 0.6 : 0.3,
    feedbackTip: 'Raise both hands higher in the air!',
    reason: `${raisedCount}/2 hands raised high enough`,
  }
}

export interface ClapCheckResult {
  isMatch: boolean
  confidence: number
  feedbackTip: string
  reason: string
}

function checkClapHands(landmarksList: NormalizedLandmark[][]): ClapCheckResult {
  if (landmarksList.length < 2) {
    return {
      isMatch: false,
      confidence: landmarksList.length === 1 ? 0.3 : 0,
      feedbackTip: 'Bring both hands together in front of the camera!',
      reason: `Only ${landmarksList.length}/2 hands in view`,
    }
  }

  const hand1 = landmarksList[0]
  const hand2 = landmarksList[1]
  const w1 = hand1[WRIST]
  const w2 = hand2[WRIST]
  const m1 = hand1[MIDDLE_MCP]
  const m2 = hand2[MIDDLE_MCP]

  if (!w1 || !w2 || !m1 || !m2) {
    return {
      isMatch: false,
      confidence: 0,
      feedbackTip: 'Bring both hands together in front of the camera!',
      reason: 'Missing wrist landmarks',
    }
  }

  const wristDist = Math.hypot(w1.x - w2.x, w1.y - w2.y)
  const palmDist = Math.hypot(m1.x - m2.x, m1.y - m2.y)

  if (wristDist < 0.35 && palmDist < 0.32) {
    return {
      isMatch: true,
      confidence: 1.0,
      feedbackTip: '👏 Clapping detected! Hold hands together...',
      reason: `Clap confirmed (palmDist: ${palmDist.toFixed(2)})`,
    }
  }

  return {
    isMatch: false,
    confidence: 0.4,
    feedbackTip: 'Bring both hands together in front of the camera!',
    reason: `Hands separated (palmDist: ${palmDist.toFixed(2)} >= 0.32)`,
  }
}

export interface WiggleCheckResult {
  isMatch: boolean
  confidence: number
  feedbackTip: string
  reason: string
}

function checkWiggleMotion(landmarksList: NormalizedLandmark[][]): WiggleCheckResult {
  const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()

  if (landmarksList.length === 0) {
    recentWiggleVariances.length = 0
    wiggleCompletedUntil = 0
    return {
      isMatch: false,
      confidence: 0,
      feedbackTip: 'Wiggle your fingers at the camera!',
      reason: 'No hand detected',
    }
  }

  if (now < wiggleCompletedUntil) {
    return {
      isMatch: true,
      confidence: 1.0,
      feedbackTip: '🖐️ Finger wiggle detected! Keep wiggling...',
      reason: 'Wiggle confirmed (in motion)',
    }
  }

  const lm = landmarksList[0]
  const wrist = lm[WRIST]
  const indexTip = lm[INDEX_TIP]
  const middleTip = lm[MIDDLE_TIP]
  const ringTip = lm[RING_TIP]
  const pinkyTip = lm[PINKY_TIP]

  if (!wrist || !indexTip || !middleTip || !ringTip || !pinkyTip) {
    return {
      isMatch: false,
      confidence: 0,
      feedbackTip: 'Wiggle your fingers at the camera!',
      reason: 'Missing fingertip landmarks',
    }
  }

  if (wrist.y > 0.88) {
    return {
      isMatch: false,
      confidence: 0.1,
      feedbackTip: 'Raise your hand higher to wiggle fingers!',
      reason: 'Hand too low in frame',
    }
  }

  const spread =
    Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y) +
    Math.hypot(middleTip.x - ringTip.x, middleTip.y - ringTip.y) +
    Math.hypot(ringTip.x - pinkyTip.x, ringTip.y - pinkyTip.y)

  recentWiggleVariances.push(spread)
  if (recentWiggleVariances.length > 18) {
    recentWiggleVariances.shift()
  }

  if (recentWiggleVariances.length < 5) {
    return {
      isMatch: false,
      confidence: 0.2,
      feedbackTip: 'Wiggle your fingers at the camera!',
      reason: `Accumulating wiggle frames (${recentWiggleVariances.length}/5)`,
    }
  }

  let totalDiff = 0
  for (let i = 1; i < recentWiggleVariances.length; i++) {
    totalDiff += Math.abs(recentWiggleVariances[i] - recentWiggleVariances[i - 1])
  }

  if (totalDiff >= 0.034) {
    wiggleCompletedUntil = now + 400
    return {
      isMatch: true,
      confidence: 1.0,
      feedbackTip: '🖐️ Finger wiggle detected! Keep wiggling...',
      reason: `Wiggle confirmed (motion variance: ${totalDiff.toFixed(3)} >= 0.034)`,
    }
  }

  return {
    isMatch: false,
    confidence: 0.3,
    feedbackTip: 'Wiggle your fingers at the camera!',
    reason: `Fingers stationary (variance: ${totalDiff.toFixed(3)} < 0.034)`,
  }
}

export interface DareDebugDetails {
  actionType: HandActionType
  handsCount: number
  landmarksReceived: boolean
  reason: string
  waveReversals?: number
  waveTravelDistance?: number
}

export interface VerificationResult {
  isMatch: boolean
  confidence: number
  feedbackTip: string
  debugDetails: DareDebugDetails
}

/**
 * Verifies if the camera-detected hand landmarks match the required action dare.
 * Strictly separates gestures, distinguishes finger combinations, and never
 * confirms a dare using hand visibility alone or unhandled defaults.
 */
export function verifyDareAction(
  actionType: HandActionType,
  landmarksList: NormalizedLandmark[][] | null | undefined
): VerificationResult {
  if (!landmarksList || landmarksList.length === 0 || !landmarksList[0]) {
    const defaultTip =
      actionType === 'raise_hands' || actionType === 'clap_hands'
        ? 'Raise both hands up high in view of the camera!'
        : 'Show your hand clearly to the camera.'
    return {
      isMatch: false,
      confidence: 0,
      feedbackTip: defaultTip,
      debugDetails: {
        actionType,
        handsCount: 0,
        landmarksReceived: false,
        reason: 'No hand detected in camera view',
      },
    }
  }

  let isMatch = false
  let confidence = 0
  let feedbackTip = ''
  let reason = ''
  let waveReversals: number | undefined
  let waveTravelDistance: number | undefined

  switch (actionType) {
    // 1. Middle finger + ring finger extended together
    case 'middle_ring': {
      let matched = false
      let bestReason = 'Extend middle and ring fingers together, curl index & pinky'
      for (const lm of landmarksList) {
        const res = checkMiddleRingTogether(lm)
        if (res.isMatch) {
          matched = true
          bestReason = res.reason
          break
        }
        bestReason = res.reason
      }
      isMatch = matched
      confidence = isMatch ? 1.0 : 0
      feedbackTip = isMatch
        ? '🤞 Middle + Ring fingers detected! Hold steady...'
        : 'Extend your middle and ring fingers together (fold index & pinky)!'
      reason = bestReason
      break
    }

    // 2. Index finger + middle finger extended together (Peace Sign / V)
    case 'peace_sign':
    case 'index_middle': {
      let matched = false
      let bestReason = 'Show index and middle fingers in a V sign'
      for (const lm of landmarksList) {
        const res = checkIndexMiddleTogether(lm)
        if (res.isMatch) {
          matched = true
          bestReason = res.reason
          break
        }
        bestReason = res.reason
      }
      isMatch = matched
      confidence = isMatch ? 1.0 : 0
      feedbackTip = isMatch
        ? '✌️ Peace sign detected! Hold steady...'
        : 'Show two fingers in a V sign (Index + Middle)!'
      reason = bestReason
      break
    }

    // 3. Open Palm
    case 'open_palms': {
      let matched = false
      let bestReason = 'Open all fingers facing the camera'
      for (const lm of landmarksList) {
        const res = checkOpenPalm(lm)
        if (res.isMatch) {
          matched = true
          bestReason = res.reason
          break
        }
        bestReason = res.reason
      }
      isMatch = matched
      confidence = isMatch ? 1.0 : 0
      feedbackTip = isMatch
        ? '✋ Open palm detected! Hold steady...'
        : 'Hold up an open palm facing the camera!'
      reason = bestReason
      break
    }

    // 4. Thumbs Up
    case 'thumbs_up': {
      let matched = false
      let bestReason = 'Thumb not pointing up or fingers not curled'
      for (const lm of landmarksList) {
        const res = checkSingleThumbsUp(lm)
        if (res.isMatch) {
          matched = true
          bestReason = res.reason
          break
        }
        bestReason = res.reason
      }
      isMatch = matched
      confidence = isMatch ? 1.0 : 0
      feedbackTip = isMatch
        ? '👍 Thumbs-Up detected! Hold steady...'
        : 'Show a clear thumbs-up to the camera!'
      reason = bestReason
      break
    }

    // 5. Horizontal Hand Waving
    case 'wave_hands': {
      const result = checkWaveMotion(landmarksList)
      isMatch = result.isMatch
      confidence = result.confidence
      feedbackTip = result.feedbackTip
      reason = result.reason
      waveReversals = result.reversals
      waveTravelDistance = result.totalTravel
      break
    }

    case 'raise_hands': {
      const result = verifyRaiseBothHands(landmarksList)
      isMatch = result.isMatch
      confidence = result.confidence
      feedbackTip = result.feedbackTip
      reason = result.reason
      break
    }

    case 'clap_hands': {
      const result = checkClapHands(landmarksList)
      isMatch = result.isMatch
      confidence = result.confidence
      feedbackTip = result.feedbackTip
      reason = result.reason
      break
    }

    case 'point_finger': {
      let matched = false
      let bestReason = 'Point index finger forward'
      for (const lm of landmarksList) {
        const res = checkPointing(lm)
        if (res.isMatch) {
          matched = true
          bestReason = res.reason
          break
        }
        bestReason = res.reason
      }
      isMatch = matched
      confidence = isMatch ? 1.0 : 0
      feedbackTip = isMatch
        ? '👉 Pointing detected! Hold steady...'
        : 'Point your index finger forward at the camera!'
      reason = bestReason
      break
    }

    case 'wiggle_fingers': {
      const result = checkWiggleMotion(landmarksList)
      isMatch = result.isMatch
      confidence = result.confidence
      feedbackTip = result.feedbackTip
      reason = result.reason
      break
    }

    default: {
      // NEVER identify a gesture automatically or fall back to open palm!
      isMatch = false
      confidence = 0
      feedbackTip = 'Perform the required action in front of the camera.'
      reason = 'Unknown or unconfigured dare action'
      break
    }
  }

  return {
    isMatch,
    confidence: confidence > 0 ? confidence : (isMatch ? 1.0 : 0),
    feedbackTip,
    debugDetails: {
      actionType,
      handsCount: landmarksList.length,
      landmarksReceived: true,
      reason,
      waveReversals,
      waveTravelDistance,
    },
  }
}
