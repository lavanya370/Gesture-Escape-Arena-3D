/**
 * Comprehensive Automated Test Suite for Gesture Verification,
 * Finger Combination Accuracy, Wave Detection, and Dare Progression.
 */

import {
  analyzeHandFingers,
  checkMiddleRingTogether,
  checkIndexMiddleTogether,
  checkOpenPalm,
  checkSingleThumbsUp,
  checkWaveMotion,
  verifyDareAction,
  resetActionMotionHistory,
} from '../vision/handActionVerifier.ts'
import { FUN_DARES_BY_RIDDLE_ID } from '../data/funDares.ts'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

interface Point3D {
  x: number
  y: number
  z: number
}

// Factory to create valid MediaPipe NormalizedLandmark with required visibility and optional presence
function makeNormalizedLandmark(
  x: number,
  y: number,
  z: number = 0,
  visibility: number = 1.0,
  presence: number = 1.0
): NormalizedLandmark {
  return { x, y, z, visibility, presence }
}

// Helper to create 21 hand landmarks based on finger extension parameters
function createHandLandmarks(options: {
  wrist?: Point3D
  thumbUp?: boolean
  thumbFolded?: boolean
  indexExtended?: boolean
  middleExtended?: boolean
  ringExtended?: boolean
  pinkyExtended?: boolean
  scale?: number
  offsetX?: number
  offsetY?: number
}): NormalizedLandmark[] {
  const scale = options.scale ?? 1.0
  const offX = options.offsetX ?? 0.5
  const offY = options.offsetY ?? 0.6

  const lm: NormalizedLandmark[] = new Array(21)

  // 0: Wrist
  lm[0] = makeNormalizedLandmark(
    options.wrist?.x ?? offX,
    options.wrist?.y ?? offY,
    options.wrist?.z ?? 0
  )

  // Knuckles (MCPs)
  // 5: Index MCP, 9: Middle MCP, 13: Ring MCP, 17: Pinky MCP
  lm[5] = makeNormalizedLandmark(offX - 0.05 * scale, offY - 0.15 * scale, 0)
  lm[9] = makeNormalizedLandmark(offX - 0.01 * scale, offY - 0.16 * scale, 0)
  lm[13] = makeNormalizedLandmark(offX + 0.03 * scale, offY - 0.15 * scale, 0)
  lm[17] = makeNormalizedLandmark(offX + 0.07 * scale, offY - 0.13 * scale, 0)

  // Thumb: 1: CMC, 2: MCP, 3: IP, 4: TIP
  if (options.thumbUp) {
    // Pointing straight up above wrist and knuckles
    lm[1] = makeNormalizedLandmark(offX - 0.04 * scale, offY - 0.06 * scale, 0)
    lm[2] = makeNormalizedLandmark(offX - 0.08 * scale, offY - 0.12 * scale, 0)
    lm[3] = makeNormalizedLandmark(offX - 0.09 * scale, offY - 0.18 * scale, 0)
    lm[4] = makeNormalizedLandmark(offX - 0.09 * scale, offY - 0.25 * scale, 0) // High tip
  } else if (options.thumbFolded) {
    // Tucked across the palm
    lm[1] = makeNormalizedLandmark(offX - 0.03 * scale, offY - 0.05 * scale, 0)
    lm[2] = makeNormalizedLandmark(offX - 0.04 * scale, offY - 0.08 * scale, 0)
    lm[3] = makeNormalizedLandmark(offX - 0.02 * scale, offY - 0.09 * scale, 0)
    lm[4] = makeNormalizedLandmark(offX, offY - 0.10 * scale, 0) // In palm
  } else {
    // Open spread thumb
    lm[1] = makeNormalizedLandmark(offX - 0.04 * scale, offY - 0.05 * scale, 0)
    lm[2] = makeNormalizedLandmark(offX - 0.08 * scale, offY - 0.08 * scale, 0)
    lm[3] = makeNormalizedLandmark(offX - 0.12 * scale, offY - 0.10 * scale, 0)
    lm[4] = makeNormalizedLandmark(offX - 0.16 * scale, offY - 0.11 * scale, 0)
  }

  // Finger builder helper
  const buildFinger = (
    mcpIdx: number,
    pipIdx: number,
    dipIdx: number,
    tipIdx: number,
    baseX: number,
    extended: boolean
  ) => {
    const mcpY = lm[mcpIdx].y
    if (extended) {
      lm[pipIdx] = makeNormalizedLandmark(baseX, mcpY - 0.08 * scale, 0)
      lm[dipIdx] = makeNormalizedLandmark(baseX, mcpY - 0.15 * scale, 0)
      lm[tipIdx] = makeNormalizedLandmark(baseX, mcpY - 0.22 * scale, 0)
    } else {
      // Curled into palm
      lm[pipIdx] = makeNormalizedLandmark(baseX, mcpY - 0.06 * scale, 0)
      lm[dipIdx] = makeNormalizedLandmark(baseX, mcpY - 0.03 * scale, 0.02)
      lm[tipIdx] = makeNormalizedLandmark(baseX, mcpY + 0.01 * scale, 0.03) // Tip below MCP
    }
  }

  // Index (5, 6, 7, 8)
  buildFinger(5, 6, 7, 8, lm[5].x, !!options.indexExtended)

  // Middle (9, 10, 11, 12)
  buildFinger(9, 10, 11, 12, lm[9].x, !!options.middleExtended)

  // Ring (13, 14, 15, 16)
  buildFinger(13, 14, 15, 16, lm[13].x, !!options.ringExtended)

  // Pinky (17, 18, 19, 20)
  buildFinger(17, 18, 19, 20, lm[17].x, !!options.pinkyExtended)

  return lm
}

