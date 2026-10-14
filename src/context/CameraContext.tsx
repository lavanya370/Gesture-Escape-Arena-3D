import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { HandLandmarker } from '@mediapipe/tasks-vision'
import {
  initHandTracker,
  detectHands,
  drawHandLandmarks,
} from '../vision/handTracker'
import {
  gestureDetector,
  type GestureData,
} from '../vision/gestureDetector'
import { sound } from '../utils/audio'

export type CameraStatus =
  | 'idle'
  | 'requesting-permission'
  | 'loading-model'
  | 'active'
  | 'permission-denied'
  | 'unavailable'
  | 'error'

export interface CameraContextValue {
  status: CameraStatus
  statusMessage: string
  errorMessage: string | null
  detectedHandsCount: number
  isHandDetected: boolean
  isPinching: boolean
  handPositionX: number // 0.0 (far left) to 1.0 (far right)
  handPositionY: number // 0.0 (top) to 1.0 (bottom)
  currentGestureStatus: string
  isVisionHUDOpen: boolean
  isMinimized: boolean
  startCamera: () => Promise<boolean>
  stopCamera: () => void
  retryCamera: () => Promise<boolean>
  setIsVisionHUDOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>
  stream: MediaStream | null
  // Compatibility aliases
  isBodyDetected: boolean
  torsoPositionX: number
  calibrateBodyCenter: () => void
}

const CameraContext = createContext<CameraContextValue | null>(null)

export const useCamera = (): CameraContextValue => {
  const ctx = useContext(CameraContext)
  if (!ctx) {
    throw new Error('useCamera must be used within a CameraProvider')
  }
  return ctx
}

interface CameraProviderProps {
  children: ReactNode
}

