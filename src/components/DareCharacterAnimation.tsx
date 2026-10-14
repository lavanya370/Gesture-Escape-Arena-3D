import React from 'react'
import type { DareType } from '../types/riddles'

interface DareCharacterAnimationProps {
  dareType: DareType
}

export const DareCharacterAnimation: React.FC<DareCharacterAnimationProps> = ({ dareType }) => {
  return (
    <div className={`dare-anim-stage dare-anim-${dareType}`}>
      {/* 1. ROBOT MODE */}
      {dareType === 'robot' && (
        <div className="char-robot-container">
          <svg viewBox="0 0 160 160" className="char-svg robot-svg" aria-label="Animated Dancing Robot">
            {/* Antenna with pulsing beacon */}
            <g className="robot-antenna-group">
              <line x1="80" y1="42" x2="80" y2="20" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
              <circle cx="80" cy="18" r="7" className="robot-beacon" fill="#ef4444" />
            </g>

            {/* Left Arm (jerky 90-deg mechanical dance) */}
            <g className="robot-arm-left">
              <path d="M 48 76 L 24 76 L 24 48" fill="none" stroke="#64748b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="46" r="6" fill="#38bdf8" />
            </g>

            {/* Right Arm (mirror mechanical dance) */}
            <g className="robot-arm-right">
              <path d="M 112 76 L 136 76 L 136 104" fill="none" stroke="#64748b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="136" cy="106" r="6" fill="#38bdf8" />
            </g>

            {/* Body Chassis */}
            <rect x="48" y="70" width="64" height="54" rx="10" fill="#334155" stroke="#06b6d4" strokeWidth="3" />

            {/* Chest Meter & Spinning Gears */}
            <rect x="58" y="80" width="44" height="20" rx="4" fill="#0f172a" />
            <circle cx="70" cy="90" r="5" className="robot-gear gear-1" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" />
            <circle cx="90" cy="90" r="5" className="robot-gear gear-2" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" />
            <line x1="60" y1="112" x2="100" y2="112" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" className="robot-led-bar" />

            {/* Robot Head */}
            <g className="robot-head-group">
              <rect x="52" y="38" width="56" height="34" rx="8" fill="#475569" stroke="#38bdf8" strokeWidth="2.5" />
              {/* Ear Bolts */}
              <rect x="46" y="48" width="6" height="12" rx="2" fill="#94a3b8" />
              <rect x="108" y="48" width="6" height="12" rx="2" fill="#94a3b8" />
              {/* Visor Screen */}
              <rect x="60" y="46" width="40" height="18" rx="4" fill="#0f172a" />
              {/* Blinking Eyes */}
              <circle cx="70" cy="55" r="4" className="robot-eye eye-left" fill="#22d3ee" />
              <circle cx="90" cy="55" r="4" className="robot-eye eye-right" fill="#22d3ee" />
            </g>

            {/* Legs with mechanical stepping */}
            <g className="robot-legs-group">
              <rect x="60" y="124" width="12" height="18" rx="4" fill="#64748b" className="robot-leg-left" />
              <rect x="88" y="124" width="12" height="18" rx="4" fill="#64748b" className="robot-leg-right" />
              <rect x="56" y="140" width="20" height="8" rx="3" fill="#334155" />
              <rect x="84" y="140" width="20" height="8" rx="3" fill="#334155" />
            </g>
          </svg>
          <div className="char-speech-bubble">“BEEP BOOP! GEARS ENGAGED!”</div>
        </div>
      )}

      {/* 2. FROG CHALLENGE */}
      {dareType === 'frog' && (
        <div className="char-frog-container">
          <svg viewBox="0 0 160 160" className="char-svg frog-svg" aria-label="Animated Jumping Frog">
            {/* Lily Pad Base */}
            <ellipse cx="80" cy="145" rx="55" ry="12" fill="#14532d" opacity="0.6" />
            <path d="M 80 145 L 98 135 L 85 145 Z" fill="#052e16" />

            {/* Animated Jumping Frog Body */}
            <g className="frog-jumper-group">
              {/* Back Legs (spring coils) */}
              <g className="frog-back-legs">
                <ellipse cx="44" cy="120" rx="14" ry="10" fill="#15803d" transform="rotate(-25 44 120)" />
                <ellipse cx="116" cy="120" rx="14" ry="10" fill="#15803d" transform="rotate(25 116 120)" />
                <path d="M 34 125 C 24 135 22 142 34 144" stroke="#15803d" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M 126 125 C 136 135 138 142 126 144" stroke="#15803d" strokeWidth="5" fill="none" strokeLinecap="round" />
              </g>

              {/* Main Chubby Body */}
              <ellipse cx="80" cy="105" rx="34" ry="26" fill="#22c55e" stroke="#16a34a" strokeWidth="3" />
              <ellipse cx="80" cy="110" rx="22" ry="16" fill="#86efac" />

              {/* Front Arms */}
              <path d="M 58 115 L 48 135" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
              <path d="M 102 115 L 112 135" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />

              {/* Big Goofy Eyes on Top */}
              <g className="frog-eyes">
                <circle cx="62" cy="80" r="13" fill="#22c55e" stroke="#16a34a" strokeWidth="2.5" />
                <circle cx="62" cy="80" r="8" fill="#ffffff" />
                <circle cx="64" cy="80" r="4.5" className="frog-pupil" fill="#0f172a" />

                <circle cx="98" cy="80" r="13" fill="#22c55e" stroke="#16a34a" strokeWidth="2.5" />
                <circle cx="98" cy="80" r="8" fill="#ffffff" />
                <circle cx="96" cy="80" r="4.5" className="frog-pupil" fill="#0f172a" />
              </g>

              {/* Big Smile & Flicking Tongue */}
              <path d="M 64 100 Q 80 114 96 100" fill="none" stroke="#14532d" strokeWidth="3.5" strokeLinecap="round" />
              <g className="frog-tongue-group">
                <path d="M 80 106 Q 95 106 120 95" fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
                <circle cx="120" cy="95" r="4" fill="#f43f5e" />
                {/* Captured Fly */}
                <circle cx="124" cy="91" r="2.5" fill="#000000" />
              </g>
            </g>
          </svg>
          <div className="char-speech-bubble">“RIBBIT! HOP 3 TIMES!”</div>
        </div>
      )}

      {/* 3. WIZARD POSE */}
      {dareType === 'wizard' && (
        <div className="char-wizard-container">
          <svg viewBox="0 0 160 160" className="char-svg wizard-svg" aria-label="Animated Casting Wizard">
            {/* Swirling Arcane Cloud */}
            <ellipse cx="80" cy="142" rx="45" ry="10" fill="#6b21a8" opacity="0.4" />

            <g className="wizard-body-group">
              {/* Wizard Robe */}
              <path d="M 60 85 L 45 138 L 115 138 L 100 85 Z" fill="#7e22ce" stroke="#9333ea" strokeWidth="2.5" />
              <path d="M 80 85 L 80 138" stroke="#fde047" strokeWidth="2" strokeDasharray="4 4" />

              {/* Head & Big Fluffy Beard */}
              <circle cx="80" cy="74" r="16" fill="#fed7aa" />
              <path d="M 68 76 Q 80 115 92 76 Q 80 85 68 76 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" className="wizard-beard" />
              {/* Eyes with Glasses */}
              <circle cx="74" cy="72" r="3" fill="#0f172a" />
              <circle cx="86" cy="72" r="3" fill="#0f172a" />
              <circle cx="74" cy="72" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="86" cy="72" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="79" y1="72" x2="81" y2="72" stroke="#f59e0b" strokeWidth="1.5" />

              {/* Pointy Crooked Wizard Hat */}
              <g className="wizard-hat-group">
                <ellipse cx="80" cy="62" rx="26" ry="6" fill="#581c87" stroke="#9333ea" strokeWidth="2" />
                <path d="M 58 61 Q 78 30 92 18 Q 84 32 102 61 Z" fill="#6b21a8" stroke="#9333ea" strokeWidth="2" />
                <path d="M 80 34 L 88 38 L 84 46 Z" fill="#fde047" />
              </g>

              {/* Left Arm holding Spell Book */}
              <g className="wizard-arm-left">
                <path d="M 62 90 L 46 102" stroke="#7e22ce" strokeWidth="7" strokeLinecap="round" />
                <rect x="36" y="96" width="16" height="20" rx="3" fill="#991b1b" stroke="#fde047" strokeWidth="1.5" transform="rotate(-15 36 96)" />
              </g>

              {/* Right Arm waving Wand */}
              <g className="wizard-arm-right">
                <path d="M 98 90 L 118 78" stroke="#7e22ce" strokeWidth="7" strokeLinecap="round" />
                {/* Magic Wand */}
                <line x1="116" y1="80" x2="140" y2="52" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
                <polygon points="140,46 142,50 146,52 142,54 140,58 138,54 134,52 138,50" fill="#fde047" className="wand-sparkle-star" />
              </g>

              {/* Magic Sparkles & Stars floating */}
              <g className="wizard-magic-sparks">
                <circle cx="145" cy="40" r="3" fill="#38bdf8" className="magic-spark sp-1" />
                <circle cx="130" cy="35" r="2.5" fill="#ec4899" className="magic-spark sp-2" />
                <circle cx="152" cy="58" r="3.5" fill="#fde047" className="magic-spark sp-3" />
              </g>
            </g>
          </svg>
          <div className="char-speech-bubble">“ALAKAZAM! STRIKE A POSE!”</div>
        </div>
      )}

      {/* 4. CHICKEN RUN */}
      {dareType === 'chicken' && (
        <div className="char-chicken-container">
          <svg viewBox="0 0 160 160" className="char-svg chicken-svg" aria-label="Animated Running Chicken">
            {/* Dust cloud from running feet */}
            <g className="chicken-dust-clouds">
              <circle cx="45" cy="140" r="7" fill="#cbd5e1" opacity="0.6" className="dust-puff d1" />
              <circle cx="35" cy="138" r="5" fill="#cbd5e1" opacity="0.5" className="dust-puff d2" />
              <circle cx="55" cy="142" r="6" fill="#cbd5e1" opacity="0.4" className="dust-puff d3" />
            </g>

            <g className="chicken-runner-group">
              {/* Plump Chicken Body */}
              <ellipse cx="85" cy="95" rx="30" ry="24" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2.5" />

              {/* Tail Feathers */}
              <path d="M 56 90 Q 38 80 44 68 Q 54 80 60 86" fill="#f97316" />
              <path d="M 54 94 Q 34 90 40 80 Q 52 90 58 92" fill="#ef4444" />

              {/* Flapping Wings */}
              <g className="chicken-wing">
                <ellipse cx="80" cy="98" rx="16" ry="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M 68 102 C 74 108 86 108 92 102" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
              </g>

              {/* Head with Wobbly Comb */}
              <circle cx="108" cy="75" r="15" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
              {/* Red Comb */}
              <path d="M 102 61 Q 106 50 112 58 Q 118 48 122 62 Z" fill="#ef4444" className="chicken-comb" />
              {/* Red Wattle */}
              <ellipse cx="118" cy="85" rx="4" ry="7" fill="#ef4444" className="chicken-wattle" />
              {/* Beak Squawking */}
              <polygon points="118,74 135,78 118,84" fill="#f59e0b" className="chicken-beak" />
              {/* Eye with silly stare */}
              <circle cx="112" cy="72" r="4.5" fill="#000000" />
              <circle cx="113" cy="71" r="1.5" fill="#ffffff" />

              {/* Fast Sprinting Yellow Feet */}
              <g className="chicken-legs">
                <path d="M 80 118 L 84 136 L 94 138" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" className="chicken-leg-1" />
                <path d="M 94 118 L 78 136 L 68 138" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" className="chicken-leg-2" />
              </g>
            </g>
          </svg>
          <div className="char-speech-bubble">“BAAAAWK! FLAP YOUR WINGS!”</div>
        </div>
      )}

      {/* 5. FUNNY DANCE */}
      {dareType === 'dance' && (
        <div className="char-dance-container">
          <svg viewBox="0 0 160 160" className="char-svg dance-svg" aria-label="Animated Disco Dancer">
            {/* Disco floor light reflections */}
            <ellipse cx="80" cy="146" rx="46" ry="10" fill="#ec4899" opacity="0.3" className="disco-floor-light" />

            <g className="dancer-group">
              {/* Legs grooving */}
              <g className="dancer-legs">
                <path d="M 72 108 L 62 140 L 52 142" stroke="#8b5cf6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="leg-groove-left" />
                <path d="M 88 108 L 98 140 L 108 142" stroke="#8b5cf6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="leg-groove-right" />
              </g>

              {/* Funky Body Shirt */}
              <rect x="66" y="66" width="28" height="42" rx="6" fill="#f59e0b" stroke="#d97706" strokeWidth="2" className="dancer-torso" />
              <polygon points="76,66 84,80 80,66" fill="#ffffff" />
              <polygon points="84,66 76,80 80,66" fill="#38bdf8" />

              {/* Left Arm Pointing Up / Down */}
              <path d="M 66 74 L 42 50 L 32 38" stroke="#f59e0b" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="dancer-arm-left" />

              {/* Right Arm Pointing Opposite */}
              <path d="M 94 74 L 118 92 L 132 102" stroke="#f59e0b" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="dancer-arm-right" />

              {/* Head with Sunglasses & Funky Hair */}
              <g className="dancer-head">
                <circle cx="80" cy="48" r="16" fill="#fed7aa" />
                {/* Big Afro / Disco Hair */}
                <path d="M 64 45 C 60 30 70 20 80 20 C 90 20 100 30 96 45 Z" fill="#451a03" />
                {/* Cool Neon Sunglasses */}
                <rect x="68" y="44" width="10" height="7" rx="2" fill="#06b6d4" stroke="#000000" strokeWidth="1" />
                <rect x="82" y="44" width="10" height="7" rx="2" fill="#06b6d4" stroke="#000000" strokeWidth="1" />
                <line x1="78" y1="47" x2="82" y2="47" stroke="#000000" strokeWidth="1.5" />
                {/* Big Smile */}
                <path d="M 74 57 Q 80 63 86 57" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>

            {/* Floating Musical Notes & Sparkles */}
            <g className="disco-sparkles">
              <text x="30" y="45" fill="#f43f5e" fontSize="16" fontWeight="bold" className="music-note n1">♪</text>
              <text x="120" y="40" fill="#38bdf8" fontSize="18" fontWeight="bold" className="music-note n2">♫</text>
              <polygon points="125,75 127,78 131,80 127,82 125,85 123,82 119,80 123,78" fill="#fde047" className="disco-star s1" />
              <polygon points="35,95 37,98 41,100 37,102 35,105 33,102 29,100 33,98" fill="#a855f7" className="disco-star s2" />
            </g>
          </svg>
          <div className="char-speech-bubble">“DISCO TIME! SHAKE THOSE SHOULDERS!”</div>
        </div>
      )}
    </div>
  )
}
