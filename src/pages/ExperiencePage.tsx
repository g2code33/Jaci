import { useEffect, useState } from 'react'
import { Experience } from '@/components/Experience'
import { GlowingHeart } from '@/components/GlowingHeart'
import { api } from '@/lib/api'
import { DEFAULT_CONFIG } from '@/lib/defaults'
import type { BirthdayConfig } from '@/types/config'
import type { ExperienceMeta } from '@/context/ExperienceContext'

function LoadingScreen() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-night-900">
      <GlowingHeart color="#ff4f9a" size={40} glow={0.7} />
    </div>
  )
}

export default function ExperiencePage() {
  const [state, setState] = useState<{ config: BirthdayConfig; meta: ExperienceMeta } | null>(null)

  useEffect(() => {
    let mounted = true
    api
      .getConfig()
      .then((res) => {
        if (mounted) setState({ config: res.config, meta: res.meta })
      })
      .catch(() => {
        if (mounted) {
          setState({
            config: structuredClone(DEFAULT_CONFIG),
            meta: { cloudName: '', publishedAt: null },
          })
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  if (!state) return <LoadingScreen />

  return <Experience config={state.config} meta={state.meta} />
}
