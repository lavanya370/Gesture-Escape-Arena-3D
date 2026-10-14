import React, { useState, useEffect, useRef, useCallback } from 'react'
import portalMoonlitBg from '../assets/portal-moonlit-bg.jpg'
import { ParticleCanvas } from './ParticleCanvas'
import { useCamera } from '../context/CameraContext'
import { sound } from '../utils/audio'
import { gestureDetector } from '../vision/gestureDetector'

interface StartScreenProps {
  onEnterArena?: () => void
  onEnterChamber1?: () => void
  isChamber1Completed?: boolean
  totalScore?: number
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onEnterArena,
  onEnterChamber1,
}) => {
  const { startCamera, setIsVisionHUDOpen, setIsMinimized } = useCamera()

  const [isAudioActive, setIsAudioActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const startBtnRef = useRef<HTMLButtonElement | null>(null)
  const pinchLockRef = useRef(false)

  // Ensure the compact Hand Tracking panel is open and docked at bottom-right
  useEffect(() => {
    setIsVisionHUDOpen(true)
    setIsMinimized(false)
  }, [setIsVisionHUDOpen, setIsMinimized])

  const toggleAudio = () => {
    const newState = sound.toggleAmbient()
    setIsAudioActive(newState)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const handleStartGame = useCallback(() => {
    sound.playStartSpell()
    // Initialize persistent camera & gesture tracking
    startCamera().catch((err) => console.warn('Camera initialization:', err))
    if (onEnterArena) {
      onEnterArena()
    } else if (onEnterChamber1) {
      onEnterChamber1()
    }
  }, [onEnterArena, onEnterChamber1, startCamera])

  // Allow starting game via hand cursor pinch gesture directly over the Start Game button
  useEffect(() => {
    const unsub = gestureDetector.subscribe((data) => {
      const btn = startBtnRef.current
      if (!btn || !data.handDetected) return
      const rect = btn.getBoundingClientRect()
      const isOver =
        data.cursorX >= rect.left - 10 &&
        data.cursorX <= rect.right + 10 &&
        data.cursorY >= rect.top - 10 &&
        data.cursorY <= rect.bottom + 10

      if (isOver && data.isPinching && !pinchLockRef.current) {
        pinchLockRef.current = true
        handleStartGame()
      } else if (!data.isPinching) {
        pinchLockRef.current = false
      }
    })
    return () => unsub()
  }, [handleStartGame])

  return (
    <div className="arena-root start-screen-viewport">
      {/* 1. Full-Screen Cinematic Castle Background */}
      <div
        className="start-bg-layer"
        style={{ backgroundImage: `url(${portalMoonlitBg})` }}
      >
        <div className="start-bg-vignette" />
        <div className="start-bg-portal-glow" />
        <div className="start-bg-torch-glow torch-left" />
        <div className="start-bg-torch-glow torch-right" />
      </div>

      {/* Subtle Floating Magical Particles */}
      <ParticleCanvas />

      {/* 2. Top Header */}
      <header className="start-header">
        <div className="header-left">
          <span className="header-expo-icon" aria-hidden="true">🎓</span>
          <div className="header-expo-titles">
            <span className="header-expo-line1">COLLEGE SCIENCE EXPO 2026</span>
            <span className="header-expo-line2">AI VISION &amp; GESTURE CHALLENGE</span>
          </div>
        </div>

        <div className="header-right">
          <button
            type="button"
            className={`header-btn sound-btn ${isAudioActive ? 'active' : ''}`}
            onClick={toggleAudio}
            onMouseEnter={() => sound.playHover()}
            title={isAudioActive ? 'Mute Sound' : 'Play Sound'}
            aria-label="Toggle Sound"
          >
            <span className="btn-icon">{isAudioActive ? '🔊' : '🔇'}</span>
            <span className="btn-text">{isAudioActive ? 'SOUND ON' : 'SOUND OFF'}</span>
          </button>

          <button
            type="button"
            className="header-btn fullscreen-btn"
            onClick={toggleFullscreen}
            onMouseEnter={() => sound.playHover()}
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            <span className="btn-icon">{isFullscreen ? '⛶' : '🗖'}</span>
            <span className="btn-text">{isFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}</span>
          </button>
        </div>
      </header>

      {/* 3, 4, 5. Central Hero: Title, Tagline, and Large Ornamental Start Button */}
      <main className="start-hero-center">
        {/* Soft Radial Backing Aura for perfect text readability (No opaque box) */}
        <div className="title-aura-backdrop" aria-hidden="true" />

        {/* Small Magical Diamond Emblem Above Title */}
        <div className="title-diamond-crest" aria-hidden="true">
          <span className="crest-line left" />
          <div className="crest-diamond-icon">◆</div>
          <span className="crest-line right" />
        </div>

        {/* Main Title */}
        <h1 className="hero-main-title">
          <div className="title-row title-row-top">
            <span className="word-gesture">GESTURE</span>{' '}
            <span className="word-escape">ESCAPE</span>
          </div>
          <div className="title-row title-row-bottom">
            <span className="word-arena">ARENA</span>
            <span className="badge-3d">3D</span>
          </div>
        </h1>

        {/* Subtle Ornamental Gold Divider */}
        <div className="title-divider-strip" aria-hidden="true">
          <div className="divider-segment left" />
          <span className="divider-gem">✦</span>
          <div className="divider-segment right" />
        </div>

        {/* 4. Tagline */}
        <p className="hero-tagline">
          "YOUR HANDS. YOUR MOVES. YOUR ESCAPE!"
        </p>

        {/* 5. Large Ornamental Start Button */}
        <div className="hero-action-container">
          <button
            ref={startBtnRef}
            type="button"
            className="btn-cinematic-start btn-start-game"
            onClick={handleStartGame}
            onMouseEnter={() => sound.playHover()}
            data-selectable="true"
            role="button"
            aria-label="Start Game: Start to find clues"
          >
            {/* Subtle blue outer glow */}
            <div className="btn-blue-glow-aura" aria-hidden="true" />

            {/* Shimmer light sweep */}
            <div className="btn-shimmer-sweep" aria-hidden="true" />

            {/* Elegant gold ornamental frame with corner filigree */}
            <div className="btn-gold-ornamental-frame" aria-hidden="true">
              <span className="frame-corner tl" />
              <span className="frame-corner tr" />
              <span className="frame-corner bl" />
              <span className="frame-corner br" />
            </div>

            <div className="btn-content-wrap">
              <div className="btn-text-block">
                <span className="btn-main-title">START GAME</span>
                <span className="btn-subtitle">START TO FIND CLUES</span>
              </div>
              {/* Glowing Cyan Arrow on the Right */}
              <div className="btn-cyan-arrow-badge" aria-hidden="true">
                <span className="btn-cyan-arrow">→</span>
              </div>
            </div>
          </button>
        </div>
      </main>

      {/* 6. Hand Tracking Panel is rendered by CameraProvider at bottom-right corner */}
    </div>
  )
}

export default StartScreen
