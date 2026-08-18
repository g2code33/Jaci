import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { GlowingHeart } from '@/components/GlowingHeart'
import { clamp } from '@/lib/utils'
import { playImpact, playWhoosh, ensureAudio } from '@/lib/sound'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// ── Geometry (SVG viewBox coordinates) ──────────────────────
const VIEW_W = 300
const VIEW_H = 520
const GRIP_X = 150
const GRIP_Y = 330
const REST_TIP_X = 136
const REST_TOP_Y = 168
const REST_BOT_Y = 492
const ARROW_LEN = 152

interface BowArrowProps {
  arrowColor: string
  heartColor: string
  glow: number // 0..1
  trailIntensity: number // 0..1
  minPull: number
  maxPull: number
  soundEffects: boolean
  impactEffect: 'heartBurst' | 'shockwave' | 'both'
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

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return `rgba(255,122,184,${alpha})`
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

type Phase = 'idle' | 'drawing' | 'flying' | 'impact' | 'done'

export function BowArrow({
  arrowColor,
  heartColor,
  glow,
  trailIntensity,
  minPull,
  maxPull,
  soundEffects,
  impactEffect,
  instruction,
  releaseInstruction = 'Let go…',
  impactMessage,
  onImpact,
}: BowArrowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)
  const heartRef = useRef<HTMLDivElement>(null)
  const heartInnerRef = useRef<HTMLDivElement>(null)

  const bowTopRef = useRef<SVGPathElement>(null)
  const bowBotRef = useRef<SVGPathElement>(null)
  const stringRef = useRef<SVGPathElement>(null)
  const arrowGroupRef = useRef<SVGGElement>(null)
  const nockGlowRef = useRef<SVGCircleElement>(null)
  const guideRef = useRef<SVGLineElement>(null)
  const instructionRef = useRef<HTMLParagraphElement>(null)
  const barWrapRef = useRef<HTMLDivElement>(null)
  const barFillRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Refs read/written by the rAF loop.
  const pullRef = useRef(0)
  const draggingRef = useRef(false)
  const dragStartRef = useRef({ y: 0, pull: 0 })
  const phaseRef = useRef<Phase>('idle')
  const flightRef = useRef<{ sx: number; sy: number; ex: number; ey: number; t0: number; dur: number } | null>(null)
  const springRef = useRef<{ from: number; to: number; t0: number; dur: number } | null>(null)
  const impactTimerRef = useRef<number | null>(null)
  const onImpactRef = useRef(onImpact)
  onImpactRef.current = onImpact

  const particles = useRef<FX[]>([])
  const rings = useRef<Ring[]>([])
  const flashes = useRef<FX[]>([])

  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // ── Geometry + rendering ──────────────────────────────────
  const renderBow = useCallback(
    (pull: number) => {
      const b = clamp(pull / Math.max(1, maxPull), 0, 1)
      const tipX = REST_TIP_X - b * 30
      const topY = REST_TOP_Y + b * 36
      const botY = REST_BOT_Y - b * 36
      const nockX = REST_TIP_X - b * 34
      const nockY = GRIP_Y + pull
      const bellyX = GRIP_X + 34 + b * 24

      if (bowTopRef.current) {
        bowTopRef.current.setAttribute(
          'd',
          `M ${GRIP_X} ${GRIP_Y} C ${bellyX} ${GRIP_Y - 74} ${bellyX} ${topY + 42} ${tipX} ${topY}`,
        )
      }
      if (bowBotRef.current) {
        bowBotRef.current.setAttribute(
          'd',
          `M ${GRIP_X} ${GRIP_Y} C ${bellyX} ${GRIP_Y + 74} ${bellyX} ${botY - 42} ${tipX} ${botY}`,
        )
      }
      if (stringRef.current) {
        stringRef.current.setAttribute('d', `M ${tipX} ${topY} L ${nockX} ${nockY} L ${tipX} ${botY}`)
      }
      if (arrowGroupRef.current) {
        arrowGroupRef.current.setAttribute('transform', `translate(${nockX} ${nockY})`)
      }
      const hidden =
        phaseRef.current === 'flying' || phaseRef.current === 'impact' || phaseRef.current === 'done'
      if (nockGlowRef.current) {
        nockGlowRef.current.setAttribute('r', String(6 + b * 16))
        nockGlowRef.current.setAttribute('opacity', hidden ? '0' : String(0.35 + b * 0.6))
      }
      if (arrowGroupRef.current) {
        arrowGroupRef.current.setAttribute('opacity', hidden ? '0' : '1')
      }
      if (guideRef.current) {
        guideRef.current.setAttribute('opacity', b > 0.04 || hidden ? '0' : String(0.5))
      }
      if (instructionRef.current) {
        instructionRef.current.textContent = pull >= minPull ? releaseInstruction : instruction
      }
      if (barWrapRef.current && barFillRef.current) {
        const ratio = clamp(pull / Math.max(1, minPull), 0, 1)
        barFillRef.current.style.width = `${ratio * 100}%`
        barWrapRef.current.style.opacity = pull >= minPull ? '0' : '1'
      }
    },
    [maxPull, minPull, instruction, releaseInstruction],
  )

