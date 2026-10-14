import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'

// Official MediaPipe hand landmark model URL (Float16)
export const OFFICIAL_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

// Fallback local model path in public directory for offline resilience
export const LOCAL_MODEL_URL = '/models/hand_landmarker.task'

// Official CDN Wasm base path
export const OFFICIAL_WASM_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm'

// Fallback local Wasm path in public directory
export const LOCAL_WASM_PATH = '/wasm'

// Hand landmarks connection graph (21 landmarks)
export const HAND_CONNECTIONS: Array<{ start: number; end: number }> =
  HandLandmarker.HAND_CONNECTIONS || [
    { start: 0, end: 1 },
    { start: 1, end: 2 },
    { start: 2, end: 3 },
    { start: 3, end: 4 }, // Thumb
    { start: 0, end: 5 },
    { start: 5, end: 6 },
    { start: 6, end: 7 },
    { start: 7, end: 8 }, // Index
    { start: 5, end: 9 },
    { start: 9, end: 10 },
    { start: 10, end: 11 },
    { start: 11, end: 12 }, // Middle
    { start: 9, end: 13 },
    { start: 13, end: 14 },
    { start: 14, end: 15 },
    { start: 15, end: 16 }, // Ring
    { start: 13, end: 17 },
    { start: 0, end: 17 },
    { start: 17, end: 18 },
    { start: 18, end: 19 },
    { start: 19, end: 20 }, // Pinky
  ]

