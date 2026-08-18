import { useEffect, useRef } from 'react'

interface Piece {
  x: number
  y: number
  w: number
  h: number
  rot: number
  vr: number
  vx: number
  vy: number
  color: string
  shape: 'rect' | 'circle' | 'heart'
  sway: number
  swaySpeed: number
  life: number
}

interface ConfettiProps {
  active: boolean
  intensity?: number // 0..1
  palette?: string[]
  className?: string
}

const DEFAULT_PALETTE = ['#ff4f9a', '#ff7ab8', '#ffd6e8', '#e8d5b5', '#d4af7a', '#ffffff']

function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.3)
  ctx.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.25, x - s * 0.5, y + s * 0.05)
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.35, x, y + s * 0.5, x, y + s * 0.7)
  ctx.bezierCurveTo(x, y + s * 0.5, x + s * 0.5, y + s * 0.35, x + s * 0.5, y + s * 0.05)
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.25, x, y, x, y + s * 0.3)
  ctx.closePath()
}

/** Elegant, slow confetti + floating hearts for the birthday reveal. */
export function Confetti({ active, intensity = 0.7, palette = DEFAULT_PALETTE, className }: ConfettiProps) {
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
    const pieces: Piece[] = []
    let lastSpawn = 0

    const spawn = () => {
      const colors = palette.length ? palette : DEFAULT_PALETTE
      const roll = Math.random()
      const shape: Piece['shape'] = roll < 0.18 ? 'heart' : roll < 0.4 ? 'circle' : 'rect'
      const size = shape === 'heart' ? 8 + Math.random() * 10 : 4 + Math.random() * 7
      pieces.push({
        x: Math.random() * w,
        y: -20,
        w: size,
        h: shape === 'rect' ? size * (0.4 + Math.random() * 0.4) : size,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.04,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.5 + Math.random() * (0.8 + intensity),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.01 + Math.random() * 0.03,
        life: 0,
      })
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      if (active && !reduced) {
        const now = performance.now()
        const spawnRate = 6 + intensity * 14
        if (now - lastSpawn > 1000 / spawnRate) {
          spawn()
          if (Math.random() < 0.3) spawn()
          lastSpawn = now
        }
      }
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i]
        p.life += 1
        p.sway += p.swaySpeed
        p.x += p.vx + Math.sin(p.sway) * 0.4
        p.y += p.vy
        p.rot += p.vr
        if (p.y > h + 30 || p.life > 1600) {
          pieces.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.min(1, Math.max(0, 1 - p.life / 1600))
        ctx.fillStyle = p.color
        if (p.shape === 'heart') {
          heartPath(ctx, 0, 0, p.w)
          ctx.fill()
        } else if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        }
        ctx.restore()
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
