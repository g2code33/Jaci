import { useId } from 'react'

interface RingIconProps {
  color?: string
  size?: number
  className?: string
}

/**
 * A realistic engagement ring: a polished gold band with a metallic sheen and
 * a faceted brilliant-cut gem held by prongs, with twinkling sparkles.
 */
export function RingIcon({ color = '#ff8fc0', size = 118, className }: RingIconProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gem = `ring-gem-${id}`
  const band = `ring-band-${id}`
  const glow = `ring-glow-${id}`

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden>
      <defs>
        <radialGradient id={gem} cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#ffd9ec" />
          <stop offset="65%" stopColor={color} />
          <stop offset="100%" stopColor="#b05388" />
        </radialGradient>

        <linearGradient id={band} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9edcd" />
          <stop offset="28%" stopColor="#f0d29a" />
          <stop offset="55%" stopColor="#d6ab66" />
          <stop offset="80%" stopColor="#9c7138" />
          <stop offset="100%" stopColor="#c9a05e" />
        </linearGradient>

        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* halo */}
      <circle cx="60" cy="42" r="34" fill={`url(#${glow})`} />

      {/* ── The band (annulus) ─────────────────────────────── */}
      <g>
        <ellipse cx="60" cy="106" rx="26" ry="5" fill="#000" opacity="0.35" />
        <path
          d="M 60 42 A 30 30 0 1 0 60 102 A 30 30 0 1 0 60 42 Z
             M 60 51 A 21 21 0 1 1 60 93 A 21 21 0 1 1 60 51 Z"
          fill={`url(#${band})`}
          fillRule="evenodd"
        />
        <path
          d="M 33 60 A 30 30 0 0 1 60 42"
          fill="none"
          stroke="#fff8e8"
          strokeOpacity="0.7"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="60" cy="72" r="21" fill="none" stroke="#6f4c22" strokeOpacity="0.35" strokeWidth="1.6" />
      </g>

      {/* ── Prongs ─────────────────────────────────────────── */}
      <g fill="#f6e7c8" stroke="#8a6633" strokeWidth="0.8">
        <path d="M 41 46 L 44 44 L 46 50 Z" />
        <path d="M 79 46 L 76 44 L 74 50 Z" />
        <path d="M 55 46 L 57 44.5 L 60 50 Z" />
        <path d="M 65 46 L 63 44.5 L 60 50 Z" />
      </g>

      {/* ── Brilliant-cut gem ──────────────────────────────── */}
      <g>
        <path d="M 46 26 L 74 26 L 84 45 L 60 82 L 36 45 Z" fill={`url(#${gem})`} />

        <polygon points="50,32 70,32 67,39 53,39" fill="#ffffff" opacity="0.92" />

        <g stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.8" fill="none">
          <path d="M 50 32 L 36 45" />
          <path d="M 70 32 L 84 45" />
          <path d="M 53 39 L 46 45" />
          <path d="M 67 39 L 74 45" />
        </g>

        <path d="M 36 45 L 84 45" stroke="#ffffff" strokeOpacity="0.65" strokeWidth="1.1" />

        <g stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" fill="none">
          <path d="M 36 45 L 60 82" />
          <path d="M 84 45 L 60 82" />
          <path d="M 46 45 L 60 82" />
          <path d="M 74 45 L 60 82" />
          <path d="M 60 45 L 60 82" />
        </g>

        <path d="M 44 52 L 52 60 L 46 66 Z" fill="#e9dfff" opacity="0.75" />
        <path d="M 66 56 L 70 62 L 63 65 Z" fill="#ffffff" opacity="0.85" />
        <path d="M 56 40 L 60 46 L 54 46 Z" fill="#ffffff" opacity="0.7" />
      </g>

      {/* ── Twinkling sparkles ─────────────────────────────── */}
      <g fill="#ffffff">
        <path
          className="animate-sparkle"
          style={{ transformOrigin: '78px 24px', animationDelay: '0s' }}
          d="M 78 16 L 79.6 22.4 L 86 24 L 79.6 25.6 L 78 32 L 76.4 25.6 L 70 24 L 76.4 22.4 Z"
        />
        <path
          className="animate-sparkle"
          style={{ transformOrigin: '40px 18px', animationDelay: '1.1s' }}
          d="M 40 12 L 41.3 17.3 L 46.6 18.6 L 41.3 19.9 L 40 25.2 L 38.7 19.9 L 33.4 18.6 L 38.7 17.3 Z"
          opacity="0.9"
        />
        <path
          className="animate-sparkle"
          style={{ transformOrigin: '92px 52px', animationDelay: '1.9s' }}
          d="M 92 47 L 93 51 L 97 52 L 93 53 L 92 57 L 91 53 L 87 52 L 91 51 Z"
          opacity="0.8"
        />
      </g>
    </svg>
  )
}
