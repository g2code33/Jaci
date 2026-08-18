import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useExperience } from '@/context/ExperienceContext'
import { mediaUrl } from '@/lib/cloudinary'

/** Floating music controls. Never autoplays unless configured + allowed. */
export function MusicPlayer() {
  const { config, meta } = useExperience()
  const music = config.music
  const url = mediaUrl(
    music.url ? { id: 'music', kind: 'audio', url: music.url } : undefined,
    meta.cloudName,
  )
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState<number>(() => {
    try {
      const v = window.sessionStorage.getItem('jaci_volume')
      return v === null ? 0.8 : Number(v)
    } catch {
      return 0.8
    }
  })
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem('jaci_muted') === '1'
    } catch {
      return false
    }
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    try {
      window.sessionStorage.setItem('jaci_volume', String(volume))
    } catch {
      // ignore
    }
  }, [volume])

  useEffect(() => {
    try {
      window.sessionStorage.setItem('jaci_muted', muted ? '1' : '0')
    } catch {
      // ignore
    }
  }, [muted])

  // Respect the configured autoplay on the first user gesture.
  useEffect(() => {
    if (!music.enabled || !url || !music.autoplay) return
    const attempt = () => {
      const a = audioRef.current
      if (a) a.play().catch(() => undefined)
      window.removeEventListener('pointerdown', attempt)
      window.removeEventListener('keydown', attempt)
    }
    window.addEventListener('pointerdown', attempt)
    window.addEventListener('keydown', attempt)
    return () => {
      window.removeEventListener('pointerdown', attempt)
      window.removeEventListener('keydown', attempt)
    }
  }, [music.enabled, url, music.autoplay])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = muted ? 0 : volume
  }, [volume, muted, url])

  if (!music.enabled || !url) return null

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false))
    } else {
      a.pause()
      setPlaying(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-2 pb-safe">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="glass flex w-64 flex-col gap-3 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="truncate font-display text-sm italic text-white/80">{music.title || 'Our song'}</span>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="text-white/70 transition hover:text-white"
              >
                {muted ? '🔇' : '🔊'}
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="w-full accent-rose"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Music controls"
        className="glass flex h-12 w-12 items-center justify-center rounded-full text-lg shadow-xl transition hover:scale-105"
      >
        🎵
      </button>
      <audio
        ref={audioRef}
        src={url}
        loop={music.loop}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
        onCanPlay={() => {
          if (music.autoplay && !playing) toggle()
        }}
      />
    </div>
  )
}
