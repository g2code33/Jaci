import { motion } from 'framer-motion'

interface LockIconProps {
  open?: boolean
  color?: string
  size?: number
}

/** A small mechanical lock that animates open. */
export function LockIcon({ open = false, color = '#ff4f9a', size = 92 }: LockIconProps) {
  return (
    <svg viewBox="0 0 64 84" width={size} height={size} aria-hidden>
      <motion.g
        animate={open ? { y: -9, x: 5, rotate: -14 } : { y: 0, x: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        style={{ transformOrigin: '32px 34px' }}
      >
        <path
          d="M19 34 V22 a13 13 0 0 1 26 0 V34"
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </motion.g>
      <rect x="13" y="32" width="38" height="36" rx="9" fill="rgba(255,255,255,0.06)" stroke={color} strokeWidth={3} />
      <circle cx="32" cy="46" r="5" fill={color} opacity={open ? 1 : 0.75} />
      <rect x="29.5" y="46" width="5" height="11" rx="2.5" fill={color} opacity={0.75} />
    </svg>
  )
}
