import React, { useState } from 'react'
import chestImg from '../assets/treasure-chest.jpg'
import { sound } from '../utils/audio'

export const TreasureChest: React.FC = () => {
  const [isInspecting, setIsInspecting] = useState(false)

  const handleChestClick = () => {
    sound.playChestBell()
    setIsInspecting(true)
    setTimeout(() => {
      setIsInspecting(false)
    }, 2800)
  }

  return (
    <div className="chest-wrapper">
      {/* Background ethereal light beam pillar */}
      <div className="chest-light-pillar"></div>

      {/* Floating Gem Sparkles */}
      <div className="chest-floating-runes">
        <span className="float-gem g1">💎</span>
        <span className="float-gem g2">✦</span>
        <span className="float-gem g3">🔮</span>
        <span className="float-gem g4">✧</span>
      </div>

      {/* Main Chest Pedestal Stage */}
      <div
        className={`chest-stage ${isInspecting ? 'chest-pulsing' : ''}`}
        onClick={handleChestClick}
        onMouseEnter={() => sound.playHover()}
        role="button"
        tabIndex={0}
        aria-label="Ancient Relic Treasure Chest - Click to inspect"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleChestClick()
          }
        }}
      >
        {/* Glowing divine light rays behind chest */}
        <div className="chest-sunburst-rays"></div>

        {/* Outer magical halo */}
        <div className="chest-halo"></div>

        {/* The detailed chest artwork */}
        <div className="chest-img-container">
          <img
            src={chestImg}
            alt="Magical Glowing Ancient Treasure Chest"
            className="chest-image"
          />
          <div className="chest-image-glow-overlay"></div>
        </div>

        {/* Stone Pedestal base with glowing engraved runes */}
        <div className="pedestal-base">
          <div className="pedestal-top-lip"></div>
          <div className="pedestal-carvings">
            <span className="rune-glyph">ᚦ</span>
            <span className="pedestal-badge">VAULT RELIC CHEST</span>
            <span className="rune-glyph">ᛟ</span>
          </div>
          <div className="pedestal-runic-line"></div>
        </div>
      </div>

      {/* Interactive inspection message */}
      {isInspecting && (
        <div className="chest-inspect-toast">
          <span className="toast-icon">📦</span>
          <div>
            <strong>*CLATTER!* MYSTERY VAULT CHEST</strong>
            <p>“Hey, who’s tapping the lock?! Complete the 15-second mini-games to claim mystery clues!”</p>
          </div>
        </div>
      )}

      {/* Subtle hint when not clicked */}
      {!isInspecting && (
        <div className="chest-hint">
          <span className="hint-indicator">✦</span> Click chest to inspect secret seals
        </div>
      )}
    </div>
  )
}
