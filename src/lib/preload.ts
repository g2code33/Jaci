import type { BirthdayConfig } from '@/types/config'
import { mediaUrl, videoBackgroundUrl } from '@/lib/cloudinary'

export interface PreloadPlan {
  images: string[]
  videos: string[]
}

/**
 * Gather every photo and video the experience uses — story, memories, cards,
 * the final surprise and each stage background — so they can be downloaded
 * ahead of time. Only referenced media is included (not the whole library).
 */
export function buildPreloadPlan(config: BirthdayConfig, cloudName: string): PreloadPlan {
  const images: string[] = []
  const videos: string[] = []

  const addItem = (item: unknown) => {
    const m = item as { kind?: string; hidden?: boolean } | null | undefined
    if (!m || m.hidden) return
    if (m.kind === 'image') {
      const u = mediaUrl(m as never, cloudName, { width: 1600 })
      if (u) images.push(u)
    } else if (m.kind === 'video') {
      const u = mediaUrl(m as never, cloudName, { width: 1600 })
      if (u) videos.push(u)
    }
  }

  for (const e of config.story.entries) {
    if (e.hidden) continue
    for (const m of e.media || []) addItem(m)
  }
  for (const m of config.memories.items) addItem(m)
  for (const c of config.things.cards) {
    if (c.hidden) continue
    for (const m of c.media || []) addItem(m)
  }
  if (config.finalSurprise.media) addItem(config.finalSurprise.media)

  // Stage backgrounds
  const bgs = config.backgrounds || ({} as Partial<Record<string, any>>)
  for (const key of Object.keys(bgs)) {
    const bg = (bgs as Record<string, any>)[key]
    if (!bg) continue
    if (bg.type === 'image' && bg.image) {
      const u = mediaUrl(bg.image, cloudName, { width: 1600 })
      if (u) images.push(u)
    } else if (bg.type === 'video' && bg.video) {
      const u = videoBackgroundUrl(bg.video, cloudName, bg)
      if (u) videos.push(u)
    }
  }

  return { images: [...new Set(images)], videos: [...new Set(videos)] }
}
