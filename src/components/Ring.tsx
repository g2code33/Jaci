import { useId } from 'react'

interface RingIconProps {
  color?: string
  size?: number
  className?: string
}

/** An elegant glowing ring with a small diamond. */
export function RingIcon({ color = '#ffd6e8', size = 96, className }: RingIconProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gem = `ring-gem-${id}`
  const band = `ring-band-${id}`
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
      <defs>
        <radialGradient id={gem} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor="#c9a8e8" />
        </radialGradient>
        <linearGradient id={band} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2e6d0" />
          <stop offset="100%" stopColor="#c9a87c" />
        </linearGradient>
      </defs>
      {/* soft glow */}
      <circle cx="50" cy="58" r="27" fill={color} opacity="0.12" />
      {/* band */}
      <circle cx="50" cy="56" r="22" fill="none" stroke={`url(#${band})`} strokeWidth="8" />
      {/* prongs */}
      <path d="M44 37 L47 45 L41 42 Z" fill="#f2e6d0" />
      <path d="M56 37 L53 45 L59 42 Z" fill="#f2e6d0" />
      {/* gem */}
      <path d="M50 20 L63 38 L50 53 L37 38 Z" fill={`url(#${gem})`} stroke="#fff" strokeWidth="1" />
      {/* sparkles */}
      <circle cx="66" cy="22" r="2" fill="#fff" />
      <circle cx="34" cy="26" r="1.4" fill="#fff" />
    </svg>
  )
}
