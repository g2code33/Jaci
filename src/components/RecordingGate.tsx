import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlowingHeart } from '@/components/GlowingHeart'
import { useExperience } from '@/context/ExperienceContext'
import { isIOS, startScreenRecording } from '@/lib/recorder'

interface Props {
  onDone: (recording: boolean) => void
}

export function RecordingGate({ onDone }: Props) {
  const { config } = useExperience()
  const accent = config.appearance.accentColor || '#ff4f9a'
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const ios = isIOS()

  const record = async () => {
    setBusy(true)
    try {
      const res = await startScreenRecording()
      if (res.ok) {
        onDone(true)
        return
      }
      if (res.error === 'NotAllowedError' || res.error === 'denied') {
        setNote('No problem — you can still enjoy it without recording. ❤️')
        window.setTimeout(() => onDone(false), 1500)
      } else {
        setNote('Recording isn\u2019t available here — continuing without it. ❤️')
        window.setTimeout(() => onDone(false), 1500)
      }
    } catch {
      onDone(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-night-900 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.9, type: 'spring', stiffness: 120, damping: 14 }}
        className="mb-8"
      >
        <GlowingHeart color={accent} size={52} glow={0.8} />
      </motion.div>

      <h2 className="max-w-md font-display text-3xl font-light leading-snug text-glow sm:text-4xl">
        Would you like a keepsake of this journey?
      </h2>
      <p className="mt-4 max-w-sm font-display text-lg italic text-white/60">
        It can be recorded as a little video for you to keep and share. 🌹
      </p>

      <div className="mt-10 flex w-full max-w-sm flex-col items-stretch gap-3">
        {ios ? (
          <>
            <div className="glass rounded-2xl p-5 text-left">
              <p className="font-body text-sm leading-relaxed text-white/85">
                <span className="font-semibold text-rose-soft">On iPhone:</span> your browser can&apos;t record the screen,
                but you can use your iPhone&apos;s own recorder — swipe down from the top-right to open Control Center,
                tap the <b>screen-record</b> button, then come back and enjoy. When it ends, a keepsake video will still
                be made for you automatically. ❤️
              </p>
            </div>
            <button type="button" className="btn-solid" onClick={() => onDone(false)}>
              Continue to the experience ❤️
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-solid" onClick={record} disabled={busy}>
              {busy ? 'Waiting for permission…' : '🎬 Record my keepsake'}
            </button>
            <button type="button" className="btn-outline" onClick={() => onDone(false)} disabled={busy}>
              No, just the experience
            </button>
          </>
        )}
      </div>

      {note && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 font-display text-lg italic text-rose-soft"
        >
          {note}
        </motion.p>
      )}
    </motion.div>
  )
}
