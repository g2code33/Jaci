import { useState } from 'react'
import { Stage } from '@/components/Stage'
import { WishArrow } from '@/components/WishArrow'
import { GlowingHeart } from '@/components/GlowingHeart'
import { useExperience } from '@/context/ExperienceContext'
import { isSoundMuted, setSoundMuted } from '@/lib/sound'

interface Props {
  onDone: () => void
}

export function ArrowSection({ onDone }: Props) {
  const { config } = useExperience()
  const a = config.arrow
  const [muted, setMuted] = useState(isSoundMuted())

  // Graceful fallback if the interaction is disabled.
  if (!a.enabled) {
    return (
      <Stage>
        <GlowingHeart color={a.heartColor} size={64} glow={a.glow} />
        {a.instruction && (
          <p className="mt-8 font-display text-xl italic text-white/80">{a.instruction}</p>
        )}
        <button type="button" className="btn-outline mt-10" onClick={onDone}>
          Continue ❤️
        </button>
      </Stage>
    )
  }

  return (
    <Stage full style={{ touchAction: 'none' }}>
      <WishArrow
        arrowColor={a.arrowColor}
        heartColor={a.heartColor}
        glow={a.glow}
        trailIntensity={a.trailIntensity}
        flightDuration={a.flightDuration}
        pierceDuration={a.pierceDuration}
        minPull={a.minPullDistance}
        maxPull={a.maxPullDistance}
        soundEffects={a.soundEffects}
        impactEffect={a.impactEffect}
        instruction={a.instruction}
        impactMessage={a.impactMessage || undefined}
        onImpact={onDone}
      />
      {a.soundEffects && (
        <button
          type="button"
          onClick={() => {
            const next = !muted
            setMuted(next)
            setSoundMuted(next)
          }}
          aria-label={muted ? 'Enable sound effects' : 'Disable sound effects'}
          className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-base text-white/60 transition hover:bg-white/10"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
    </Stage>
  )
}
