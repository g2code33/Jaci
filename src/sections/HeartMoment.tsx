import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { GlowingHeart } from '@/components/GlowingHeart'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

export function HeartMoment({ onDone }: Props) {
  const { config } = useExperience()
  const hm = config.heartMoment
  const eggs = config.easterEggs
  const [revealed, setRevealed] = useState(false)
  const [egg, setEgg] = useState<string | null>(null)
  const tapRef = useRef(0)

  const handleTap = () => {
    if (!revealed) {
      setRevealed(true)
      return
    }
    if (!eggs.enabled || eggs.messages.length === 0) return
    const msg = eggs.messages[tapRef.current % eggs.messages.length]
    tapRef.current += 1
    setEgg(msg)
    window.setTimeout(() => setEgg(null), 2600)
  }

  return (
    <Stage>
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <p className="mb-10 max-w-md font-display text-2xl font-light text-white/90 text-glow-soft sm:text-3xl">
              {hm.intro}
            </p>
            <GlowingHeart color={config.appearance.accentColor} size={110} glow={0.9} onClick={handleTap} />
            <p className="mt-8 font-body text-xs uppercase tracking-[0.3em] text-white/40">tap the heart</p>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 12 }}
            >
              <GlowingHeart color={config.appearance.accentColor} size={140} glow={1} onClick={handleTap} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: hm.revealDuration / 1000 }}
              className="mt-10 max-w-lg font-display text-3xl font-light leading-snug text-glow sm:text-4xl"
            >
              {hm.message}
            </motion.p>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              type="button"
              className="btn-outline mt-12"
              onClick={onDone}
            >
              {hm.buttonText}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {egg && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/10 px-5 py-2 font-body text-sm text-rose-soft backdrop-blur-md"
          >
            {egg}
          </motion.p>
        )}
      </AnimatePresence>
    </Stage>
  )
}
