// Immutable path helpers for the admin config editor.

export type Path = string

export function getIn(obj: unknown, path: Path): unknown {
  if (!path) return obj
  let cur: any = obj
  for (const key of path.split('.')) {
    if (cur == null) return undefined
    cur = cur[key]
  }
  return cur
}

export function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (!path) return value as T
  const keys = path.split('.')
  const root: any = Array.isArray(obj) ? [...obj] : { ...(obj as any) }
  let cur = root
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const next = keys[i + 1]
    const isArrayIndex = /^\d+$/.test(next)
    const child = cur[key]
    if (Array.isArray(child)) {
      cur[key] = [...child]
    } else if (child && typeof child === 'object') {
      cur[key] = { ...child }
    } else {
      cur[key] = isArrayIndex ? [] : {}
    }
    cur = cur[key]
  }
  cur[keys[keys.length - 1]] = value
  return root as T
}

/** Move an item within an array at `path` from `from` to `to`. */
export function moveIn<T>(obj: T, path: Path, from: number, to: number): T {
  const arr = getIn(obj, path) as unknown[]
  if (!Array.isArray(arr)) return obj
  const next = [...arr]
  const [item] = next.splice(from, 1)
  if (item === undefined) return obj
  next.splice(to, 0, item)
  return setIn(obj, path, next)
}

export function removeAt<T>(obj: T, path: Path, index: number): T {
  const arr = getIn(obj, path) as unknown[]
  if (!Array.isArray(arr)) return obj
  const next = arr.filter((_, i) => i !== index)
  return setIn(obj, path, next)
}

export function insertAt<T>(obj: T, path: Path, index: number, item: unknown): T {
  const arr = (getIn(obj, path) as unknown[]) || []
  const next = [...arr]
  next.splice(index, 0, item)
  return setIn(obj, path, next)
}