let totalTests = 0
let passedTests = 0

function assert(condition: unknown, testName: string, detail?: string): asserts condition {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✓ PASS: ${testName}`)
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`)
    throw new Error(`Assertion failed for: ${testName}`)
  }
}

console.log('\n=== TEST SUITE 1: Finger Combination Verification ===')

// 1. Middle + Ring extended together
{
  const middleRingHand = createHandLandmarks({
    thumbFolded: true,
    indexExtended: false,
    middleExtended: true,
    ringExtended: true,
    pinkyExtended: false,
  })

  // Bring middle and ring tips close together as requested in the gesture definition
  middleRingHand[12].x = 0.505
  middleRingHand[16].x = 0.515

  const analysis = analyzeHandFingers(middleRingHand)
  assert(analysis !== null, 'Hand analysis computed successfully')
  assert(analysis.isMiddleExtended, 'Middle finger recognized as extended')
  assert(analysis.isRingExtended, 'Ring finger recognized as extended')
  assert(analysis.isIndexCurled, 'Index finger recognized as curled')
  assert(analysis.isPinkyCurled, 'Pinky finger recognized as curled')

  const resMiddleRing = checkMiddleRingTogether(middleRingHand)
  assert(resMiddleRing.isMatch, 'checkMiddleRingTogether returns isMatch = true for genuine pose')

  // Check that checkIndexMiddleTogether fails on middle+ring
  const resPeace = checkIndexMiddleTogether(middleRingHand)
  assert(!resPeace.isMatch, 'checkIndexMiddleTogether rejects middle+ring pose')

  // Check that checkOpenPalm fails on middle+ring
  const resOpen = checkOpenPalm(middleRingHand)
  assert(!resOpen.isMatch, 'checkOpenPalm rejects middle+ring pose')

  // Check verifyDareAction dispatcher
  const verifyRes = verifyDareAction('middle_ring', [middleRingHand])
  assert(verifyRes.isMatch, 'verifyDareAction matches "middle_ring"')
}

// 2. Index + Middle extended together (Peace sign / V-pose)
{
  const peaceHand = createHandLandmarks({
    thumbFolded: true,
    indexExtended: true,
    middleExtended: true,
    ringExtended: false,
    pinkyExtended: false,
  })

  const resPeace = checkIndexMiddleTogether(peaceHand)
  assert(resPeace.isMatch, 'checkIndexMiddleTogether returns isMatch = true for genuine pose')

  const resMiddleRing = checkMiddleRingTogether(peaceHand)
  assert(!resMiddleRing.isMatch, 'checkMiddleRingTogether rejects peace sign pose')

  const resOpen = checkOpenPalm(peaceHand)
  assert(!resOpen.isMatch, 'checkOpenPalm rejects peace sign pose')

  const verifyPeace = verifyDareAction('peace_sign', [peaceHand])
  assert(verifyPeace.isMatch, 'verifyDareAction matches "peace_sign"')

  const verifyIndexMiddle = verifyDareAction('index_middle', [peaceHand])
  assert(verifyIndexMiddle.isMatch, 'verifyDareAction matches "index_middle"')
}

