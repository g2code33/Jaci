import { useEffect, useMemo, useState } from 'react'
import type { StageBackground } from '@/types/config'
import { mediaUrl, videoBackgroundUrl, videoPoster } from '@/lib/cloudinary'
import { WaterDrops } from '@/components/WaterDrops'

interface StageBackdropProps {
  bg?: StageBackground
  cloudName: string
}

/**
 * The background for a single stage: a solid colour, a gradient, a photo or a
 * video (autoplay / muted / looped).
 *
 * - Photos: effects applied with CSS (static → cheap).
 * - Videos: effects applied server-side by Cloudinary, so playback is smooth
 *   (no per-frame CSS filtering). A poster frame sits underneath and the video
 *   fades in once it can play, eliminating the black flash. If the video fails,
 *   it falls back to the stage colour.
 */
export function StageBackdrop({ bg, cloudName }: StageBackdropProps) {
  const [videoReady, setVideoReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  const imageUrl = useMemo(() => {
    if (bg?.type === 'image' && bg.image) return mediaUrl(bg.image, cloudName, { width: 1600 })
    return undefined
  }, [bg, cloudName])

  const videoUrl = useMemo(() => {
    if (bg?.type === 'video' && bg.video) return videoBackgroundUrl(bg.video, cloudName, bg)
    return undefined
  }, [bg, cloudName])

  const poster = useMemo(() => {
    if (bg?.type === 'video' && bg.video) return videoPoster(bg.video, cloudName)
    return undefined
  }, [bg, cloudName])

  // Reset playback state whenever the video source changes.
  useEffect(() => {
    setVideoReady(false)
    setVideoFailed(false)
  }, [videoUrl])

  const imageFilter = [
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

  // image
  if (bg.type === 'image') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
            style={{
              filter: imageFilter,
              opacity: bg.opacity ?? 1,
              transform: `scale(${bg.scale ?? 1})`,
            }}
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: bg.color || '#08080c' }} />
        )}

        {((bg.tintOpacity ?? 0) > 0) && (
          <div className="absolute inset-0" style={{ backgroundColor: bg.tint || '#ff4f9a', opacity: bg.tintOpacity ?? 0 }} />
        )}
        {((bg.dim ?? 0) > 0) && (
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${bg.dim})` }} />
        )}
        {bg.waterDrop && <WaterDrops strength={bg.waterDropStrength} className="absolute inset-0" />}
      </div>
    )
  }

  // video
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Poster underlay — shown until the video is actually playing (no black flash). */}
      {poster && !videoReady && !videoFailed && (
        <img
          src={poster}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: bg.opacity ?? 1, transform: `scale(${bg.scale ?? 1})` }}
        />
      )}

      {videoUrl && !videoFailed ? (
        <video
          key={videoUrl}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
          style={{
            // Fade in over the poster; keep the admin opacity on top.
            opacity: videoReady ? (bg.opacity ?? 1) : 0,
            transform: `scale(${bg.scale ?? 1})`,
          }}
        />
      ) : (
        <div className="h-full w-full" style={{ backgroundColor: bg.color || '#08080c' }} />
      )}

      {((bg.tintOpacity ?? 0) > 0) && (
        <div className="absolute inset-0" style={{ backgroundColor: bg.tint || '#ff4f9a', opacity: bg.tintOpacity ?? 0 }} />
      )}
      {((bg.dim ?? 0) > 0) && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${bg.dim})` }} />
      )}
      {bg.waterDrop && <WaterDrops strength={bg.waterDropStrength} className="absolute inset-0" />}
    </div>
  )
}
