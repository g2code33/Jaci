import { useState } from 'react'
import { motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { MediaView } from '@/components/MediaView'
import { Lightbox } from '@/components/Lightbox'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

export function Memories({ onDone }: Props) {
  const { config, meta } = useExperience()
  const memories = config.memories
  const items = memories.items.filter((m) => !m.hidden)
  const [lightbox, setLightbox] = useState<number | null>(null)

  return (
    <Stage align="top" className="pb-28">
      <div className="mb-10 mt-6 text-center">
        <h2 className="font-display text-4xl font-light text-glow sm:text-5xl">{memories.title}</h2>
        {memories.subtitle && (
          <p className="mt-3 font-display text-lg italic text-white/50">{memories.subtitle}</p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="font-display text-lg italic text-white/40">
          This gallery is still being filled with memories…
        </p>
      ) : (
        <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:max-w-5xl lg:grid-cols-4">
          {items.map((m, i) => (
            <motion.button
              key={m.id}
              type="button"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: memories.animationDuration / 1000, delay: (i % 6) * 0.06 }}
              onClick={() => setLightbox(i)}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-white/5"
              aria-label={m.caption || m.alt || 'Open memory'}
            >
              <MediaView item={m} cloudName={meta.cloudName} width={640} className="transition-transform duration-500 group-hover:scale-105" />
              {m.caption && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-left font-display text-sm italic text-white/85 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {m.caption}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <button type="button" className="btn-outline mt-14" onClick={onDone}>
        Continue ❤️
      </button>

      {lightbox !== null && (
        <Lightbox
          items={items}
          index={lightbox}
          cloudName={meta.cloudName}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </Stage>
  )
}
