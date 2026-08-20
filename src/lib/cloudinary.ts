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

/** Video effects (admin edit ranges) mapped onto Cloudinary transforms. */
export interface VideoFx {
  blur: number // px 0..50
  brightness: number // % 0..200
  contrast: number // % 0..200
  saturate: number // % 0..200
  grayscale: number // % 0..100
  sepia: number // % 0..100
  hue: number // deg 0..360
}

/**
 * A background video URL that is optimised for smooth looping playback and
 * has all effects applied server-side (so the browser does no per-frame CSS
 * filtering). Strips audio and scales to width — never `c_fill`, which is
 * invalid for single-dimension video transforms.
 */
export function videoBackgroundUrl(
  item: MediaItem | undefined,
  cloudName: string,
  fx?: Partial<VideoFx>,
): string | undefined {
  if (!item) return undefined
  if (item.url) return item.url
  if (!item.publicId || !cloudName) return undefined

  const base = `https://res.cloudinary.com/${cloudName}`
  const transforms = ['q_auto:eco', 'vc_auto', 'ac_none', 'c_scale', 'w_1600']
  const f = fx || {}
  if (f.blur && f.blur > 0) transforms.push(`e_blur:${Math.round(f.blur * 20)}`)
  if (f.brightness != null && f.brightness !== 100) transforms.push(`e_brightness:${Math.round(f.brightness - 100)}`)
  if (f.contrast != null && f.contrast !== 100) transforms.push(`e_contrast:${Math.round(f.contrast - 100)}`)
  if (f.saturate != null && f.saturate !== 100) transforms.push(`e_saturation:${Math.round(f.saturate - 100)}`)
  if (f.grayscale && f.grayscale > 0) transforms.push(`e_grayscale:${Math.round(f.grayscale)}`)
  if (f.sepia && f.sepia > 0) transforms.push(`e_sepia:${Math.round(f.sepia)}`)
  if (f.hue && f.hue !== 0) transforms.push(`e_hue:${Math.round(f.hue)}`)

  const ext = item.format ? `.${item.format}` : ''
  return `${base}/video/upload/${transforms.join(',')}/${item.publicId}${ext}`
}

/**
 * A URL that forces the browser to download the original file (Cloudinary's
 * fl_attachment flag sets Content-Disposition: attachment). Falls back to the
 * item's direct URL for local uploads.
 */
export function attachmentUrl(item: MediaItem, cloudName: string): string | undefined {
  if (item.url) return item.url
  if (!item.publicId || !cloudName) return undefined
  const base = `https://res.cloudinary.com/${cloudName}`
  if (item.kind === 'image') {
    return `${base}/image/upload/fl_attachment/${item.publicId}`
  }
  const ext = item.format ? `.${item.format}` : ''
  return `${base}/video/upload/fl_attachment/${item.publicId}${ext}`
}
