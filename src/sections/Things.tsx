import { motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { MediaView } from '@/components/MediaView'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

export function Things({ onDone }: Props) {
  const { config, meta } = useExperience()
  const things = config.things
  const cards = things.cards.filter((c) => !c.hidden)

  return (
    <Stage align="top" className="pb-28">
      <div className="mb-12 mt-6 text-center">
        <h2 className="font-display text-4xl font-light text-glow sm:text-5xl">{things.title}</h2>
        {things.subtitle && (
          <p className="mt-3 font-display text-lg italic text-white/50">{things.subtitle}</p>
        )}
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2 lg:max-w-4xl">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: things.animationDuration / 1000, delay: (i % 2) * 0.1 }}
            className="glass rounded-3xl p-7 text-left"
          >
            {card.title && (
              <h3 className="mb-2 font-display text-xl font-light text-rose-soft">{card.title}</h3>
            )}
            <p className="font-display text-2xl font-light leading-snug text-white/90">{card.message}</p>
            {card.media && card.media.filter((m) => !m.hidden).length > 0 && (
              <div className="mt-5 aspect-[4/3] overflow-hidden rounded-2xl border border-white/5">
                <MediaView item={card.media.find((m) => !m.hidden)!} cloudName={meta.cloudName} width={800} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <button type="button" className="btn-outline mt-16" onClick={onDone}>
        Continue ❤️
      </button>
    </Stage>
  )
}
