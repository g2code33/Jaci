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

/** Full-screen picker to browse the media library. */
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

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <h3 className="font-display text-xl font-light text-white/90">{title}</h3>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-4">
          <input
            className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-rose/50"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex gap-1">
            {(['all', 'image', 'video', 'audio'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs capitalize transition',
                  type === t ? 'bg-rose text-white' : 'bg-white/5 text-white/60 hover:bg-white/10',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="no-scrollbar grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-4">
          {items.length === 0 && (
            <p className="col-span-full py-16 text-center font-display italic text-white/40">
              No media yet — upload some in the Media Library first.
            </p>
          )}
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick(cloneItem(m))}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 transition hover:border-rose/60"
            >
              <MediaView item={m} cloudName={cloudName} width={320} />
              {m.kind !== 'image' && (
                <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase text-white/80">
                  {m.kind}
                </span>
              )}
              {m.caption && (
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 pb-1 pt-4 text-left text-[11px] text-white/85">
                  {m.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Pick a single media item. */
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

/** Edit a list of media items (for story entries, memories, cards…). */
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
