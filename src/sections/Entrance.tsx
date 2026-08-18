import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { LineSequence } from '@/components/LineSequence'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

export function Entrance({ onDone }: Props) {
  const { config } = useExperience()
  const e = config.entrance
  const [showGreeting, setShowGreeting] = useState(false)
  const [showRest, setShowRest] = useState(false)

  const lines = [e.title, ...e.messages, e.closingLine].filter((l) => l && l.trim())

  useEffect(() => {
    const t1 = setTimeout(() => setShowGreeting(true), 1100)
    const t2 = setTimeout(() => {
      setShowGreeting(false)
      setShowRest(true)
    }, 1100 + e.lineDuration + e.transitionDuration)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [e.lineDuration, e.transitionDuration])

  return (
    <Stage>
      <AnimatePresence mode="wait">
        {showGreeting && (
          <motion.h1
            key="greeting"
            initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
            transition={{ duration: e.transitionDuration / 1000, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl font-light italic text-glow sm:text-7xl"
          >
            {e.greeting}
          </motion.h1>
        )}
      </AnimatePresence>

      {showRest && (
        <LineSequence
          lines={lines}
          holdMs={e.lineDuration}
          fadeMs={e.transitionDuration}
          onDone={onDone}
          className="max-w-2xl font-display text-2xl font-light text-white/90 text-glow-soft sm:text-4xl"
        />
      )}
    </Stage>
  )
}
