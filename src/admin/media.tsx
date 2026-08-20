import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAdmin } from '@/admin/AdminContext'
import { MediaView } from '@/components/MediaView'
import { getIn, moveIn, removeAt } from '@/lib/path'
import type { MediaItem, MediaType } from '@/types/config'
import { cn } from '@/lib/utils'

function cloneItem(item: MediaItem): MediaItem {
  return JSON.parse(JSON.stringify(item))
}

export function MediaLibraryModal({
  onPick,
  onClose,
  filter,
  title = 'Choose from library',
}: {
  onPick: (item: MediaItem) => void
  onClose: () => void
  filter?: MediaType[]
  title?: string
}) {
  const { draft, cloudinary } = useAdmin()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | MediaType>('all')
  const cloudName = draft.media.cloudName || cloudinary.cloudName

  const items = useMemo(() => {
    return draft.media.library
      .filter((m) => !m.hidden)
      .filter((m) => !filter || filter.includes(m.kind))
      .filter((m) => type === 'all' || m.kind === type)
      .filter((m) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return `${m.caption || ''} ${m.alt || ''} ${m.publicId || ''}`.toLowerCase().includes(q)
      })
  }, [draft.media.library, filter, query, type])

  const tabs: Array<{ id: 'all' | MediaType; label: string; icon: string }> = [
    { id: 'all', label: 'All', icon: '✦' },
    { id: 'image', label: 'Photos', icon: '🖼' },
    { id: 'video', label: 'Videos', icon: '🎬' },
    { id: 'audio', label: 'Music', icon: '🎵' },
  ]

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-night-850 shadow-2xl"
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="font-display text-xl font-light text-white/95">{title}</h3>
            <p className="mt-0.5 font-body text-xs text-white/40">
              {items.length} {items.length === 1 ? 'item' : 'items'} — tap one to choose
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-3">
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              🔍
            </span>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition focus:border-rose/50 focus:bg-white/[0.07]"
              placeholder="Search your library…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-white/5 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition',
                  type === t.id ? 'bg-rose text-white shadow' : 'text-white/60 hover:text-white',
                )}
              >
                <span aria-hidden>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="no-scrollbar grid flex-1 grid-cols-2 gap-4 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <span aria-hidden className="text-4xl">🌸</span>
              <p className="mt-4 font-display text-xl italic text-white/50">Nothing here yet</p>
              <p className="mt-1 font-body text-sm text-white/35">
                Upload media in the Media Library first.
              </p>
            </div>
          )}
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick(cloneItem(m))}
              className="group relative aspect-square w-full rounded-2xl border border-white/10 bg-white/[0.04] text-left transition hover:border-rose/60"
            >
              {/* media is clipped by this div — divs clip reliably in every
                  browser (unlike buttons, which Safari refuses to clip) */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <MediaView
                  item={m}
                  cloudName={cloudName}
                  width={480}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/85">
                {m.kind === 'image' ? '🖼 photo' : m.kind === 'video' ? '🎬 video' : '🎵 audio'}
              </span>
              {(m.caption || m.alt) && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2.5 pt-10">
                  <span className="line-clamp-2 font-display text-sm italic leading-snug text-white/95">
                    {m.caption || m.alt}
                  </span>
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-rose/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span className="rounded-full bg-rose px-4 py-1.5 font-body text-xs font-semibold text-white shadow-lg">
                  Choose ✓
                </span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function MediaField({ value, onChange, label, filter }: { value?: MediaItem; onChange: (item?: MediaItem) => void; label?: string; filter?: MediaType[] }) {
  const [open, setOpen] = useState(false)
  const { draft, cloudinary } = useAdmin()
  const cloudName = draft.media.cloudName || cloudinary.cloudName

  return (
    <div>
      {label && <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</span>}
      {value ? (
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
            <MediaView item={value} cloudName={cloudName} width={160} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white/80">{value.caption || value.alt || value.publicId || value.url}</p>
            <p className="text-[11px] uppercase text-white/35">{value.kind}</p>
          </div>
          <button type="button" className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60 hover:bg-white/10" onClick={() => setOpen(true)}>
            Change
          </button>
          <button type="button" className="rounded-lg bg-rose/20 px-3 py-2 text-xs text-rose-soft hover:bg-rose/30" onClick={() => onChange(undefined)}>
            Remove
          </button>
        </div>
      ) : (
        <button type="button" className="rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-white/50 transition hover:border-rose/50 hover:text-white" onClick={() => setOpen(true)}>
          + Choose from library
        </button>
      )}

      <AnimatePresence>
        {open && <MediaLibraryModal filter={filter} onClose={() => setOpen(false)} onPick={(item) => { onChange(item); setOpen(false) }} />}
      </AnimatePresence>
    </div>
  )
}

export function MediaListField({ path, label, filter }: { path: string; label?: string; filter?: MediaType[] }) {
  const { draft, update, cloudinary } = useAdmin()
  const list = (getIn(draft, path) as MediaItem[]) || []
  const [open, setOpen] = useState(false)
  const cloudName = draft.media.cloudName || cloudinary.cloudName

  const addItem = (item: MediaItem) => {
    update(path, [...list, item])
    setOpen(false)
  }

  return (
    <div>
      {label && <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {list.map((item, i) => (
          <div key={item.id} className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/10">
              <MediaView item={item} cloudName={cloudName} width={160} />
            </div>
            <button
              type="button"
              onClick={() => update(path, removeAt(draft, path, i))}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose text-[10px] text-white"
              aria-label="Remove"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={() => update(path, moveIn(draft, path, i, i - 1))}
              disabled={i === 0}
              className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] text-white disabled:opacity-30"
              aria-label="Move left"
            >
              ‹
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/15 text-xl text-white/40 transition hover:border-rose/50 hover:text-white"
          onClick={() => setOpen(true)}
          aria-label="Add media"
        >
          +
        </button>
      </div>
      <AnimatePresence>
        {open && <MediaLibraryModal filter={filter} onClose={() => setOpen(false)} onPick={addItem} />}
      </AnimatePresence>
    </div>
  )
}
