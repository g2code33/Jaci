import { useMemo, useState } from 'react'
import type { MediaItem } from '@/types/config'
import { mediaUrl, videoPoster } from '@/lib/cloudinary'
import { cn } from '@/lib/utils'

interface MediaViewProps {
  item: MediaItem
  cloudName: string
  width?: number
  className?: string
  imgClassName?: string
  eager?: boolean
}

/** Renders a photo or video with graceful failure handling. */
export function MediaView({ item, cloudName, width, className, imgClassName, eager }: MediaViewProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const url = useMemo(() => mediaUrl(item, cloudName, { width }), [item, cloudName, width])
  const poster = useMemo(() => videoPoster(item, cloudName), [item, cloudName])

  if (!url || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02] text-rose/60',
          className,
        )}
        role="img"
        aria-label={item.alt || item.caption || 'Unavailable'}
      >
        <span aria-hidden className="text-2xl">
          ❤
        </span>
      </div>
    )
  }

  if (item.kind === 'video') {
    return (
      <video
        className={cn('h-full w-full object-cover', className)}
        src={url}
        poster={poster}
        muted
        playsInline
        loop
        preload={eager ? 'auto' : 'metadata'}
        onError={() => setFailed(true)}
        aria-label={item.alt || item.caption || 'A video'}
      />
    )
  }

  return (
    <img
      src={url}
      alt={item.alt || item.caption || 'A memory'}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn(
        'h-full w-full object-cover transition-opacity duration-300',
        loaded ? 'opacity-100' : 'opacity-0',
        className,
        imgClassName,
      )}
      draggable={false}
    />
  )
}
