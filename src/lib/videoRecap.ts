import type { BirthdayConfig } from '@/types/config'
import { mediaUrl } from '@/lib/cloudinary'
import { revealDateParts } from '@/lib/utils'

const W = 720
const H = 1280

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return `rgba(255,122,184,${alpha})`
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
}

function pickMime(): { mime: string; ext: string } {
  const candidates: Array<[string, string]> = [
    ['video/mp4', 'mp4'],
    ['video/mp4;codecs=avc1', 'mp4'],
    ['video/webm;codecs=vp9', 'webm'],
    ['video/webm', 'webm'],
  ]
  for (const [mime, ext] of candidates) {
    try {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        return { mime, ext }
      }
    } catch {
      // continue
    }
  }
  return { mime: '', ext: 'webm' }
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, s * 0.3)
  ctx.bezierCurveTo(0, 0, -s * 0.5, -s * 0.25, -s * 0.5, s * 0.05)
  ctx.bezierCurveTo(-s * 0.5, s * 0.35, 0, s * 0.5, 0, s * 0.7)
  ctx.bezierCurveTo(0, s * 0.5, s * 0.5, s * 0.35, s * 0.5, s * 0.05)
  ctx.bezierCurveTo(s * 0.5, -s * 0.25, 0, 0, 0, s * 0.3)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function fade(t: number): number {
  return Math.max(0, Math.min(1, Math.min(t * 3, (1 - t) * 3, 1)))
}

interface Scene {
  dur: number
  draw: (ctx: CanvasRenderingContext2D, t: number) => void
}

/**
 * Renders a cinematic, animated recap of the entire experience to a canvas and
 * records it to a real video file (mp4/webm) via MediaRecorder. Everything is
 * generated in the browser — no upload, no server.
 */
