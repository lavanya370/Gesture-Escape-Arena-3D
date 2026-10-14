import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { HandActionType } from '../types/riddles'

// Landmark index constants
const WRIST = 0
const THUMB_MCP = 2
const THUMB_IP = 3
const THUMB_TIP = 4

const INDEX_MCP = 5
const INDEX_PIP = 6
const INDEX_TIP = 8

const MIDDLE_MCP = 9
const MIDDLE_PIP = 10
const MIDDLE_TIP = 12

const RING_MCP = 13
const RING_PIP = 14
const RING_TIP = 16

const PINKY_MCP = 17
const PINKY_PIP = 18
const PINKY_TIP = 20

interface MotionPoint {
  x: number
  y: number
  time: number
}

// Recent wrist positions for wave detection
const recentWristHistory: MotionPoint[] = []

// Recent fingertip relative speeds for wiggle detection
const recentTipDistances: number[] = []

export function resetActionMotionHistory() {
  recentWristHistory.length = 0
  recentTipDistances.length = 0
}


/**
 * Checks if a specific hand is performing a thumbs-up:
 * - Thumb pointing upwards (tip above IP and MCP)
 * - All other 4 fingers curled inward (tips below PIPs)
 */
function checkSingleThumbsUp(lm: NormalizedLandmark[]): boolean {
  const thumbTip = lm[THUMB_TIP]
  const thumbIp = lm[THUMB_IP]
  const thumbMcp = lm[THUMB_MCP]
  const indexTip = lm[INDEX_TIP]
  const indexPip = lm[INDEX_PIP]
  const middleTip = lm[MIDDLE_TIP]
  const middlePip = lm[MIDDLE_PIP]
  const ringTip = lm[RING_TIP]
  const ringPip = lm[RING_PIP]
  const pinkyTip = lm[PINKY_TIP]
  const pinkyPip = lm[PINKY_PIP]
  const indexMcp = lm[INDEX_MCP]
  const wrist = lm[WRIST]

  if (!thumbTip || !thumbIp || !thumbMcp || !indexTip || !indexPip || !middleTip || !middlePip || !wrist || !indexMcp) {
    return false
  }

  // Thumb tip is clearly above thumb IP and MCP (lower y = higher up)
  const isThumbPointingUp = thumbTip.y < thumbIp.y - 0.02 && thumbTip.y < thumbMcp.y - 0.03
  const isThumbAboveIndex = thumbTip.y < indexMcp.y - 0.02

  // Other four fingers are curled in towards palm (tip y >= pip y - 0.03)
  const isIndexCurled = indexTip.y > indexPip.y - 0.03
  const isMiddleCurled = middleTip.y > middlePip.y - 0.03
  const isRingCurled = ringTip ? ringTip.y > ringPip.y - 0.03 : true
  const isPinkyCurled = pinkyTip ? pinkyTip.y > pinkyPip.y - 0.03 : true

  // At least 3 of the 4 fingers are curled (forgiving for students)
  const curledCount = (isIndexCurled ? 1 : 0) + (isMiddleCurled ? 1 : 0) + (isRingCurled ? 1 : 0) + (isPinkyCurled ? 1 : 0)

  return isThumbPointingUp && isThumbAboveIndex && curledCount >= 3
}

/**
 * Checks if hands are raised high in the view:
 * Wrist is elevated in upper portion of frame
 */
function checkHandsRaised(landmarksList: NormalizedLandmark[][]): boolean {
  if (landmarksList.length === 0) return false

  for (const lm of landmarksList) {
    const wrist = lm[WRIST]
    const indexTip = lm[INDEX_TIP]
    const middleTip = lm[MIDDLE_TIP]
    if (wrist && indexTip && middleTip) {
      // Hand is clearly in the upper half or high view
      if (wrist.y < 0.52 && (indexTip.y < 0.40 || middleTip.y < 0.40)) {
        return true
      }
    }
  }

  return false
}

/**
 * Checks if two hands are clapping or brought together:
 * - 2 hands detected
 * - Wrists and palm centers are close to each other
 */
function checkClapHands(landmarksList: NormalizedLandmark[][]): boolean {
  if (landmarksList.length < 2) return false

  const hand1 = landmarksList[0]
  const hand2 = landmarksList[1]
  const w1 = hand1[WRIST]
  const w2 = hand2[WRIST]
  const m1 = hand1[MIDDLE_MCP]
  const m2 = hand2[MIDDLE_MCP]

  if (!w1 || !w2 || !m1 || !m2) return false

  const wristDist = Math.hypot(w1.x - w2.x, w1.y - w2.y)
  const palmDist = Math.hypot(m1.x - m2.x, m1.y - m2.y)

  // Both hands are touching or within clapping distance
  return wristDist < 0.35 && palmDist < 0.32
}

