import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useExperience } from '@/context/ExperienceContext'
import { buildRecapHtml, buildShareText } from '@/lib/recap'

/**
 * Download + Share controls for the final page.
 *
 * - Download: saves a beautiful standalone HTML keepsake of the whole journey.
 * - Share: shares a summary of everything Jacinta experienced (via the native
 *   share sheet, falling back to clipboard).
 */
export function RecapButtons() {
  const { config } = useExperience()
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  const download = () => {
    try {
      const html = buildRecapHtml(config)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-birthday.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      flash('Keepsake downloaded ❤️')
    } catch {
      flash('Could not download — please try again.')
    }
  }

  const share = async () => {
    const text = buildShareText(config)
    const url = window.location.href
    const shareData = {
      title: `${config.name} ❤️`,
      text,
      url,
    }
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(shareData)
        flash('Shared ❤️')
      } else if (typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(`${text}\n\n${url}`)
        flash('Copied — paste it anywhere to share ❤️')
      } else {
        flash('Sharing is not available on this device.')
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        flash('Sharing is not available on this device.')
      }
    }
  }

  return (
    <>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={download} className="btn-outline">
          ⬇ Save the keepsake
        </button>
        <button type="button" onClick={share} className="btn-solid">
          💌 Share our story
        </button>
      </div>

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
