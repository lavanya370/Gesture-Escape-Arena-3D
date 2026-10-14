import React, { useEffect } from 'react'
import { useCamera } from '../context/CameraContext'
import type { GestureData } from '../vision/gestureDetector'
import { gestureDetector } from '../vision/gestureDetector'

export interface WebcamPreviewProps {
  onHandsDetectedChange?: (count: number) => void
  onGestureDataChange?: (data: GestureData) => void
  isCompactMode?: boolean
}

/**
 * WebcamPreview Adapter:
 * Connects directly to the global, persistent CameraContext.
 * Guaranteed never to open a duplicate MediaStream or stop the global stream on unmount.
 */
export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  onHandsDetectedChange,
  onGestureDataChange,
}) => {
  const { detectedHandsCount } = useCamera()

  useEffect(() => {
    onHandsDetectedChange?.(detectedHandsCount)
  }, [detectedHandsCount, onHandsDetectedChange])

  useEffect(() => {
    if (!onGestureDataChange) return
    const unsub = gestureDetector.subscribe((data) => {
      onGestureDataChange(data)
    })
    return () => unsub()
  }, [onGestureDataChange])

  // The actual HUD UI is rendered once globally by CameraProvider.
  return null
}
