// Tiny WebAudio synthesiser — no audio files required. All sounds are
// generated on the fly so the experience works fully offline. Sounds are
// always user-gesture-gated (AudioContext is resumed on pointer input).

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false

export function setSoundMuted(value: boolean): void {
  muted = value
}

export function isSoundMuted(): boolean {
  return muted
}

/** Call from a user gesture to (re)start the audio context. */
export function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.5
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }
    return ctx
  } catch {
    return null
  }
}

// Automatically unlock AudioContext on first user gesture on mobile browsers (Firefox Android, Chrome, Safari)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    ensureAudio()
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('pointerdown', unlockAudio, true)
      window.removeEventListener('touchstart', unlockAudio, true)
      window.removeEventListener('touchend', unlockAudio, true)
      window.removeEventListener('click', unlockAudio, true)
    }
  }
  window.addEventListener('pointerdown', unlockAudio, { capture: true, passive: true })
  window.addEventListener('touchstart', unlockAudio, { capture: true, passive: true })
  window.addEventListener('touchend', unlockAudio, { capture: true, passive: true })
  window.addEventListener('click', unlockAudio, { capture: true, passive: true })
}

function now(ac: AudioContext): number {
  return ac.currentTime
}

/** A soft "whoosh" for releasing the arrow. */
export function playWhoosh(): void {
  if (muted) return
  const ac = ensureAudio()
  if (!ac || !master) return
  const t0 = now(ac)
  const bufferSize = Math.floor(ac.sampleRate * 0.28)
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.4
  filter.frequency.setValueAtTime(320, t0)
  filter.frequency.exponentialRampToValueAtTime(2400, t0 + 0.2)
  filter.frequency.exponentialRampToValueAtTime(500, t0 + 0.28)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.55, t0 + 0.06)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28)
  src.connect(filter).connect(gain).connect(master)
  src.start(t0)
  src.stop(t0 + 0.3)
}

/** Soft impact "thump" when the arrow strikes the heart. */
export function playImpact(): void {
  if (muted) return
  const ac = ensureAudio()
  if (!ac || !master) return
  const t0 = now(ac)

  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(170, t0)
  osc.frequency.exponentialRampToValueAtTime(55, t0 + 0.32)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.6, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4)
  osc.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + 0.42)

  // shimmer
  const shimmer = ac.createOscillator()
  shimmer.type = 'sine'
  shimmer.frequency.setValueAtTime(1180, t0 + 0.02)
  shimmer.frequency.exponentialRampToValueAtTime(1760, t0 + 0.12)
  const sg = ac.createGain()
  sg.gain.setValueAtTime(0.0001, t0 + 0.02)
  sg.gain.exponentialRampToValueAtTime(0.18, t0 + 0.05)
  sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35)
  shimmer.connect(sg).connect(master)
  shimmer.start(t0 + 0.02)
  shimmer.stop(t0 + 0.4)
}

/** A soft mechanical click (lock). */
export function playClick(): void {
  if (muted) return
  const ac = ensureAudio()
  if (!ac || !master) return
  const t0 = now(ac)
  const osc = ac.createOscillator()
  osc.type = 'square'
  osc.frequency.setValueAtTime(700, t0)
  osc.frequency.exponentialRampToValueAtTime(260, t0 + 0.06)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08)
  osc.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + 0.09)
}

/** A gentle chime for a successful unlock. */
export function playChime(): void {
  if (muted) return
  const ac = ensureAudio()
  if (!ac || !master) return
  const out = master
  const t0 = now(ac)
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => {
    const start = t0 + i * 0.12
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(0.2, start + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.7)
    osc.connect(g).connect(out)
    osc.start(start)
    osc.stop(start + 0.75)
  })
}