export async function recordRecapVideo(
  config: BirthdayConfig,
  cloudName: string,
  onProgress?: (p: number) => void,
  musicEl?: HTMLAudioElement | null,
): Promise<{ blob: Blob; ext: string }> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no_canvas')

  const accent = config.appearance.accentColor || '#ff4f9a'
  const date = revealDateParts(config.birthday)

  const storyEntries = config.story.entries.filter((e) => !e.hidden).slice(0, 6)
  const storyImgs = await Promise.all(
    storyEntries.map((e) => {
      const m = (e.media || []).find((x) => !x.hidden)
      return m ? loadImage(mediaUrl(m, cloudName, { width: 720 }) || '') : Promise.resolve(null)
    }),
  )
  const memItems = config.memories.items.filter((m) => !m.hidden).slice(0, 6)
  const memImgs = await Promise.all(
    memItems.map((m) => loadImage(mediaUrl(m, cloudName, { width: 720 }) || '')),
  )
  const thingCards = config.things.cards.filter((c) => !c.hidden).slice(0, 5)

  const particles = Array.from({ length: 34 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 1 + Math.random() * 2.5,
    a: 0.08 + Math.random() * 0.3,
    vy: -0.05 - Math.random() * 0.15,
  }))

  const scenes: Scene[] = []

  scenes.push({
    dur: 4200,
    draw: (c, t) => {
      const a = fade(t)
      c.textAlign = 'center'
      c.font = 'italic 300 76px Georgia, serif'
      c.fillStyle = hexToRgba('#ffffff', a)
      c.fillText(config.name, W / 2, H * 0.42)
      c.font = 'italic 300 44px Georgia, serif'
      c.fillStyle = hexToRgba('#ffd6e8', a * 0.85)
      c.fillText(config.entrance.greeting, W / 2, H * 0.5)
      const pulse = 1 + Math.sin(t * Math.PI * 2) * 0.08
      drawHeart(c, W / 2, H * 0.66, 90 * pulse * a, accent)
    },
  })

  storyEntries.forEach((entry, i) => {
    scenes.push({
      dur: 4200,
      draw: (c, t) => {
        const a = fade(t)
        const img = storyImgs[i]
        if (img) {
          const iw = W
          const ih = img.height * (W / img.width)
          const iy = H * 0.16 - ih * 0.15
          c.globalAlpha = a * 0.9
          c.drawImage(img, 0, iy, iw, ih)
          c.globalAlpha = 1
          const grad = c.createLinearGradient(0, H * 0.15, 0, H * 0.7)
          grad.addColorStop(0, 'rgba(8,8,12,0.15)')
          grad.addColorStop(1, 'rgba(8,8,12,0.92)')
          c.fillStyle = grad
          c.fillRect(0, 0, W, H)
        }
        c.textAlign = 'center'
        if (entry.date) {
          c.font = '500 26px Georgia, serif'
          c.fillStyle = hexToRgba(accent, a)
          c.fillText(entry.date, W / 2, H * 0.62)
        }
        c.font = '600 56px Georgia, serif'
        c.fillStyle = hexToRgba('#ffffff', a)
        c.fillText(entry.title, W / 2, H * 0.72)
        if (entry.description) {
          c.font = '300 30px Georgia, serif'
          c.fillStyle = hexToRgba('#cfc8d4', a * 0.95)
          const lines = wrapText(c, entry.description, W - 140)
          lines.slice(0, 3).forEach((ln, j) => c.fillText(ln, W / 2, H * 0.8 + j * 40))
        }
      },
    })
  })

  memItems.forEach((m, i) => {
    scenes.push({
      dur: 3200,
      draw: (c, t) => {
        const a = fade(t)
        const img = memImgs[i]
        if (img) {
          const iw = W
          const ih = img.height * (W / img.width)
          const iy = (H - ih) / 2
          c.globalAlpha = a
          c.drawImage(img, 0, iy, iw, ih)
          c.globalAlpha = 1
        }
        if (m.caption || m.description) {
          const grad = c.createLinearGradient(0, H * 0.55, 0, H)
          grad.addColorStop(0, 'rgba(8,8,12,0)')
          grad.addColorStop(1, 'rgba(8,8,12,0.9)')
          c.fillStyle = grad
          c.fillRect(0, H * 0.55, W, H * 0.45)
          c.textAlign = 'center'
          c.font = 'italic 300 40px Georgia, serif'
          c.fillStyle = hexToRgba('#ffffff', a)
          c.fillText(m.caption || m.description || '', W / 2, H * 0.86)
        }
      },
    })
  })

  thingCards.forEach((card) => {
    scenes.push({
      dur: 3200,
      draw: (c, t) => {
        const a = fade(t)
        c.fillStyle = hexToRgba('#ffffff', a * 0.04)
        const cx = W / 2
        const cw = W - 160
        const ch = 360
        const cy = H / 2 - ch / 2
        c.beginPath()
        c.roundRect(cx - cw / 2, cy, cw, ch, 32)
        c.fill()
        c.textAlign = 'center'
        if (card.title) {
          c.font = 'italic 300 30px Georgia, serif'
          c.fillStyle = hexToRgba(accent, a)
          c.fillText(card.title, cx, cy + 80)
        }
        c.font = '300 46px Georgia, serif'
        c.fillStyle = hexToRgba('#ffffff', a)
        const lines = wrapText(c, card.message, cw - 90)
        lines.slice(0, 4).forEach((ln, j) => c.fillText(ln, cx, cy + 140 + j * 56))
      },
    })
  })

  scenes.push({
    dur: 5200,
    draw: (c, t) => {
      const a = fade(t)
      c.textAlign = 'center'
      c.font = '700 200px Georgia, serif'
      c.fillStyle = hexToRgba(accent, a)
      c.fillText(date.day, W / 2, H * 0.34)
      c.font = '400 34px Georgia, serif'
      c.fillStyle = hexToRgba('#ffffff', a * 0.9)
      c.fillText(date.month, W / 2, H * 0.42)
      c.fillText(date.year, W / 2, H * 0.47)
      c.font = 'italic 300 56px Georgia, serif'
      c.fillStyle = hexToRgba('#ffffff', a)
      c.fillText(config.name, W / 2, H * 0.6)
      if (config.birthdayReveal.showAge && config.birthdayReveal.age) {
        c.font = 'italic 300 44px Georgia, serif'
        c.fillStyle = hexToRgba('#ff7ab8', a)
        c.fillText(`${config.birthdayReveal.age} ${config.birthdayReveal.ageCaption || ''}`, W / 2, H * 0.7)
      }
      for (let i = 0; i < 40; i++) {
        const px = (i * 97) % W
        const py = ((i * 53 + Math.floor(t * 60)) * 7) % H
        c.fillStyle = hexToRgba(i % 3 === 0 ? '#ffd6e8' : i % 3 === 1 ? '#e8d5b5' : accent, a * 0.5)
        c.beginPath()
        c.arc(px, py, 3, 0, Math.PI * 2)
        c.fill()
      }
    },
  })

  scenes.push({
    dur: 6200,
    draw: (c, t) => {
      const a = fade(t)
      c.fillStyle = hexToRgba('#ffffff', a * 0.04)
      const cw = W - 120
      const ch = H - 260
      c.beginPath()
      c.roundRect(60, 130, cw, ch, 32)
      c.fill()
      c.textAlign = 'center'
      c.font = 'italic 300 52px Georgia, serif'
      c.fillStyle = hexToRgba('#ffd6e8', a)
      c.fillText(config.letter.title, W / 2, 220)
      c.textAlign = 'left'
      c.font = '300 32px Georgia, serif'
      c.fillStyle = hexToRgba('#f5eff4', a * 0.95)
      const text = config.letter.body
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
      const lines = wrapText(c, text, cw - 120)
      lines.slice(0, 9).forEach((ln, j) => c.fillText(ln, 120, 300 + j * 46))
    },
  })

  scenes.push({
    dur: 5200,
    draw: (c, t) => {
      const a = fade(t)
      c.textAlign = 'center'
      c.font = '300 64px Georgia, serif'
      c.fillStyle = hexToRgba('#ffffff', a)
      const lines = wrapText(c, config.closing.message, W - 140)
      lines.slice(0, 2).forEach((ln, j) => c.fillText(ln, W / 2, H * 0.44 + j * 76))
      c.font = 'italic 300 40px Georgia, serif'
      c.fillStyle = hexToRgba('#ffffff', a * 0.8)
      c.fillText(config.closing.withLove, W / 2, H * 0.62)
      c.font = 'italic 300 52px Georgia, serif'
      c.fillStyle = hexToRgba('#ff7ab8', a)
      c.fillText(config.senderName, W / 2, H * 0.7)
      const pulse = 1 + Math.sin(t * Math.PI * 2) * 0.08
      drawHeart(c, W / 2, H * 0.82, 70 * pulse * a, accent)
      c.font = '400 26px Georgia, serif'
      c.fillStyle = hexToRgba('#ffffff', a * 0.5)
      c.fillText(config.closing.dateLabel, W / 2, H * 0.92)
    },
  })

  const total = scenes.reduce((s, sc) => s + sc.dur, 0)
  const { mime, ext } = pickMime()

  if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
    throw new Error('recorder_unsupported')
  }

  const stream = canvas.captureStream(24)

  let audioCtx: AudioContext | null = null
  let mediaSrc: MediaElementAudioSourceNode | null = null
  if (musicEl && musicEl.src && !musicEl.paused) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new AC()
      mediaSrc = audioCtx.createMediaElementSource(musicEl)
      const dest = audioCtx.createMediaStreamDestination()
      mediaSrc.connect(dest)
      mediaSrc.connect(audioCtx.destination)
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t))
      await audioCtx.resume()
    } catch {
      mediaSrc = null
    }
  }

  const options: MediaRecorderOptions = { videoBitsPerSecond: 3_000_000 }
  if (mime) options.mimeType = mime
  const rec = new MediaRecorder(stream, options)
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data)
  }

  const result = new Promise<{ blob: Blob; ext: string }>((resolve, reject) => {
    rec.onstop = () => {
      try {
        mediaSrc?.disconnect()
        void audioCtx?.close()
      } catch {
        // ignore
      }
      resolve({ blob: new Blob(chunks, { type: mime || 'video/webm' }), ext })
    }
    rec.onerror = () => reject(new Error('recorder_error'))

    const start = performance.now()
    rec.start()

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / total, 1)

      let acc = 0
      let scene = scenes[0]
      let local = 0
      for (const s of scenes) {
        if (elapsed < acc + s.dur) {
          scene = s
          local = (elapsed - acc) / s.dur
          break
        }
        acc += s.dur
      }
      local = Math.min(Math.max(local, 0), 1)

      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#0a0a0f')
      g.addColorStop(1, '#151020')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)

      for (const p of particles) {
        let y = (p.y + t * p.vy * total * 0.06) % H
        if (y < 0) y += H
        ctx.globalAlpha = p.a
        ctx.fillStyle = '#ffb6d5'
        ctx.beginPath()
        ctx.arc(p.x, y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      scene.draw(ctx, local)

      onProgress?.(t)

      if (t >= 1) {
        rec.stop()
      } else {
        requestAnimationFrame(tick)
      }
    }
    requestAnimationFrame(tick)
  })

  return result
}

/** Turn a recorded blob into a shareable File with a nice filename. */
export function recapFileName(config: BirthdayConfig, ext: string): string {
  const safe = (config.name || 'birthday').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  return `${safe}-birthday-video.${ext}`
}
