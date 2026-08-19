import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { LineSequence } from '@/components/LineSequence'
import { Confetti } from '@/components/Confetti'
import { Fireworks } from '@/components/Fireworks'
import { useExperience } from '@/context/ExperienceContext'
import { revealDateParts } from '@/lib/utils'

interface Props {
  onDone: () => void
}

type Phase = 'pre' | 'dark' | 'reveal'

export function BirthdayReveal({ onDone }: Props) {
  const { config } = useExperience()
  const br = config.birthdayReveal
  const [phase, setPhase] = useState<Phase>('pre')
  const date = revealDateParts(config.birthday)
  const doneRef = useRef(false)

  useEffect(() => {
    if (phase !== 'dark') return
    const t = setTimeout(() => setPhase('reveal'), br.darkDuration)
    return () => clearTimeout(t)
  }, [phase, br.darkDuration])

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  return (
    <Stage
      style={{ background: phase === 'dark' ? '#050507' : undefined }}
      className={phase === 'reveal' ? 'justify-center' : undefined}
    >
      {phase === 'pre' && (
        <LineSequence
          lines={br.preLines}
          holdMs={br.lineDuration}
          fadeMs={br.fadeDuration}
          onDone={() => setPhase('dark')}
          className="max-w-xl font-display text-3xl font-light text-white/90 text-glow-soft sm:text-4xl"
        />
      )}

      {phase === 'reveal' && (
        <>
          <Confetti active intensity={br.intensity} className="pointer-events-none fixed inset-0 z-0" />
          {br.fireworks && (
            <Fireworks active intensity={br.intensity} className="pointer-events-none fixed inset-0 z-0" />
          )}

          <div className="relative z-10 flex flex-col items-center px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.7, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <span
                className="font-display text-[7rem] font-light leading-none sm:text-[11rem]"
                style={{ color: br.accentColor, textShadow: `0 0 60px ${br.accentColor}88` }}
              >
                {date.day}
              </span>
              <span className="mt-2 font-body text-sm uppercase tracking-[0.6em] text-white/80 sm:text-base">
                {date.month}
              </span>
              <span className="mt-1 font-body text-sm uppercase tracking-[0.6em] text-white/50 sm:text-base">
                {date.year}
              </span>
            </motion.div>

            {br.showAge && br.age && (
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 1 }}
                className="mt-8 font-display text-2xl italic text-rose-soft sm:text-3xl"
              >
                {br.age}
                {br.ageCaption ? (
                  <span className="ml-2 text-lg text-white/50 sm:text-xl">{br.ageCaption}</span>
                ) : null}
              </motion.p>
            )}

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 1 }}
              className="mt-8 font-body text-xs uppercase tracking-[0.5em] text-champagne sm:text-sm"
            >
              {br.happyText}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 1 }}
              className="mt-3 font-display text-4xl font-light leading-tight text-glow sm:text-6xl"
            >
              {config.name}
            </motion.h2>
            {br.subText && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.7, duration: 0.8 }}
                className="mt-3 text-2xl"
              >
                {br.subText}
              </motion.p>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.2 }}
              type="button"
              className="btn-outline mt-12"
              onClick={finish}
            >
              Continue ❤️
            </motion.button>
          </div>
        </>
      )}
    </Stage>
  )
}
