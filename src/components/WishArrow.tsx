import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { GlowingHeart } from '@/components/GlowingHeart'
import { OpeningHeart } from '@/components/OpeningHeart'
import { clamp } from '@/lib/utils'
import { playImpact, playWhoosh, playChime, ensureAudio } from '@/lib/sound'
import { hapticPulse } from '@/lib/haptics'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface WishArrowProps {
  arrowColor: string
  heartColor: string
  glow: number // 0..1
  trailIntensity: number // 0..1
  minPull: number
  maxPull: number
  soundEffects: boolean
  impactEffect: 'heartBurst' | 'shockwave' | 'both'
  flightDuration: number
  pierceDuration: number
  instruction: string
  releaseInstruction?: string
  impactMessage?: string
  onImpact: () => void
}

interface FX {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

interface Ring {
  x: number
  y: number
  r: number
  vr: number
  life: number
  maxLife: number
}

interface Flower {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  rot: number
  vr: number
  color: string
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return `rgba(255,122,184,${alpha})`
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
}

const FLOWER_PALETTE = ['#ff7ab8', '#ffd6e8', '#e8d5b5', '#ffffff', '#ff4f9a']

type Phase = 'idle' | 'dragging' | 'lunging' | 'pierce' | 'opening' | 'done'

/**
 * The "Wish Arrow" — a romantic replacement for the bow.
 *
 * A glowing heart sits at the top; a glowing arrow floats below it. She drags
 * the arrow upward into the heart; it pierces, the heart opens, the message
 * pops out and a soft shower of flowers rains down.
 *
 * Everything is laid out in normal flow (centred) — no fragile absolute
 * positioning — so it looks right on every screen size.
 */
export function WishArrow({
  arrowColor,
  heartColor,
  glow,
  trailIntensity,
  minPull,
  maxPull,
  soundEffects,
  impactEffect,
  flightDuration,
  pierceDuration,
  instruction,
  releaseInstruction = 'Let go…',
  impactMessage,
  onImpact,
}: WishArrowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)
  const heartRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)
  const messageRef = useRef<HTMLParagraphElement>(null)
  const instructionRef = useRef<HTMLParagraphElement>(null)

  const isDesktop = useMediaQuery('(min-width: 768px)')
  const heartSize = isDesktop ? 84 : 62
  const arrowH = isDesktop ? 190 : 156

  const [phase, setPhase] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')
  const arrowY = useMotionValue(0)

  const draggingRef = useRef(false)
  const dragStartRef = useRef({ y: 0, dy: 0 })
  const geoRef = useRef({ gap: 220, heartCX: 0, heartCY: 0, heartSize: 62, restTipY: 0 })
  const heartSizeRef = useRef(62)
  const flightRef = useRef(flightDuration)
  const pierceRef = useRef(pierceDuration)
  const pierceTimerRef = useRef<number | null>(null)
  const onImpactRef = useRef(onImpact)
  onImpactRef.current = onImpact

  useEffect(() => {
    flightRef.current = flightDuration
  }, [flightDuration])
  useEffect(() => {
    pierceRef.current = pierceDuration
  }, [pierceDuration])
  useEffect(() => {
    heartSizeRef.current = heartSize
  }, [heartSize])

  const particles = useRef<FX[]>([])
  const rings = useRef<Ring[]>([])
  const flashes = useRef<FX[]>([])
  const flowers = useRef<Flower[]>([])
  const sizeRef = useRef({ w: 0, h: 0 })
  const lastShowerSpawn = useRef(0)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // ── Geometry (measure the fixed layout) ───────────────────
  const measure = useCallback(() => {
    const c = containerRef.current
    const h = heartRef.current
    const a = arrowRef.current
    if (!c || !h || !a) return
    const cr = c.getBoundingClientRect()
    const hr = h.getBoundingClientRect()
    const ar = a.getBoundingClientRect()
    geoRef.current = {
      gap: ar.top - cr.top - (hr.top + hr.height / 2 - cr.top),
      heartCX: hr.left + hr.width / 2 - cr.left,
      heartCY: hr.top + hr.height / 2 - cr.top,
      heartSize: hr.height,
      restTipY: ar.top - cr.top,
    }
    heartSizeRef.current = hr.height
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  // ── FX helpers ────────────────────────────────────────────
  const spawnBurst = useCallback((x: number, y: number, count: number, color: string) => {
    if (reduced.current) return
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 5.5
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 40 + Math.random() * 50,
        size: 1.2 + Math.random() * 2.8,
        color: Math.random() < 0.7 ? color : '#ffd6e8',
      })
    }
  }, [])

  const spawnShockwave = useCallback((x: number, y: number) => {
    if (reduced.current) return
    rings.current.push({ x, y, r: 6, vr: 6.5, life: 0, maxLife: 55 })
    rings.current.push({ x, y, r: 4, vr: 4.0, life: 0, maxLife: 72 })
  }, [])

  const spawnFlash = useCallback((x: number, y: number, color: string) => {
    flashes.current.push({ x, y, vx: 0, vy: 0, life: 0, maxLife: 16, size: 40, color })
  }, [])

  const spawnFlowers = useCallback((x: number, y: number, count: number) => {
    if (reduced.current) return
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.4 + Math.random() * 1.6
      flowers.current.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 0,
        maxLife: 90 + Math.random() * 60,
        size: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.07,
        color: FLOWER_PALETTE[Math.floor(Math.random() * FLOWER_PALETTE.length)],
      })
    }
  }, [])

  const spawnShower = useCallback((cx: number, cy: number, count: number) => {
    if (reduced.current) return
    const { w } = sizeRef.current
    const spread = Math.max(140, (w || 400) * 0.5)
    for (let i = 0; i < count; i++) {
      flowers.current.push({
        x: cx + (Math.random() - 0.5) * spread * 1.8,
        y: cy - 60 - Math.random() * 160,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.35 + Math.random() * 0.55,
        life: 0,
        maxLife: 150 + Math.random() * 80,
        size: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.06,
        color: FLOWER_PALETTE[Math.floor(Math.random() * FLOWER_PALETTE.length)],
      })
    }
  }, [])

  // ── Pierce → open ─────────────────────────────────────────
  const triggerPierce = useCallback(
    (x: number, y: number) => {
      phaseRef.current = 'pierce'
      setPhase('pierce')
      spawnBurst(x, y, 70, heartColor)
      if (impactEffect === 'shockwave' || impactEffect === 'both') spawnShockwave(x, y)
      if (soundEffects) playImpact()
      hapticPulse()

      pierceTimerRef.current = window.setTimeout(() => {
        phaseRef.current = 'opening'
        setPhase('opening')
        spawnFlash(x, y, heartColor)
        spawnBurst(x, y, 46, '#ffd6e8')
        spawnFlowers(x, y, 16)
        if (soundEffects) playChime()

        window.setTimeout(() => {
          const m = messageRef.current
          const c = containerRef.current
          if (m && c) {
            const mr = m.getBoundingClientRect()
            const cr = c.getBoundingClientRect()
            const mx = mr.left - cr.left + mr.width / 2
            const my = mr.top - cr.top + mr.height / 2
            spawnFlowers(mx, my, 12)
            spawnShower(mx, my, 30)
          }
        }, 520)
      }, pierceRef.current)
    },
    [heartColor, impactEffect, soundEffects, spawnBurst, spawnFlash, spawnFlowers, spawnShower, spawnShockwave],
  )

  // ── Main FX loop ──────────────────────────────────────────
  useEffect(() => {
    const fx = fxRef.current
    if (!fx) return
    const ctx = fx.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = fx.clientWidth
      h = fx.clientHeight
      sizeRef.current = { w, h }
      fx.width = Math.max(1, Math.floor(w * dpr))
      fx.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const drawFx = (now: number) => {
      ctx.clearRect(0, 0, w, h)

      const ph = phaseRef.current
      if (ph === 'idle' || ph === 'dragging') {
        const { heartCX, heartCY, restTipY, gap } = geoRef.current
        const dy = arrowY.get()
        const progress = clamp(-dy / Math.max(1, gap), 0, 1)
        ctx.strokeStyle = hexToRgba(heartColor, 0.22 + progress * 0.4)
        ctx.lineWidth = 1.6
        ctx.setLineDash([3, 9])
        ctx.beginPath()
        ctx.moveTo(heartCX, heartCY + 6)
        ctx.lineTo(heartCX, restTipY + dy)
        ctx.stroke()
        ctx.setLineDash([])
      }

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i]
        p.life += 1
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.985
        p.vy = p.vy * 0.985 + 0.02
        if (p.life >= p.maxLife) {
          particles.current.splice(i, 1)
          continue
        }
        ctx.globalAlpha = 1 - p.life / p.maxLife
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = flowers.current.length - 1; i >= 0; i--) {
        const fl = flowers.current[i]
        fl.life += 1
        fl.x += fl.vx
        fl.y += fl.vy
        fl.vx *= 0.99
        fl.vy *= 0.99
        fl.vy -= 0.008
        fl.rot += fl.vr
        if (fl.life >= fl.maxLife) {
          flowers.current.splice(i, 1)
          continue
        }
        ctx.globalAlpha = 1 - fl.life / fl.maxLife
        drawFlower(ctx, fl)
      }

      for (let i = rings.current.length - 1; i >= 0; i--) {
        const r = rings.current[i]
        r.life += 1
        r.r += r.vr
        if (r.life >= r.maxLife) {
          rings.current.splice(i, 1)
          continue
        }
        ctx.globalAlpha = (1 - r.life / r.maxLife) * 0.8
        ctx.strokeStyle = heartColor
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      for (let i = flashes.current.length - 1; i >= 0; i--) {
        const fl = flashes.current[i]
        fl.life += 1
        if (fl.life >= fl.maxLife) {
          flashes.current.splice(i, 1)
          continue
        }
        const a = 1 - fl.life / fl.maxLife
        const grad = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, fl.size)
        grad.addColorStop(0, hexToRgba(fl.color, a))
        grad.addColorStop(1, hexToRgba(fl.color, 0))
        ctx.globalAlpha = 1
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(fl.x, fl.y, fl.size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      raf = requestAnimationFrame(drawFx)
    }

    raf = requestAnimationFrame(drawFx)
    const ro = new ResizeObserver(resize)
    ro.observe(fx)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [arrowColor, heartColor, arrowY, spawnShower, spawnFlowers])

  // ── Pointer interaction ───────────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      const dy = dragStartRef.current.dy + (e.clientY - dragStartRef.current.y)
      const maxUp = Math.min(maxPull || 400, geoRef.current.gap + 90)
      const clamped = clamp(dy, -maxUp, 24)
      arrowY.set(clamped)
      if (phaseRef.current === 'idle') {
        phaseRef.current = 'dragging'
        setPhase('dragging')
      }
      if (instructionRef.current) {
        instructionRef.current.textContent = clamped <= -(geoRef.current.gap - heartSizeRef.current * 0.3)
          ? releaseInstruction
          : instruction
      }
      if (!reduced.current) {
        const { heartCX, restTipY } = geoRef.current
        const count = trailIntensity > 0 ? Math.round(1 + trailIntensity * 2) : 0
        for (let i = 0; i < count; i++) {
          particles.current.push({
            x: heartCX + (Math.random() - 0.5) * 8,
            y: restTipY + clamped + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            life: 0,
            maxLife: 20 + Math.random() * 18,
            size: 1 + Math.random() * 2,
            color: arrowColor,
          })
        }
      }
    }

    const onUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      const dy = arrowY.get()
      const reached = dy <= -(geoRef.current.gap - heartSizeRef.current * 0.3)
      if (reached) {
        phaseRef.current = 'lunging'
        setPhase('lunging')
        const target = -(geoRef.current.gap + heartSizeRef.current * 0.1)
        if (soundEffects) playWhoosh()
        hapticPulse()
        animate(arrowY, target, {
          duration: flightRef.current / 1000,
          ease: 'easeIn',
          onComplete: () => {
            triggerPierce(geoRef.current.heartCX, geoRef.current.heartCY)
          },
        })
      } else {
        animate(arrowY, 0, { type: 'spring', stiffness: 220, damping: 24 })
        if (phaseRef.current === 'dragging') {
          phaseRef.current = 'idle'
          setPhase('idle')
        }
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [arrowY, instruction, releaseInstruction, maxPull, soundEffects, trailIntensity, arrowColor, triggerPierce])

  useEffect(() => {
    return () => {
      if (pierceTimerRef.current) window.clearTimeout(pierceTimerRef.current)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== 'idle' && phaseRef.current !== 'dragging') return
    e.preventDefault()
    ensureAudio()
    measure()
    draggingRef.current = true
    dragStartRef.current = { y: e.clientY, dy: arrowY.get() }
    if (phaseRef.current === 'idle') {
      phaseRef.current = 'dragging'
      setPhase('dragging')
    }
  }

  const message = impactMessage?.trim() || 'You opened my heart. ❤️'
  const hideArrow = phase === 'opening' || phase === 'done'

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full select-none flex-col items-center"
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      {/* Heart + message + continue (all in flow) */}
      <div ref={heartRef} className="relative mt-[max(9vh,56px)] flex flex-col items-center">
        <motion.div
          animate={
            phase === 'pierce'
              ? { x: [0, -7, 6, -4, 2, 0], scale: [1, 1.08, 1.02, 1] }
              : { x: 0, scale: 1 }
          }
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {phase === 'pierce' || phase === 'opening' || phase === 'done' ? (
            <OpeningHeart color={heartColor} size={heartSize} open={phase !== 'pierce'} />
          ) : (
            <GlowingHeart color={heartColor} size={heartSize} glow={glow} pulse interactive={false} />
          )}
        </motion.div>

        {phase === 'opening' && (
          <div className="flex flex-col items-center text-center">
            <motion.p
              ref={messageRef}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 240, damping: 16 }}
              className="mt-8 max-w-[min(86vw,360px)] font-display text-2xl italic leading-snug text-glow sm:text-3xl"
            >
              {message}
            </motion.p>
            <motion.button
              type="button"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.94 }}
              transition={{ delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onImpactRef.current()}
              className="btn-solid relative z-20 mt-7"
            >
              Continue ❤️
            </motion.button>
          </div>
        )}
      </div>

      {/* Arrow — floats below the heart, dragged upward */}
      <motion.div
        ref={arrowRef}
        style={{ y: arrowY, pointerEvents: hideArrow ? 'none' : 'auto' }}
        animate={{ opacity: hideArrow ? 0 : 1, rotate: phase === 'pierce' ? -8 : 0 }}
        transition={{ opacity: { duration: 0.4 }, rotate: { duration: 0.2 } }}
        onPointerDown={onPointerDown}
        onContextMenu={(e) => e.preventDefault()}
        className="relative mt-[min(13vh,110px)] cursor-grab active:cursor-grabbing"
        aria-label="Drag the arrow into the heart"
      >
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${arrowColor}33 0%, transparent 70%)` }}
        />
        <ArrowSvg color={arrowColor} height={arrowH} />
      </motion.div>

      {/* Instruction */}
      {(phase === 'idle' || phase === 'dragging') && (
        <p ref={instructionRef} className="mt-7 font-body text-sm uppercase tracking-[0.3em] text-white/70">
          {instruction}
        </p>
      )}

      {/* FX canvas */}
      <canvas ref={fxRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
    </div>
  )
}

function ArrowSvg({ color, height }: { color: string; height: number }) {
  const w = Math.round(height * 0.34)
  return (
    <svg width={w} height={height} viewBox="0 0 40 200" aria-hidden>
      <defs>
        <linearGradient id="wish-shaft" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <line x1="20" y1="196" x2="20" y2="34" stroke="url(#wish-shaft)" strokeWidth="5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 7px ${color})` }} />
      <path d="M20 196 L8 176 L14 188 Z" fill={color} opacity="0.9" />
      <path d="M20 196 L32 176 L26 188 Z" fill={color} opacity="0.9" />
      <path d="M20 4 L9 36 L20 30 L31 36 Z" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <circle cx="20" cy="10" r="2.4" fill="#ffffff" />
    </svg>
  )
}

function drawFlower(ctx: CanvasRenderingContext2D, f: Flower) {
  ctx.save()
  ctx.translate(f.x, f.y)
  ctx.rotate(f.rot)
  const petals = 5
  for (let i = 0; i < petals; i++) {
    ctx.rotate((Math.PI * 2) / petals)
    ctx.fillStyle = f.color
    ctx.beginPath()
    ctx.ellipse(0, -f.size * 0.55, f.size * 0.32, f.size * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#fff0d6'
  ctx.beginPath()
  ctx.arc(0, 0, f.size * 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
