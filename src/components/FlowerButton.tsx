import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useExperience } from '@/context/ExperienceContext'
import { cn } from '@/lib/utils'

interface FlowerButtonProps {
  onRestart: () => void
  /** Enlarged, glowing, animated hero mode (used on the final page). */
  hero?: boolean
  /** Where the flower is anchored. */
  position?: 'top' | 'bottom'
}

/**
 * A delicate flower used as the restart control on every page.
 *
 * Secret admin access (for you, not Jacinta):
 *   - triple-tap the flower quickly, OR
 *   - press and hold it for 5 seconds
 * → opens the private admin login.
 */
export function FlowerButton({ onRestart, hero = false, position = 'top' }: FlowerButtonProps) {
  const { config, preview } = useExperience()
  const accent = config.appearance.accentColor || '#ff4f9a'
  const navigate = useNavigate()

  const [confirming, setConfirming] = useState(false)
  const timer = useRef<number | null>(null)
  const holdTimer = useRef<number | null>(null)
  const holdTriggered = useRef(false)
  const tapTimes = useRef<number[]>([])

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
      if (holdTimer.current) window.clearTimeout(holdTimer.current)
    }
  }, [])

  const openAdmin = () => {
    if (preview) return
    setConfirming(false)
    navigate('/admin')
  }

  // Press-and-hold (5s) opens the admin login.
  const startHold = () => {
    holdTriggered.current = false
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    holdTimer.current = window.setTimeout(() => {
      holdTriggered.current = true
      openAdmin()
    }, 5000)
  }
  const cancelHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  const handleClick = () => {
    if (holdTriggered.current) return
    // Triple-tap detection (3 taps within 1.2s) opens the admin login.
    const now = Date.now()
    const times = tapTimes.current.filter((t) => now - t < 1200)
    times.push(now)
    tapTimes.current = times
    if (times.length >= 3) {
      tapTimes.current = []
      setConfirming(false)
      openAdmin()
      return
    }

    // Normal two-tap confirm → restart.
    if (!confirming) {
      setConfirming(true)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setConfirming(false), 2600)
      return
    }
    if (timer.current) window.clearTimeout(timer.current)
    setConfirming(false)
    onRestart()
  }

  const sparkles = [
    { x: 0, y: -34, s: 0 },
    { x: 26, y: -18, s: 0.6 },
    { x: -26, y: -18, s: 1.2 },
    { x: 14, y: -32, s: 1.8 },
  ]

  const isBottom = position === 'bottom'
  // Label placement: only on the end page (hero) does the top flower put its
  // label above the flower; the bottom flower keeps its label below. On every
  // other page the small top flower keeps its label below the flower.
  const labelAbove = !isBottom && hero

  const label = (
    <AnimatePresence mode="wait" initial={false}>
      {confirming ? (
        <motion.span
          key="confirm"
          initial={{ opacity: 0, y: labelAbove ? -6 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: labelAbove ? -6 : 6 }}
          className={cn(
            'glass whitespace-nowrap rounded-full px-3 py-1 font-body text-[11px] tracking-wide text-white/85',
            labelAbove ? 'mb-1.5' : 'mt-1',
          )}
        >
          Tap again to confirm
        </motion.span>
      ) : hero ? (
        <motion.span
          key="hero-label"
          initial={{ opacity: 0, y: labelAbove ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cn(
            'whitespace-nowrap font-display text-lg italic tracking-[0.14em] text-glow',
            labelAbove ? 'mb-2' : 'mt-2',
          )}
        >
          Restart Afresh ❤️
        </motion.span>
      ) : (
        <motion.span
          key="label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'whitespace-nowrap font-display text-[13px] italic tracking-[0.16em] text-white/60 text-glow-soft',
            labelAbove ? 'mb-1' : 'mt-1',
          )}
        >
          Restart Afresh
        </motion.span>
      )}
    </AnimatePresence>
  )

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[55] flex justify-center',
        isBottom ? 'bottom-0 pb-2' : 'top-0',
      )}
    >
      <div
        className={cn(
          'pointer-events-auto relative flex flex-col items-center',
          isBottom ? 'pb-safe' : 'pt-safe',
        )}
      >
        {labelAbove && label}

        <button
          type="button"
          onClick={handleClick}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          aria-label="Restart the experience"
          title="Restart"
          className={cn(
            'group relative flex items-center justify-center rounded-full transition-all duration-300',
            hero
              ? '-mt-1 h-24 w-24'
              : '-mt-1 h-11 w-11 opacity-70 hover:scale-110 hover:opacity-100',
            'focus-visible:opacity-100 focus-visible:outline-none',
          )}
        >
          {hero && (
            <>
              <span
                aria-hidden
                className="animate-ring-pulse absolute -inset-6 rounded-full"
                style={{ border: `2px solid ${accent}66` }}
              />
              <span
                aria-hidden
                className="animate-ring-pulse absolute -inset-6 rounded-full"
                style={{ border: `2px solid ${accent}44`, animationDelay: '1.3s' }}
              />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${accent}4d 0%, transparent 70%)`,
                  filter: 'blur(4px)',
                }}
              />
              {sparkles.map((s, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="animate-sparkle absolute h-1.5 w-1.5 rounded-full bg-white"
                  style={{
                    left: `calc(50% + ${s.x}px)`,
                    top: `calc(50% + ${s.y}px)`,
                    animationDelay: `${s.s}s`,
                    boxShadow: '0 0 8px #fff',
                  }}
                />
              ))}
            </>
          )}
          {!hero && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)` }}
            />
          )}
          <FlowerIcon
            color={accent}
            size={hero ? 48 : 26}
            className={cn('flower-spin relative drop-glow', hero && 'animate-float-slow')}
          />
        </button>

        {!labelAbove && label}
      </div>
    </div>
  )
}

export function FlowerIcon({ color = '#ff4f9a', size = 26, className }: { color?: string; size?: number; className?: string }) {
  const petals = [0, 60, 120, 180, 240, 300]
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <defs>
        <radialGradient id="flower-petal" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffd6e8" />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor="#e63a86" />
        </radialGradient>
      </defs>
      {petals.map((r) => (
        <ellipse
          key={`outer-${r}`}
          cx="12"
          cy="5.4"
          rx="3.6"
          ry="5.4"
          transform={`rotate(${r} 12 12)`}
          fill={color}
          opacity="0.35"
        />
      ))}
      {petals.map((r) => (
        <ellipse
          key={`inner-${r}`}
          cx="12"
          cy="6"
          rx="2.9"
          ry="4.6"
          transform={`rotate(${r + 30} 12 12)`}
          fill="url(#flower-petal)"
        />
      ))}
      <circle cx="12" cy="12" r="2.7" fill="#f2e6d0" />
      <circle cx="12" cy="12" r="1.3" fill="#d4af7a" />
    </svg>
  )
}
