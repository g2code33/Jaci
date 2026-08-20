import type { BirthdayConfig } from '@/types/config'

let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let chunks: BlobPart[] = []
let mime = ''
let ext = 'webm'
let hasAudio = false
let recording = false

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function canScreenRecord(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'
  )
}

function pickMime(): void {
  const candidates: Array<[string, string]> = [
    ['video/mp4', 'mp4'],
    ['video/mp4;codecs=avc1', 'mp4'],
    ['video/webm;codecs=vp9', 'webm'],
    ['video/webm', 'webm'],
  ]
  for (const [m, e] of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) {
        mime = m
        ext = e
        return
      }
    } catch {
      // keep looking
    }
  }
}

export async function startScreenRecording(): Promise<{ ok: boolean; audio: boolean; error?: string }> {
  if (recording) return { ok: true, audio: hasAudio }
  if (!canScreenRecord()) return { ok: false, audio: false, error: 'unsupported' }

  chunks = []
  pickMime()

  let s: MediaStream | null = null
  let audio = false

  try {
    s = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30 } } as unknown as MediaTrackConstraints,
      audio: true,
    } as MediaStreamConstraints)
    audio = s.getAudioTracks().length > 0
  } catch {
    try {
      s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false } as MediaStreamConstraints)
      audio = false
    } catch (err) {
      const name = err instanceof Error ? err.name : 'denied'
      return { ok: false, audio: false, error: name }
    }
  }

  stream = s
  hasAudio = audio

  s.getVideoTracks().forEach((t) => {
    t.addEventListener('ended', () => {
      void stopScreenRecording()
      window.dispatchEvent(new CustomEvent('jaci-recording-ended'))
    })
  })

  try {
    const opts: MediaRecorderOptions = { videoBitsPerSecond: 5_000_000 }
    if (mime) opts.mimeType = mime
    recorder = new MediaRecorder(s, opts)
  } catch {
    recorder = new MediaRecorder(s)
  }
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data)
  }
  recorder.start()
  recording = true
  return { ok: true, audio }
}

export function isScreenRecording(): boolean {
  return recording
}

export function stopScreenRecording(): Promise<{ blob: Blob; ext: string; audio: boolean } | null> {
  if (!recording || !recorder) return Promise.resolve(null)
  return new Promise((resolve) => {
    const r = recorder!
    r.onstop = () => {
      const blob = new Blob(chunks, { type: r.mimeType || 'video/webm' })
      const result = chunks.length ? { blob, ext, audio: hasAudio } : null
      stream?.getTracks().forEach((t) => t.stop())
      recorder = null
      stream = null
      recording = false
      chunks = []
      resolve(result)
    }
    try {
      r.stop()
    } catch {
      stream?.getTracks().forEach((t) => t.stop())
      recorder = null
      stream = null
      recording = false
      chunks = []
      resolve(null)
    }
  })
}

export function screenFileName(config: BirthdayConfig, fileExt: string): string {
  const safe = (config.name || 'birthday').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  return `${safe}-journey.${fileExt}`
}
