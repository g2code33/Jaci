// ─────────────────────────────────────────────────────────────
// Centralised content / data model for the whole experience.
// Every piece of copy and behaviour in the public site is driven
// by `BirthdayConfig`. Nothing user-facing is hard-coded in the
// React components — it all reads from this configuration, which
// the admin dashboard edits (draft → publish).
// ─────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'audio'

export interface MediaItem {
  id: string
  kind: MediaType
  /** Cloudinary public id (folder + filename without extension). */
  publicId?: string
  /** Direct URL (local uploads, or any external asset). */
  url?: string
  caption?: string
  alt?: string
  date?: string
  description?: string
  folder?: string
  /** File format/extension (e.g. "mp4", "jpg") — used for Cloudinary video/audio URLs. */
  format?: string
  width?: number
  height?: number
  hidden?: boolean
}

export interface StoryEntry {
  id: string
  date?: string
  title: string
  description?: string
  location?: string
  caption?: string
  media?: MediaItem[]
  hidden?: boolean
}

export interface MessageCard {
  id: string
  title?: string
  message: string
  media?: MediaItem[]
  hidden?: boolean
}

export interface EntranceConfig {
  /** Opening name line, e.g. "Jacinta…" */
  greeting: string
  /** e.g. "I made something for you." */
  title: string
  /** The additional lines that appear one after another. */
  messages: string[]
  /** e.g. "Please don't rush through it." */
  closingLine: string
  heartColor: string
  /** 0..1 — density of ambient particles. */
  particleIntensity: number
  /** 0..1 — overall animation strength. */
  animationIntensity: number
  /** ms each line stays visible. */
  lineDuration: number
  /** ms of cross-fade between lines. */
  transitionDuration: number
  background: string
}

export interface HeartIntroConfig {
  beforeText: string
  promptText: string
}

export interface ArrowConfig {
  enabled: boolean
  instruction: string
  arrowColor: string
  heartColor: string
  /** 0..1 */
  glow: number
  /** 0..1 */
  trailIntensity: number
  /** Minimum pull distance (svg units) required to fire. */
  minPullDistance: number
  /** Maximum pull distance (svg units). */
  maxPullDistance: number
  impactEffect: 'heartBurst' | 'shockwave' | 'both'
  soundEffects: boolean
  impactMessage: string
}

export interface SecretLockConfig {
  title: string
  question: string
  answer: string
  placeholder: string
  buttonText: string
  wrongMessage: string
  correctMessage: string
  /** Shown after the lock opens. */
  unlockedMessage: string
  /** Second intro line, e.g. "But there's one more thing." */
  teaserLine: string
  /** 0 = unlimited. */
  maxAttempts: number
  caseSensitive: boolean
  trimWhitespace: boolean
  lockAnimation: 'mechanical' | 'glow' | 'both'
  unlockSound: boolean
}

export interface ReadyConfig {
  readyText: string
  readyButton: string
  sureText: string
  sureButton: string
  waitButton: string
  waitResponses: string[]
  introLines: string[]
  introButton: string
}

export interface StoryConfig {
  title: string
  subtitle: string
  entries: StoryEntry[]
}

export interface MemoriesConfig {
  title: string
  subtitle: string
  items: MediaItem[]
}

export interface ThingsConfig {
  title: string
  subtitle: string
  cards: MessageCard[]
}

export interface HeartMomentConfig {
  intro: string
  message: string
  buttonText: string
}

export interface BirthdayRevealConfig {
  preLines: string[]
  happyText: string
  subText: string
  /** 0..1 */
  intensity: number
  confetti: boolean
  fireworks: boolean
  accentColor: string
  background: string
}

export interface LetterConfig {
  title: string
  /** Sanitised rich text (HTML). */
  body: string
}

export interface FinalSurpriseConfig {
  teaseLines: string[]
  title: string
  message: string
  buttonText: string
  media?: MediaItem
  instructions?: string
  dateTime?: string
  location?: string
}

export interface ClosingConfig {
  message: string
  dateLabel: string
  withLove: string
}

export interface MusicConfig {
  enabled: boolean
  url?: string
  title?: string
  autoplay: boolean
  loop: boolean
}

export interface CountdownConfig {
  enabled: boolean
  message: string
}

export interface EasterEggsConfig {
  enabled: boolean
  messages: string[]
}

export interface AppearanceConfig {
  backgroundColor: string
  accentColor: string
  textColor: string
  fontHeading: string
  fontBody: string
  /** 0..1 */
  animationIntensity: number
}

export interface MediaConfig {
  /** Cloudinary cloud name used to build delivery URLs. */
  cloudName: string
  /** The master media library — the source the admin picks from. */
  library: MediaItem[]
}

export interface BirthdayConfig {
  name: string
  senderName: string
  /** ISO date, e.g. "2026-08-22". */
  birthday: string
  entrance: EntranceConfig
  heartIntro: HeartIntroConfig
  arrow: ArrowConfig
  secretLock: SecretLockConfig
  ready: ReadyConfig
  story: StoryConfig
  memories: MemoriesConfig
  things: ThingsConfig
  heartMoment: HeartMomentConfig
  birthdayReveal: BirthdayRevealConfig
  letter: LetterConfig
  finalSurprise: FinalSurpriseConfig
  closing: ClosingConfig
  music: MusicConfig
  countdown: CountdownConfig
  easterEggs: EasterEggsConfig
  appearance: AppearanceConfig
  media: MediaConfig
}

export interface StoreMeta {
  version: number
  updatedAt?: string
  publishedAt?: string
}

export interface Store {
  draft: BirthdayConfig
  published: BirthdayConfig
  meta: StoreMeta
}
