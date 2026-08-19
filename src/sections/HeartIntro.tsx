import { useState } from 'react'
import { motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { LineSequence } from '@/components/LineSequence'
import { GlowingHeart } from '@/components/GlowingHeart'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

export function HeartIntro({ onDone }: Props) {
  const { config } = useExperience()
  const hi = config.heartIntro
  const [started, setStarted] = useState(false)

  return (
    <Stage>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        className="mb-12"
        onAnimationComplete={() => setStarted(true)}
      >
        <GlowingHeart color={config.entrance.heartColor} size={46} glow={0.85} />
      </motion.div>

      {started && (
        <LineSequence
          lines={[hi.beforeText, hi.promptText]}
          holdMs={hi.lineDuration}
          fadeMs={hi.transitionDuration}
          onDone={onDone}
          className="max-w-md font-display text-2xl font-light text-white/90 text-glow-soft sm:text-3xl"
        />
      )}
    </Stage>
  )
}
