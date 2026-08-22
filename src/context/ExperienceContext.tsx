import { createContext, useContext } from 'react'
import type { BirthdayConfig } from '@/types/config'

export interface ExperienceMeta {
  cloudName: string
  publishedAt: string | null
}

interface ExperienceContextValue {
  config: BirthdayConfig
  meta: ExperienceMeta
  /** True when rendered from the admin "Preview as Jacinta" mode. */
  preview: boolean
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null)

export function ExperienceProvider({
  config,
  meta,
  preview = false,
  children,
}: Omit<ExperienceContextValue, 'preview'> & { preview?: boolean; children: React.ReactNode }) {
  return (
    <ExperienceContext.Provider value={{ config, meta, preview }}>
      {children}
    </ExperienceContext.Provider>
  )
}

export function useExperience(): ExperienceContextValue {
  const ctx = useContext(ExperienceContext)
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceProvider>')
  return ctx
}
