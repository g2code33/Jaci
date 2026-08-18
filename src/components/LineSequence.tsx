import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface LineSequenceProps {
  lines: string[]
  holdMs?: number
  fadeMs?: number
  className?: string
  onDone?: () => void
}

/** Shows a list of lines one at a time, fading between them, then finishes. */
export function LineSequence({ lines, holdMs = 2600, fadeMs = 900, className, onDone }: LineSequenceProps) {
  const [i, setI] = useState(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const filtered = lines.filter((l) => l && l.trim().length > 0)

  useEffect(() => {
    if (filtered.length === 0) {
      const t = setTimeout(() => onDoneRef.current?.(), 200)
      return () => clearTimeout(t)
    }
    if (i >= filtered.length) {
      const t = setTimeout(() => onDoneRef.current?.(), fadeMs + 60)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setI((v) => v + 1), holdMs)
    return () => clearTimeout(t)
  }, [i, filtered.length, holdMs, fadeMs])

  if (filtered.length === 0) return null

  return (
    <div className="relative flex min-h-[1.5em] items-center justify-center">
      <AnimatePresence mode="wait">
        {i < filtered.length && (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
            transition={{ duration: fadeMs / 1000, ease: [0.22, 1, 0.36, 1] }}
            className={className}
          >
            {filtered[i]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
