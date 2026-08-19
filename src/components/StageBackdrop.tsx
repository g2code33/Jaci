import { useMemo } from 'react'
import type { StageBackground } from '@/types/config'
import { mediaUrl, videoPoster } from '@/lib/cloudinary'
import { WaterDrops } from '@/components/WaterDrops'

interface StageBackdropProps {
  bg?: StageBackground
  cloudName: string
}

/**
 * The background for a single stage: a solid colour, a gradient, a photo or a
 * video (autoplay / muted / looped) with full editing (gaussian blur,
 * brightness, contrast, saturation, grayscale, sepia, hue, zoom, tint, dim)
 * plus an optional water-drop effect.
 */
export function StageBackdrop({ bg, cloudName }: StageBackdropProps) {
  const imageUrl = useMemo(() => {
    if (bg?.type === 'image' && bg.image) return mediaUrl(bg.image, cloudName, { width: 1600 })
    return undefined
  }, [bg, cloudName])

  const videoUrl = useMemo(() => {
    if (bg?.type === 'video' && bg.video) return mediaUrl(bg.video, cloudName, { width: 1600 })
    return undefined
  }, [bg, cloudName])

  const poster = useMemo(() => {
    if (bg?.type === 'video' && bg.video) return videoPoster(bg.video, cloudName)
    return undefined
  }, [bg, cloudName])

  const filter = [
    `blur(${bg?.blur ?? 0}px)`,
    `brightness(${(bg?.brightness ?? 100) / 100})`,
    `contrast(${(bg?.contrast ?? 100) / 100})`,
    `saturate(${(bg?.saturate ?? 100) / 100})`,
    `grayscale(${(bg?.grayscale ?? 0) / 100})`,
    `sepia(${(bg?.sepia ?? 0) / 100})`,
    `hue-rotate(${bg?.hue ?? 0}deg)`,
  ].join(' ')

  // colour
  if (!bg || bg.type === 'color') {
    return (
      <div className="absolute inset-0" style={{ backgroundColor: bg?.color || '#08080c' }}>
        {bg?.waterDrop && <WaterDrops strength={bg.waterDropStrength} className="absolute inset-0" />}
      </div>
    )
  }

  // gradient
  if (bg.type === 'gradient') {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(160deg, ${bg.gradientFrom || '#0e0e15'}, ${bg.gradientTo || '#1a1a24'})`,
        }}
      >
        {bg.waterDrop && <WaterDrops strength={bg.waterDropStrength} className="absolute inset-0" />}
      </div>
    )
  }

  // image or video
  const isVideo = bg.type === 'video'
  return (
    <div className="absolute inset-0 overflow-hidden">
      {isVideo ? (
        videoUrl ? (
          <video
            src={videoUrl}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
            style={{
              filter,
              opacity: bg.opacity ?? 1,
              transform: `scale(${bg.scale ?? 1})`,
            }}
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: bg.color || '#08080c' }} />
        )
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          style={{
            filter,
            opacity: bg.opacity ?? 1,
            transform: `scale(${bg.scale ?? 1})`,
          }}
        />
      ) : (
        <div className="h-full w-full" style={{ backgroundColor: bg.color || '#08080c' }} />
      )}

      {/* colour tint wash */}
      {((bg.tintOpacity ?? 0) > 0) && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: bg.tint || '#ff4f9a', opacity: bg.tintOpacity ?? 0 }}
        />
      )}

      {/* dark overlay for readability */}
      {((bg.dim ?? 0) > 0) && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${bg.dim})` }} />
      )}

      {bg.waterDrop && <WaterDrops strength={bg.waterDropStrength} className="absolute inset-0" />}
    </div>
  )
}
