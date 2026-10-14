// Web Audio API Synthesizer for Gesture Escape Arena
// Uses native browser audio context - zero external sound files required!

class SoundSystem {
  private ctx: AudioContext | null = null
  private ambientGain: GainNode | null = null
  private isMuted: boolean = false
  private isAmbientPlaying: boolean = false
  private oscPool: OscillatorNode[] = []

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  // Play subtle magical chime on hover
  playHover() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      // Gentle high sparkle pitch
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12) // A5

      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.15)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Play mystical spell arpeggio on Start button click
  playStartSpell() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51] // A major mystical arpeggio
      const now = ctx.currentTime

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = idx % 2 === 0 ? 'triangle' : 'sine'
        const startTime = now + idx * 0.08
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0.08, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.5)
      })
    } catch {
      // Audio fallback
    }
  }

  // Resonant deep bell for clicking treasure chest
  playChestBell() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime

      // Fundamental deep tone
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(220, now) // A3
      osc1.frequency.exponentialRampToValueAtTime(110, now + 0.8)

      gain1.gain.setValueAtTime(0.12, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.9)

      // Shimmer harmonic
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(880, now)
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.5)

      gain2.gain.setValueAtTime(0.06, now)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now)
      osc2.stop(now + 0.65)
    } catch {
      // Audio fallback
    }
  }

  // Toggle ambient dark castle drone
  toggleAmbient(): boolean {
    const ctx = this.getContext()
    if (!ctx) return false

    if (this.isAmbientPlaying) {
      this.stopAmbient()
      return false
    } else {
      this.startAmbient()
      return true
    }
  }

  startAmbient() {
    const ctx = this.getContext()
    if (!ctx) return
    if (this.isAmbientPlaying) return

    try {
      this.ambientGain = ctx.createGain()
      this.ambientGain.gain.setValueAtTime(0.03, ctx.currentTime)
      this.ambientGain.connect(ctx.destination)

      // Drone chord: D2, A2, F3 (mysterious minor chord)
      const freqs = [73.42, 110.0, 174.61]
      this.oscPool = freqs.map((f, i) => {
        const osc = ctx.createOscillator()
        osc.type = i === 0 ? 'sawtooth' : 'sine'
        osc.frequency.setValueAtTime(f, ctx.currentTime)

        // Filter to make it deep and moody
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(320, ctx.currentTime)

        osc.connect(filter)
        if (this.ambientGain) {
          filter.connect(this.ambientGain)
        }
        osc.start()
        return osc
      })

      this.isAmbientPlaying = true
    } catch {
      // Audio fallback
    }
  }

  stopAmbient() {
    this.oscPool.forEach((osc) => {
      try {
        osc.stop()
        osc.disconnect()
      } catch {
        // Safe disconnect
      }
    })
    this.oscPool = []
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect()
      } catch {
        // Safe disconnect
      }
      this.ambientGain = null
    }
    this.isAmbientPlaying = false
  }

  // Ascending rune chime (tone index 0, 1, 2)
  playRuneChime(step: number = 0) {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const freqs = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      const freq = freqs[Math.min(step, freqs.length - 1)]
      const now = ctx.currentTime

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.3)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.36)
    } catch {
      // Audio fallback
    }
  }

  // Dissonant error fizzle when incorrect rune is struck
  playErrorFizzle() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(160, now)
      osc.frequency.linearRampToValueAtTime(90, now + 0.3)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.36)
    } catch {
      // Audio fallback
    }
  }

  // Radiant victory fanfare when chamber is solved
  playVictoryFanfare() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51] // C Major radiant chord

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
        const startTime = now + idx * 0.09
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0.1, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.85)
      })
    } catch {
      // Audio fallback
    }
  }

  // Deep somber defeat tone when timer hits 0
  playDefeatTone() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const notes = [220, 196, 174.61, 146.83] // Descending minor lament
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        const startTime = now + idx * 0.22
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0.09, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.55)
      })
    } catch {
      // Audio fallback
    }
  }

  // Play vibrant triumphant sparkle chime for correct science answer (+100 PTS)
  playCorrectScienceAnswer() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51] // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const startTime = now + idx * 0.06
        osc.frequency.setValueAtTime(freq, startTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.25)

        gain.gain.setValueAtTime(0.09, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.38)
      })
    } catch {
      // Audio fallback
    }
  }

  // Play funny wobble tone for guardian dare reaction
  playGuardianDareAlert() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(280, now)
      osc.frequency.linearRampToValueAtTime(140, now + 0.15)
      osc.frequency.linearRampToValueAtTime(220, now + 0.3)
      osc.frequency.linearRampToValueAtTime(110, now + 0.45)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.5)
    } catch {
      // Audio fallback
    }
  }

  // Resonant ethereal whoosh when warping into a portal
  playPortalWarp() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.45)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.2)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.52)
    } catch {
      // Audio fallback
    }
  }

  // Sparkling chime when a portal unlocks
  playPortalUnlock() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const freqs = [440, 554.37, 659.25, 880, 1108.73]
      const now = ctx.currentTime
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const startTime = now + idx * 0.07
        osc.frequency.setValueAtTime(f, startTime)
        gain.gain.setValueAtTime(0.08, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.42)
      })
    } catch {
      // Audio fallback
    }
  }

  // Crisp arcade gold coin ding (+10 PTS)
  playCoinCatch() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const freqs = [987.77, 1318.51] // B5 -> E6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        const startTime = now + idx * 0.05
        osc.frequency.setValueAtTime(freq, startTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.15)

        gain.gain.setValueAtTime(0.12, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.22)
      })
    } catch {
      // Audio fallback
    }
  }

  // Sparkling celestial crystal chime for rare diamond (+50 PTS)
  playDiamondCatch() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const freqs = [1046.5, 1396.91, 1760.0, 2093.0] // C6, F6, A6, C7 arpeggio
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine'
        const startTime = now + idx * 0.04
        osc.frequency.setValueAtTime(freq, startTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.1, startTime + 0.2)

        gain.gain.setValueAtTime(0.1, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.32)
      })
    } catch {
      // Audio fallback
    }
  }

  // Cartoon obstacle bomb explosion & thud (-10 PTS)
  playBombHit() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.3)

      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(400, now)
      filter.frequency.linearRampToValueAtTime(100, now + 0.3)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.35)
    } catch {
      // Audio fallback
    }
  }

  // Sharp comical hurt tone when player loses a heart
  playPlayerHurt() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.linearRampToValueAtTime(140, now + 0.12)
      osc.frequency.linearRampToValueAtTime(220, now + 0.22)
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.38)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.42)
    } catch {
      // Audio fallback
    }
  }

  // Squishy wet tomato splat effect
  playTomatoSplat() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(450, now)
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.18)

      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.24)
    } catch {
      // Audio fallback
    }
  }

  // Silly chicken squawk / cluck effect
  playChickenSquawk() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.linearRampToValueAtTime(820, now + 0.08)
      osc.frequency.linearRampToValueAtTime(440, now + 0.18)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.26)
    } catch {
      // Audio fallback
    }
  }

  // Celestial Counter-Beam Special Attack Blast
  playBossLaserBlast() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.5)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1600, now)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.58)
    } catch {
      // Audio fallback
    }
  }

  // Comical boss taking damage groaning wobble
  playBossHurt() {
    if (this.isMuted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(160, now)
      osc.frequency.linearRampToValueAtTime(240, now + 0.08)
      osc.frequency.linearRampToValueAtTime(80, now + 0.3)

      gain.gain.setValueAtTime(0.22, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.36)
    } catch {
      // Audio fallback
    }
  }

  // Throttling helper to prevent audio distortion / overlapping spam
  private lastSoundTimes: Record<string, number> = {}

  private canPlay(soundId: string, minIntervalMs: number = 80): boolean {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const last = this.lastSoundTimes[soundId] || 0
    if (now - last < minIntervalMs) {
      return false
    }
    this.lastSoundTimes[soundId] = now
    return true
  }

  // 1. Catching a ball or coin: a satisfying collection sound
  playBallCatch() {
    this.playCoinCatch()
  }

  // 2. Missing or dropping a ball: a soft falling sound
  playBallDrop() {
    if (this.isMuted) return
    if (!this.canPlay('ballDrop', 140)) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'sine'
      // Smoothly descending pitch
      osc.frequency.setValueAtTime(340, now)
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(450, now)
      filter.frequency.linearRampToValueAtTime(180, now + 0.22)

      gain.gain.setValueAtTime(0.07, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.25)
    } catch {
      // Audio fallback
    }
  }

  // 3. Escaping a trap or avoiding an obstacle: a magical success sound
  playTrapEscape() {
    if (this.isMuted) return
    if (!this.canPlay('trapEscape', 200)) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      // Ethereal rising sparkle arpeggio: E5 (659.25Hz), B5 (987.77Hz), G6 (1567.98Hz)
      const notes = [659.25, 987.77, 1567.98]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = idx === 2 ? 'sine' : 'triangle'
        const startTime = now + idx * 0.06

        osc.frequency.setValueAtTime(freq, startTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.08, startTime + 0.2)

        gain.gain.setValueAtTime(0.08, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.3)
      })
    } catch {
      // Audio fallback
    }
  }

  // 4. Losing a life: a subtle warning sound
  playLifeLost() {
    if (this.isMuted) return
    if (!this.canPlay('lifeLost', 250)) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const freqs = [240, 180]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        osc.type = 'triangle'
        const startTime = now + idx * 0.1
        osc.frequency.setValueAtTime(freq, startTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, startTime + 0.12)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(380, startTime)

        gain.gain.setValueAtTime(0.12, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.16)
      })
    } catch {
      // Audio fallback
    }
  }

  // 5. Correct riddle answer: a cheerful success sound
  playCorrectRiddle() {
    if (this.isMuted) return
    if (!this.canPlay('correctRiddle', 350)) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      // Bright cheerful ascending chime: C5, E5, G5, C6
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const startTime = now + idx * 0.07

        osc.frequency.setValueAtTime(freq, startTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.04, startTime + 0.28)

        gain.gain.setValueAtTime(0.11, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.4)
      })
    } catch {
      // Audio fallback
    }
  }

  // 6. Wrong riddle answer: a gentle error sound
  playWrongAnswer() {
    if (this.isMuted) return
    if (!this.canPlay('wrongAnswer', 350)) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      // Soft gentle two-tone descent: F4 (349.23Hz) -> C4 (261.63Hz)
      const notes = [349.23, 261.63]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        osc.type = 'sine'
        const startTime = now + idx * 0.12
        osc.frequency.setValueAtTime(freq, startTime)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(420, startTime)

        gain.gain.setValueAtTime(0.09, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.2)
      })
    } catch {
      // Audio fallback
    }
  }

  // 7. Clicking a button: a light click sound
  playButtonClick() {
    if (this.isMuted) return
    if (!this.canPlay('btnClick', 50)) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      // Very short, tactile micro-tap
      osc.frequency.setValueAtTime(1400, now)
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.025)

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.035)
    } catch {
      // Audio fallback
    }
  }

  // 8. Completing a level: a short victory sound
  playLevelComplete() {
    if (this.isMuted) return
    if (!this.canPlay('levelComplete', 400)) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      // Short triumphant fanfare
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine'
        const startTime = now + idx * 0.07

        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.1, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.5)
      })
    } catch {
      // Audio fallback
    }
  }

  // Attach global button click handler once user interacts with page
  initButtonSounds() {
    if (typeof window === 'undefined') return
    if ((window as unknown as { __btnSoundsInit?: boolean }).__btnSoundsInit) return
    ;(window as unknown as { __btnSoundsInit?: boolean }).__btnSoundsInit = true

    window.addEventListener(
      'click',
      (e) => {
        const target = e.target as HTMLElement | null
        if (!target) return
        const button = target.closest('button, [role="button"], a.btn, [data-selectable="true"]')
        if (button) {
          this.playButtonClick()
        }
      },
      { passive: true }
    )
  }

  getAmbientState(): boolean {
    return this.isAmbientPlaying
  }
}

export const sound = new SoundSystem()
if (typeof window !== 'undefined') {
  sound.initButtonSounds()
}
