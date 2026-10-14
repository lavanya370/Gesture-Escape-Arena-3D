import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  pulseSpeed: number
  color: string
  glowColor: string
}

export const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    // Palette of magical particles: Arcane Violet, Cyan Star, Mystic Gold, Celestial White
    const colors = [
      { fill: 'rgba(192, 132, 252, ', glow: 'rgba(168, 85, 247, 0.8)' }, // Purple
      { fill: 'rgba(56, 189, 248, ', glow: 'rgba(6, 182, 212, 0.8)' },   // Cyan
      { fill: 'rgba(251, 191, 36, ', glow: 'rgba(245, 158, 11, 0.7)' },   // Gold
      { fill: 'rgba(236, 72, 153, ', glow: 'rgba(219, 39, 119, 0.6)' },   // Magenta
      { fill: 'rgba(224, 242, 254, ', glow: 'rgba(186, 230, 253, 0.9)' },  // Pure Starlight
    ]

    const particleCount = Math.min(85, Math.floor((width * height) / 16000))
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)]
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.8 + 1.2,
        speedX: (Math.random() - 0.5) * 0.45,
        speedY: -Math.random() * 0.7 - 0.25, // Gently float upwards
        opacity: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.008,
        color: col.fill,
        glowColor: col.glow,
      })
    }

    let time = 0

    const render = () => {
      time += 0.02
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Drift update
        p.x += p.speedX + Math.sin(time + i) * 0.2
        p.y += p.speedY

        // Mouse subtle repulsion
        if (mouseRef.current.active) {
          const dx = p.x - mouseRef.current.x
          const dy = p.y - mouseRef.current.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140 && dist > 0) {
            const force = (140 - dist) / 140
            p.x += (dx / dist) * force * 2.2
            p.y += (dy / dist) * force * 2.2
          }
        }

        // Screen wrap
        if (p.y < -10) {
          p.y = height + 10
          p.x = Math.random() * width
        }
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        // Opacity pulsing shimmer
        const alpha = Math.max(0.15, Math.min(1, p.opacity + Math.sin(time * 2 + i) * 0.25))

        // Draw particle with glow
        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${alpha})`
        ctx.shadowColor = p.glowColor
        ctx.shadowBlur = p.size * 6
        ctx.fill()

        // Occasional cross sparkle on larger particles
        if (p.size > 2.6 && (i % 4 === 0)) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(p.x - p.size * 2, p.y)
          ctx.lineTo(p.x + p.size * 2, p.y)
          ctx.moveTo(p.x, p.y - p.size * 2)
          ctx.lineTo(p.x, p.y + p.size * 2)
          ctx.stroke()
        }

        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  )
}