  // ── FX helpers ────────────────────────────────────────────
  const spawnBurst = useCallback((x: number, y: number, count: number, color: string) => {
    if (reduced.current) return
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 5.5
      particles.current.push({
        x,
        y,
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

  // ── Impact ────────────────────────────────────────────────
  const triggerImpact = useCallback(
    (x: number, y: number) => {
      phaseRef.current = 'impact'
      setPhase('impact')
      spawnBurst(x, y, 110, heartColor)
      if (impactEffect === 'shockwave' || impactEffect === 'both') spawnShockwave(x, y)
      spawnFlash(x, y, heartColor)
      if (soundEffects) playImpact()

      if (heartInnerRef.current) {
        heartInnerRef.current.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.65)' },
            { transform: 'scale(1.12)' },
          ],
          { duration: 640, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        )
      }

      impactTimerRef.current = window.setTimeout(() => {
        phaseRef.current = 'done'
        setPhase('done')
        onImpactRef.current()
      }, 950)
    },
    [heartColor, impactEffect, soundEffects, spawnBurst, spawnFlash, spawnShockwave],
  )

  // ── Main loop ─────────────────────────────────────────────
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
      fx.width = Math.max(1, Math.floor(w * dpr))
      fx.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const drawFx = (now: number) => {
      ctx.clearRect(0, 0, w, h)

      // spring-back
      if (springRef.current) {
        const s = springRef.current
        const t = clamp((now - s.t0) / s.dur, 0, 1)
        pullRef.current = s.from + (s.to - s.from) * easeOutCubic(t)
        if (t >= 1) springRef.current = null
      }

      renderBow(pullRef.current)

      // flight
      if (flightRef.current) {
        const f = flightRef.current
        const t = clamp((now - f.t0) / f.dur, 0, 1)
        const e = easeOutCubic(t)
        const x = f.sx + (f.ex - f.sx) * e
        const y = f.sy + (f.ey - f.sy) * e
        if (!reduced.current) {
          const count = trailIntensity > 0 ? Math.round(1 + trailIntensity * 2) : 0
          for (let i = 0; i < count; i++) {
            particles.current.push({
              x: x + (Math.random() - 0.5) * 4,
              y: y + 20 + Math.random() * 40,
              vx: (Math.random() - 0.5) * 0.8,
              vy: 0.6 + Math.random() * 1.2,
              life: 0,
              maxLife: 22 + Math.random() * 20,
              size: 1 + Math.random() * 2,
              color: arrowColor,
            })
          }
        }
        drawArrow(ctx, x, y, arrowColor, trailIntensity)
        if (t >= 1) {
          flightRef.current = null
          triggerImpact(f.ex, f.ey)
        }
      }

      // particles
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
        const a = 1 - p.life / p.maxLife
        ctx.globalAlpha = a
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // rings
      for (let i = rings.current.length - 1; i >= 0; i--) {
        const r = rings.current[i]
        r.life += 1
        r.r += r.vr
        if (r.life >= r.maxLife) {
          rings.current.splice(i, 1)
          continue
        }
        const a = 1 - r.life / r.maxLife
        ctx.globalAlpha = a * 0.8
        ctx.strokeStyle = heartColor
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // flashes
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
  }, [arrowColor, heartColor, trailIntensity, triggerImpact, renderBow])

  // ── Pointer interaction ───────────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      const dy = e.clientY - dragStartRef.current.y
      const pull = clamp(dragStartRef.current.pull + dy, 0, maxPull)
      pullRef.current = pull
      if (pull > 0.02 && phaseRef.current === 'idle') {
        phaseRef.current = 'drawing'
        setPhase('drawing')
      }
    }

    const onUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      const pull = pullRef.current
      if (pull >= minPull) {
        // Release — fire the arrow.
        const container = containerRef.current
        const svg = svgRef.current
        const heart = heartRef.current
        if (container && svg && heart) {
          const cRect = container.getBoundingClientRect()
          const sRect = svg.getBoundingClientRect()
          const hRect = heart.getBoundingClientRect()
          const b = clamp(pull / Math.max(1, maxPull), 0, 1)
          const nockX = REST_TIP_X - b * 34
          const nockY = GRIP_Y + pull
          const toLocal = (sx: number, sy: number) => ({
            x: sRect.left - cRect.left + (sx / VIEW_W) * sRect.width,
            y: sRect.top - cRect.top + (sy / VIEW_H) * sRect.height,
          })
          const tip = toLocal(nockX, nockY - ARROW_LEN)
          const end = {
            x: hRect.left + hRect.width / 2 - cRect.left,
            y: hRect.top + hRect.height / 2 - cRect.top,
          }
          if (soundEffects) playWhoosh()
          flightRef.current = {
            sx: tip.x,
            sy: tip.y,
            ex: end.x,
            ey: end.y,
            t0: performance.now(),
            dur: 470,
          }
          phaseRef.current = 'flying'
          setPhase('flying')
          // spring the bow back to rest
          springRef.current = { from: pull, to: 0, t0: performance.now(), dur: 260 }
        }
      } else {
        // Not enough pull — spring back.
        springRef.current = { from: pull, to: 0, t0: performance.now(), dur: 220 }
        if (phaseRef.current === 'drawing') {
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
  }, [minPull, maxPull, soundEffects])

  useEffect(() => {
    return () => {
      if (impactTimerRef.current) window.clearTimeout(impactTimerRef.current)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current === 'flying' || phaseRef.current === 'impact' || phaseRef.current === 'done') return
    e.preventDefault()
    ensureAudio()
    draggingRef.current = true
    dragStartRef.current = { y: e.clientY, pull: pullRef.current }
    if (phaseRef.current === 'idle') {
      phaseRef.current = 'drawing'
      setPhase('drawing')
    }
  }

  const heartSize = isDesktop ? 78 : 58

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full select-none"
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Aim guide + heart */}
      <div
        ref={heartRef}
        className="absolute left-1/2 top-[15%] -translate-x-1/2"
      >
        <div ref={heartInnerRef} style={{ transformOrigin: 'center' }}>
          <GlowingHeart color={heartColor} size={heartSize} glow={glow} pulse={phase !== 'impact' && phase !== 'done'} interactive={false} />
        </div>
      </div>

      {/* FX canvas */}
      <canvas ref={fxRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />

      {/* Bow */}
      <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-[min(64vh,480px)] w-auto"
          style={{ maxWidth: '92vw' }}
          aria-hidden
        >
          <defs>
            <linearGradient id="bow-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c9a87c" />
              <stop offset="55%" stopColor="#f0dcbb" />
              <stop offset="100%" stopColor="#c9a87c" />
            </linearGradient>
            <filter id="bow-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* aim guide */}
          <line
            ref={guideRef}
            x1={REST_TIP_X}
            y1={24}
            x2={REST_TIP_X}
            y2={REST_TOP_Y}
            stroke={hexToRgba(heartColor, 0.35)}
            strokeWidth={1.4}
            strokeDasharray="4 7"
            opacity={0.5}
          />

          {/* limbs */}
          <path
            ref={bowTopRef}
            d="M 150 330 C 184 256 184 210 136 168"
            fill="none"
            stroke="url(#bow-grad)"
            strokeWidth={7}
            strokeLinecap="round"
            filter="url(#bow-glow)"
          />
          <path
            ref={bowBotRef}
            d="M 150 330 C 184 404 184 450 136 492"
            fill="none"
            stroke="url(#bow-grad)"
            strokeWidth={7}
            strokeLinecap="round"
            filter="url(#bow-glow)"
          />

          {/* grip */}
          <rect x={GRIP_X - 6} y={GRIP_Y - 16} width={12} height={32} rx={6} fill="#3a2a1e" stroke="#c9a87c" strokeWidth={1.5} />

          {/* tip caps */}
          <circle cx={REST_TIP_X} cy={REST_TOP_Y} r={4.5} fill="#f4e3c2" />
          <circle cx={REST_TIP_X} cy={REST_BOT_Y} r={4.5} fill="#f4e3c2" />

          {/* string */}
          <path ref={stringRef} d="M 136 168 L 136 330 L 136 492" fill="none" stroke={hexToRgba('#f5efdf', 0.85)} strokeWidth={2} />

          {/* arrow */}
          <g ref={arrowGroupRef} transform="translate(136 330)">
            <line x1={0} y1={0} x2={0} y2={-ARROW_LEN} stroke={arrowColor} strokeWidth={4.5} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${arrowColor})` }} />
            <path d={`M 0 ${-ARROW_LEN - 18} L -7.5 ${-ARROW_LEN} L 7.5 ${-ARROW_LEN} Z`} fill={arrowColor} style={{ filter: `drop-shadow(0 0 5px ${arrowColor})` }} />
            <path d="M 0 -16 L -13 -38 L -5 -33 Z" fill={hexToRgba(arrowColor, 0.9)} />
            <path d="M 0 -16 L 13 -38 L 5 -33 Z" fill={hexToRgba(arrowColor, 0.9)} />
          </g>

          {/* nock glow */}
          <circle ref={nockGlowRef} cx={REST_TIP_X} cy={GRIP_Y} r={6} fill={arrowColor} opacity={0.4} />
        </svg>
      </div>

      {/* Instruction */}
      {(phase === 'idle' || phase === 'drawing') && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[9%] flex flex-col items-center gap-3 px-6 pb-safe">
          <p ref={instructionRef} className="font-body text-sm uppercase tracking-[0.3em] text-white/70">
            {instruction}
          </p>
          <div ref={barWrapRef} className="h-1 w-44 overflow-hidden rounded-full bg-white/10">
            <div ref={barFillRef} className="h-full rounded-full bg-rose" style={{ width: '0%' }} />
          </div>
        </div>
      )}

      {phase === 'impact' && impactMessage && (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none absolute inset-x-0 bottom-[14%] px-6 text-center font-display text-2xl italic text-glow"
        >
          {impactMessage}
        </motion.p>
      )}
    </div>
  )
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, trail: number) {
  // trailing streak
  const streakLen = 150
  const grad = ctx.createLinearGradient(x, y, x, y + streakLen)
  grad.addColorStop(0, hexToRgba(color, 0.85))
  grad.addColorStop(1, hexToRgba(color, 0))
  ctx.strokeStyle = grad
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y + streakLen)
  ctx.stroke()

  // soft outer glow shaft
  ctx.strokeStyle = hexToRgba(color, 0.25 + trail * 0.2)
  ctx.lineWidth = 9
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y + streakLen * 0.7)
  ctx.stroke()

  // arrowhead
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - 16)
  ctx.lineTo(x - 7, y)
  ctx.lineTo(x + 7, y)
  ctx.closePath()
  ctx.fill()

  // bright core
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.beginPath()
  ctx.arc(x, y - 4, 2.6, 0, Math.PI * 2)
  ctx.fill()
}
