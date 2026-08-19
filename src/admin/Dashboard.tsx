import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAdmin } from '@/admin/AdminContext'
import { Experience } from '@/components/Experience'
import {
  AppearanceEditor,
  ArrowEditor,
  BackgroundsEditor,
  BirthdayRevealEditor,
  EntranceEditor,
  FinalSurpriseEditor,
  HeartEditor,
  LetterEditor,
  MemoriesEditor,
  MusicEditor,
  OverviewEditor,
  ReadyEditor,
  SecretLockEditor,
  SettingsEditor,
  StoryEditor,
  ThingsEditor,
} from '@/admin/editors'
import { MediaLibrary } from '@/admin/MediaLibrary'
import { cn } from '@/lib/utils'

const NAV = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'entrance', label: 'Entrance' },
  { id: 'arrow', label: 'Arrow Interaction' },
  { id: 'lock', label: 'Secret Lock' },
  { id: 'ready', label: 'Ready Sequence' },
  { id: 'story', label: 'Our Story' },
  { id: 'memories', label: 'Memories' },
  { id: 'things', label: "Things I Don't Say Enough" },
  { id: 'heart', label: 'Heart Messages' },
  { id: 'reveal', label: 'Birthday Reveal' },
  { id: 'letter', label: 'Birthday Letter' },
  { id: 'surprise', label: 'Final Surprise' },
  { id: 'music', label: 'Music' },
  { id: 'media', label: 'Cloudinary Media' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'backgrounds', label: 'Stage Backgrounds' },
  { id: 'settings', label: 'Settings' },
]

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { draft, meta, dirty, saving, publishing, saveDraft, publish, revert, reset, cloudinary } = useAdmin()
  const [section, setSection] = useState('overview')
  const [preview, setPreview] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2600)
  }

  const renderSection = () => {
    switch (section) {
      case 'overview':
        return <OverviewEditor onNavigate={setSection} />
      case 'entrance':
        return <EntranceEditor />
      case 'arrow':
        return <ArrowEditor />
      case 'lock':
        return <SecretLockEditor />
      case 'ready':
        return <ReadyEditor />
      case 'story':
        return <StoryEditor />
      case 'memories':
        return <MemoriesEditor />
      case 'things':
        return <ThingsEditor />
      case 'heart':
        return <HeartEditor />
      case 'reveal':
        return <BirthdayRevealEditor />
      case 'letter':
        return <LetterEditor />
      case 'surprise':
        return <FinalSurpriseEditor />
      case 'music':
        return <MusicEditor />
      case 'media':
        return <MediaLibrary />
      case 'appearance':
        return <AppearanceEditor />
      case 'backgrounds':
        return <BackgroundsEditor />
      case 'settings':
        return <SettingsEditor />
      default:
        return <OverviewEditor onNavigate={setSection} />
    }
  }

  return (
    <div className="min-h-[100dvh] bg-night-900 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-night-900/95 backdrop-blur-md">
        <div className="flex flex-col gap-2.5 px-3 pt-3 lg:flex-row lg:items-center lg:justify-between lg:px-4">
          {/* Title + status (hamburger left, mobile logout icon right) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/70 transition hover:bg-white/10 lg:hidden"
            >
              ☰
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span aria-hidden className="text-rose">❤</span>
              <h1 className="truncate font-display text-lg font-light">Birthday Admin</h1>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider',
                  dirty ? 'bg-amber-400/20 text-amber-200' : 'bg-emerald-400/20 text-emerald-200',
                )}
              >
                <span className="lg:hidden">{dirty ? 'Unsaved' : 'Saved'}</span>
                <span className="hidden lg:inline">{dirty ? 'Unsaved changes' : 'Saved'}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/60 transition hover:bg-white/10 lg:hidden"
            >
              ⏻
            </button>
          </div>

          {/* Actions — stacked grid on mobile, single row on desktop */}
          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
            <button type="button" className="btn-outline col-span-2 !px-4 !py-2.5 text-xs lg:col-span-1" onClick={() => setPreview(true)}>
              Preview as Jacinta
            </button>
            <button type="button" className="btn-outline hidden !px-4 !py-2 text-xs lg:inline-flex" onClick={onLogout}>
              Log out
            </button>
            <button type="button" className="btn-solid !px-4 !py-2.5 text-xs" disabled={saving || !dirty} onClick={() => saveDraft().then(() => flash('Draft saved.'))}>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              type="button"
              className="btn-solid !px-4 !py-2.5 text-xs"
              disabled={publishing}
              style={{ background: 'linear-gradient(135deg,#d4af7a,#b98a4e)' }}
              onClick={() => publish().then(() => flash('Published — the live experience is updated.'))}
            >
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 pb-2.5 lg:px-4">
          <button
            type="button"
            className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] text-white/50 transition hover:bg-white/10"
            onClick={() => {
              if (window.confirm('Discard draft changes and revert to the published version?')) revert().then(() => flash('Reverted to published.'))
            }}
          >
            Revert draft
          </button>
          <button
            type="button"
            className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] text-white/50 transition hover:bg-white/10"
            onClick={() => {
              if (window.confirm('Reset everything to defaults? This cannot be undone.')) reset().then(() => flash('Reset to defaults.'))
            }}
          >
            Reset all
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-[105px] hidden h-[calc(100dvh-105px)] w-60 shrink-0 overflow-y-auto border-r border-white/10 p-3 lg:block">
          <nav className="flex flex-col gap-0.5">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSection(n.id)}
                className={cn(
                  'rounded-lg px-3 py-2 text-left text-sm transition',
                  section === n.id ? 'bg-rose/20 text-rose-soft' : 'text-white/60 hover:bg-white/5 hover:text-white',
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-8">
          <div className="mx-auto max-w-4xl">{renderSection()}</div>
        </main>
      </div>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-night-900 lg:hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-rose">❤</span>
                <span className="font-display text-lg font-light">Birthday Admin</span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/70 transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <nav className="no-scrollbar flex-1 overflow-y-auto p-3">
              <div className="flex flex-col gap-1">
                {NAV.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setSection(n.id)
                      setMenuOpen(false)
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm transition',
                      section === n.id ? 'bg-rose/20 text-rose-soft' : 'text-white/70 hover:bg-white/5',
                    )}
                  >
                    <span>{n.label}</span>
                    <span aria-hidden className="text-white/30">›</span>
                  </button>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Experience
              config={draft}
              meta={{ cloudName: draft.media.cloudName || cloudinary.cloudName, publishedAt: meta.publishedAt || null }}
              preview
            />
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="glass fixed right-4 top-4 z-[90] flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20"
              aria-label="Close preview"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="glass fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm text-white/90"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
