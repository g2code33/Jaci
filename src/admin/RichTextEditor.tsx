import { useEffect, useRef, useState } from 'react'
import { useAdmin } from '@/admin/AdminContext'
import { getIn } from '@/lib/path'
import { sanitizeHtml } from '@/lib/sanitize'

interface RichTextEditorProps {
  path: string
  label?: string
  hint?: string
  minHeight?: number
}

const TOOLBAR: Array<{ cmd: string; label: string; icon: string }> = [
  { cmd: 'bold', label: 'Bold', icon: 'B' },
  { cmd: 'italic', label: 'Italic', icon: 'I' },
  { cmd: 'underline', label: 'Underline', icon: 'U' },
  { cmd: 'insertUnorderedList', label: 'Bullet list', icon: '•≡' },
  { cmd: 'insertOrderedList', label: 'Numbered list', icon: '1.' },
  { cmd: 'removeFormat', label: 'Clear formatting', icon: '⌫' },
]

export function RichTextEditor({ path, label, hint, minHeight = 320 }: RichTextEditorProps) {
  const { draft, update } = useAdmin()
  const value = getIn(draft, path)
  const ref = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef(String(value ?? ''))
  const [html, setHtml] = useState(String(value ?? ''))

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== lastEmitted.current) {
      ref.current.innerHTML = lastEmitted.current
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-sync only when the value changed externally (e.g. revert/reset).
  useEffect(() => {
    const external = String(value ?? '')
    if (external !== lastEmitted.current) {
      lastEmitted.current = external
      if (ref.current) ref.current.innerHTML = external
      setHtml(external)
    }
  }, [value])

  const emit = () => {
    const inner = ref.current?.innerHTML ?? ''
    const clean = sanitizeHtml(inner)
    lastEmitted.current = clean
    setHtml(clean)
    update(path, clean)
  }

  const exec = (cmd: string) => {
    document.execCommand(cmd)
    emit()
  }

  return (
    <div>
      {label && <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</span>}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap gap-1 border-b border-white/10 bg-white/[0.03] px-2 py-2">
          {TOOLBAR.map((t) => (
            <button
              key={t.cmd}
              type="button"
              title={t.label}
              aria-label={t.label}
              onMouseDown={(e) => {
                e.preventDefault()
                exec(t.cmd)
              }}
              className="h-8 min-w-8 rounded-lg px-2 font-body text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {t.icon}
            </button>
          ))}
        </div>
        <div
          ref={ref}
          contentEditable
          role="textbox"
          aria-multiline="true"
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          className="letter-body min-h-[320px] w-full px-4 py-4 text-[1.15rem] outline-none"
          style={{ minHeight }}
        />
      </div>
      <p className="mt-1 text-[11px] text-white/35">
        {hint || 'Write the letter here. Use the toolbar for bold, italic and lists.'} ({html.length} chars)
      </p>
    </div>
  )
}
