import { useRef, useState } from 'react'
import { useAdmin } from '@/admin/AdminContext'
import { Section } from '@/admin/editors'
import { MediaView } from '@/components/MediaView'
import { api } from '@/lib/api'
import { mediaUrl } from '@/lib/cloudinary'
import { moveIn, removeAt } from '@/lib/path'
import { uid } from '@/lib/utils'
import type { MediaItem, MediaType } from '@/types/config'
import { cn } from '@/lib/utils'

const FOLDERS = ['entrance', 'memories', 'gallery', 'videos', 'birthday', 'final-surprise']

export function MediaLibrary() {
  const { draft, update, cloudinary } = useAdmin()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | MediaType>('all')
  const [folder, setFolder] = useState('memories')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
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
    return {
      id: uid(),
      kind: kindFromType(file.type, data.resource_type),
      publicId: data.public_id,
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
      update('media.library', [...draft.media.library, ...added])
      setMessage(`Added ${added.length} item${added.length === 1 ? '' : 's'}.`)
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

  return (
    <Section
      title="Cloudinary Media"
      description={cloudinary.enabled ? `Uploading to Cloudinary (${cloudinary.cloudName}).` : 'Cloudinary is not configured — files are stored locally on the server.'}
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
          )}
          <span className="text-xs text-white/40">JPG, PNG, WEBP, MP4, WEBM, MOV, MP3…</span>
        </div>
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
              <div className="relative aspect-square">
                <MediaView item={item} cloudName={cloudName} width={400} />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase text-white/80">{item.kind}</span>
                {item.hidden && (
                  <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase text-amber-300">hidden</span>
                )}
              </div>
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
    </Section>
  )
}
