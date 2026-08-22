import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { GlowingHeart } from '@/components/GlowingHeart'
import { useExperience } from '@/context/ExperienceContext'
import { buildPreloadPlan } from '@/lib/preload'

interface Props {
  onDone: () => void
}

export function MediaPreloader({ onDone }: Props) {
  const { config, meta } = useExperience()

  const plan = useMemo(() => buildPreloadPlan(config, meta.cloudName), [config, meta.cloudName])
  const total = plan.images.length + plan.videos.length

  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [ready, setReady] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (total === 0) onDone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  const mark = () => setReady((r) => r + 1)

  const start = () => {
    if (startedRef.current) return
    startedRef.current = true
    setStatus('loading')
    setReady(0)

    for (const url of plan.images) {
      const img = new Image()
      img.onload = mark
      img.onerror = mark
      img.src = url
    }

    for (const url of plan.videos) {
      const v = document.createElement('video')
      v.preload = 'auto'
      v.muted = true
      v.playsInline = true
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        mark()
        v.removeAttribute('src')
        v.load()
      }
      const cap = window.setTimeout(done, 12000)
      v.onloadeddata = () => {
        window.clearTimeout(cap)
        done()
      }
      v.onerror = () => {
        window.clearTimeout(cap)
        done()
      }
      v.src = url
      v.load()
    }
  }

  useEffect(() => {
    if (status === 'loading' && total > 0 && ready >= total) {
      setStatus('done')
    }
  }, [status, ready, total])

  if (total === 0) return null

  const pct = total > 0 ? Math.round((ready / total) * 100) : 0

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-night-900 px-6 text-center">
      {status === 'done' ? (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 120, damping: 14 }}
          >
            <GlowingHeart color={config.appearance.accentColor} size={130} glow={0.95} onClick={onDone} />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 font-display text-3xl font-light text-glow sm:text-4xl"
          >
            Everything is ready ✨
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 font-display text-xl italic text-white/70"
          >
            Tap the heart to begin ❤️
          </motion.p>
        </>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.8, type: 'spring', stiffness: 120, damping: 14 }}
            className="mb-8"
          >
            <GlowingHeart color={config.appearance.accentColor} size={56} glow={0.85} pulse={false} />
          </motion.div>

          <h2 className="max-w-md font-display text-3xl font-light leading-snug text-glow sm:text-4xl">
            One tiny thing before we begin
          </h2>
          <p className="mt-4 max-w-sm font-display text-lg italic text-white/60">
            Let me download the photos and videos first, so every moment plays buttery-smooth with no waiting. 🌹
          </p>

          <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
            {status === 'idle' ? (
              <>
                <button type="button" className="btn-solid" onClick={start}>
                  ⬇ Download the experience
                </button>
                <button type="button" className="btn-outline" onClick={onDone}>
                  Start now
                </button>
              </>
            ) : (
              <>
                <div className="w-full">
                  <div className="mb-2 flex items-center justify-between font-body text-xs text-white/60">
                    <span>
                      Downloading {Math.min(ready, total)} / {total}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-rose transition-[width] duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <p className="font-body text-xs text-white/40">
                  {plan.images.length} photos · {plan.videos.length} videos
                </p>
                <button type="button" className="btn-outline mt-2" onClick={onDone}>
                  Start now — I don't mind waiting
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
