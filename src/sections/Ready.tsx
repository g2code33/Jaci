import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

export function Ready({ onDone }: Props) {
  const { config } = useExperience()
  const r = config.ready
  const [step, setStep] = useState<'ready' | 'sure'>('ready')
  const [waitMessage, setWaitMessage] = useState<string | null>(null)
  const waitIdx = useRef(0)

  const responses = r.waitResponses.length ? r.waitResponses : ['Take your time 😂']

  const handleWait = () => {
    const msg = responses[waitIdx.current % responses.length]
    waitIdx.current += 1
    setWaitMessage(msg)
  }

  return (
    <Stage>
      <AnimatePresence mode="wait">
        {step === 'ready' ? (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <h2 className="font-display text-4xl font-light text-glow sm:text-5xl">{r.readyText}</h2>
            <button type="button" className="btn-solid mt-10" onClick={() => setStep('sure')}>
              {r.readyButton}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="sure"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <h2 className="font-display text-4xl font-light text-glow sm:text-5xl">{r.sureText}</h2>

            <AnimatePresence>
              {waitMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 font-display text-xl italic text-rose-soft"
                >
                  {waitMessage}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <button type="button" className="btn-solid" onClick={onDone}>
                {r.sureButton}
              </button>
              <button type="button" className="btn-outline" onClick={handleWait}>
                {r.waitButton}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  )
}
