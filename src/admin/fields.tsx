import { useState } from 'react'
import { useAdmin } from '@/admin/AdminContext'
import { getIn, moveIn, removeAt } from '@/lib/path'
import { cn } from '@/lib/utils'

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-rose/50 focus:bg-white/[0.07]'
const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45'
const hintCls = 'mt-1 block text-[11px] leading-snug text-white/35'

function useField(path: string) {
  const { draft, update } = useAdmin()
  const value = getIn(draft, path)
  return { value, set: (v: unknown) => update(path, v) }
}

export function Field({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      {label && <span className={labelCls}>{label}</span>}
      {children}
      {hint && <span className={hintCls}>{hint}</span>}
    </label>
  )
}

export function TextField({
  path,
  label,
  hint,
  placeholder,
}: {
  path: string
  label?: string
  hint?: string
  placeholder?: string
}) {
  const { value, set } = useField(path)
  return (
    <Field label={label} hint={hint}>
      <input className={inputCls} value={String(value ?? '')} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
    </Field>
  )
}

export function TextArea({
  path,
  label,
  hint,
  rows = 3,
  placeholder,
}: {
  path: string
  label?: string
  hint?: string
  rows?: number
  placeholder?: string
}) {
  const { value, set } = useField(path)
  return (
    <Field label={label} hint={hint}>
      <textarea className={cn(inputCls, 'resize-y leading-relaxed')} rows={rows} value={String(value ?? '')} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
    </Field>
  )
}

export function NumberField({
  path,
  label,
  hint,
  min,
  max,
  step,
}: {
  path: string
  label?: string
  hint?: string
  min?: number
  max?: number
  step?: number
}) {
  const { value, set } = useField(path)
  return (
    <Field label={label} hint={hint}>
      <input
        className={inputCls}
        type="number"
        value={Number(value ?? 0)}
        min={min}
        max={max}
        step={step}
        onChange={(e) => set(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    </Field>
  )
}

export function ColorField({ path, label, hint }: { path: string; label?: string; hint?: string }) {
  const { value, set } = useField(path)
  const hex = String(value || '#ff4f9a')
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#ff4f9a'}
          onChange={(e) => set(e.target.value)}
          className="h-9 w-11 cursor-pointer rounded-lg border border-white/10 bg-transparent"
        />
        <input className={inputCls} value={hex} onChange={(e) => set(e.target.value)} />
      </div>
    </Field>
  )
}

export function Toggle({ path, label, hint }: { path: string; label?: string; hint?: string }) {
  const { value, set } = useField(path)
  const on = Boolean(value)
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {label && <span className="block text-sm font-medium text-white/80">{label}</span>}
        {hint && <span className="block text-[11px] text-white/35">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set(!on)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
          on ? 'bg-rose' : 'bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300',
            on ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

export function SelectField({
  path,
  label,
  hint,
  options,
}: {
  path: string
  label?: string
  hint?: string
  options: Array<{ value: string; label: string }>
}) {
  const { value, set } = useField(path)
  return (
    <Field label={label} hint={hint}>
      <select className={cn(inputCls, 'appearance-none')} value={String(value ?? '')} onChange={(e) => set(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-night-800">
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function RangeField({
  path,
  label,
  hint,
  min = 0,
  max = 1,
  step = 0.05,
}: {
  path: string
  label?: string
  hint?: string
  min?: number
  max?: number
  step?: number
}) {
  const { value, set } = useField(path)
  const v = Number(value ?? 0)
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          className="w-full accent-rose"
          min={min}
          max={max}
          step={step}
          value={v}
          onChange={(e) => set(Number(e.target.value))}
        />
        <span className="w-12 shrink-0 text-right font-mono text-xs text-white/60">{v.toFixed(2)}</span>
      </div>
    </Field>
  )
}

/** Editable list of strings (messages, responses, lines…). */
export function StringList({ path, label, hint }: { path: string; label?: string; hint?: string }) {
  const { draft, update } = useAdmin()
  const list = (getIn(draft, path) as unknown[]) || []
  const [draftText, setDraftText] = useState('')

  const add = () => {
    if (!draftText.trim()) return
    update(path, [...list, draftText.trim()])
    setDraftText('')
  }

  return (
    <div>
      {label && <span className={labelCls}>{label}</span>}
      <div className="flex flex-col gap-2">
        {list.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={inputCls}
              value={String(item ?? '')}
              onChange={(e) => {
                const next = [...list]
                next[i] = e.target.value
                update(path, next)
              }}
            />
            <button type="button" className="h-8 w-8 shrink-0 rounded-lg bg-white/5 text-white/50 transition hover:bg-white/10" onClick={() => update(path, moveIn(draft, path, i, i - 1))} disabled={i === 0} aria-label="Move up">↑</button>
            <button type="button" className="h-8 w-8 shrink-0 rounded-lg bg-white/5 text-white/50 transition hover:bg-white/10" onClick={() => update(path, moveIn(draft, path, i, i + 1))} disabled={i === list.length - 1} aria-label="Move down">↓</button>
            <button type="button" className="h-8 w-8 shrink-0 rounded-lg bg-rose/20 text-rose-soft transition hover:bg-rose/30" onClick={() => update(path, removeAt(draft, path, i))} aria-label="Remove">✕</button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className={inputCls}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Add a line…"
        />
        <button type="button" className="btn-solid shrink-0 !px-4 !py-2 text-xs" onClick={add}>
          Add
        </button>
      </div>
      {hint && <span className={hintCls}>{hint}</span>}
    </div>
  )
}
