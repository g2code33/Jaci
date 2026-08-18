import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { LineSequence } from '@/components/LineSequence'
import { LockIcon } from '@/components/LockIcon'
import { useExperience } from '@/context/ExperienceContext'
import { useSessionId } from '@/hooks/useSessionId'
import { api } from '@/lib/api'
import { playChime, playClick } from '@/lib/sound'

interface Props {
  onDone: () => void
}

type Stage2 = 'intro' | 'form' | 'unlocking'

export function SecretLock({ onDone }: Props) {
  const { config } = useExperience()
  const lock = config.secretLock
  const sessionId = useSessionId()

  const [stage, setStage] = useState<Stage2>('intro')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lockedOut, setLockedOut] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (stage !== 'unlocking') return
    const t = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true
        onDone()
      }
    }, 2100)
    return () => clearTimeout(t)
  }, [stage, onDone])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || lockedOut) return
    setLoading(true)
    try {
      const res = await api.submitAnswer(answer, sessionId)
      if (res.correct) {
        setError(null)
        setStage('unlocking')
        if (lock.unlockSound) playChime()
        else playClick()
      } else {
        if (res.lockedOut) setLockedOut(true)
        setAttemptsLeft(res.attemptsRemaining ?? null)
        setError(res.message || lock.wrongMessage)
        setShakeKey((k) => k + 1)
        setAnswer('')
        playClick()
      }
    } catch {
      setError('Something went wrong — please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  if (stage === 'intro') {
    return (
      <Stage>
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="mb-10"
        >
          <LockIcon color={config.appearance.accentColor} />
        </motion.div>
        <LineSequence
          lines={[lock.unlockedMessage, lock.teaserLine]}
          holdMs={2600}
          fadeMs={900}
          onDone={() => setStage('form')}
          className="max-w-md font-display text-2xl font-light text-white/90 text-glow-soft sm:text-3xl"
        />
      </Stage>
    )
  }

  if (stage === 'unlocking') {
    return (
      <Stage>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <LockIcon open color={config.appearance.accentColor} size={110} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9 }}
          className="mt-10 font-display text-3xl font-light text-glow sm:text-4xl"
        >
          {lock.correctMessage}
        </motion.p>
      </Stage>
    )
  }

  return (
    <Stage>
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          <p className="mb-3 font-body text-[11px] uppercase tracking-[0.4em] text-rose/70">
            {lock.title}
          </p>
          <h2 className="font-display text-2xl font-light leading-snug text-white/95 sm:text-3xl">
            {lock.question}
          </h2>
        </motion.div>

        <form onSubmit={submit} className="mt-8">
          <motion.div
            key={shakeKey}
            animate={shakeKey > 0 ? { x: [0, -10, 10, -7, 7, -3, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={lock.placeholder}
              disabled={lockedOut}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="input-luxe text-center"
              aria-label="Your answer"
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 font-body text-sm text-rose-soft"
                role="alert"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {attemptsLeft !== null && !lockedOut && (
            <p className="mt-3 font-body text-xs text-white/40">
              {attemptsLeft > 0 ? `${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} left` : ''}
            </p>
          )}

          <button type="submit" className="btn-solid mt-6 w-full" disabled={loading || lockedOut || !answer.trim()}>
            {loading ? '…' : lock.buttonText}
          </button>
        </form>
      </div>
    </Stage>
  )
}
