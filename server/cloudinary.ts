// Signed Cloudinary upload support. The API secret never leaves the server:
// the browser receives only a one-shot signature + timestamp and uploads
// directly to Cloudinary.
//
// Signature algorithm (per Cloudinary docs):
//   signature = sha1( "key=value&key=value..." + api_secret )
// where the key=value pairs are all upload parameters EXCEPT `file`,
// `api_key`, `resource_type`, `cloud_name` and `signature`, sorted
// alphabetically.

import { sha1Hex } from './crypto'

export interface CloudinarySettings {
  cloudName: string
  apiKey: string
  apiSecret: string
  folder: string
}

export interface SignedUpload {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  signature: string
  publicId?: string
}

export async function buildSignedUpload(
  settings: CloudinarySettings,
  opts: { folder?: string; publicId?: string } = {},
): Promise<SignedUpload> {
  const timestamp = Math.floor(Date.now() / 1000)
  const params: Record<string, string> = {
    timestamp: String(timestamp),
    folder: opts.folder || settings.folder,
  }
  if (opts.publicId) params.public_id = opts.publicId

  const sorted = Object.keys(params).sort()
  const paramString = sorted.map((k) => `${k}=${params[k]}`).join('&')
  const signature = await sha1Hex(paramString + settings.apiSecret)

  return {
    cloudName: settings.cloudName,
    apiKey: settings.apiKey,
    timestamp,
    folder: params.folder,
    signature,
    publicId: opts.publicId,
  }
}

export interface CloudinaryResource {
  public_id: string
  resource_type: 'image' | 'video' | 'raw'
  format?: string
  width?: number
  height?: number
  folder?: string
  secure_url?: string
}

/**
 * List resources already in Cloudinary (Admin API). Uses basic auth with the
 * API key + secret, server-side only — the secret never reaches the browser.
 */
export async function listCloudinaryResources(
  settings: CloudinarySettings,
  opts: { prefix?: string; resourceType?: 'image' | 'video' | 'raw'; maxResults?: number } = {},
): Promise<CloudinaryResource[]> {
  const resourceType = opts.resourceType || 'image'
  const maxResults = opts.maxResults || 500
  const params = new URLSearchParams({
    type: 'upload',
    max_results: String(maxResults),
  })
  if (opts.prefix) params.set('prefix', opts.prefix)

  const url = `https://api.cloudinary.com/v1_1/${settings.cloudName}/resources/${resourceType}?${params.toString()}`
  const auth = btoa(`${settings.apiKey}:${settings.apiSecret}`)
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new Error(err?.error?.message || `Cloudinary list failed (${res.status})`)
  }
  const data = (await res.json()) as { resources?: CloudinaryResource[] }
  return data.resources || []
}
