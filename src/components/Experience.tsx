import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ExperienceProvider, type ExperienceMeta } from '@/context/ExperienceContext'
import { AmbientParticles } from '@/components/AmbientParticles'
import { MusicPlayer } from '@/components/MusicPlayer'
import { clamp, isBirthdayNow } from '@/lib/utils'
import type { BirthdayConfig } from '@/types/config'
import { Countdown } from '@/sections/Countdown'
import { Entrance } from '@/sections/Entrance'
import { HeartIntro } from '@/sections/HeartIntro'
import { ArrowSection } from '@/sections/ArrowSection'
import { SecretLock } from '@/sections/SecretLock'
import { Ready } from '@/sections/Ready'
import { StoryIntro } from '@/sections/StoryIntro'
import { Story } from '@/sections/Story'
import { Memories } from '@/sections/Memories'
import { Things } from '@/sections/Things'
import { HeartMoment } from '@/sections/HeartMoment'
import { BirthdayReveal } from '@/sections/BirthdayReveal'
import { Letter } from '@/sections/Letter'
import { FinalSurprise } from '@/sections/FinalSurprise'
import { Closing } from '@/sections/Closing'

export type StageId =
  | 'countdown'
  | 'entrance'
  | 'heart'
  | 'arrow'
  | 'lock'
  | 'ready'
  | 'intro'
  | 'story'
  | 'memories'
  | 'things'
  | 'heartmoment'
  | 'reveal'
  | 'letter'
  | 'surprise'
  | 'closing'

export const STAGE_LABELS: Array<{ id: StageId; label: string }> = [
  { id: 'countdown', label: 'Countdown' },
  { id: 'entrance', label: 'Entrance' },
  { id: 'heart', label: 'Heart' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'lock', label: 'Secret Lock' },
  { id: 'ready', label: 'Ready' },
  { id: 'intro', label: 'Story Intro' },
  { id: 'story', label: 'Our Story' },
  { id: 'memories', label: 'Memories' },
  { id: 'things', label: "Things I Don't Say" },
  { id: 'heartmoment', label: 'Heart Moment' },
  { id: 'reveal', label: 'Birthday Reveal' },
  { id: 'letter', label: 'Letter' },
  { id: 'surprise', label: 'Final Surprise' },
  { id: 'closing', label: 'Closing' },
]

function buildStages(config: BirthdayConfig): StageId[] {
  const stages: StageId[] = []
  if (config.countdown.enabled && !isBirthdayNow(config.birthday)) stages.push('countdown')
  return stages.concat([
    'entrance',
    'heart',
    'arrow',
    'lock',
    'ready',
    'intro',
    'story',
    'memories',
    'things',
    'heartmoment',
    'reveal',
    'letter',
    'surprise',
    'closing',
  ])
}

export interface ExperienceProps {
  config: BirthdayConfig
  meta?: ExperienceMeta
  preview?: boolean
  initialStage?: number
  onStageChange?: (index: number, id: StageId) => void
}

export function Experience({
  config,
  meta = { cloudName: '', publishedAt: null },
  preview = false,
  initialStage,
  onStageChange,
}: ExperienceProps) {
  const stages = useMemo(() => buildStages(config), [config])
  const scrollRef = useRef<HTMLDivElement>(null)

  const [idx, setIdx] = useState<number>(() => {
    if (initialStage !== undefined) return clamp(initialStage, 0, stages.length - 1)
    if (preview) return 0
    try {
      const saved = Number(window.sessionStorage.getItem('jaci_stage'))
      const unlocked = window.sessionStorage.getItem('jaci_unlocked') === '1'
      if (Number.isFinite(saved)) {
        const lockIdx = stages.indexOf('lock')
        const clamped = clamp(saved, 0, stages.length - 1)
        if (unlocked) return clamped
        if (lockIdx >= 0) return Math.min(clamped, lockIdx)
        return clamped
      }
    } catch {
      // ignore
    }
    return 0
  })

  const stageId: StageId = stages[idx] ?? 'closing'

  const advance = useCallback(() => {
    setIdx((i) => {
      if (stages[i] === 'lock' && !preview) {
        try {
          window.sessionStorage.setItem('jaci_unlocked', '1')
        } catch {
          // ignore
        }
      }
      return Math.min(i + 1, stages.length - 1)
    })
  }, [stages, preview])

  useEffect(() => {
    if (preview) return
    try {
      window.sessionStorage.setItem('jaci_stage', String(idx))
    } catch {
      // ignore
    }
    scrollRef.current?.scrollTo({ top: 0 })
  }, [idx, preview])

  useEffect(() => {
    onStageChange?.(idx, stageId)
  }, [idx, stageId, onStageChange])

  const app = config.appearance
  const accent = app.accentColor || config.entrance.heartColor
  const rootStyle: React.CSSProperties = {
    background: app.backgroundColor || '#08080c',
    color: app.textColor || '#f5eff4',
  }
  ;(rootStyle as Record<string, string>)['--font-heading'] = app.fontHeading
  ;(rootStyle as Record<string, string>)['--font-body'] = app.fontBody

  const renderStage = () => {
    switch (stageId) {
      case 'countdown':
        return <Countdown key="countdown" onDone={advance} />
      case 'entrance':
        return <Entrance key="entrance" onDone={advance} />
      case 'heart':
        return <HeartIntro key="heart" onDone={advance} />
      case 'arrow':
        return <ArrowSection key="arrow" onDone={advance} />
      case 'lock':
        return <SecretLock key="lock" onDone={advance} />
      case 'ready':
        return <Ready key="ready" onDone={advance} />
      case 'intro':
        return <StoryIntro key="intro" onDone={advance} />
      case 'story':
        return <Story key="story" onDone={advance} />
      case 'memories':
        return <Memories key="memories" onDone={advance} />
      case 'things':
        return <Things key="things" onDone={advance} />
      case 'heartmoment':
        return <HeartMoment key="heartmoment" onDone={advance} />
      case 'reveal':
        return <BirthdayReveal key="reveal" onDone={advance} />
      case 'letter':
        return <Letter key="letter" onDone={advance} />
      case 'surprise':
        return <FinalSurprise key="surprise" onDone={advance} />
      case 'closing':
        return <Closing key="closing" />
    }
  }

  return (
    <ExperienceProvider config={config} meta={meta} preview={preview}>
      <div
        ref={scrollRef}
        className="no-scrollbar relative h-[100dvh] w-full overflow-y-auto overflow-x-hidden"
        style={rootStyle}
      >
        <AmbientParticles
          density={config.entrance.particleIntensity}
          color={accent}
          className="pointer-events-none fixed inset-0 z-0"
        />

        <div className="relative z-10">
          <AnimatePresence mode="wait">{renderStage()}</AnimatePresence>
        </div>

        <MusicPlayer />

        {preview && (
          <div className="glass fixed bottom-4 left-4 z-[70] flex max-w-[80vw] items-center gap-2 rounded-2xl p-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              aria-label="Previous stage"
            >
              ‹
            </button>
            <select
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              className="max-w-[42vw] rounded-lg border border-white/10 bg-night-800 px-2 py-1 text-xs text-white/90 outline-none"
              aria-label="Jump to stage"
            >
              {stages.map((sid, i) => (
                <option key={sid} value={i}>
                  {i + 1}. {STAGE_LABELS.find((s) => s.id === sid)?.label ?? sid}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20"
              onClick={() => setIdx((i) => Math.min(stages.length - 1, i + 1))}
              aria-label="Next stage"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </ExperienceProvider>
  )
}
