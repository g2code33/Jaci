import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { LineSequence } from '@/components/LineSequence'
import { RingIcon } from '@/components/Ring'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

export function Entrance({ onDone }: Props) {
  const { config } = useExperience()
  const e = config.entrance
  const [step, setStep] = useState<'wait' | 'greeting' | 'ring' | 'rest'>('wait')
  const [taken, setTaken] = useState(false)

  const lines = [e.title, ...e.messages, e.closingLine].filter((l) => l && l.trim())

  // Show the name after the initial delay.
  useEffect(() => {
    const t = setTimeout(() => setStep('greeting'), e.initialDelay)
    return () => clearTimeout(t)
  }, [e.initialDelay])

  // After the name, show the ring (or skip straight to the messages).
  useEffect(() => {
    if (step !== 'greeting') return
    const t = setTimeout(
      () => setStep(e.ringEnabled ? 'ring' : 'rest'),
      e.lineDuration + e.transitionDuration,
    )
    return () => clearTimeout(t)
  }, [step, e.ringEnabled, e.lineDuration, e.transitionDuration])

  const takeRing = () => {
    if (taken) return
    setTaken(true)
    window.setTimeout(() => setStep('rest'), 1600)
  }

  return (
    <Stage>
      <AnimatePresence mode="wait">
        {step === 'greeting' && (
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

        {step === 'ring' && (
          <motion.div
            key="ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <motion.button
              type="button"
              onClick={takeRing}
              aria-label="Take the ring"
              className="relative rounded-full"
              initial={{ opacity: 0, scale: 0.55, y: 8 }}
              animate={
                taken
                  ? { opacity: 0.9, scale: 1.18, y: -6 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              transition={
                taken
                  ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                  : { type: 'spring', stiffness: 110, damping: 13 }
              }
            >
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${e.heartColor}55 0%, transparent 70%)`,
                  filter: 'blur(6px)',
                }}
              />
              <RingIcon color={e.heartColor} size={118} className="drop-glow animate-float-slow" />
            </motion.button>

            <AnimatePresence mode="wait">
              {taken ? (
                <motion.p
                  key="taken"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="mt-8 font-display text-2xl italic text-glow sm:text-3xl"
                >
                  {e.ringTakenMessage}
                </motion.p>
              ) : (
                <motion.p
                  key="prompt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                  className="mt-8 font-display text-xl italic text-white/80 sm:text-2xl"
                >
                  {e.ringPrompt}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'rest' && (
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
