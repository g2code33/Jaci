import { ensureAudio, isSoundMuted } from '@/lib/sound'

/**
 * Play a tiny, ultra-short low-frequency "thock" — a synthetic tactile click.
 * On iPhone (which has no vibration API) this, together with the press-down
 * animation, is the closest a website can get to a felt tap.
 */
function tick(depth: number): void {
  if (isSoundMuted()) return
  const ac = ensureAudio()
  if (!ac) return
  try {
    const t0 = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, t0)
    osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.05)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(depth, t0 + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + 0.07)
  } catch {
    // ignore
  }
}

/** A short tap "feel": real vibration on Android, synthetic tick elsewhere. */
export function hapticTap(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12)
      return
    }
  } catch {
    // fall through to synthetic tick
  }
  tick(0.2)
}

/** A stronger double "feel" for the big moments (arrow release, unlock…). */
export function hapticPulse(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([28, 40, 28])
      return
    }
  } catch {
    // fall through to synthetic double-thock
  }
  tick(0.3)
  window.setTimeout(() => tick(0.3), 90)
}
