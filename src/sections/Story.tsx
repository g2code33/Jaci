import { useState } from 'react'
import { motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { MediaView } from '@/components/MediaView'
import { Lightbox } from '@/components/Lightbox'
import { useExperience } from '@/context/ExperienceContext'
import type { MediaItem } from '@/types/config'

interface Props {
  onDone: () => void
}

export function Story({ onDone }: Props) {
  const { config, meta } = useExperience()
  const story = config.story
  const entries = story.entries.filter((e) => !e.hidden)
  const [lightbox, setLightbox] = useState<{ items: MediaItem[]; index: number } | null>(null)

  return (
    <Stage align="top" className="pb-28">
      <div className="mb-14 mt-6 text-center">
        <h2 className="font-display text-4xl font-light text-glow sm:text-5xl">{story.title}</h2>
        {story.subtitle && (
          <p className="mt-3 font-display text-lg italic text-white/50">{story.subtitle}</p>
        )}
      </div>

      <div className="relative w-full max-w-2xl">
        <span aria-hidden className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-rose/50 via-rose/20 to-transparent" />

        <div className="flex flex-col gap-12">
          {entries.map((entry, i) => {
            const media = (entry.media || []).filter((m) => !m.hidden)
            return (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative pl-10"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-2 h-[22px] w-[22px] rounded-full border border-rose/60 bg-night-800"
                  style={{ boxShadow: `0 0 14px ${config.appearance.accentColor}55` }}
                />
                {entry.date && (
                  <p className="font-body text-[11px] uppercase tracking-[0.3em] text-rose/70">{entry.date}</p>
                )}
                <h3 className="mt-1 font-display text-2xl font-light text-white/95">{entry.title}</h3>
                {entry.location && (
                  <p className="mt-1 font-body text-xs text-white/45">📍 {entry.location}</p>
                )}
                {entry.description && (
                  <p className="mt-3 max-w-xl font-body text-[15px] leading-relaxed text-white/70">
                    {entry.description}
                  </p>
                )}

                {media.length > 0 && (
                  <div className={`mt-5 grid gap-3 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {media.slice(0, 3).map((m, mi) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setLightbox({ items: media, index: mi })}
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-white/5"
                        aria-label={m.caption || m.alt || 'Open memory'}
                      >
                        <MediaView item={m} cloudName={meta.cloudName} width={640} className="transition-transform duration-500 group-hover:scale-105" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.article>
            )
          })}
        </div>
      </div>

      <button type="button" className="btn-outline mt-16" onClick={onDone}>
        Continue ❤️
      </button>

      {lightbox && (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          cloudName={meta.cloudName}
          onClose={() => setLightbox(null)}
          onNavigate={(i) => setLightbox((l) => (l ? { ...l, index: i } : l))}
        />
      )}
    </Stage>
  )
}
