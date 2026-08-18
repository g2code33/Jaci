import type { BirthdayConfig, MediaItem, StoreMeta } from '@/types/config'

export class ApiError extends Error {
  status: number
  data: unknown
  constructor(status: number, data: unknown) {
    super(`Request failed with status ${status}`)
    this.status = status
    this.data = data
  }
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { credentials: 'include', ...init })
  } catch {
    throw new ApiError(0, { error: 'network' })
  }
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) throw new ApiError(res.status, data)
  return data as T
}

function post<T>(url: string, body: unknown): Promise<T> {
  return http<T>(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function put<T>(url: string, body: unknown): Promise<T> {
  return http<T>(url, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export interface PublicConfigResponse {
  config: BirthdayConfig
  meta: { cloudName: string; publishedAt: string | null }
}

export interface AnswerResponse {
  correct: boolean
  message?: string
  attemptsRemaining?: number
  lockedOut?: boolean
  error?: string
}

export interface AdminConfigResponse {
  draft: BirthdayConfig
  published: BirthdayConfig
  meta: StoreMeta
  cloudinary: { enabled: boolean; cloudName: string; folder: string }
  localUpload: boolean
}

export const api = {
  // public
  getConfig: () => http<PublicConfigResponse>('/api/config'),
  submitAnswer: (answer: string, sessionId: string) =>
    post<AnswerResponse>('/api/answer', { answer, sessionId }),

  // admin auth
  login: (password: string) => post<{ ok: boolean }>('/api/admin/login', { password }),
  logout: () => post<{ ok: boolean }>('/api/admin/logout', {}),
  me: () => http<{ authed: boolean }>('/api/admin/me'),

  // admin config
  getAdminConfig: () => http<AdminConfigResponse>('/api/admin/config'),
  saveDraft: (config: BirthdayConfig) =>
    put<{ ok: boolean; draft: BirthdayConfig }>('/api/admin/config/draft', config),
  publish: () => post<{ ok: boolean; published: BirthdayConfig; meta: StoreMeta }>('/api/admin/config/publish', {}),
  revert: () => post<{ ok: boolean; draft: BirthdayConfig }>('/api/admin/config/revert', {}),
  reset: () => post<{ ok: boolean; draft: BirthdayConfig }>('/api/admin/config/reset', {}),

  // media
  cloudinarySignature: (folder: string) =>
    post<{
      enabled: boolean
      cloudName?: string
      apiKey?: string
      timestamp?: number
      folder?: string
      signature?: string
      publicId?: string
    }>('/api/admin/cloudinary/signature', { folder }),
  localUpload: (payload: { name: string; type: string; dataUrl: string }) =>
    post<{ ok: boolean; item?: MediaItem; error?: string }>('/api/admin/media/local', payload),
  localList: () => http<{ ok: boolean; items: Array<{ id: string; url: string }> }>('/api/admin/media/local'),
  localDelete: (id: string) => http<{ ok: boolean }>(`/api/admin/media/local/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
