import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StageProps {
  children: React.ReactNode
  className?: string
  /** Remove padding for full-bleed sections (e.g. the bow). */
  full?: boolean
  align?: 'center' | 'top'
  style?: React.CSSProperties
}

export function Stage({ children, className, full, align = 'center', style }: StageProps) {
  return (
    <motion.section
      className={cn(
        'relative z-10 flex min-h-[100dvh] w-full flex-col items-center overflow-hidden',
        align === 'top' ? 'justify-start pt-24' : 'justify-center',
        !full && 'px-6 text-center',
        className,
      )}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {children}
    </motion.section>
  )
}
