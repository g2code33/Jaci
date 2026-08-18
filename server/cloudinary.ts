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
