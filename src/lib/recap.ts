import type { BirthdayConfig } from '@/types/config'
import { revealDateParts } from '@/lib/utils'

/** Strip HTML down to plain text (for the share summary + recap). */
function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n\n')
    .replace(/<\s*li\s*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * A condensed, share-friendly summary of Jacinta's whole journey — from the
 * opening through to the closing — so she can keep (and re-share) it.
 */
export function buildShareText(config: BirthdayConfig): string {
  const parts: string[] = []
  parts.push(`💌 ${config.name} — a little something made for you`)
  parts.push(config.entrance.greeting)
  parts.push(config.entrance.title)

  const storyLines = config.story.entries
    .filter((e) => !e.hidden)
    .map((e) => (e.date ? `${e.date} — ${e.title}` : e.title))
  if (storyLines.length) parts.push('✨ Our story: ' + storyLines.join(' · '))

  const memories = config.memories.items
    .filter((m) => !m.hidden && (m.caption || m.description))
    .map((m) => m.caption || m.description)
  if (memories.length) parts.push('🖼️ Memories: ' + memories.join(' · '))

  const things = config.things.cards.filter((c) => !c.hidden).map((c) => c.message)
  if (things.length) parts.push('💞 Things I don\u2019t say enough: ' + things.join(' · '))

  if (config.heartMoment.message) parts.push('❤️ ' + config.heartMoment.message)

  const date = revealDateParts(config.birthday)
  parts.push(`🎂 ${config.birthdayReveal.happyText}, ${config.name}! ${date.day} ${date.month} ${date.year}`)
  if (config.birthdayReveal.showAge && config.birthdayReveal.age) {
    parts.push(`${config.birthdayReveal.age} ${config.birthdayReveal.ageCaption || 'years'}`)
  }

  const letterText = htmlToText(config.letter.body || '')
  if (letterText) parts.push('✉️ ' + letterText.split('\n\n')[0])

  if (config.finalSurprise.title) parts.push('🎁 ' + config.finalSurprise.title)
  if (config.finalSurprise.message) parts.push(config.finalSurprise.message)

  parts.push(config.closing.message)
  if (config.senderName && config.senderName !== '[your name]') parts.push(`${config.closing.withLove} ${config.senderName}`)

  return parts.join('\n\n')
}

/** Escape text for safe insertion into generated HTML. */
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
}

/**
 * A beautiful, standalone HTML keepsake of the entire experience that can be
 * downloaded from the final page.
 */
export function buildRecapHtml(config: BirthdayConfig): string {
  const story = config.story.entries
    .filter((e) => !e.hidden)
    .map(
      (e) => `
        <section class="entry">
          ${e.date ? `<div class="date">${esc(e.date)}</div>` : ''}
          <h3>${esc(e.title)}</h3>
          ${e.location ? `<div class="loc">📍 ${esc(e.location)}</div>` : ''}
          ${e.description ? `<p>${esc(e.description)}</p>` : ''}
        </section>`,
    )
    .join('')

  const things = config.things.cards
    .filter((c) => !c.hidden)
    .map((c) => `<li>${esc(c.message)}</li>`)
    .join('')

  const memories = config.memories.items
    .filter((m) => !m.hidden && (m.caption || m.description))
    .map((m) => `<li>${esc(m.caption || m.description || '')}</li>`)
    .join('')

  const letter = config.letter.body || ''

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(config.name)} ❤️</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #08080c; color: #f5eff4; font-family: Georgia, 'Times New Roman', serif; line-height: 1.7; }
  .wrap { max-width: 680px; margin: 0 auto; padding: 48px 24px 80px; }
  .eyebrow { letter-spacing: 0.3em; text-transform: uppercase; font-size: 11px; color: #b98a4e; }
  h1 { font-size: 44px; font-weight: 400; margin: 8px 0 0; }
  h2 { font-size: 26px; font-weight: 400; color: #ffd6e8; margin: 48px 0 8px; }
  .sub { color: #9aa; font-style: italic; }
  .date { letter-spacing: 0.25em; text-transform: uppercase; font-size: 11px; color: #ff7ab8; margin-bottom: 2px; }
  .loc { color: #8a8a9a; font-size: 13px; }
  .entry { padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .entry h3 { margin: 4px 0; font-size: 20px; font-weight: 400; }
  .entry p { margin: 6px 0 0; color: #cfc8d4; }
  .letter { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px 24px; }
  .letter p { margin: 0 0 16px; }
  .letter p:last-child { margin-bottom: 0; }
  ul { padding-left: 20px; }
  li { margin: 8px 0; color: #cfc8d4; }
  .heart { text-align: center; font-size: 40px; margin-top: 48px; }
  .sign { margin-top: 48px; font-size: 20px; font-style: italic; color: #ffd6e8; }
  .sign b { color: #ff7ab8; font-weight: 400; }
  .foot { margin-top: 16px; letter-spacing: 0.25em; text-transform: uppercase; font-size: 11px; color: #6a6a7a; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="eyebrow">A little something, made for you</div>
    <h1>${esc(config.name)}</h1>
    <div class="sub">${esc(config.entrance.greeting)} ${esc(config.entrance.title)}</div>

    <h2>Our Story</h2>
    ${story || '<p class="sub">—</p>'}

    <h2>Memories</h2>
    ${memories ? `<ul>${memories}</ul>` : '<p class="sub">—</p>'}

    <h2>Things I Don\u2019t Say Enough</h2>
    ${things ? `<ul>${things}</ul>` : '<p class="sub">—</p>'}

    <h2>${esc(config.birthdayReveal.happyText)}</h2>
    <p class="sub">${esc(config.birthday)}${config.birthdayReveal.showAge && config.birthdayReveal.age ? ' · ' + esc(config.birthdayReveal.age) + ' ' + esc(config.birthdayReveal.ageCaption || '') : ''}</p>

    <h2>${esc(config.letter.title)}</h2>
    <div class="letter">${letter}</div>

    ${config.finalSurprise.title ? `<h2>${esc(config.finalSurprise.title)}</h2><p>${esc(config.finalSurprise.message || '')}</p>` : ''}

    <div class="sign">${esc(config.closing.message)}<br/><b>${esc(config.closing.withLove)} ${esc(config.senderName)}</b></div>
    <div class="foot">${esc(config.closing.dateLabel)}</div>

    <div class="heart">❤</div>
  </div>
</body>
</html>`
}
