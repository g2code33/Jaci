import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { GlowingHeart } from '@/components/GlowingHeart'
import { useExperience } from '@/context/ExperienceContext'

export function Closing() {
  const { config } = useExperience()
  const c = config.closing
  const eggs = config.easterEggs
  const [egg, setEgg] = useState<string | null>(null)
  const tapRef = useRef(0)

  const hearts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: 6 + ((i * 13.7) % 88),
        delay: i * 0.9,
        duration: 9 + (i % 4) * 2,
        size: 16 + ((i * 7) % 22),
      })),
    [],
  )

  const onHeartTap = () => {
    if (!eggs.enabled || eggs.messages.length === 0) return
    const msg = eggs.messages[tapRef.current % eggs.messages.length]
    tapRef.current += 1
    setEgg(msg)
    window.setTimeout(() => setEgg(null), 2600)
  }

  return (
    <Stage>
      {/* floating hearts */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            className="pointer-events-auto absolute"
            style={{ left: `${h.left}%`, bottom: '-60px' }}
            animate={{ y: [0, -window.innerHeight - 120], opacity: [0, 0.7, 0.5, 0] }}
            transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: 'linear' }}
          >
            <GlowingHeart color={config.appearance.accentColor} size={h.size} glow={0.5} pulse={false} onClick={onHeartTap} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="font-display text-4xl font-light leading-snug text-glow sm:text-6xl"
        >
          {c.message}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="mt-8 font-body text-sm uppercase tracking-[0.5em] text-white/50"
        >
          {c.dateLabel}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
          className="mt-12 font-display text-xl italic text-white/70"
        >
          {c.withLove}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 1 }}
          className="mt-1 font-display text-3xl font-light text-rose-soft"
        >
          {config.senderName}
        </motion.p>
      </div>

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