/**
 * Checks for side-to-side waving motion:
 * Hand is raised and oscillating horizontally
 */
function checkWaving(landmarksList: NormalizedLandmark[][]): boolean {
  if (landmarksList.length === 0) return false

  const hand = landmarksList[0]
  const wrist = hand[WRIST]
  const indexTip = hand[INDEX_TIP]
  if (!wrist || !indexTip) return false

  // Hand should be elevated
  if (wrist.y > 0.75) return false

  const now = performance.now()
  recentWristHistory.push({ x: wrist.x, y: wrist.y, time: now })

  // Keep last 1.2 seconds of movement
  while (recentWristHistory.length > 0 && now - recentWristHistory[0].time > 1200) {
    recentWristHistory.shift()
  }

  if (recentWristHistory.length < 8) return false

  // Count horizontal direction reversals
  let reversals = 0
  let totalDeltaX = 0
  let prevDir = 0

  for (let i = 1; i < recentWristHistory.length; i++) {
    const dx = recentWristHistory[i].x - recentWristHistory[i - 1].x
    totalDeltaX += Math.abs(dx)
    const dir = dx > 0.006 ? 1 : dx < -0.006 ? -1 : 0
    if (dir !== 0) {
      if (prevDir !== 0 && dir !== prevDir) {
        reversals++
      }
      prevDir = dir
    }
  }

  return reversals >= 2 && totalDeltaX > 0.10
}

/**
 * Checks for open palm:
 * All 4 fingers extended above their PIP and MCP joints
 */
function checkOpenPalm(lm: NormalizedLandmark[]): boolean {
  const wrist = lm[WRIST]
  const indexTip = lm[INDEX_TIP]
  const indexPip = lm[INDEX_PIP]
  const indexMcp = lm[INDEX_MCP]
  const middleTip = lm[MIDDLE_TIP]
  const middlePip = lm[MIDDLE_PIP]
  const middleMcp = lm[MIDDLE_MCP]
  const ringTip = lm[RING_TIP]
  const ringPip = lm[RING_PIP]
  const ringMcp = lm[RING_MCP]
  const pinkyTip = lm[PINKY_TIP]
  const pinkyPip = lm[PINKY_PIP]
  const pinkyMcp = lm[PINKY_MCP]

  if (!wrist || !indexTip || !indexPip || !middleTip || !middlePip || !ringTip || !ringPip || !pinkyTip || !pinkyPip) {
    return false
  }

  // Fingers are extended away from wrist
  const iExt = indexTip.y < indexPip.y && indexTip.y < indexMcp.y
  const mExt = middleTip.y < middlePip.y && middleTip.y < middleMcp.y
  const rExt = ringTip.y < ringPip.y && ringTip.y < ringMcp.y
  const pExt = pinkyTip.y < pinkyPip.y && pinkyTip.y < pinkyMcp.y

  const extendedCount = (iExt ? 1 : 0) + (mExt ? 1 : 0) + (rExt ? 1 : 0) + (pExt ? 1 : 0)
  const spreadDist = Math.hypot(indexTip.x - pinkyTip.x, indexTip.y - pinkyTip.y)

  return extendedCount >= 3 && spreadDist > 0.08
}

/**
 * Checks for peace sign (V sign):
 * Index and middle fingers extended, ring and pinky curled
 */
function checkPeaceSign(lm: NormalizedLandmark[]): boolean {
  const indexTip = lm[INDEX_TIP]
  const indexPip = lm[INDEX_PIP]
  const middleTip = lm[MIDDLE_TIP]
  const middlePip = lm[MIDDLE_PIP]
  const ringTip = lm[RING_TIP]
  const ringPip = lm[RING_PIP]
  const pinkyTip = lm[PINKY_TIP]
  const pinkyPip = lm[PINKY_PIP]

  if (!indexTip || !indexPip || !middleTip || !middlePip || !ringTip || !ringPip || !pinkyTip || !pinkyPip) {
    return false
  }

  const indexExt = indexTip.y < indexPip.y - 0.02
  const middleExt = middleTip.y < middlePip.y - 0.02
  const ringCurled = ringTip.y > ringPip.y - 0.03
  const pinkyCurled = pinkyTip.y > pinkyPip.y - 0.03

  const tipDist = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y)

  return indexExt && middleExt && ringCurled && pinkyCurled && tipDist > 0.035
}

/**
 * Checks for pointing gesture:
 * Index finger extended, middle and other fingers curled
 */