export const CameraProvider: React.FC<CameraProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('Camera is idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Hand tracking states
  const [detectedHandsCount, setDetectedHandsCount] = useState<number>(0)
  const [isHandDetected, setIsHandDetected] = useState<boolean>(false)
  const [isPinching, setIsPinching] = useState<boolean>(false)
  const [handPositionX, setHandPositionX] = useState<number>(0.5)
  const [handPositionY, setHandPositionY] = useState<number>(0.5)
  const [currentGestureStatus, setCurrentGestureStatus] = useState<string>('NO HAND DETECTED')

  // HUD & Stream states
  const [isMinimized, setIsMinimized] = useState<boolean>(true)
  const [isVisionHUDOpen, setIsVisionHUDOpen] = useState<boolean>(true)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [videoAspect, setVideoAspect] = useState<string>('16 / 9')
  const prevAspectRef = useRef<string>('16 / 9')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)
  const animFrameIdRef = useRef<number | null>(null)
  const lastProcessedTimeRef = useRef<number>(-1)
  const lastTimestampRef = useRef<number>(0)

  // Guard against parallel or React StrictMode duplicate camera starts
  const initPromiseRef = useRef<Promise<boolean> | null>(null)

  // Synchronize stream to preview video element whenever stream, HUD visibility, or minimized state changes
  useEffect(() => {
    if (previewVideoRef.current && stream && previewVideoRef.current.srcObject !== stream) {
      previewVideoRef.current.srcObject = stream
      previewVideoRef.current.play().catch(() => {})
    }
  }, [stream, isVisionHUDOpen, isMinimized])

  // Refs to prevent unnecessary React root re-renders during 60fps tracking
  const prevHandsCountRef = useRef<number>(0)
  const prevHandDetectedRef = useRef<boolean>(false)
  const prevStatusMsgRef = useRef<string>('Camera is idle')
  const prevPinchingRef = useRef<boolean>(false)
  const prevGestureStatusRef = useRef<string>('NO HAND DETECTED')
  const prevHandPosRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 })

  // Subscribe to gestureDetector for real-time gesture data
  useEffect(() => {
    const unsub = gestureDetector.subscribe((data: GestureData) => {
      if (prevPinchingRef.current !== data.isPinching) {
        prevPinchingRef.current = data.isPinching
        setIsPinching(data.isPinching)
      }
      if (prevGestureStatusRef.current !== data.statusMessage) {
        prevGestureStatusRef.current = data.statusMessage
        setCurrentGestureStatus(data.statusMessage)
      }
      if (typeof window !== 'undefined' && window.innerWidth > 0) {
        const nx = Math.max(0, Math.min(1, data.cursorX / window.innerWidth))
        const ny = Math.max(0, Math.min(1, data.cursorY / window.innerHeight))
        if (
          Math.abs(nx - prevHandPosRef.current.x) > 0.04 ||
          Math.abs(ny - prevHandPosRef.current.y) > 0.04
        ) {
          prevHandPosRef.current = { x: nx, y: ny }
          setHandPositionX(nx)
          setHandPositionY(ny)
        }
      }
    })
    return () => unsub()
  }, [])

  // Continuous frame detection loop
  const runDetectionLoop = useCallback(function loop() {
    const video = videoRef.current
    const landmarker = handLandmarkerRef.current

    // Video must be ready with active decoded frames
    if (
      !video ||
      !landmarker ||
      video.paused ||
      video.ended ||
      video.readyState < 2 ||
      video.videoWidth === 0
    ) {
      animFrameIdRef.current = requestAnimationFrame(loop)
      return
    }

    // Only process when a new video frame has arrived
    if (video.currentTime !== lastProcessedTimeRef.current) {
      lastProcessedTimeRef.current = video.currentTime

      const now = performance.now()
      // MediaPipe Tasks-Vision requires strictly monotonically increasing timestamps
      const nextTimestamp = Math.max(now, lastTimestampRef.current + 1)
      lastTimestampRef.current = nextTimestamp

      const results = detectHands(landmarker, video, nextTimestamp)
      const handLandmarks = results?.landmarks || []

      // Update hands count and detection status only when changed
      const count = handLandmarks.length
      if (prevHandsCountRef.current !== count) {
        prevHandsCountRef.current = count
        setDetectedHandsCount(count)
      }
      const isDetected = count > 0
      if (prevHandDetectedRef.current !== isDetected) {
        prevHandDetectedRef.current = isDetected
        setIsHandDetected(isDetected)
      }
      const nextMsg = isDetected
        ? count > 1
          ? 'Hand Tracking Active (2 Hands)'
          : 'Hand Tracking Active'
        : 'Camera Ready • Hand Not Detected'
      if (prevStatusMsgRef.current !== nextMsg) {
        prevStatusMsgRef.current = nextMsg
        setStatusMessage(nextMsg)
      }

      // Feed detected hand landmarks into gestureDetector with viewport and camera frame dimensions
      const vw = typeof window !== 'undefined' ? (window.innerWidth || document.documentElement.clientWidth) : 1280
      const vh = typeof window !== 'undefined' ? (window.innerHeight || document.documentElement.clientHeight) : 720
      gestureDetector.processFrame(
        handLandmarks,
        vw,
        vh,
        video.videoWidth,
        video.videoHeight
      )

      // Draw cyber-fantasy hand skeleton on canvas overlay
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
          }
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const currentAspect = `${video.videoWidth} / ${video.videoHeight}`
            if (prevAspectRef.current !== currentAspect) {
              prevAspectRef.current = currentAspect
              setVideoAspect(currentAspect)
            }
          }
          drawHandLandmarks(ctx, handLandmarks, canvas.width, canvas.height, true)
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(loop)
  }, [])

  // Cleanly stop camera
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current)
      animFrameIdRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {
          console.warn('Error stopping track:', e)
        }
      })
      streamRef.current = null
      setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }

    lastProcessedTimeRef.current = -1
    lastTimestampRef.current = 0
    gestureDetector.reset()
    gestureDetector.processFrame(null)

    setDetectedHandsCount(0)
    setIsHandDetected(false)
    setIsPinching(false)
    setStatus('idle')
    setStatusMessage('Touch / Mouse Mode')
    setErrorMessage(null)
    initPromiseRef.current = null
  }, [])

  const calibrateBodyCenter = useCallback(() => {
    sound.playHover()
  }, [])

  // Start Camera - initializes stream and MediaPipe HandLandmarker once
  const startCamera = useCallback(async (): Promise<boolean> => {
    // If already active with tracks running, reuse
    if (streamRef.current && streamRef.current.active && status === 'active') {
      return true
    }

    // If already in the process of starting, return that exact promise
    if (initPromiseRef.current) {
      return initPromiseRef.current
    }

    // 1. Check if browser supports mediaDevices
    const hasMediaDevices =
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
    const isSecure = typeof window !== 'undefined' && window.isSecureContext

    // If mediaDevices is missing because of insecure HTTP on LAN:
    if (!hasMediaDevices || (!isSecure && !isLocalhost)) {
      setStatus('unavailable')
      setStatusMessage('Blocked by Insecure HTTP')
      const host = typeof window !== 'undefined' ? window.location.host : 'local network'
      setErrorMessage(
        `Webcam access blocked by browser security: Plain HTTP (http://${host}/) is not a Secure Context. ` +
        `To enable webcam hand tracking on Wi-Fi: 1) Run "npm run dev:https" and open https://${host}/ (accept dev certificate). ` +
        `2) Or test on this laptop via http://localhost:5173/. Mouse & touch fallback controls remain active!`
      )
      return false
    }

    const initPromise = (async () => {
      let timeoutTimer: ReturnType<typeof setTimeout> | null = null

      const timeoutPromise = new Promise<boolean>((_, reject) => {
        timeoutTimer = setTimeout(() => {
          reject(new Error('Camera initialization timed out after 12s. Check permissions or camera availability.'))
        }, 12000)
      })

      const executeSetup = async (): Promise<boolean> => {
        setStatus('requesting-permission')
        setStatusMessage('Requesting camera permission...')
        setErrorMessage(null)

        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            aspectRatio: { ideal: 16 / 9 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = mediaStream
        setStream(mediaStream)

        // Attach to permanent detection video element
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          try {
            await videoRef.current.play()
          } catch (playErr) {
            console.warn('Video play was delayed or queued:', playErr)
          }

          // Wait until video has loaded enough data to decode dimensions
          await new Promise<void>((resolve) => {
            const v = videoRef.current!
            if (v.readyState >= 2 && v.videoWidth > 0) {
              resolve()
              return
            }
            let done = false
            const onReady = () => {
              if (!done) {
                done = true
                v.removeEventListener('loadeddata', onReady)
                v.removeEventListener('canplay', onReady)
                v.removeEventListener('playing', onReady)
                resolve()
              }
            }
            v.addEventListener('loadeddata', onReady)
            v.addEventListener('canplay', onReady)
            v.addEventListener('playing', onReady)
            setTimeout(onReady, 1200)
          })
        }

        // Attach to preview video if currently rendered in DOM
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = mediaStream
          try {
            await previewVideoRef.current.play()
          } catch (playErr) {
            console.warn('Preview video play was delayed:', playErr)
          }
        }

        // Initialize MediaPipe HandLandmarker Model (detects up to 2 hands)
        setStatus('loading-model')
        setStatusMessage('Initializing Hand Landmark Neural Network...')

        const landmarker = await initHandTracker((msg) => {
          setStatusMessage(msg)
        })
        handLandmarkerRef.current = landmarker

        setStatus('active')
        setStatusMessage('Camera Ready • Hand Not Detected')
        sound.playStartSpell()

        // Kick off continuous detection loop
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current)
        }
        animFrameIdRef.current = requestAnimationFrame(runDetectionLoop)
        return true
      }

      try {
        return await Promise.race([executeSetup(), timeoutPromise])
      } catch (err: unknown) {
        console.error('Hand/Camera initialization error:', err)
        stopCamera()

        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setStatus('permission-denied')
          setStatusMessage('Camera Permission Denied')
          setErrorMessage(
            'Camera permission was denied. Allow camera in your browser address bar icon to enable hand tracking, or play with mouse/touch.'
          )
        } else if (err instanceof DOMException && err.name === 'NotFoundError') {
          setStatus('unavailable')
          setStatusMessage('Camera Unavailable')
          setErrorMessage(
            'No camera device detected on this system. Mouse and touch controls are fully functional!'
          )
        } else if (err instanceof DOMException && err.name === 'NotReadableError') {
          setStatus('unavailable')
          setStatusMessage('Camera In Use')
          setErrorMessage(
            'Camera is currently in use by another application. Close it and retry, or use mouse controls.'
          )
        } else if (err instanceof DOMException && err.name === 'SecurityError') {
          setStatus('unavailable')
          setStatusMessage('Insecure Context')
          setErrorMessage(
            'Browser blocked camera access due to insecure HTTP origin. Use https:// or http://localhost:5173.'
          )
        } else if (err instanceof Error) {
          setStatus('unavailable')
          setStatusMessage('Camera Unavailable')
          setErrorMessage(`${err.message}. Mouse and touch fallback controls are active!`)
        } else {
          setStatus('unavailable')
          setStatusMessage('Camera Unavailable')
          setErrorMessage('Failed to start hand tracker. Mouse & touch controls remain ready.')
        }
        return false
      } finally {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer)
        }
        initPromiseRef.current = null
      }
    })()

    initPromiseRef.current = initPromise
    return initPromise
  }, [runDetectionLoop, status, stopCamera])

  const retryCamera = useCallback(async (): Promise<boolean> => {
    stopCamera()
    return await startCamera()
  }, [startCamera, stopCamera])

  // Stop camera tracks only when the entire application unmounts
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const contextValue: CameraContextValue = {
    status,
    statusMessage,
    errorMessage,
    detectedHandsCount,
    isHandDetected,
    isPinching,
    handPositionX,
    handPositionY,
    currentGestureStatus,
    isVisionHUDOpen,
    isMinimized,
    startCamera,
    stopCamera,
    retryCamera,
    setIsVisionHUDOpen,
    setIsMinimized,
    stream,
    // Compatibility aliases
    isBodyDetected: isHandDetected,
    torsoPositionX: handPositionX,
    calibrateBodyCenter,
  }

  return (
    <CameraContext.Provider value={contextValue}>
      {/* Permanent, unthrottled off-screen video element for MediaPipe detection */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -9999,
        }}
        aria-hidden="true"
      />

      {/* Persistent Hand Gesture HUD (Rendered once at App root) */}
      {isVisionHUDOpen && (
        <aside
          className="vision-hud-dock"
          aria-label="Webcam Hand Tracking HUD"
          style={{ zIndex: 9000 }}
        >
          <div className={`webcam-hud-container ${isMinimized ? 'minimized' : ''}`}>
            {/* HUD Header Bar */}
            <div className="webcam-hud-header">
              <div className="hud-title-box">
                <span className="hud-hand-icon" aria-hidden="true">🖐️</span>
                <span className={`hud-status-led ${status}`}></span>
                <span className="hud-title">HAND TRACKING</span>
              </div>

              <div className="hud-header-actions">
                <button
                  type="button"
                  className="hud-min-btn"
                  onClick={() => setIsMinimized((prev) => !prev)}
                  title={isMinimized ? 'Expand Camera Preview' : 'Minimize Camera HUD'}
                  aria-label="Toggle HUD Size"
                >
                  {isMinimized ? '⛶ EXPAND' : '— MINIMIZE'}
                </button>
                <button
                  type="button"
                  className="hud-min-btn hud-close-btn"
                  onClick={() => setIsVisionHUDOpen(false)}
                  title="Hide Camera Preview"
                  aria-label="Hide Camera Preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main HUD Body - keeps video and canvas in DOM so detection continues seamlessly */}
            <div
              className="webcam-hud-body"
              style={{ display: isMinimized ? 'none' : 'block' }}
            >
              {/* Video & Canvas Overlay Viewport */}
              <div className="webcam-viewport" style={{ aspectRatio: videoAspect }}>
                {/* Live Video Feed Preview */}
                <video
                  ref={previewVideoRef}
                  className="webcam-video"
                  playsInline
                  muted
                  autoPlay
                  aria-label="Live webcam stream preview"
                />

                {/* Hand Landmark Canvas Overlay */}
                <canvas
                  ref={canvasRef}
                  className="webcam-canvas-overlay"
                  aria-hidden="true"
                />

                {/* Viewport Inactive / Standby Placeholder */}
                {status !== 'active' && (
                  <div className="webcam-placeholder">
                    <div className="placeholder-crest">
                      <span className="rune-pulse">🖐️</span>
                    </div>
                    <p className="placeholder-text">
                      {status === 'idle' && 'Hand Tracking is currently OFF'}
                      {status === 'requesting-permission' && 'Awaiting Camera Permission...'}
                      {status === 'loading-model' && 'Loading Hand Neural Network...'}
                      {status === 'permission-denied' && 'Camera Permission Denied'}
                      {status === 'unavailable' && 'Webcam Unavailable'}
                      {status === 'error' && 'Sensor Standby / Error'}
                    </p>
                    <span className="placeholder-sub">
                      {status === 'idle' &&
                        'Click "START HAND CAMERA" below to activate gesture control'}
                      {status === 'unavailable' &&
                        (errorMessage || 'Touch and mouse controls are fully active!')}
                      {status === 'permission-denied' &&
                        'Enable camera in browser address bar, or use mouse/touch'}
                      {status === 'error' && 'You can continue playing using mouse or touch!'}
                    </span>
                  </div>
                )}

                {/* Hand state status pill inside viewport */}
                {status === 'active' && !isHandDetected && (
                  <div className="no-hand-alert">
                    <span className="alert-sparkle">✦</span>
                    <span>NO HAND DETECTED • SHOW YOUR HAND TO THE CAMERA</span>
                    <span className="alert-sparkle">✦</span>
                  </div>
                )}

                {status === 'active' && isHandDetected && (
                  <div className="hands-badge">
                    <span className="hands-dot"></span>
                    <span>
                      🖐️ {detectedHandsCount} {detectedHandsCount > 1 ? 'HANDS' : 'HAND'} DETECTED •{' '}
                      {isPinching ? '🤏 PINCHING' : 'OPEN PALM'}
                    </span>
                  </div>
                )}

                {/* Corner reticle decorations */}
                <div className="reticle reticle-tl"></div>
                <div className="reticle reticle-tr"></div>
                <div className="reticle reticle-bl"></div>
                <div className="reticle reticle-br"></div>
              </div>

              {/* Status & Error Banner */}
              <div className="webcam-status-bar">
                {errorMessage ? (
                  <div className="hud-error-msg">
                    <span className="error-icon">⚠️</span>
                    <span>{errorMessage}</span>
                  </div>
                ) : (
                  <div className="hud-info-msg">
                    <span className="status-label">STATUS:</span>
                    <span className="status-val">
                      {status === 'active' ? currentGestureStatus : statusMessage}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls: Start Camera / Stop Camera */}
              <div className="webcam-controls-row">
                {status !== 'active' ? (
                  <button
                    type="button"
                    className="btn-hud-start"
                    onClick={() => startCamera()}
                    disabled={
                      status === 'requesting-permission' || status === 'loading-model'
                    }
                  >
                    <span className="btn-hud-icon">🖐️</span>
                    <span>
                      {status === 'requesting-permission' || status === 'loading-model'
                        ? 'CONNECTING...'
                        : 'START HAND CAMERA'}
                    </span>
                  </button>
                ) : (
                  <button type="button" className="btn-hud-stop" onClick={stopCamera}>
                    <span className="btn-hud-icon">⏹</span>
                    <span>STOP CAMERA</span>
                  </button>
                )}
              </div>

              {/* Tutorial / Help snippet */}
              <div className="hud-privacy-badge">
                <span>💡 Move hand to guide cursor • Pinch index & thumb to select/confirm</span>
              </div>
            </div>

            {/* Minimized Pill Bar */}
            {isMinimized && (
              <div className="hud-minimized-summary">
                <span className="min-label">
                  {status === 'active'
                    ? isHandDetected
                      ? `HANDS: ${detectedHandsCount} (${isPinching ? 'PINCH' : 'OPEN'})`
                      : 'SHOW HAND'
                    : `CAMERA: ${status.toUpperCase()}`}
                </span>
                {status === 'active' ? (
                  <button type="button" className="btn-min-stop" onClick={stopCamera}>
                    STOP
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-min-start"
                    onClick={() => startCamera()}
                  >
                    START
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {children}
    </CameraContext.Provider>
  )
}
