import { useEffect, useRef, useState } from 'react'
import { useAdmin } from '@/admin/AdminContext'
import { Section } from '@/admin/editors'
import { MediaView } from '@/components/MediaView'
import { Lightbox } from '@/components/Lightbox'
import { api, type CloudinaryResource } from '@/lib/api'
import { attachmentUrl, cleanImagePublicId, mediaUrl } from '@/lib/cloudinary'
import { moveIn, removeAt } from '@/lib/path'
import { uid } from '@/lib/utils'
import type { MediaItem, MediaType } from '@/types/config'
import { cn } from '@/lib/utils'

const FOLDERS = ['entrance', 'memories', 'gallery', 'videos', 'birthday', 'final-surprise']
const AUDIO_FORMATS = ['mp3', 'm4a', 'wav', 'ogg', 'aac', 'flac', 'opus']

function resourceToItem(r: CloudinaryResource): MediaItem {
  const format = (r.format || '').toLowerCase()
  let kind: MediaType = 'image'
  if (r.resource_type === 'video') {
    kind = AUDIO_FORMATS.includes(format) ? 'audio' : 'video'
  }
  const cleanPid = kind === 'image' ? cleanImagePublicId(r.public_id) : r.public_id
  const name = r.public_id.split('/').pop() || r.public_id
  return {
    id: uid(),
    kind,
    publicId: cleanPid,
    format: format || undefined,
    width: r.width,
    height: r.height,
    folder: r.folder,
    caption: '',
    alt: name,
  }
}

