import { useEffect, useRef } from 'react'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
}

interface Rocket {
  x: number
  y: number
  vy: number
  targetY: number
  color: string
  done: boolean
}

interface FireworksProps {
  active: boolean
  intensity?: number
  palette?: string[]
  className?: string
}

const DEFAULT_PALETTE = ['#ff4f9a', '#ff7ab8', '#ffd6e8', '#e8d5b5', '#d4af7a', '#ffffff']

export function Fireworks({ active, intensity = 0.7, palette = DEFAULT_PALETTE, className }: FireworksProps) {
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
    const sparks: Spark[] = []
    const rockets: Rocket[] = []
    let lastLaunch = 0

    const explode = (x: number, y: number, color: string) => {
      const count = Math.round(24 + intensity * 20)
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
        const speed = 1.4 + Math.random() * 3.4
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 50 + Math.random() * 40,
          color: Math.random() < 0.7 ? color : '#ffffff',
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
    }

    const tick = (now: number) => {
      ctx.clearRect(0, 0, w, h)

      if (active && !reduced) {
        if (now - lastLaunch > 900 - intensity * 250) {
          const colors = palette.length ? palette : DEFAULT_PALETTE
          rockets.push({
            x: w * (0.15 + Math.random() * 0.7),
            y: h,
            vy: -(5 + Math.random() * 2.5),
            targetY: h * (0.18 + Math.random() * 0.3),
            color: colors[Math.floor(Math.random() * colors.length)],
            done: false,
          })
          lastLaunch = now
        }
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        r.y += r.vy
        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color)
          rockets.splice(i, 1)
          continue
        }
        ctx.globalAlpha = 0.9
        ctx.fillStyle = r.color
        ctx.beginPath()
        ctx.arc(r.x, r.y, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life += 1
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.04
        s.vx *= 0.99
        if (s.life >= s.maxLife) {
          sparks.splice(i, 1)
          continue
        }
        ctx.globalAlpha = Math.max(0, 1 - s.life / s.maxLife)
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }

    resize()
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, intensity, palette])

  return <canvas ref={ref} className={className} aria-hidden />
}
