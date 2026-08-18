import { b64urlDecode, b64urlEncode, hmacSha256Hex, randomHex, safeEqualHex } from './crypto'

interface SessionPayload {
  exp: number
  role: 'admin'
  nonce: string
}

export async function createSessionToken(secret: string, ttlSeconds: number): Promise<string> {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    role: 'admin',
    nonce: randomHex(8),
  }
  const body = b64urlEncode(JSON.stringify(payload))
  const sig = await hmacSha256Hex(body, secret)
  return `${body}.${sig}`
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const idx = token.lastIndexOf('.')
  if (idx <= 0) return false
  const body = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  const expected = await hmacSha256Hex(body, secret)
  if (!safeEqualHex(sig, expected)) return false
  try {
    const payload = JSON.parse(b64urlDecode(body)) as SessionPayload
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
