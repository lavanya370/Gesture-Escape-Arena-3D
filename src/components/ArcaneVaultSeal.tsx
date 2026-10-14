import React from 'react'

export const ArcaneVaultSeal: React.FC = () => {
  // 12 celestial runic nodes spaced evenly around 360 degrees
  const runicNodes = Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30
    return {
      key: i,
      angle,
      glyph: ['ᚦ', 'ᚱ', 'ᛉ', 'ᛟ', 'ᚨ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ'][i % 12],
    }
  })

  // 8 outer starlight flares
  const starFlares = Array.from({ length: 8 }, (_, i) => i * 45)

  return (
    <div className="arcane-clock-emblem-wrap" aria-hidden="true">
      <div className="clock-ambient-halo"></div>

      <svg
        viewBox="0 0 160 160"
        className="arcane-clock-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Deep cosmic void gradient */}
          <radialGradient id="sealVoidGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e1145" />
            <stop offset="45%" stopColor="#12092b" />
            <stop offset="80%" stopColor="#090417" />
            <stop offset="100%" stopColor="#04010a" />
          </radialGradient>

          {/* Polished celestial gold bezel */}
          <linearGradient id="astralGoldBezel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#78350f" />
            <stop offset="85%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>

          {/* Glowing cyan/purple ethereal ring gradient */}
          <linearGradient id="etherRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Core Keystone Crystal Radial */}
          <radialGradient id="keystoneCrystalGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#a5f3fc" />
            <stop offset="55%" stopColor="#06b6d4" />
            <stop offset="85%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="sealAura" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Outer Heavy Gold Astrolabe Bezel */}
        <circle
          cx="80"
          cy="80"
          r="76"
          fill="none"
          stroke="url(#astralGoldBezel)"
          strokeWidth="3.2"
          filter="url(#sealAura)"
        />

        <circle
          cx="80"
          cy="80"
          r="73"
          fill="none"
          stroke="rgba(192, 132, 252, 0.45)"
          strokeWidth="1.2"
        />

        {/* 2. Deep Midnight Cosmic Medallion Disk */}
        <circle
          cx="80"
          cy="80"
          r="71.5"
          fill="url(#sealVoidGrad)"
          stroke="rgba(245, 158, 11, 0.3)"
          strokeWidth="1"
        />

        {/* 3. Outer Counter-Rotating Runic Ring */}
        <g className="astrolabe-gear-ring">
          <circle
            cx="80"
            cy="80"
            r="66"
            fill="none"
            stroke="rgba(216, 180, 254, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
          {runicNodes.map((n) => (
            <g key={n.key} transform={`rotate(${n.angle} 80 80)`}>
              <circle cx="80" cy="14" r="2.5" fill="#facc15" opacity="0.9" />
              <text
                x="80"
                y="26"
                fill="#e9d5ff"
                fontSize="8"
                fontFamily="Outfit, sans-serif"
                fontWeight="700"
                textAnchor="middle"
                opacity="0.8"
              >
                {n.glyph}
              </text>
            </g>
          ))}
        </g>

        {/* 4. Sacred Celestial Octagram Star (Inner Rotating) */}
        <g className="celestial-inner-ring">
          {/* Outer Star */}
          <polygon
            points="80,28 92,68 132,80 92,92 80,132 68,92 28,80 68,68"
            fill="none"
            stroke="url(#etherRingGrad)"
            strokeWidth="1.2"
            opacity="0.75"
          />
          {/* Rotated Secondary Star */}
          <polygon
            points="80,32 90,70 128,80 90,90 80,128 70,90 32,80 70,70"
            fill="none"
            stroke="rgba(251, 191, 36, 0.6)"
            strokeWidth="1"
            opacity="0.6"
            transform="rotate(45 80 80)"
          />
        </g>

        {/* 5. Middle Interlocking Astral Rings */}
        <circle
          cx="80"
          cy="80"
          r="48"
          fill="none"
          stroke="rgba(56, 189, 248, 0.35)"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />
        <circle
          cx="80"
          cy="80"
          r="34"
          fill="none"
          stroke="rgba(192, 132, 252, 0.4)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* 6. Eight Radiant Keystone Energy Flares */}
        {starFlares.map((deg) => (
          <line
            key={deg}
            x1="80"
            y1="56"
            x2="80"
            y2="46"
            stroke="#38bdf8"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.85"
            transform={`rotate(${deg} 80 80)`}
          />
        ))}

        {/* 7. Central Sacred Vault Keystone (Floating Glowing Crystal) */}
        <g>
          {/* Beveled Collet */}
          <circle
            cx="80"
            cy="80"
            r="16"
            fill="url(#astralGoldBezel)"
            stroke="#451a03"
            strokeWidth="1"
            filter="drop-shadow(0 2px 6px rgba(0,0,0,0.8))"
          />

          {/* Central Keystone Gem */}
          <polygon
            points="80,68 91,74 91,86 80,92 69,86 69,74"
            fill="url(#keystoneCrystalGrad)"
            stroke="#cffafe"
            strokeWidth="1"
          />

          {/* Inner Prismatic Core */}
          <circle
            cx="80"
            cy="80"
            r="4"
            fill="#ffffff"
            filter="drop-shadow(0 0 6px #38bdf8)"
          />

          {/* Specular Gem Sparkle */}
          <circle cx="77.5" cy="76.5" r="1.5" fill="#ffffff" opacity="0.9" />
        </g>
      </svg>
    </div>
  )
}
