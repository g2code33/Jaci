import { motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { useExperience } from '@/context/ExperienceContext'
import { sanitizeHtml } from '@/lib/sanitize'

interface Props {
  onDone: () => void
}

export function Letter({ onDone }: Props) {
  const { config } = useExperience()
  const letter = config.letter

  return (
    <Stage align="top" className="pb-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: letter.revealDuration / 1000 }}
        className="flex w-full max-w-2xl flex-col items-center lg:max-w-3xl"
      >
        <h2 className="mb-10 font-display text-4xl font-light text-glow sm:text-5xl">{letter.title}</h2>

        <motion.div
          initial={{ opacity: 0, y: 20, rotateX: 6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: letter.revealDuration / 3000, duration: letter.revealDuration / 1000 }}
          className="glass letter-body w-full rounded-3xl px-7 py-9 text-left sm:px-12 sm:py-12"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(letter.body) }}
        />

        <button type="button" className="btn-outline mt-14" onClick={onDone}>
          Continue ❤️
        </button>
      </motion.div>
    </Stage>
  )
}
