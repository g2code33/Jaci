import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Stage } from '@/components/Stage'
import { GlowingHeart } from '@/components/GlowingHeart'
import { useExperience } from '@/context/ExperienceContext'
import { mediaUrl } from '@/lib/cloudinary'
import type { MediaItem } from '@/types/config'

interface Props {
  onDone: () => void
}

interface Slide {
  key: string
  moment: number // 0-based moment index
  momentTotal: number
  position: number // 1-based within this moment
  positionTotal: number
  title: string
  date?: string
  location?: string
  description?: string
  caption?: string
  media?: MediaItem
}

function buildSlides(
  entries: Array<{
    id: string
    title: string
    date?: string
    location?: string
    description?: string
    caption?: string
    media?: MediaItem[]
  }>,
): Slide[] {
  const slides: Slide[] = []
  const momentTotal = entries.length
  entries.forEach((entry, mi) => {
    const media = (entry.media || []).filter((m) => !m.hidden)
    if (media.length === 0) {
      slides.push({
        key: `${entry.id}-text`,
        moment: mi,
        momentTotal,
        position: 1,
        positionTotal: 1,
        title: entry.title,
        date: entry.date,
        location: entry.location,
        description: entry.description,
        caption: entry.caption,
        media: undefined,
      })
      return
    }
    media.forEach((m, pi) => {
      slides.push({
        key: `${entry.id}-${m.id}`,
        moment: mi,
        momentTotal,
        position: pi + 1,
        positionTotal: media.length,
        title: entry.title,
        date: entry.date,
        location: entry.location,
        description: entry.description,
        caption: m.caption || entry.caption,
        media: m,
      })
    })
  })
  return slides
}

export function Story({ onDone }: Props) {
  const { config, meta } = useExperience()
  const story = config.story
  const entries = story.entries.filter((e) => !e.hidden)

  const slides = useMemo(() => buildSlides(entries), [entries])
  const [index, setIndex] = useState(0)
  const finished = index >= slides.length
  const current = slides[index]
  const slideMs = Math.max(1500, story.slideDuration || 5000)

  const advance = () => setIndex((i) => Math.min(i + 1, slides.length))

  useEffect(() => {
    if (finished || !current) return
    const isVideo = current.media?.kind === 'video'
    const ms = isVideo ? 30000 : slideMs
    const t = window.setTimeout(advance, ms)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, finished, current, slideMs])

  return (
    <Stage full align="top" className="h-svh overflow-hidden">
      {!finished && current ? (
        <motion.div
          key={current.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="relative h-full w-full cursor-pointer overflow-hidden"
          onClick={advance}
        >
          <Slide slide={current} cloudName={meta.cloudName} slideMs={slideMs} onDone={advance} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex h-full w-full flex-col items-center justify-center gap-8 px-6 text-center"
        >
          <GlowingHeart color={config.appearance.accentColor} size={54} glow={0.8} />
          {story.closingLine && (
            <p className="max-w-md font-display text-2xl font-light italic text-white/85 text-glow-soft">
              {story.closingLine}
            </p>
          )}
          <button type="button" className="btn-solid" onClick={onDone}>
            Continue ❤️
          </button>
        </motion.div>
      )}
    </Stage>
  )
}

function Slide({
  slide,
  cloudName,
  slideMs,
  onDone,
}: {
  slide: Slide
  cloudName: string
  slideMs: number
  onDone: () => void
}) {
  const m = slide.media
  const isVideo = m?.kind === 'video'
  const [mediaFailed, setMediaFailed] = useState(false)
  const url = m && !mediaFailed ? mediaUrl(m, cloudName, { width: 1600 }) : undefined

  return (
    <>
      {m && url ? (
        <div className="absolute inset-0 bg-night-900">
          {isVideo ? (
            <video
              src={url}
              autoPlay
              muted
              playsInline
              onError={() => setMediaFailed(true)}
              className="h-full w-full object-cover"
              onEnded={onDone}
            />
          ) : (
            <motion.img
              src={url}
              alt=""
              draggable={false}
              onError={() => setMediaFailed(true)}
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: Math.max(4, slideMs / 1000 + 1), ease: 'linear' }}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
            {slide.date && (
              <p className="font-body text-[11px] uppercase tracking-[0.3em] text-rose-soft">{slide.date}</p>
            )}
            <h3 className="mt-2 font-display text-3xl font-light text-white">{slide.title}</h3>
            {slide.location && <p className="mt-2 font-body text-sm text-white/50">📍 {slide.location}</p>}
            {slide.description && (
              <p className="mt-4 font-body text-base leading-relaxed text-white/80">{slide.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-safe">
        <span className="font-display text-lg italic text-white/90">{slide.title}</span>
        <span className="font-body text-xs tracking-widest text-white/60">
          {slide.moment + 1} / {slide.momentTotal}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-12 flex gap-1.5 px-5 pt-safe">
        {Array.from({ length: slide.positionTotal }).map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i < slide.position - 1 ? 'bg-white/70' : i === slide.position - 1 ? 'bg-rose' : 'bg-white/20'}`}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-16 text-left sm:px-10">
        {slide.date && (
          <p className="font-body text-[11px] uppercase tracking-[0.3em] text-rose-soft">{slide.date}</p>
        )}
        <h3 className="mt-2 font-display text-3xl font-light leading-tight text-white sm:text-4xl">
          {slide.title}
        </h3>
        {slide.location && <p className="mt-2 font-body text-sm text-white/60">📍 {slide.location}</p>}
        {slide.description && (
          <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-white/85">{slide.description}</p>
        )}
        {slide.caption && <p className="mt-3 font-display text-lg italic text-white/70">{slide.caption}</p>}
      </div>

      <span className="pointer-events-none absolute right-4 bottom-4 rounded-full bg-black/40 px-3 py-1.5 font-body text-[11px] text-white/70">
        {slide.position < slide.positionTotal ? 'tap for next →' : 'tap to continue →'}
      </span>
    </>
  )
}
