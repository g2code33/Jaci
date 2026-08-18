import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { LineSequence } from '@/components/LineSequence'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

export function StoryIntro({ onDone }: Props) {
  const { config } = useExperience()
  const r = config.ready
  const [showButton, setShowButton] = useState(false)

  return (
    <Stage>
      <LineSequence
        lines={r.introLines}
        holdMs={2300}
        fadeMs={950}
        onDone={() => setShowButton(true)}
        className="max-w-2xl font-display text-2xl font-light text-white/90 text-glow-soft sm:text-3xl"
      />
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2"
          >
            <button type="button" className="btn-outline" onClick={onDone}>
              {r.introButton}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  )
}
