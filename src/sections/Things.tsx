import { motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { useExperience } from '@/context/ExperienceContext'

interface Props {
  onDone: () => void
}

/**
 * "Things I Don't Say Enough" — all cards plus the Continue button fit on a
 * single screen, no scrolling. Cards shrink to fit however many there are.
 */
export function Things({ onDone }: Props) {
  const { config } = useExperience()
  const things = config.things
  const cards = things.cards.filter((c) => !c.hidden)
  const count = cards.length

  // Shrink the text as more cards are added so everything always fits.
  const titleSize = count <= 4 ? 'text-3xl sm:text-5xl' : count <= 8 ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'
  const msgSize =
    count <= 3 ? 'text-2xl sm:text-3xl' : count <= 6 ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'

  return (
    <Stage full align="top" className="h-[100dvh] overflow-hidden">
      <div className="flex h-full w-full flex-col px-5 py-6 pb-safe pt-safe">
        {/* Title */}
        <div className="mb-3 shrink-0 text-center">
          <h2 className={`font-display font-light text-glow ${titleSize}`}>{things.title}</h2>
          {things.subtitle && (
            <p className="mt-1 font-display text-sm italic text-white/50 sm:text-lg">{things.subtitle}</p>
          )}
        </div>

        {/* Cards — fill the remaining space equally, never overflow */}
        <div className="grid min-h-0 flex-1 grid-cols-1 content-center gap-2.5 overflow-hidden sm:grid-cols-2">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass flex min-h-0 flex-col justify-center overflow-hidden rounded-2xl p-4 text-center sm:p-5"
            >
              {card.title && (
                <h3 className="mb-1 font-display text-sm italic text-rose-soft sm:text-base">{card.title}</h3>
              )}
              <p className={`font-display font-light leading-snug text-white/90 ${msgSize} line-clamp-4`}>
                {card.message}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Continue — pinned to the bottom of the single page */}
        <div className="flex shrink-0 justify-center pt-4">
          <button type="button" className="btn-outline" onClick={onDone}>
            Continue ❤️
          </button>
        </div>
      </div>
    </Stage>
  )
}
