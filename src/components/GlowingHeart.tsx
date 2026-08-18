import { useId } from 'react'
import { cn } from '@/lib/utils'

interface GlowingHeartProps {
  color?: string
  size?: number
  glow?: number // 0..1
  pulse?: boolean
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
  /** When false, renders a plain div instead of a button. */
  interactive?: boolean
}

/** A soft, glowing SVG heart used throughout the experience. */
export function GlowingHeart({
  color = '#ff4f9a',
  size = 64,
  glow = 0.8,
  pulse = true,
  className,
  onClick,
  style,
  interactive = true,
}: GlowingHeartProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gradientId = `heart-grad-${id}`
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      aria-label={interactive ? 'A glowing heart' : undefined}
      className={cn('relative inline-flex items-center justify-center', onClick && 'cursor-pointer', className)}
      style={{ width: size, height: size, ...style }}
    >
      {/* glow halo */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}${Math.round(glow * 55)
            .toString(16)
            .padStart(2, '0')} 0%, transparent 70%)`,
          opacity: glow,
        }}
      />
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={cn('relative', pulse && 'animate-heart-beat')}
        style={{ filter: `drop-shadow(0 0 ${6 + glow * 12}px ${color})` }}
        aria-hidden
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
    </Tag>
  )
}