export function MediaLibrary() {
  const { draft, update, cloudinary, persist } = useAdmin()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | MediaType>('all')
  const [folder, setFolder] = useState('memories')
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [pending, setPending] = useState<MediaItem[] | null>(null)
  const [viewIndex, setViewIndex] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const autoRanRef = useRef(false)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const cloudName = draft.media.cloudName || cloudinary.cloudName

  const library = draft.media.library
  const items = library
    .filter((m) => type === 'all' || m.kind === type)
    .filter((m) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return `${m.caption || ''} ${m.alt || ''} ${m.publicId || ''} ${m.folder || ''}`.toLowerCase().includes(q)
    })

  const kindFromType = (mime: string, resourceType?: string): MediaType => {
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('audio/')) return 'audio'
    if (resourceType === 'image') return 'image'
    if (resourceType === 'video') return 'video'
    return 'image'
  }

  const uploadCloudinary = async (file: File, subfolder: string): Promise<MediaItem> => {
    const sig = await api.cloudinarySignature(`${cloudinary.folder}/${subfolder}`)
    if (!sig.enabled || !sig.cloudName || !sig.apiKey || !sig.signature) {
      throw new Error('cloudinary_disabled')
    }
    const form = new FormData()
    form.append('file', file)
    form.append('api_key', sig.apiKey)
    form.append('timestamp', String(sig.timestamp))
    form.append('signature', sig.signature)
    form.append('folder', sig.folder || `${cloudinary.folder}/${subfolder}`)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
      method: 'POST',
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message || 'Upload failed')
    const kind = kindFromType(file.type, data.resource_type)
    return {
      id: uid(),
      kind,
      publicId: kind === 'image' ? cleanImagePublicId(data.public_id) : data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      folder: data.folder,
      caption: '',
      alt: file.name,
    }
  }

  const uploadLocal = async (file: File): Promise<MediaItem> => {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('read_failed'))
      reader.readAsDataURL(file)
    })
    const res = await api.localUpload({ name: file.name, type: file.type, dataUrl })
    if (!res.ok || !res.item) throw new Error(res.error || 'Upload failed')
    return res.item
  }

  const importItems = async (newItems: MediaItem[]) => {
    const current = draftRef.current
    const nextLibrary = [...current.media.library, ...newItems]
    update('media.library', nextLibrary)
    await persist({ ...current, media: { ...current.media, library: nextLibrary } })
  }

  useEffect(() => {
    if (autoRanRef.current || !cloudinary.enabled) return
    autoRanRef.current = true
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.cloudinaryResources()
        if (cancelled || !res.enabled) return
        const known = new Set(draftRef.current.media.library.map((m) => m.publicId).filter(Boolean))
        const missing = res.resources
          .filter((r) => r.public_id && !known.has(r.public_id))
          .map(resourceToItem)
        if (missing.length > 0) {
          await importItems(missing)
          if (!cancelled) setMessage(`Auto-imported ${missing.length} new file${missing.length === 1 ? '' : 's'} from Cloudinary.`)
        }
      } catch {
        if (!cancelled) setMessage('Could not reach Cloudinary to auto-import.')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudinary.enabled])

  const syncNow = async () => {
    if (!cloudinary.enabled) {
      setMessage('Cloudinary is not configured — nothing to sync.')
      return
    }
    setSyncing(true)
    setMessage(null)
    try {
      const res = await api.cloudinaryResources()
      if (!res.enabled) {
        setMessage('Cloudinary is not configured.')
        return
      }
      const known = new Set(draftRef.current.media.library.map((m) => m.publicId).filter(Boolean))
      const missing = res.resources
        .filter((r) => r.public_id && !known.has(r.public_id))
        .map(resourceToItem)
      if (missing.length === 0) {
        setMessage('No files to sync — everything in Cloudinary is already here.')
      } else {
        setPending(missing)
      }
    } catch {
      setMessage('Could not reach Cloudinary to check for files.')
    } finally {
      setSyncing(false)
    }
  }

  const confirmImport = async () => {
    if (!pending) return
    const items = pending
    setPending(null)
    await importItems(items)
    setMessage(`Imported ${items.length} file${items.length === 1 ? '' : 's'}.`)
  }

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setMessage(null)
    const added: MediaItem[] = []
    try {
      for (const file of Array.from(files)) {
        if (file.size > 40 * 1024 * 1024) {
          setMessage('Skipped a file larger than 40 MB.')
          continue
        }
        const item = cloudinary.enabled ? await uploadCloudinary(file, folder) : await uploadLocal(file)
        added.push(item)
      }
      const nextLibrary = [...draft.media.library, ...added]
      update('media.library', nextLibrary)
      await persist({ ...draft, media: { ...draft.media, library: nextLibrary } })
      setMessage(`Added ${added.length} item${added.length === 1 ? '' : 's'} and saved.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const copyUrl = async (item: MediaItem) => {
    const url = mediaUrl(item, cloudName)
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setMessage('URL copied.')
    } catch {
      setMessage(url)
    }
  }

  const triggerDownload = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadItem = async (item: MediaItem) => {
    const url = attachmentUrl(item, cloudName)
    if (!url) {
      setMessage('No file to download.')
      return
    }
    const name = item.alt || item.caption || item.publicId?.split('/').pop() || 'media'
    if (item.url) {
      // Local uploads: fetch to blob so the `download` attribute is honoured.
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const objUrl = URL.createObjectURL(blob)
        triggerDownload(objUrl, name)
        setTimeout(() => URL.revokeObjectURL(objUrl), 1000)
      } catch {
        window.open(url, '_blank')
      }
      return
    }
    // Cloudinary: fl_attachment makes the browser download the original file.
    triggerDownload(url, name)
  }

  return (
    <Section
      title="Cloudinary Media"
      description={cloudinary.enabled ? `Uploading to Cloudinary (${cloudinary.cloudName}). New uploads are saved automatically, and files already in Cloudinary are auto-imported here.` : 'Cloudinary is not configured — files are stored locally on the server.'}
    >
      <div className="rounded-2xl border border-dashed border-white/15 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <button type="button" className="btn-solid !px-5 !py-2.5 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload media'}
          </button>
          {cloudinary.enabled && (
            <>
              <button type="button" className="btn-outline !px-5 !py-2.5 text-xs" onClick={syncNow} disabled={syncing}>
                {syncing ? 'Checking…' : 'Sync from Cloudinary'}
              </button>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none"
                aria-label="Destination folder"
              >
                {FOLDERS.map((f) => (
                  <option key={f} value={f} className="bg-night-800">
                    {cloudinary.folder}/{f}/
                  </option>
                ))}
              </select>
            </>
          )}
          <span className="text-xs text-white/40">JPG, PNG, WEBP, MP4, WEBM, MOV, MP3…</span>
        </div>

        {pending && (
          <div className="mt-4 rounded-2xl border border-rose/30 bg-rose/10 p-4">
            <p className="text-sm text-white/85">
              {pending.length} new file{pending.length === 1 ? '' : 's'} found in Cloudinary. Import {pending.length === 1 ? 'it' : 'them'}?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-solid !px-4 !py-2 text-xs" onClick={confirmImport}>
                Yes, import
              </button>
              <button type="button" className="btn-outline !px-4 !py-2 text-xs" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {message && <p className="mt-3 text-sm text-white/60">{message}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
              className={cn('rounded-lg px-3 py-1.5 text-xs capitalize transition', type === t ? 'bg-rose text-white' : 'bg-white/5 text-white/60 hover:bg-white/10')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.length === 0 && (
          <p className="col-span-full py-16 text-center font-display italic text-white/40">No media yet.</p>
        )}
        {items.map((item, i) => {
          const index = library.findIndex((m) => m.id === item.id)
          return (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setViewIndex(i)}
                className="group relative block aspect-square w-full overflow-hidden"
                aria-label={`View ${item.caption || item.alt || 'media'}`}
              >
                <MediaView item={item} cloudName={cloudName} width={400} className="transition-transform duration-300 group-hover:scale-105" />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase text-white/80">{item.kind}</span>
                {item.hidden && (
                  <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase text-amber-300">hidden</span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="text-2xl">🔍</span>
                </span>
              </button>
              <div className="space-y-2 p-3">
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-white/25 outline-none focus:border-rose/50"
                  value={item.caption || ''}
                  placeholder="Caption…"
                  onChange={(e) => {
                    const next = [...library]
                    next[index] = { ...item, caption: e.target.value }
                    update('media.library', next)
                  }}
                />
                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" className="rounded bg-white/5 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10" onClick={() => copyUrl(item)}>Copy URL</button>
                  <button type="button" className="rounded bg-white/5 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10" onClick={() => downloadItem(item)}>⬇ Download</button>
                  <button type="button" className="rounded bg-white/5 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10" onClick={() => { const next = [...library]; next[index] = { ...item, hidden: !item.hidden }; update('media.library', next) }}>
                    {item.hidden ? 'Show' : 'Hide'}
                  </button>
                  <button type="button" className="rounded bg-white/5 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10 disabled:opacity-30" disabled={index === 0} onClick={() => update('media.library', moveIn(draft, 'media.library', index, index - 1))}>‹</button>
                  <button type="button" className="rounded bg-white/5 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10 disabled:opacity-30" disabled={index === library.length - 1} onClick={() => update('media.library', moveIn(draft, 'media.library', index, index + 1))}>›</button>
                  <button type="button" className="ml-auto rounded bg-rose/20 px-2 py-1 text-[11px] text-rose-soft hover:bg-rose/30" onClick={() => update('media.library', removeAt(draft, 'media.library', index))}>Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tap-to-view preview */}
      {viewIndex !== null && (
        <Lightbox
          items={items}
          index={viewIndex}
          cloudName={cloudName}
          onClose={() => setViewIndex(null)}
          onNavigate={setViewIndex}
        />
      )}
    </Section>
  )
}