function checkPointing(lm: NormalizedLandmark[]): boolean {
  const wrist = lm[WRIST]
  const indexTip = lm[INDEX_TIP]
  const indexPip = lm[INDEX_PIP]
  const middleTip = lm[MIDDLE_TIP]
  const ringTip = lm[RING_TIP]
  const pinkyTip = lm[PINKY_TIP]

  if (!wrist || !indexTip || !indexPip || !middleTip || !ringTip || !pinkyTip) {
    return false
  }

  const distIndex = Math.hypot(wrist.x - indexTip.x, wrist.y - indexTip.y)
  const distMiddle = Math.hypot(wrist.x - middleTip.x, wrist.y - middleTip.y)
  const distRing = Math.hypot(wrist.x - ringTip.x, wrist.y - ringTip.y)

  const isIndexLonger = distIndex > distMiddle + 0.04 && distIndex > distRing + 0.04

  return isIndexLonger && indexTip.y < indexPip.y + 0.04
}

/**
 * Checks for finger wiggling:
 * Open hand with active relative finger tip movement
 */
function checkFingerWiggle(lm: NormalizedLandmark[]): boolean {
  if (!checkOpenPalm(lm)) return false

  const wrist = lm[WRIST]
  const indexTip = lm[INDEX_TIP]
  const pinkyTip = lm[PINKY_TIP]
  if (!wrist || !indexTip || !pinkyTip) return false

  const dist = Math.hypot(indexTip.x - pinkyTip.x, indexTip.y - pinkyTip.y)
  recentTipDistances.push(dist)
  if (recentTipDistances.length > 25) {
    recentTipDistances.shift()
  }

  if (recentTipDistances.length < 8) return false

  let diffSum = 0
  for (let i = 1; i < recentTipDistances.length; i++) {
    diffSum += Math.abs(recentTipDistances[i] - recentTipDistances[i - 1])
  }

  return diffSum > 0.035
}

export interface VerificationResult {
  isMatch: boolean
  confidence: number
  feedbackTip: string
}

/**
 * Verifies if the camera-detected hand landmarks match the required action dare.
 */
export function verifyDareAction(
  actionType: HandActionType,
  landmarksList: NormalizedLandmark[][] | null | undefined
): VerificationResult {
  if (!landmarksList || landmarksList.length === 0 || !landmarksList[0]) {
    return {
      isMatch: false,
      confidence: 0,
      feedbackTip: 'Hold your hand up in front of the camera to begin!',
    }
  }

  let isMatch = false
  let feedbackTip = ''

  switch (actionType) {
    case 'thumbs_up': {
      isMatch = landmarksList.some((lm) => checkSingleThumbsUp(lm))
      feedbackTip = isMatch ? '👍 Thumbs-Up detected! Hold steady...' : 'Show a clear thumbs-up to the camera!'
      break
    }

    case 'raise_hands': {
      isMatch = checkHandsRaised(landmarksList)
      feedbackTip = isMatch ? '🙌 Hands raised! Hold them high...' : 'Raise both hands up high in view of the camera!'
      break
    }

    case 'clap_hands': {
      isMatch = checkClapHands(landmarksList)
      feedbackTip = isMatch ? '👏 Clapping detected! Great job...' : 'Bring both hands together in front of the camera!'
      break
    }

    case 'wave_hands': {
      isMatch = checkWaving(landmarksList)
      feedbackTip = isMatch ? '👋 Wave detected! Keep waving...' : 'Wave your hand side to side at the webcam!'
      break
    }

    case 'open_palms': {
      isMatch = landmarksList.some((lm) => checkOpenPalm(lm))
      feedbackTip = isMatch ? '✋ Open palm detected! Hold steady...' : 'Hold your open hand facing the camera!'
      break
    }

    case 'peace_sign': {
      isMatch = landmarksList.some((lm) => checkPeaceSign(lm))
      feedbackTip = isMatch ? '✌️ Peace sign detected! Hold steady...' : 'Show two fingers in a V peace sign!'
      break
    }

    case 'point_finger': {
      isMatch = landmarksList.some((lm) => checkPointing(lm))
      feedbackTip = isMatch ? '👉 Pointing detected! Hold steady...' : 'Point your index finger forward at the camera!'
      break
    }

    case 'wiggle_fingers': {
      isMatch = landmarksList.some((lm) => checkFingerWiggle(lm))
      feedbackTip = isMatch ? '🖐️ Finger wiggle detected! Keep wiggling...' : 'Wiggle your fingers in front of the camera!'
      break
    }

    default: {
      isMatch = landmarksList.some((lm) => checkOpenPalm(lm) || checkSingleThumbsUp(lm))
      feedbackTip = 'Show your hand action to the camera!'
      break
    }
  }

  return {
    isMatch,
    confidence: isMatch ? 1 : 0,
    feedbackTip,
  }
}
