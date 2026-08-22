import type { MediaItem } from '@/types/config'

export interface CloudinaryUrlOptions {
  width?: number
  height?: number
}

/**
 * Remove raw format extensions like .heic, .heif, .jpg, .png from Cloudinary public IDs.
 * This ensures Cloudinary's dynamic `f_auto,q_auto` transformation delivers universal
 * formats (WebP/AVIF for Android & PC, WebP/JPEG for iOS Safari) instead of raw HEIC.
 */
export function cleanImagePublicId(publicId: string): string {
  return publicId.replace(/\.(heic|heif|HEIC|HEIF|jpg|jpeg|png|webp|avif)$/i, '')
}

/**
 * Optimise a raw Cloudinary URL to ensure `f_auto,q_auto` is applied and HEIC extensions
 * are replaced with universal formats.
 */
export function optimizeCloudinaryUrl(url: string, opts: CloudinaryUrlOptions = {}): string {
  if (!url || !url.includes('res.cloudinary.com')) return url

  let result = url
  // Replace .heic/.heif with .jpg to force universal decoding on Android & PC
  result = result.replace(/\.(heic|heif|HEIC|HEIF)($|\?)/i, '.jpg$2')

  if (result.includes('/image/upload/')) {
    const parts = result.split('/image/upload/')
    const segments = parts[1].split('/')
    const firstSegment = segments[0]
    
    // Check if the first segment is already a transformation segment
    if (!firstSegment.startsWith('v') && (firstSegment.includes('_') || firstSegment.includes(','))) {
      let transforms = firstSegment
      if (!transforms.includes('f_auto')) transforms += ',f_auto'
      if (!transforms.includes('q_auto')) transforms += ',q_auto'
      if (opts.width && !transforms.includes('w_')) transforms += `,w_${opts.width}`
      segments[0] = transforms
      result = `${parts[0]}/image/upload/${segments.join('/')}`
    } else {
      const t = ['f_auto', 'q_auto']
      if (opts.width) t.push(`c_scale,w_${opts.width}`)
      result = `${parts[0]}/image/upload/${t.join(',')}/${parts[1]}`
    }
  }
  return result
}

/**
 * Build an optimised Cloudinary delivery URL for a media item.
 * Prioritises Cloudinary dynamic transformation (`f_auto,q_auto`) to ensure full
 * cross-device compatibility (Android, Windows, iOS, Mac, Linux).
 */
export function mediaUrl(
  item: MediaItem | undefined,
  cloudName: string,
  opts: CloudinaryUrlOptions = {},
): string | undefined {
  if (!item) return undefined

  // Determine effective cloudName: from argument, or extracted from URL if available
  let effectiveCloudName = cloudName || ''
  if (!effectiveCloudName && item.url && item.url.includes('res.cloudinary.com/')) {
    const match = item.url.match(/res\.cloudinary\.com\/([^/]+)/)
    if (match) effectiveCloudName = match[1]
  }

  // If item.publicId is actually a full URL
  if (item.publicId && (item.publicId.startsWith('http://') || item.publicId.startsWith('https://'))) {
    return optimizeCloudinaryUrl(item.publicId, opts)
  }

  // When Cloudinary is available, always use its dynamic pipeline so format conversion
  // (HEIC -> WebP/JPEG for Android & PC) works reliably.
  if (item.publicId && effectiveCloudName) {
    const base = `https://res.cloudinary.com/${effectiveCloudName}`
    const transforms = ['q_auto', 'f_auto']
    if (opts.width && opts.height) {
      transforms.push(`w_${opts.width}`, `h_${opts.height}`, 'c_fill')
    } else if (opts.width) {
      transforms.push('c_scale', `w_${opts.width}`)
    } else if (opts.height) {
      transforms.push('c_scale', `h_${opts.height}`)
    }
    const t = transforms.join(',')

    if (item.kind === 'image') {
      const cleanPid = cleanImagePublicId(item.publicId)
      const ext = item.format === 'svg' ? '.svg' : '.jpg'
      return `${base}/image/upload/${t}/${cleanPid}${ext}`
    }
    // Videos and audio use the "video" resource type in Cloudinary URLs.
    const ext = item.format && !['heic', 'heif'].includes(item.format.toLowerCase()) ? `.${item.format}` : ''
    return `${base}/video/upload/${t}/${item.publicId}${ext}`
  }

  if (item.url) {
    return optimizeCloudinaryUrl(item.url, opts)
  }

  return undefined
}

/** A lightweight poster frame for a Cloudinary video. */
export function videoPoster(item: MediaItem, cloudName: string): string | undefined {
  if (item.publicId && cloudName && item.kind === 'video') {
    return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_720,q_auto,f_auto/${item.publicId}.jpg`
  }
  if (item.url) return optimizeCloudinaryUrl(item.url)
  return undefined
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
  if (item.publicId && cloudName) {
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

    const ext = item.format && !['heic', 'heif'].includes(item.format.toLowerCase()) ? `.${item.format}` : ''
    return `${base}/video/upload/${transforms.join(',')}/${item.publicId}${ext}`
  }

  if (item.url) return optimizeCloudinaryUrl(item.url)
  return undefined
}

/**
 * A URL that forces the browser to download the original file (Cloudinary's
 * fl_attachment flag sets Content-Disposition: attachment). Falls back to the
 * item's direct URL for local uploads.
 */
export function attachmentUrl(item: MediaItem, cloudName: string): string | undefined {
  if (item.publicId && cloudName) {
    const base = `https://res.cloudinary.com/${cloudName}`
    if (item.kind === 'image') {
      const cleanPid = cleanImagePublicId(item.publicId)
      return `${base}/image/upload/fl_attachment/${cleanPid}`
    }
    const ext = item.format ? `.${item.format}` : ''
    return `${base}/video/upload/fl_attachment/${item.publicId}${ext}`
  }
  if (item.url) return item.url
  return undefined
}
