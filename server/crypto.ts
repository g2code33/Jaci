// WebCrypto helpers. Deliberately free of Node-only imports so this
// module works identically in Node, Cloudflare Workers and Vercel.

const encoder = new TextEncoder()

export function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function sha1Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', encoder.encode(message))
  return bufToHex(new Uint8Array(digest))
}

export async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return bufToHex(new Uint8Array(sig))
}

export function randomHex(bytes = 16): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return bufToHex(arr)
}

/** Constant-time comparison of two equal-length hex strings. */
export function safeEqualHex(a: string, b: string): boolean {
  const ab = encoder.encode(a)
  const bb = encoder.encode(b)
  let diff = ab.length ^ bb.length
  const len = Math.max(ab.length, bb.length)
  for (let i = 0; i < len; i++) {
    diff |= (i < ab.length ? ab[i] : 0) ^ (i < bb.length ? bb[i] : 0)
  }
  return diff === 0
}

export function b64urlEncode(str: string): string {
  const b64 = btoa(str)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function b64urlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return atob(b64)
}
