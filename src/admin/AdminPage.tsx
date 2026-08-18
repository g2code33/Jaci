import { useCallback, useEffect, useState } from 'react'
import { AdminProvider, type AdminContextValue } from '@/admin/AdminContext'
import { Dashboard } from '@/admin/Dashboard'
import { Login } from '@/admin/Login'
import { api, type AdminConfigResponse } from '@/lib/api'
import { setIn } from '@/lib/path'
import type { BirthdayConfig, StoreMeta } from '@/types/config'

function Loading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-night-900">
      <p className="font-display text-lg italic text-white/40">Loading…</p>
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [data, setData] = useState<AdminConfigResponse | null>(null)
  const [draft, setDraft] = useState<BirthdayConfig | null>(null)
  const [published, setPublished] = useState<BirthdayConfig | null>(null)
  const [meta, setMeta] = useState<StoreMeta | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const load = useCallback(async () => {
    const res = await api.getAdminConfig()
    setData(res)
    setDraft(res.draft)
    setPublished(res.published)
    setMeta(res.meta)
  }, [])

  useEffect(() => {
    let mounted = true
    api
      .me()
      .then(async ({ authed: isAuthed }) => {
        if (!mounted) return
        if (isAuthed) {
          try {
            await load()
            if (mounted) setAuthed(true)
          } catch {
            if (mounted) setAuthed(false)
          }
        } else {
          setAuthed(false)
        }
      })
      .catch(() => {
        if (mounted) setAuthed(false)
      })
    return () => {
      mounted = false
    }
  }, [load])

  const update = useCallback((path: string, value: unknown) => {
    setDraft((prev) => (prev ? (setIn(prev, path, value) as BirthdayConfig) : prev))
    setDirty(true)
  }, [])

  const saveDraft = useCallback(async () => {
    if (!draft) return
    setSaving(true)
    try {
      const res = await api.saveDraft(draft)
      setDraft(res.draft)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }, [draft])

  const publish = useCallback(async () => {
    setPublishing(true)
    try {
      const res = await api.publish()
      setPublished(res.published)
      setMeta(res.meta)
      setDirty(false)
    } finally {
      setPublishing(false)
    }
  }, [])

  const revert = useCallback(async () => {
    const res = await api.revert()
    setDraft(res.draft)
    setDirty(false)
  }, [])

  const reset = useCallback(async () => {
    const res = await api.reset()
    setDraft(res.draft)
    setPublished(res.draft)
    setDirty(false)
  }, [])

  if (authed === null) return <Loading />

  if (!authed) {
    return (
      <Login
        onSuccess={async () => {
          await load()
          setAuthed(true)
        }}
      />
    )
  }

  if (!draft || !published || !meta || !data) return <Loading />

  const value: AdminContextValue = {
    draft,
    published,
    meta,
    dirty,
    saving,
    publishing,
    cloudinary: data.cloudinary,
    localUpload: data.localUpload,
    update,
    saveDraft,
    publish,
    revert,
    reset,
  }

  return (
    <AdminProvider value={value}>
      <Dashboard
        onLogout={async () => {
          try {
            await api.logout()
          } finally {
            setAuthed(false)
          }
        }}
      />
    </AdminProvider>
  )
}
