import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { LineSequence } from '@/components/LineSequence'
import { MediaView } from '@/components/MediaView'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

export function FinalSurprise({ onDone }: Props) {
  const { config, meta } = useExperience()
  const fs = config.finalSurprise
  const [showButton, setShowButton] = useState(false)
  const [revealed, setRevealed] = useState(false)

  return (
    <Stage align="top" className="pb-28">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="tease"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[70vh] w-full flex-col items-center justify-center"
          >
            <LineSequence
              lines={fs.teaseLines}
              holdMs={2300}
              fadeMs={900}
              onDone={() => setShowButton(true)}
              className="max-w-lg font-display text-3xl font-light text-white/90 text-glow-soft sm:text-4xl"
            />
            {showButton && (
              <motion.button
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                type="button"
                className="btn-solid mt-12"
                onClick={() => setRevealed(true)}
              >
                {fs.buttonText}
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex w-full max-w-xl flex-col items-center"
          >
            <h2 className="font-display text-4xl font-light text-glow sm:text-5xl">{fs.title}</h2>
            {fs.message && (
              <p className="mt-6 max-w-md font-body text-lg leading-relaxed text-white/85">{fs.message}</p>
            )}

            {fs.dateTime && (
              <p className="mt-5 font-body text-base text-champagne">🗓️ {fs.dateTime}</p>
            )}
            {fs.location && <p className="mt-2 font-body text-base text-champagne">📍 {fs.location}</p>}
            {fs.instructions && (
              <p className="mt-5 max-w-md font-display text-xl italic text-rose-soft">{fs.instructions}</p>
            )}

            {fs.media && !fs.media.hidden && (
              <div className="mt-8 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10">
                <div className="aspect-video">
                  <MediaView item={fs.media} cloudName={meta.cloudName} width={1200} />
                </div>
                {fs.media.caption && (
                  <p className="px-4 py-3 text-center font-display text-sm italic text-white/60">
                    {fs.media.caption}
                  </p>
                )}
              </div>
            )}

            <button type="button" className="btn-outline mt-12" onClick={onDone}>
              Continue ❤️
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  )
}
