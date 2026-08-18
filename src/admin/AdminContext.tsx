import { createContext, useContext } from 'react'
import type { BirthdayConfig, StoreMeta } from '@/types/config'

export interface AdminCloudinary {
  enabled: boolean
  cloudName: string
  folder: string
}

export interface AdminContextValue {
  draft: BirthdayConfig
  published: BirthdayConfig
  meta: StoreMeta
  dirty: boolean
  saving: boolean
  publishing: boolean
  cloudinary: AdminCloudinary
  localUpload: boolean
  update: (path: string, value: unknown) => void
  saveDraft: () => Promise<void>
  publish: () => Promise<void>
  revert: () => Promise<void>
  reset: () => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ value, children }: { value: AdminContextValue; children: React.ReactNode }) {
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>')
  return ctx
}
