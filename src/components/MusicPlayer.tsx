import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useExperience } from '@/context/ExperienceContext'
import { cn } from '@/lib/utils'

const FADE_MS = 900
const FADE_IN_MS = 700

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

/**
 * Floating music controls for the playlist.
 *
 * Track changes crossfade: the current track gently fades out while the next
 * one sips in — no gap, no hard cut. A two-element (A/B) audio pool powers it.
 *
 * Tapping any major button starts the music; further button taps advance to
 * the next track with a crossfade. The music controls are excluded so they
 * don't double-trigger.
 */
export function MusicPlayer() {
  const { config } = useExperience()
  const music = config.music
  const tracks = (music.tracks || []).filter((t) => t.url && t.url.trim())

  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [index, setIndex] = useState(0)
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

  // A/B audio pool
  const audioARef = useRef<HTMLAudioElement | null>(null)
  const audioBRef = useRef<HTMLAudioElement | null>(null)
  const activeRef = useRef<'A' | 'B'>('A')
  const fadeA = useRef(0)
  const fadeB = useRef(0)
  const playingRef = useRef(false)
  const indexRef = useRef(0)
  const rampRef = useRef<number | null>(null)

  const volumeRef = useRef(volume)
  const mutedRef = useRef(muted)
  const tracksRef = useRef(tracks)

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])
  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  const applyVolume = (el: HTMLAudioElement | null, level: number) => {
    if (!el) return
    el.volume = level * (mutedRef.current ? 0 : volumeRef.current)
  }

  const getActive = () => (activeRef.current === 'A' ? audioARef.current : audioBRef.current)
  const getInactive = () => (activeRef.current === 'A' ? audioBRef.current : audioARef.current)

  const cancelRamp = () => {
    if (rampRef.current != null) {
      cancelAnimationFrame(rampRef.current)
      rampRef.current = null
    }
  }

  // Fade an element in from 0 → 1 (used on start and resume).
  const fadeIn = useCallback((el: HTMLAudioElement | null) => {
    if (!el) return
    cancelRamp()
    const isA = el === audioARef.current
    if (isA) fadeA.current = 0
    else fadeB.current = 0
    applyVolume(el, 0)
    el.play()
      .then(() => {
        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / FADE_IN_MS)
          const eased = easeInOutQuad(t)
          if (isA) fadeA.current = eased
          else fadeB.current = eased
          applyVolume(el, eased)
          if (t >= 1) rampRef.current = null
          else rampRef.current = requestAnimationFrame(step)
        }
        rampRef.current = requestAnimationFrame(step)
      })
      .catch(() => {
        playingRef.current = false
        setPlaying(false)
      })
  }, [])

  const startMusic = useCallback((trackIndex: number) => {
    const list = tracksRef.current
    const track = list[Math.min(trackIndex, list.length - 1)]
    if (!track) return
    const el = getActive()
    if (!el) return
    el.loop = list.length === 1
    el.src = track.url
    el.currentTime = 0
    indexRef.current = Math.min(trackIndex, list.length - 1)
    setIndex(indexRef.current)
    playingRef.current = true
    setPlaying(true)
    fadeIn(el)
  }, [fadeIn])

  const crossfade = useCallback((trackIndex: number) => {
    const list = tracksRef.current
    const track = list[Math.min(trackIndex, list.length - 1)]
    if (!track) return
    const from = getActive()
    const to = getInactive()
    if (!from || !to) {
      startMusic(trackIndex)
      return
    }
    cancelRamp()
    const fromIsA = activeRef.current === 'A'
    const fromStart = fromIsA ? fadeA.current : fadeB.current
    const toIsA = !fromIsA

    to.loop = false
    to.src = track.url
    to.currentTime = 0
    if (toIsA) fadeA.current = 0
    else fadeB.current = 0
    applyVolume(to, 0)

    to.play()
      .then(() => {
        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / FADE_MS)
          const eased = easeInOutQuad(t)
          const fromLevel = fromStart * (1 - eased)
          const toLevel = eased
          if (fromIsA) fadeA.current = fromLevel
          else fadeB.current = fromLevel
          if (toIsA) fadeA.current = toLevel
          else fadeB.current = toLevel
          applyVolume(from, fromLevel)
          applyVolume(to, toLevel)
          if (t >= 1) {
            from.pause()
            from.currentTime = 0
            applyVolume(from, 0)
            if (fromIsA) fadeA.current = 0
            else fadeB.current = 0
            activeRef.current = toIsA ? 'A' : 'B'
            rampRef.current = null
            // Preload the upcoming track into the now-idle element.
            if (list.length > 1) {
              const idle = getInactive()
              const upcoming = list[(indexRef.current + 1) % list.length]
              if (idle && upcoming) {
                idle.src = upcoming.url
                idle.load()
              }
            }
          } else {
            rampRef.current = requestAnimationFrame(step)
          }
        }
        rampRef.current = requestAnimationFrame(step)
      })
      .catch(() => {
        playingRef.current = false
        setPlaying(false)
      })

    indexRef.current = Math.min(trackIndex, list.length - 1)
    setIndex(indexRef.current)
    playingRef.current = true
    setPlaying(true)
  }, [startMusic])

  const pause = useCallback(() => {
    const el = getActive()
    if (!el) return
    cancelRamp()
    const isA = el === audioARef.current
    const startLevel = isA ? fadeA.current : fadeB.current
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 350)
      const level = startLevel * (1 - t)
      if (isA) fadeA.current = level
      else fadeB.current = level
      applyVolume(el, level)
      if (t >= 1) {
        el.pause()
        applyVolume(el, 0)
        if (isA) fadeA.current = 0
        else fadeB.current = 0
        rampRef.current = null
      } else {
        rampRef.current = requestAnimationFrame(step)
      }
    }
    rampRef.current = requestAnimationFrame(step)
  }, [])

  // Apply volume/mute changes to whichever track is sounding.
  useEffect(() => {
    applyVolume(audioARef.current, fadeA.current)
    applyVolume(audioBRef.current, fadeB.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, muted])

  // Tapping any major button starts the music; further taps crossfade to the
  // next track. Music controls are excluded so they don't double-fire.
  useEffect(() => {
    if (!music.enabled || tracks.length === 0) return
    const onTap = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (target && typeof target.closest === 'function') {
        if (target.closest('[data-music-controls]')) return
        if (!target.closest('button')) return
      }
      if (!playingRef.current) {
        startMusic(indexRef.current)
      } else if (tracks.length > 1) {
        crossfade((indexRef.current + 1) % tracks.length)
      }
    }
    const onKey = () => {
      if (!playingRef.current) startMusic(indexRef.current)
    }
    window.addEventListener('pointerdown', onTap, { capture: true })
    window.addEventListener('keydown', onKey, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', onTap, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [music.enabled, tracks.length, startMusic, crossfade])

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

  useEffect(() => {
    return () => cancelRamp()
  }, [])

  if (!music.enabled || tracks.length === 0) return null

  const current = tracks.length ? tracks[Math.min(index, tracks.length - 1)] : undefined

  const toggle = () => {
    if (playingRef.current) {
      pause()
      playingRef.current = false
      setPlaying(false)
    } else {
      const el = getActive()
      if (el && el.src) {
        playingRef.current = true
        setPlaying(true)
        fadeIn(el)
      } else {
        startMusic(indexRef.current)
      }
    }
  }

  const next = () => crossfade((indexRef.current + 1) % tracks.length)
  const prev = () => crossfade((indexRef.current - 1 + tracks.length) % tracks.length)

  const handleEnded = () => {
    const list = tracksRef.current
    if (list.length > 1 && music.loop) {
      crossfade((indexRef.current + 1) % list.length)
    } else {
      playingRef.current = false
      setPlaying(false)
    }
  }

  return (
    <div data-music-controls className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-2 pb-safe">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="glass flex w-72 flex-col gap-3 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-display text-sm italic text-white/80">
                {current?.title || 'Our song'}
              </span>
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="text-white/70 transition hover:text-white"
              >
                {muted ? '🔇' : '🔊'}
              </button>
            </div>

            {tracks.length > 1 && (
              <>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous song"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/15"
                  >
                    ⏮
                  </button>
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={playing ? 'Pause' : 'Play'}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-rose/80 text-lg text-white transition hover:bg-rose"
                  >
                    {playing ? '⏸' : '▶'}
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next song"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/15"
                  >
                    ⏭
                  </button>
                </div>
                <p className="text-center text-[10px] uppercase tracking-[0.25em] text-white/40">
                  {index + 1} / {tracks.length}
                </p>
              </>
            )}

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
        className={cn(
          'glass flex h-12 w-12 items-center justify-center rounded-full text-lg shadow-xl transition hover:scale-105',
          playing && 'ring-2 ring-rose/50',
        )}
      >
        {playing ? '🎶' : '🎵'}
      </button>

      <audio
        ref={audioARef}
        preload="auto"
        onEnded={handleEnded}
        className="hidden"
      />
      <audio
        ref={audioBRef}
        preload="auto"
        onEnded={handleEnded}
        className="hidden"
      />
    </div>
  )
}
