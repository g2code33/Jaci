import { useEffect, useRef } from 'react'

interface Drop {
  x: number
  y: number
  r: number
  born: number
  life: number
}

interface Ripple {
  x: number
  y: number
  r: number
  born: number
  life: number
}

/**
 * A subtle "rain on glass" effect: small glossy droplets appear and slowly
 * fade, while soft ripples expand from random points. Respects
 * prefers-reduced-motion.
 */
export function WaterDrops({ strength = 0.6, color = '#ffffff', className }: { strength?: number; color?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let raf = 0
    let w = 0
    let h = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const drops: Drop[] = []
    const ripples: Ripple[] = []
    let lastSpawn = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const tick = (now: number) => {
      ctx.clearRect(0, 0, w, h)
      const s = Math.max(0.1, strength)

      if (now - lastSpawn > 1300 / s) {
        lastSpawn = now
        const x = Math.random() * w
        const y = Math.random() * h
        if (drops.length < 26) {
          drops.push({ x, y, r: 2 + Math.random() * 3.5, born: now, life: 2600 + Math.random() * 2600 })
        }
        if (ripples.length < 12) {
          ripples.push({ x, y, r: 2, born: now, life: 1600 })
        }
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        const age = now - d.born
        if (age >= d.life) {
          drops.splice(i, 1)
          continue
        }
        const fadeIn = Math.min(1, age / 500)
        const fadeOut = Math.min(1, (d.life - age) / 500)
        const a = Math.min(fadeIn, fadeOut) * 0.55
        const grad = ctx.createRadialGradient(d.x - d.r * 0.35, d.y - d.r * 0.35, 0, d.x, d.y, d.r)
        grad.addColorStop(0, 'rgba(255,255,255,0.9)')
        grad.addColorStop(0.4, 'rgba(255,255,255,0.25)')
        grad.addColorStop(1, 'rgba(255,255,255,0.02)')
        ctx.globalAlpha = a
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        const age = now - r.born
        if (age >= r.life) {
          ripples.splice(i, 1)
          continue
        }
        const t = age / r.life
        const radius = r.r + t * 26
        const a = (1 - t) * 0.28
        ctx.globalAlpha = a
        ctx.strokeStyle = color
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [strength, color])

  return <canvas ref={ref} className={className} aria-hidden />
}
