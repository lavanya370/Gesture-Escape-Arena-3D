import React from 'react'
import { useCamera } from '../context/CameraContext'

export const CameraStatusBadge: React.FC = () => {
  const {
    status,
    errorMessage,
    isHandDetected,
    isPinching,
    detectedHandsCount,
    retryCamera,
    startCamera,
    stopCamera,
    isVisionHUDOpen,
    setIsVisionHUDOpen,
    isMinimized,
    setIsMinimized,
  } = useCamera()

  let statusLabel = 'Touch / Mouse Mode'
  let statusClass = 'mouse'

  if (status === 'requesting-permission') {
    statusLabel = 'Camera Permission...'
    statusClass = 'connecting'
  } else if (status === 'loading-model') {
    statusLabel = 'Loading AI Model...'
    statusClass = 'connecting'
  } else if (status === 'active') {
    if (isHandDetected) {
      if (isPinching) {
        statusLabel = '🤏 Pinch Detected'
        statusClass = 'active'
      } else if (detectedHandsCount > 1) {
        statusLabel = '✨ Hand Active (2 Hands)'
        statusClass = 'active'
      } else {
        statusLabel = '✨ Hand Tracking Active'
        statusClass = 'active'
      }
    } else {
      statusLabel = '🖐️ Hand Not Detected'
      statusClass = 'active-no-hand'
    }
  } else if (status === 'permission-denied') {
    statusLabel = 'Permission Denied'
    statusClass = 'error'
  } else if (status === 'unavailable' || status === 'error') {
    statusLabel = 'Camera Unavailable'
    statusClass = 'error'
  } else {
    statusLabel = 'Touch / Mouse Mode'
    statusClass = 'mouse'
  }

  const isFailedOrIdle =
    status === 'permission-denied' ||
    status === 'unavailable' ||
    status === 'error' ||
    status === 'idle'

  const handleShowCam = () => {
    // If camera is currently off or failed, initiate startCamera so user sees live video
    if (status !== 'active') {
      startCamera().catch(() => {})
    }
    if (!isVisionHUDOpen) {
      setIsVisionHUDOpen(true)
      setIsMinimized(false)
    } else if (isMinimized) {
      setIsMinimized(false)
    } else {
      setIsMinimized(true)
    }
  }

  return (
    <div
      className={`camera-status-badge ${statusClass}`}
      role="status"
      title={errorMessage || statusLabel}
    >
      <div className="badge-indicator-dot"></div>
      <span className="badge-text">{statusLabel}</span>

      {isFailedOrIdle && (
        <button
          type="button"
          className="badge-retry-btn"
          onClick={() => retryCamera()}
          title="Retry or Start Hand Tracking"
        >
          ↻ Retry
        </button>
      )}

      {(status === 'requesting-permission' || status === 'loading-model') && (
        <button
          type="button"
          className="badge-retry-btn"
          onClick={() => stopCamera()}
          title="Cancel and switch to mouse mode"
        >
          ✕ Cancel
        </button>
      )}

      <button
        type="button"
        className="badge-hud-toggle"
        onClick={handleShowCam}
        title="Toggle Camera HUD Preview"
      >
        {isVisionHUDOpen && !isMinimized ? 'Hide Cam' : 'Show Cam'}
      </button>
    </div>
  )
}