let cachedLandmarker: HandLandmarker | null = null

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMsg)), ms)
    promise
      .then((res) => {
        clearTimeout(timer)
        resolve(res)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

/**
 * Initializes MediaPipe HandLandmarker in VIDEO mode to detect up to two hands.
 * Attempts GPU delegate first, with automatic fallback to CPU,
 * and tries local cached model with fallback to CDN model.
 * Each step is guarded by a strict timeout to prevent infinite loading.
 */
export async function initHandTracker(
  onProgress?: (message: string) => void
): Promise<HandLandmarker> {
  if (cachedLandmarker) {
    return cachedLandmarker
  }

  onProgress?.('Loading MediaPipe Vision Wasm runtime...')

  // Step 1: Resolve Wasm Fileset (try local /wasm first for instant offline/LAN loading, fallback to CDN)
  let wasmFileset
  const localWasmUrl =
    typeof window !== 'undefined'
      ? new URL(LOCAL_WASM_PATH, window.location.origin).href
      : LOCAL_WASM_PATH

  try {
    wasmFileset = await withTimeout(
      FilesetResolver.forVisionTasks(localWasmUrl),
      6000,
      'Local /wasm runtime load timed out'
    )
  } catch (localWasmErr) {
    console.warn('Local /wasm fileset failed or timed out, attempting official CDN wasm...', localWasmErr)
    try {
      wasmFileset = await withTimeout(
        FilesetResolver.forVisionTasks(OFFICIAL_WASM_PATH),
        5000,
        'CDN wasm runtime load timed out'
      )
    } catch (cdnWasmErr) {
      throw new Error(
        'Failed to initialize MediaPipe Wasm runtime from both local and CDN sources: ' +
          (cdnWasmErr instanceof Error ? cdnWasmErr.message : String(cdnWasmErr))
      )
    }
  }

  onProgress?.('Fetching Hand Landmark Model (detecting up to 2 hands)...')

  // Step 2: Try creating HandLandmarker with GPU delegate first, then CPU
  const tryCreate = async (modelPath: string, delegate: 'GPU' | 'CPU') => {
    return await withTimeout(
      HandLandmarker.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: delegate,
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }),
      6000,
      `HandLandmarker creation with ${delegate} delegate timed out`
    )
  }

  const localModelUrl =
    typeof window !== 'undefined'
      ? new URL(LOCAL_MODEL_URL, window.location.origin).href
      : LOCAL_MODEL_URL

  try {
    // Attempt 1: Local Model + GPU
    try {
      cachedLandmarker = await tryCreate(localModelUrl, 'GPU')
      return cachedLandmarker
    } catch (localGpuErr) {
      console.warn('Local GPU delegate failed, trying local CPU delegate...', localGpuErr)
      try {
        // Attempt 2: Local Model + CPU
        cachedLandmarker = await tryCreate(localModelUrl, 'CPU')
        return cachedLandmarker
      } catch (localCpuErr) {
        console.warn('Local model load failed, falling back to official CDN...', localCpuErr)
        // Attempt 3: Official CDN + GPU / CPU
        try {
          cachedLandmarker = await tryCreate(OFFICIAL_MODEL_URL, 'GPU')
          return cachedLandmarker
        } catch {
          cachedLandmarker = await tryCreate(OFFICIAL_MODEL_URL, 'CPU')
          return cachedLandmarker
        }
      }
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error during HandLandmarker creation'
    throw new Error(`MediaPipe model initialization failed: ${errorMsg}`)
  }
}

let lastDetectTimestamp = 0

/**
 * Perform hand landmark detection on an active video frame.
 */
export function detectHands(
  landmarker: HandLandmarker,
  video: HTMLVideoElement,
  timestamp: number
): HandLandmarkerResult | null {
  // Ensure video is playing and has decoded dimensions
  if (video.readyState < 2 || video.videoWidth === 0 || video.paused || video.ended) {
    return null
  }

  // Ensure timestamps are strictly monotonically increasing
  const safeTimestamp = Math.max(timestamp, lastDetectTimestamp + 1)
  lastDetectTimestamp = safeTimestamp

  try {
    return landmarker.detectForVideo(video, safeTimestamp)
  } catch (err) {
    console.error('Hand landmark detection error:', err)
    return null
  }
}

/**
 * Draws magical cyber-fantasy hand landmarks and connections on the canvas.
 * Handles video mirror transformation so user sees their own hands naturally.
 */
export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarksList: NormalizedLandmark[][],
  canvasWidth: number,
  canvasHeight: number,
  isMirrored: boolean = true
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  if (!landmarksList || landmarksList.length === 0) {
    return
  }

  // Fantasy themes for Hand 1 (Cyan Astral) and Hand 2 (Purple Void)
  const handThemes = [
    {
      lineColor: 'rgba(56, 189, 248, 0.85)',
      glowColor: '#00f0ff',
      nodeFill: '#ffffff',
      tipGlow: '#fde047', // Gold fingertip sparkles
      label: 'HAND I (ASTRAL)',
    },
    {
      lineColor: 'rgba(192, 132, 252, 0.85)',
      glowColor: '#c084fc',
      nodeFill: '#ffffff',
      tipGlow: '#f43f5e', // Ruby fingertip sparkles
      label: 'HAND II (VOID)',
    },
  ]

  landmarksList.forEach((landmarks, handIndex) => {
    const theme = handThemes[handIndex % handThemes.length]

    // Helper to get canvas (x, y) with optional horizontal mirror
    const getPos = (lm: NormalizedLandmark) => {
      const x = isMirrored ? (1 - lm.x) * canvasWidth : lm.x * canvasWidth
      const y = lm.y * canvasHeight
      return { x, y }
    }

    // 1. Draw glowing connecting lines
    ctx.save()
    ctx.lineWidth = 3
    ctx.strokeStyle = theme.lineColor
    ctx.shadowColor = theme.glowColor
    ctx.shadowBlur = 10
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    HAND_CONNECTIONS.forEach(({ start, end }) => {
      const p1 = landmarks[start]
      const p2 = landmarks[end]
      if (p1 && p2) {
        const { x: x1, y: y1 } = getPos(p1)
        const { x: x2, y: y2 } = getPos(p2)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    })
    ctx.restore()

    // 2. Draw landmark dots with magic node aura
    landmarks.forEach((lm, index) => {
      const { x, y } = getPos(lm)
      const isFingertip = [4, 8, 12, 16, 20].includes(index)
      const isWrist = index === 0

      ctx.save()

      if (isFingertip) {
        // Radiant fingertip node
        ctx.beginPath()
        ctx.arc(x, y, 6.5, 0, Math.PI * 2)
        ctx.fillStyle = theme.tipGlow
        ctx.shadowColor = theme.tipGlow
        ctx.shadowBlur = 15
        ctx.fill()

        // Inner white star point
        ctx.beginPath()
        ctx.arc(x, y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      } else if (isWrist) {
        // Wrist root crystal
        ctx.beginPath()
        ctx.arc(x, y, 5.5, 0, Math.PI * 2)
        ctx.fillStyle = theme.glowColor
        ctx.shadowColor = theme.glowColor
        ctx.shadowBlur = 12
        ctx.fill()
      } else {
        // Standard joint node
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = theme.nodeFill
        ctx.shadowColor = theme.glowColor
        ctx.shadowBlur = 8
        ctx.fill()
      }

      ctx.restore()
    })

    // 3. Draw hand label tag near the wrist
    if (landmarks[0]) {
      const wrist = getPos(landmarks[0])
      ctx.save()
      ctx.font = '600 11px Outfit, sans-serif'
      ctx.fillStyle = theme.glowColor
      ctx.shadowColor = '#000000'
      ctx.shadowBlur = 6
      ctx.textAlign = 'center'
      ctx.fillText(theme.label, wrist.x, Math.min(canvasHeight - 8, wrist.y + 20))
      ctx.restore()
    }
  })
}
