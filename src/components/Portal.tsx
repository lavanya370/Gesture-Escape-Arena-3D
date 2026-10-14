import React from 'react'
import { sound } from '../utils/audio'

interface PortalProps {
  type: 'purple' | 'cyan'
  title: string
  subtitle: string
  runeLetter: string
  side: 'left' | 'right'
}

export const Portal: React.FC<PortalProps> = ({
  type,
  title,
  subtitle,
  runeLetter,
  side,
}) => {
  const isPurple = type === 'purple'

  return (
    <div
      className={`portal-container portal-${type} portal-${side}`}
      onMouseEnter={() => sound.playHover()}
    >
      {/* Outer ambient aura */}
      <div className="portal-aura"></div>

      {/* Arch Stone Frame with ancient carvings */}
      <div className="portal-arch-frame">
        <div className="arch-keystone">
          <span className="keystone-glyph">{runeLetter}</span>
        </div>

        {/* Portal energy window */}
        <div className="portal-vortex-window">
          {/* Rotating rune ring 1 (clockwise) */}
          <div className="portal-rune-ring ring-outer">
            <svg viewBox="0 0 200 200" className="rune-svg">
              <circle
                cx="100"
                cy="100"
                r="92"
                fill="none"
                stroke={isPurple ? '#c084fc' : '#38bdf8'}
                strokeWidth="1.5"
                strokeDasharray="4 8"
                opacity="0.7"
              />
              <circle
                cx="100"
                cy="100"
                r="84"
                fill="none"
                stroke={isPurple ? '#a855f7' : '#06b6d4'}
                strokeWidth="1"
                opacity="0.5"
              />
            </svg>
            <div className="ring-glyphs">
              <span>᚛</span>
              <span>ᚦ</span>
              <span>ᚱ</span>
              <span>ᚲ</span>
              <span>ᚷ</span>
              <span>ᚹ</span>
              <span>ᚺ</span>
              <span>ᛜ</span>
            </div>
          </div>

          {/* Rotating rune ring 2 (counter-clockwise) */}
          <div className="portal-rune-ring ring-inner">
            <div className="ring-glyphs-inner">
              <span>✦</span>
              <span>✧</span>
              <span>𐫰</span>
              <span>✵</span>
              <span>ᛉ</span>
              <span>ᛟ</span>
            </div>
          </div>

          {/* Deep Swirling Vortex Core */}
          <div className="portal-vortex-core">
            <div className="vortex-layer vortex-layer-1"></div>
            <div className="vortex-layer vortex-layer-2"></div>
            <div className="vortex-eye">
              <div className="eye-flare"></div>
            </div>
          </div>

          {/* Particle lightning wisps */}
          <div className="portal-sparks">
            <span className="spark s1"></span>
            <span className="spark s2"></span>
            <span className="spark s3"></span>
            <span className="spark s4"></span>
          </div>
        </div>

        {/* Ground light pool reflection */}
        <div className="portal-ground-pool"></div>
      </div>

      {/* Info plaque below portal */}
      <div className="portal-plaque">
        <div className="plaque-badge">
          <span className="pulse-dot"></span>
          {isPurple ? 'VOID RIFT' : 'ASTRAL RIFT'}
        </div>
        <h3 className="plaque-title">{title}</h3>
        <p className="plaque-sub">{subtitle}</p>
      </div>
    </div>
  )
}
