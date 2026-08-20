let active: HTMLAudioElement | null = null

export function setActiveMusic(el: HTMLAudioElement | null): void {
  active = el
}

export function getActiveMusic(): HTMLAudioElement | null {
  return active
}
