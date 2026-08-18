// Minimal client-side HTML sanitisation for admin-authored rich text.
// The letter is the only place rich HTML is rendered. This is defence in
// depth — the server also strips dangerous markup on save.

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'A', 'UL', 'OL', 'LI',
  'H2', 'H3', 'H4', 'BLOCKQUOTE', 'DIV', 'SPAN', 'HR',
])

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walk = (node: Element) => {
    const children = Array.from(node.children)
    for (const child of children) {
      if (child.nodeType === 1) {
        const el = child as HTMLElement
        const tag = el.tagName
        if (!ALLOWED_TAGS.has(tag)) {
          el.replaceWith(...Array.from(el.childNodes))
          continue
        }
        // Strip event handlers + javascript: URLs
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase()
          const value = attr.value || ''
          if (name.startsWith('on')) {
            el.removeAttribute(attr.name)
          } else if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(value)) {
            el.removeAttribute(attr.name)
          }
        }
        if (tag === 'A') el.setAttribute('rel', 'noopener noreferrer')
        walk(el)
      }
    }
  }
  walk(doc.body)
  return doc.body.innerHTML
}