// 3. Open Palm (All 5 extended)
{
  const openPalmHand = createHandLandmarks({
    thumbFolded: false,
    indexExtended: true,
    middleExtended: true,
    ringExtended: true,
    pinkyExtended: true,
  })

  const resOpen = checkOpenPalm(openPalmHand)
  assert(resOpen.isMatch, 'checkOpenPalm returns isMatch = true for open hand')

  const resMiddleRing = checkMiddleRingTogether(openPalmHand)
  assert(!resMiddleRing.isMatch, 'checkMiddleRingTogether rejects open palm')

  const resPeace = checkIndexMiddleTogether(openPalmHand)
  assert(!resPeace.isMatch, 'checkIndexMiddleTogether rejects open palm')

  const resThumbsUp = checkSingleThumbsUp(openPalmHand)
  assert(!resThumbsUp.isMatch, 'checkSingleThumbsUp rejects open palm')

  const verifyOpen = verifyDareAction('open_palms', [openPalmHand])
  assert(verifyOpen.isMatch, 'verifyDareAction matches "open_palms"')
}

// 4. Thumbs Up (Thumb high, all 4 fingers curled into fist)
{
  const thumbsUpHand = createHandLandmarks({
    thumbUp: true,
    indexExtended: false,
    middleExtended: false,
    ringExtended: false,
    pinkyExtended: false,
  })

  const resThumbsUp = checkSingleThumbsUp(thumbsUpHand)
  assert(resThumbsUp.isMatch, 'checkSingleThumbsUp returns isMatch = true for thumbs up')

  const resMiddleRing = checkMiddleRingTogether(thumbsUpHand)
  assert(!resMiddleRing.isMatch, 'checkMiddleRingTogether rejects thumbs up')

  const resPeace = checkIndexMiddleTogether(thumbsUpHand)
  assert(!resPeace.isMatch, 'checkIndexMiddleTogether rejects thumbs up')

  const resOpen = checkOpenPalm(thumbsUpHand)
  assert(!resOpen.isMatch, 'checkOpenPalm rejects thumbs up')

  const verifyThumbs = verifyDareAction('thumbs_up', [thumbsUpHand])
  assert(verifyThumbs.isMatch, 'verifyDareAction matches "thumbs_up"')
}

console.log('\n=== TEST SUITE 2: Wave Motion Detection & Camera Noise Filtering ===')

// 5. Stationary Hand should NOT trigger wave
{
  resetActionMotionHistory()
  const baseHand = createHandLandmarks({
    indexExtended: true,
    middleExtended: true,
    ringExtended: true,
    pinkyExtended: true,
  })

  let waveMatchFound = false
  for (let i = 0; i < 30; i++) {
    const res = checkWaveMotion([baseHand])
    if (res.isMatch) waveMatchFound = true
  }
  assert(!waveMatchFound, 'Stationary hand does NOT trigger wave motion')
}

// 6. Forward Motion (Hand pushing toward camera) should NOT trigger wave
{
  resetActionMotionHistory()
  let waveMatchFound = false
  for (let i = 0; i < 25; i++) {
    // Scale increases rapidly simulating moving toward camera, x barely fluctuates
    const forwardHand = createHandLandmarks({
      scale: 1.0 + i * 0.05,
      offsetX: 0.5 + (Math.random() - 0.5) * 0.002, // camera jitter
      indexExtended: true,
      middleExtended: true,
      ringExtended: true,
      pinkyExtended: true,
    })
    const res = checkWaveMotion([forwardHand])
    if (res.isMatch) waveMatchFound = true
  }
  assert(!waveMatchFound, 'Pushing hand toward camera is filtered out and does NOT trigger wave')
}

