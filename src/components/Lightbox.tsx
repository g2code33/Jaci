import { useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { MediaItem } from '@/types/config'
import { mediaUrl, videoPoster } from '@/lib/cloudinary'

interface LightboxProps {
  items: MediaItem[]
  index: number
  cloudName: string
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ items, index, cloudName, onClose, onNavigate }: LightboxProps) {
  const item = items[index]
  const prev = useCallback(() => onNavigate((index - 1 + items.length) % items.length), [index, items.length, onNavigate])
  const next = useCallback(() => onNavigate((index + 1) % items.length), [index, items.length, onNavigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!item) return null
  const url = mediaUrl(item, cloudName, { width: 1600 })
  const poster = videoPoster(item, cloudName)

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.caption || item.alt || 'Media viewer'}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white/80 transition hover:bg-white/20"
      >
        ✕
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          prev()
        }}
        aria-label="Previous"
        className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          next()
        }}
        aria-label="Next"
        className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
      >
        ›
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="flex max-h-full w-full max-w-4xl flex-col items-center px-12 py-16"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (info.offset.x < -70) next()
            else if (info.offset.x > 70) prev()
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {item.kind === 'video' ? (
            <video
              src={url}
              poster={poster}
              controls
              playsInline
              className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain"
            />
          ) : (
            <img src={url} alt={item.alt || item.caption || 'Memory'} className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain" />
          )}
          {(item.caption || item.alt) && (
            <p className="mt-5 max-w-xl text-center font-display text-lg italic text-white/80">{item.caption || item.alt}</p>
          )}
          <p className="mt-2 text-xs tracking-widest text-white/40">
            {index + 1} / {items.length}
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
