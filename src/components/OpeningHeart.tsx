import { useId } from 'react'
import { motion } from 'framer-motion'

interface OpeningHeartProps {
  color: string
  size: number
  /** Swing the two halves open like a locket. */
  open: boolean
}

/**
 * The heart that opens after the arrow pierces it. It renders the full heart
 * twice — each half clipped — and swings the halves outward from the bottom
 * point to reveal what's behind it.
 */
export function OpeningHeart({ color, size, open }: OpeningHeartProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gradientId = `opening-heart-${id}`

  const heart = (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      style={{ filter: `drop-shadow(0 0 ${10 + size / 12}px ${color})` }}
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="36%" r="75%">
          <stop offset="0%" stopColor="#ffd6e8" />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor="#e63a86" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M12 21.35s-7.8-4.78-7.8-10.68c0-3.04 2.36-5.17 4.77-5.17 1.75 0 2.73.99 3.03 1.98.3-.99 1.28-1.98 3.03-1.98 2.41 0 4.77 2.13 4.77 5.17C19.8 16.57 12 21.35 12 21.35z"
      />
    </svg>
  )

  const halfStyle: React.CSSProperties = {
    clipPath: 'inset(0 50% 0 0)',
    WebkitClipPath: 'inset(0 50% 0 0)',
    transformOrigin: '50% 100%',
  }
  const halfStyleRight: React.CSSProperties = {
    clipPath: 'inset(0 0 0 50%)',
    WebkitClipPath: 'inset(0 0 0 50%)',
    transformOrigin: '50% 100%',
  }

  return (
    <div className="pointer-events-none relative" style={{ width: size, height: size }}>
      {/* light that blooms from inside as it opens */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          background: `radial-gradient(circle, ${color}99 0%, transparent 68%)`,
        }}
        initial={false}
        animate={open ? { opacity: 1, scale: 2.1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />

      {/* left half */}
      <motion.div
        className="absolute inset-0"
        style={halfStyle}
        initial={false}
        animate={
          open
            ? { x: -size * 0.27, y: size * 0.08, rotate: -17, opacity: 0.85 }
            : { x: 0, y: 0, rotate: 0, opacity: 1 }
        }
        transition={open ? { type: 'spring', stiffness: 130, damping: 14 } : { duration: 0.3 }}
      >
        {heart}
      </motion.div>

      {/* right half */}
      <motion.div
        className="absolute inset-0"
        style={halfStyleRight}
        initial={false}
        animate={
          open
            ? { x: size * 0.27, y: size * 0.08, rotate: 17, opacity: 0.85 }
            : { x: 0, y: 0, rotate: 0, opacity: 1 }
        }
        transition={open ? { type: 'spring', stiffness: 130, damping: 14 } : { duration: 0.3 }}
      >
        {heart}
      </motion.div>

      {/* crack of light between the halves */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 3,
          height: size * 0.85,
          marginLeft: -1.5,
          marginTop: -size * 0.45,
          background: `linear-gradient(${color}, #ffffff)`,
          filter: 'blur(1.5px)',
        }}
        initial={false}
        animate={open ? { opacity: 0.95, scaleY: 1 } : { opacity: 0, scaleY: 0.15 }}
        transition={{ duration: 0.6 }}
      />
    </div>
  )
}
