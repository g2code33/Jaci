import type { MediaItem } from '@/types/config'

export interface CloudinaryUrlOptions {
  width?: number
  height?: number
}

/**
 * Build an optimised Cloudinary delivery URL for a media item.
 * Falls back to the item's direct `url` (local uploads / external).
 */
export function mediaUrl(
  item: MediaItem | undefined,
  cloudName: string,
  opts: CloudinaryUrlOptions = {},
): string | undefined {
  if (!item) return undefined
  if (item.url) return item.url
  if (!item.publicId || !cloudName) return undefined

  const base = `https://res.cloudinary.com/${cloudName}`
  const transforms = ['q_auto', 'f_auto']
  if (opts.width) transforms.push(`w_${opts.width}`)
  if (opts.height) transforms.push(`h_${opts.height}`)
  if (opts.width || opts.height) transforms.push('c_fill')
  const t = transforms.join(',')

  if (item.kind === 'image') {
    return `${base}/image/upload/${t}/${item.publicId}`
  }
  // Videos and audio use the "video" resource type in Cloudinary URLs.
  const ext = item.format ? `.${item.format}` : ''
  return `${base}/video/upload/${t}/${item.publicId}${ext}`
}

/** A lightweight poster frame for a Cloudinary video. */
export function videoPoster(item: MediaItem, cloudName: string): string | undefined {
  if (item.url) return undefined
  if (!item.publicId || !cloudName || item.kind !== 'video') return undefined
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_720,q_auto,f_auto/${item.publicId}.jpg`
}

/** Optimised thumbnail (for grids). */
export function thumbUrl(item: MediaItem, cloudName: string, width = 640): string | undefined {
  if (item.kind === 'image') return mediaUrl(item, cloudName, { width })
  const poster = videoPoster(item, cloudName)
  return poster || mediaUrl(item, cloudName, { width })
}
