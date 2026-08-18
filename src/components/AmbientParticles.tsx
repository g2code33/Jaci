import { useEffect, useRef } from 'react'

interface Dot {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  a: number
  phase: number
}

interface AmbientParticlesProps {
  /** 0..1 */
  density?: number
  color?: string
  className?: string
}

/** Slow, barely-there drifting particles — the cinematic "dust". */
export function AmbientParticles({ density = 0.4, color = '#ff9ec4', className }: AmbientParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let w = 0
    let h = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const dots: Dot[] = []

    const seed = () => {
      dots.length = 0
      const count = reduced ? 0 : Math.round(Math.max(0, density) * 70)
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 1.6,
          vx: (Math.random() - 0.5) * 0.08,
          vy: -(0.04 + Math.random() * 0.14),
          a: 0.15 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const d of dots) {
        d.x += d.vx
        d.y += d.vy
        if (d.y < -6) {
          d.y = h + 6
          d.x = Math.random() * w
        }
        if (d.x < -6) d.x = w + 6
        if (d.x > w + 6) d.x = -6
        const twinkle = 0.6 + 0.4 * Math.sin(t / 1400 + d.phase)
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = d.a * twinkle
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [density, color])

  return <canvas ref={ref} className={className} aria-hidden />
}
