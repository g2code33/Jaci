import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useExperience } from '@/context/ExperienceContext'
import { buildRecapHtml } from '@/lib/recap'
import { isIOS, isScreenRecording, screenFileName, stopScreenRecording } from '@/lib/recorder'

/**
 * Download + Share controls for the final page.
 *
 * - Save the video / Share the video: only shown when a real screen recording
 *   is active (Android / desktop where she agreed to record). No synthetic
 *   video is generated.
 * - On iPhone the recording buttons are replaced with instructions to use the
 *   built-in Control Center screen recorder.
 * - Save the letter: downloads the text keepsake (HTML) as a third option.
 */
export function RecapButtons() {
  const { config } = useExperience()
  const [busy, setBusy] = useState<'save' | 'share' | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const ios = isIOS()
  const hasRecording = isScreenRecording()

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const shareOrSave = async (blob: Blob, name: string) => {
    const file = new File([blob], name, { type: blob.type })
    try {
      const canShareFiles =
        typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
      if (typeof navigator.share === 'function' && canShareFiles) {
        await navigator.share({ files: [file], title: `${config.name} ❤️` })
        flash('Shared ❤️')
        return
      }
    } catch {
      // fall through to download
    }
    downloadBlob(blob, name)
    flash('Sharing video isn\u2019t supported here — saved it instead.')
  }

  const makeVideo = async (mode: 'save' | 'share') => {
    setBusy(mode)
    try {
      const res = await stopScreenRecording()
      if (!res) {
        flash('Recording wasn\u2019t saved — try again or use "Save the letter".')
        return
      }
      const name = screenFileName(config, res.ext)
      if (mode === 'save') {
        downloadBlob(res.blob, name)
        flash('Your journey video is saved ❤️')
      } else {
        await shareOrSave(res.blob, name)
      }
    } catch {
      flash('Couldn\u2019t save the video — use "Save the letter".')
    } finally {
      setBusy(null)
    }
  }

  const saveLetter = () => {
    try {
      const html = buildRecapHtml(config)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const safe = config.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      downloadBlob(blob, `${safe}-birthday.html`)
      flash('Letter keepsake saved ❤️')
    } catch {
      flash('Could not download — please try again.')
    }
  }

  return (
    <>
      <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {hasRecording && (
          <>
            <button type="button" onClick={() => makeVideo('save')} disabled={busy !== null} className="btn-solid">
              {busy === 'save' ? 'Preparing…' : '🎬 Save the video'}
            </button>
            <button type="button" onClick={() => makeVideo('share')} disabled={busy !== null} className="btn-solid">
              {busy === 'share' ? 'Preparing…' : '💌 Share the video'}
            </button>
          </>
        )}
        <button type="button" onClick={saveLetter} disabled={busy !== null} className="btn-outline">
          📄 Save the letter
        </button>
      </div>

      {ios && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
          <p className="font-body text-sm leading-relaxed text-white/80">
            <span className="font-semibold text-rose-soft">Want to keep it as a video on iPhone?</span>{' '}
            Use your iPhone&apos;s own recorder — swipe down from the top-right to open Control Center, tap the
            <b> screen-record</b> button, then tap it again when you&apos;re done. Your recording is saved to Photos. ❤️
          </p>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none fixed bottom-20 left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-full bg-white/10 px-5 py-2.5 font-body text-sm text-white/90 backdrop-blur-md"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  )
}