// 7. Genuine Horizontal Wave (Left -> Right -> Left) MUST trigger wave
{
  resetActionMotionHistory()
  let waveSucceeded = false

  // Wave cycle: oscillate x from 0.40 to 0.60 across frames
  const xTrajectory = [
    0.40, 0.44, 0.48, 0.53, 0.58, 0.60, // move right
    0.57, 0.52, 0.46, 0.41, 0.39,       // reversal 1: move left
    0.43, 0.48, 0.54, 0.59, 0.61        // reversal 2: move right
  ]

  for (const x of xTrajectory) {
    const hand = createHandLandmarks({
      offsetX: x,
      indexExtended: true,
      middleExtended: true,
      ringExtended: true,
      pinkyExtended: true,
    })
    const res = checkWaveMotion([hand])
    if (res.isMatch) {
      waveSucceeded = true
      break
    }
  }

  assert(waveSucceeded, 'Genuine horizontal wave motion across multiple reversals is successfully verified')
}

// 8. Hand Disappearance & Tracking Reset
{
  resetActionMotionHistory()
  // Run partial motion
  const hand = createHandLandmarks({ offsetX: 0.45, indexExtended: true, middleExtended: true, ringExtended: true, pinkyExtended: true })
  checkWaveMotion([hand])

  // Empty landmarks passed to verifyDareAction
  const verifyEmpty = verifyDareAction('wave_hands', [])
  assert(!verifyEmpty.isMatch, 'Empty landmarks return isMatch = false for wave_hands')
  assert(verifyEmpty.debugDetails?.reason.includes('No hand detected') || verifyEmpty.feedbackTip.includes('hand clearly'), 'Feedback accurately indicates no hand detected')
}

console.log('\n=== TEST SUITE 3: Dare Variety and Assignment Integrity ===')

// 9. Verify that fun dares have rich variety across riddles
{
  const dareActionsUsed = new Set<string>()
  const riddleIds = Object.keys(FUN_DARES_BY_RIDDLE_ID)

  assert(riddleIds.length >= 10, `At least 10 riddles have registered fun dares (found ${riddleIds.length})`)

  for (const id of riddleIds) {
    const dare = FUN_DARES_BY_RIDDLE_ID[id]
    assert(!!dare.id, `Riddle ${id} dare has a non-empty id`)
    assert(!!dare.actionType, `Riddle ${id} dare has an actionType`)
    assert(!!dare.title, `Riddle ${id} dare has non-empty title`)
    assert(!!dare.instruction, `Riddle ${id} dare has non-empty instruction`)
    assert(!!dare.hint, `Riddle ${id} dare has a helpful hint`)
    assert(!!dare.icon, `Riddle ${id} dare has an icon`)
    dareActionsUsed.add(dare.actionType)
  }

  console.log(`  Actions used across dares: ${Array.from(dareActionsUsed).join(', ')}`)
  assert(dareActionsUsed.has('thumbs_up'), 'thumbs_up is assigned to dares')
  assert(dareActionsUsed.has('peace_sign'), 'peace_sign is assigned to dares')
  assert(dareActionsUsed.has('open_palms'), 'open_palms is assigned to dares')
  assert(dareActionsUsed.has('wave_hands'), 'wave_hands is assigned to dares')
  assert(dareActionsUsed.has('clap_hands'), 'clap_hands is assigned to dares')
  assert(dareActionsUsed.size >= 5, `Dares use at least 5 different distinct gesture actions (used: ${dareActionsUsed.size})`)
}

console.log('\n=== TEST SUITE 4: Cross-Dare State Isolation & Auto-Completion Prevention ===')

// 10. Ensure stale open palm does not trigger middle_ring or thumbs_up
{
  const openPalm = createHandLandmarks({
    indexExtended: true,
    middleExtended: true,
    ringExtended: true,
    pinkyExtended: true,
    thumbFolded: false,
  })

  // Player shows open palm
  const verifyMR = verifyDareAction('middle_ring', [openPalm])
  assert(!verifyMR.isMatch, 'Open palm will NOT verify a middle_ring dare')

  const verifyThumbs = verifyDareAction('thumbs_up', [openPalm])
  assert(!verifyThumbs.isMatch, 'Open palm will NOT verify a thumbs_up dare')

  const verifyWave = verifyDareAction('wave_hands', [openPalm])
  assert(!verifyWave.isMatch, 'Static open palm will NOT verify a wave_hands dare')
}

console.log(`\n========================================`)
console.log(`All ${passedTests}/${totalTests} Automated Tests Passed Successfully!`)
console.log(`========================================\n`)
