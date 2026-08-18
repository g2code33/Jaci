import { useState } from 'react'
import { useAdmin } from '@/admin/AdminContext'
import {
  ColorField,
  NumberField,
  RangeField,
  SelectField,
  StringList,
  TextArea,
  TextField,
  Toggle,
} from '@/admin/fields'
import { MediaField, MediaListField, MediaLibraryModal } from '@/admin/media'
import { RichTextEditor } from '@/admin/RichTextEditor'
import { getIn, moveIn, removeAt } from '@/lib/path'
import { mediaUrl } from '@/lib/cloudinary'
import { uid } from '@/lib/utils'
import type { MediaItem, MessageCard, StoryEntry } from '@/types/config'

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-light text-white/95">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">{children}</div>
}

function Card({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-body text-sm font-semibold text-white/80">{title}</h3>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function IconButton({ onClick, disabled, label, children }: { onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="h-7 w-7 rounded-lg bg-white/5 text-xs text-white/60 transition hover:bg-white/10 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Entrance
// ─────────────────────────────────────────────────────────────
export function EntranceEditor() {
  return (
    <Section title="Entrance" description="The cinematic opening — everything she sees first.">
      <Grid>
        <TextField path="entrance.greeting" label="Opening name" />
        <TextField path="entrance.title" label="Title" />
      </Grid>
      <StringList path="entrance.messages" label="Introduction lines" />
      <TextField path="entrance.closingLine" label="Closing line (optional)" />
      <Grid>
        <ColorField path="entrance.heartColor" label="Heart colour" />
        <ColorField path="entrance.background" label="Background" />
        <RangeField path="entrance.particleIntensity" label="Particle intensity" />
        <RangeField path="entrance.animationIntensity" label="Animation intensity" />
        <NumberField path="entrance.lineDuration" label="Line duration (ms)" min={500} max={10000} step={100} />
        <NumberField path="entrance.transitionDuration" label="Transition (ms)" min={100} max={4000} step={100} />
      </Grid>
      <Grid>
        <TextField path="heartIntro.beforeText" label="Heart intro — line 1" />
        <TextField path="heartIntro.promptText" label="Heart intro — line 2" />
      </Grid>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Arrow
// ─────────────────────────────────────────────────────────────
export function ArrowEditor() {
  return (
    <Section title="Arrow Interaction" description="The bow-and-arrow moment.">
      <Card title="Interaction">
        <Toggle path="arrow.enabled" label="Enabled" />
        <TextField path="arrow.instruction" label="Instruction" />
        <TextField path="arrow.impactMessage" label="Impact message (optional)" />
        <NumberField path="arrow.minPullDistance" label="Minimum pull distance" min={10} max={400} step={5} />
        <NumberField path="arrow.maxPullDistance" label="Maximum pull distance" min={20} max={600} step={5} />
        <SelectField
          path="arrow.impactEffect"
          label="Impact effect"
          options={[
            { value: 'heartBurst', label: 'Heart burst' },
            { value: 'shockwave', label: 'Shockwave' },
            { value: 'both', label: 'Both' },
          ]}
        />
        <Toggle path="arrow.soundEffects" label="Sound effects" />
      </Card>
      <Card title="Appearance">
        <ColorField path="arrow.arrowColor" label="Arrow colour" />
        <ColorField path="arrow.heartColor" label="Heart colour" />
        <RangeField path="arrow.glow" label="Glow" />
        <RangeField path="arrow.trailIntensity" label="Trail intensity" />
      </Card>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Secret lock
// ─────────────────────────────────────────────────────────────
export function SecretLockEditor() {
  return (
    <Section title="Secret Lock" description="The secret question Jacinta must answer. The answer is validated on the server — never in the browser.">
      <Grid>
        <TextField path="secretLock.title" label="Title" />
        <TextField path="secretLock.question" label="Question" />
        <TextField path="secretLock.answer" label="Correct answer (secret)" hint="Stored and checked server-side only." />
        <TextField path="secretLock.placeholder" label="Placeholder" />
        <TextField path="secretLock.buttonText" label="Button text" />
        <TextField path="secretLock.wrongMessage" label="Wrong-answer message" />
        <TextField path="secretLock.correctMessage" label="Correct-answer message" />
        <TextField path="secretLock.unlockedMessage" label="First line after unlocking" />
        <TextField path="secretLock.teaserLine" label="Second line after unlocking" />
      </Grid>
      <Grid>
        <NumberField path="secretLock.maxAttempts" label="Max attempts (0 = unlimited)" min={0} max={100} step={1} />
        <Toggle path="secretLock.caseSensitive" label="Case sensitive" />
        <Toggle path="secretLock.trimWhitespace" label="Trim whitespace" />
        <Toggle path="secretLock.unlockSound" label="Unlock sound" />
        <SelectField
          path="secretLock.lockAnimation"
          label="Lock animation"
          options={[
            { value: 'mechanical', label: 'Mechanical' },
            { value: 'glow', label: 'Glow' },
            { value: 'both', label: 'Both' },
          ]}
        />
      </Grid>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Ready sequence
// ─────────────────────────────────────────────────────────────
export function ReadyEditor() {
  return (
    <Section title="Ready Sequence" description="Are you ready… are you sure?">
      <Grid>
        <TextField path="ready.readyText" label="Ready text" />
        <TextField path="ready.readyButton" label="Ready button" />
        <TextField path="ready.sureText" label="Sure text" />
        <TextField path="ready.sureButton" label="Sure button" />
        <TextField path="ready.waitButton" label="Wait button" />
        <TextField path="ready.introButton" label="Intro button" />
      </Grid>
      <StringList path="ready.waitResponses" label="Wait responses" />
      <StringList path="ready.introLines" label="Story introduction lines" />
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Our story
// ─────────────────────────────────────────────────────────────
export function StoryEditor() {
  const { draft, update } = useAdmin()
  const entries = (getIn(draft, 'story.entries') as StoryEntry[]) || []

  const add = () => {
    const entry: StoryEntry = { id: uid(), title: 'New memory', description: '', hidden: false }
    update('story.entries', [...entries, entry])
  }

  return (
    <Section title="Our Story" description="The timeline of moments.">
      <Grid>
        <TextField path="story.title" label="Title" />
        <TextField path="story.subtitle" label="Subtitle" />
      </Grid>
      <div className="space-y-4">
        {entries.map((entry, i) => (
          <Card
            key={entry.id}
            title={entry.title || `Entry ${i + 1}`}
            actions={
              <div className="flex gap-1">
                <IconButton label="Move up" disabled={i === 0} onClick={() => update('story.entries', moveIn(draft, 'story.entries', i, i - 1))}>↑</IconButton>
                <IconButton label="Move down" disabled={i === entries.length - 1} onClick={() => update('story.entries', moveIn(draft, 'story.entries', i, i + 1))}>↓</IconButton>
                <IconButton label="Delete" onClick={() => update('story.entries', removeAt(draft, 'story.entries', i))}>✕</IconButton>
              </div>
            }
          >
            <Grid>
              <TextField path={`story.entries.${i}.title`} label="Title" />
              <TextField path={`story.entries.${i}.date`} label="Date (e.g. 'March 2024')" />
              <TextField path={`story.entries.${i}.location`} label="Location" />
              <TextField path={`story.entries.${i}.caption`} label="Caption" />
            </Grid>
            <TextArea path={`story.entries.${i}.description`} label="Description" rows={3} />
            <MediaListField path={`story.entries.${i}.media`} label="Photos / videos" />
            <Toggle path={`story.entries.${i}.hidden`} label="Hidden" />
          </Card>
        ))}
        <button type="button" className="btn-outline !py-2 text-xs" onClick={add}>
          + Add a moment
        </button>
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Memories (gallery)
// ─────────────────────────────────────────────────────────────
export function MemoriesEditor() {
  const { draft, update } = useAdmin()
  const items = (getIn(draft, 'memories.items') as MediaItem[]) || []
  const [open, setOpen] = useState(false)

  const addItem = (item: MediaItem) => {
    update('memories.items', [...items, item])
    setOpen(false)
  }

  return (
    <Section title="Memories" description="The gallery — photos and videos with captions.">
      <Grid>
        <TextField path="memories.title" label="Title" />
        <TextField path="memories.subtitle" label="Subtitle" />
      </Grid>
      <div className="space-y-3">
        {items.map((item, i) => (
          <Card
            key={item.id}
            title={item.caption || `Item ${i + 1}`}
            actions={
              <div className="flex gap-1">
                <IconButton label="Move up" disabled={i === 0} onClick={() => update('memories.items', moveIn(draft, 'memories.items', i, i - 1))}>↑</IconButton>
                <IconButton label="Move down" disabled={i === items.length - 1} onClick={() => update('memories.items', moveIn(draft, 'memories.items', i, i + 1))}>↓</IconButton>
                <IconButton label="Delete" onClick={() => update('memories.items', removeAt(draft, 'memories.items', i))}>✕</IconButton>
              </div>
            }
          >
            <MediaField
              label="Media"
              value={item}
              onChange={(next) => {
                const list = [...items]
                if (next) list[i] = next
                else list.splice(i, 1)
                update('memories.items', list)
              }}
            />
            <Grid>
              <TextField path={`memories.items.${i}.caption`} label="Caption" />
              <TextField path={`memories.items.${i}.date`} label="Date" />
            </Grid>
            <TextArea path={`memories.items.${i}.description`} label="Description" rows={2} />
            <Toggle path={`memories.items.${i}.hidden`} label="Hidden" />
          </Card>
        ))}
        <button type="button" className="btn-outline !py-2 text-xs" onClick={() => setOpen(true)}>
          + Add from library
        </button>
      </div>
      {open && <MediaLibraryModal onClose={() => setOpen(false)} onPick={addItem} title="Add to gallery" />}
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Things I don't say enough
// ─────────────────────────────────────────────────────────────
export function ThingsEditor() {
  const { draft, update } = useAdmin()
  const cards = (getIn(draft, 'things.cards') as MessageCard[]) || []

  const add = () => {
    const card: MessageCard = { id: uid(), message: '', hidden: false }
    update('things.cards', [...cards, card])
  }

  return (
    <Section title="Things I Don't Say Enough" description="Emotional cards.">
      <Grid>
        <TextField path="things.title" label="Title" />
        <TextField path="things.subtitle" label="Subtitle" />
      </Grid>
      <div className="space-y-4">
        {cards.map((card, i) => (
          <Card
            key={card.id}
            title={card.message || `Card ${i + 1}`}
            actions={
              <div className="flex gap-1">
                <IconButton label="Move up" disabled={i === 0} onClick={() => update('things.cards', moveIn(draft, 'things.cards', i, i - 1))}>↑</IconButton>
                <IconButton label="Move down" disabled={i === cards.length - 1} onClick={() => update('things.cards', moveIn(draft, 'things.cards', i, i + 1))}>↓</IconButton>
                <IconButton label="Delete" onClick={() => update('things.cards', removeAt(draft, 'things.cards', i))}>✕</IconButton>
              </div>
            }
          >
            <TextField path={`things.cards.${i}.title`} label="Title (optional)" />
            <TextArea path={`things.cards.${i}.message`} label="Message" rows={2} />
            <MediaListField path={`things.cards.${i}.media`} label="Image / video" />
            <Toggle path={`things.cards.${i}.hidden`} label="Hidden" />
          </Card>
        ))}
        <button type="button" className="btn-outline !py-2 text-xs" onClick={add}>
          + Add a card
        </button>
      </div>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Heart moment
// ─────────────────────────────────────────────────────────────
export function HeartEditor() {
  return (
    <Section title="Heart Moment" description="The second heart — a personal message.">
      <Grid>
        <TextField path="heartMoment.intro" label="Intro text" />
        <TextField path="heartMoment.buttonText" label="Continue button" />
      </Grid>
      <TextArea path="heartMoment.message" label="Message revealed when she taps the heart" rows={3} />
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Birthday reveal
// ─────────────────────────────────────────────────────────────
export function BirthdayRevealEditor() {
  return (
    <Section title="Birthday Reveal" description="The big moment.">
      <StringList path="birthdayReveal.preLines" label="Reveal intro lines" />
      <Grid>
        <TextField path="birthdayReveal.happyText" label="Happy text" />
        <TextField path="birthdayReveal.subText" label="Sub text (emoji / hearts)" />
        <ColorField path="birthdayReveal.accentColor" label="Accent colour" />
        <ColorField path="birthdayReveal.background" label="Background" />
        <RangeField path="birthdayReveal.intensity" label="Celebration intensity" />
      </Grid>
      <Grid>
        <Toggle path="birthdayReveal.confetti" label="Confetti" />
        <Toggle path="birthdayReveal.fireworks" label="Fireworks" />
      </Grid>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Letter
// ─────────────────────────────────────────────────────────────
export function LetterEditor() {
  return (
    <Section title="Birthday Letter" description="Write the personal letter with rich text.">
      <TextField path="letter.title" label="Title" />
      <RichTextEditor path="letter.body" label="Letter" />
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Final surprise
// ─────────────────────────────────────────────────────────────
export function FinalSurpriseEditor() {
  const { draft, update } = useAdmin()
  return (
    <Section title="Final Surprise" description="The last surprise before the closing.">
      <StringList path="finalSurprise.teaseLines" label="Tease lines" />
      <Grid>
        <TextField path="finalSurprise.title" label="Title" />
        <TextField path="finalSurprise.buttonText" label="Button text" />
        <TextField path="finalSurprise.dateTime" label="Date / time (optional)" />
        <TextField path="finalSurprise.location" label="Location (optional)" />
      </Grid>
      <TextArea path="finalSurprise.message" label="Message" rows={3} />
      <TextArea path="finalSurprise.instructions" label="Instructions (optional)" rows={2} />
      <MediaField
        label="Image / video"
        value={(getIn(draft, 'finalSurprise.media') as MediaItem) || undefined}
        onChange={(item) => update('finalSurprise.media', item)}
      />
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Music
// ─────────────────────────────────────────────────────────────
export function MusicEditor() {
  const { draft, update, cloudinary } = useAdmin()
  const [open, setOpen] = useState(false)
  return (
    <Section title="Music" description="Optional background music (never forced to autoplay).">
      <Toggle path="music.enabled" label="Music enabled" />
      <TextField path="music.url" label="Music URL" hint="A direct audio URL (Cloudinary, /media/…, or external)." />
      <TextField path="music.title" label="Title" />
      <Grid>
        <Toggle path="music.autoplay" label="Try autoplay after first tap" />
        <Toggle path="music.loop" label="Loop" />
      </Grid>
      <button type="button" className="btn-outline !py-2 text-xs" onClick={() => setOpen(true)}>
        Pick audio from library
      </button>
      {open && (
        <MediaLibraryModal
          filter={['audio']}
          title="Pick music"
          onClose={() => setOpen(false)}
          onPick={(item) => {
            const url = mediaUrl(item, draft.media.cloudName || cloudinary.cloudName)
            if (url) update('music.url', url)
            if (item.caption) update('music.title', item.caption)
            setOpen(false)
          }}
        />
      )}
      {draft.music.url && (
        <audio controls src={draft.music.url} className="mt-2 w-full" preload="none" />
      )}
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Appearance
// ─────────────────────────────────────────────────────────────
export function AppearanceEditor() {
  return (
    <Section title="Appearance" description="Global look and feel.">
      <Grid>
        <ColorField path="appearance.backgroundColor" label="Background colour" />
        <ColorField path="appearance.accentColor" label="Accent colour" />
        <ColorField path="appearance.textColor" label="Text colour" />
        <RangeField path="appearance.animationIntensity" label="Animation intensity" />
      </Grid>
      <Grid>
        <TextField path="appearance.fontHeading" label="Heading font" hint="A valid CSS font-family." />
        <TextField path="appearance.fontBody" label="Body font" />
      </Grid>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────
export function SettingsEditor() {
  return (
    <Section title="Settings" description="Core identity, countdown, closing and easter eggs.">
      <Grid>
        <TextField path="name" label="Her name" />
        <TextField path="senderName" label="Sender name (your name)" />
        <TextField path="birthday" label="Birthday (YYYY-MM-DD)" />
      </Grid>
      <Card title="Countdown">
        <Toggle path="countdown.enabled" label="Show countdown before the birthday" />
        <TextField path="countdown.message" label="Countdown message" />
      </Card>
      <Card title="Closing">
        <TextField path="closing.message" label="Closing message" />
        <TextField path="closing.dateLabel" label="Date label" />
        <TextField path="closing.withLove" label="Sign-off" />
      </Card>
      <Card title="Easter eggs">
        <Toggle path="easterEggs.enabled" label="Enabled" />
        <StringList path="easterEggs.messages" label="Messages (tapping the hearts)" />
      </Card>
      <Card title="Cloudinary">
        <TextField path="media.cloudName" label="Cloud name" hint="Used to build delivery URLs. Usually matches your server env." />
      </Card>
    </Section>
  )
}

// ─────────────────────────────────────────────────────────────
// Dashboard overview
// ─────────────────────────────────────────────────────────────
export function OverviewEditor({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { draft, published, meta } = useAdmin()
  const publishedAt = meta.publishedAt ? new Date(meta.publishedAt).toLocaleString() : 'Never'
  const updatedAt = meta.updatedAt ? new Date(meta.updatedAt).toLocaleString() : '—'

  const needsAnswer = !draft.secretLock.answer || draft.secretLock.answer.trim() === ''
  const needsLetter = !draft.letter.body || draft.letter.body.trim() === '' || draft.letter.body.includes('replace')

  return (
    <Section title="Dashboard" description="Overview of your surprise.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">For</p>
          <p className="mt-1 font-display text-xl text-white/90">{draft.name}</p>
          <p className="mt-1 font-body text-sm text-white/50">🎂 {draft.birthday}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Published</p>
          <p className="mt-1 font-body text-sm text-white/80">{publishedAt}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Draft updated</p>
          <p className="mt-1 font-body text-sm text-white/80">{updatedAt}</p>
        </div>
      </div>

      {(needsAnswer || needsLetter) && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
          <p className="font-body text-sm font-semibold text-amber-200">Action needed</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-100/80">
            {needsAnswer && (
              <li>
                Set the <b>secret answer</b> — otherwise the lock can't be opened.{' '}
                <button type="button" className="underline" onClick={() => onNavigate('lock')}>
                  Open Secret Lock →
                </button>
              </li>
            )}
            {needsLetter && (
              <li>
                Write the <b>birthday letter</b>.{' '}
                <button type="button" className="underline" onClick={() => onNavigate('letter')}>
                  Open Letter →
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="glass rounded-2xl p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Quick jump</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ['entrance', 'Entrance'],
            ['arrow', 'Arrow'],
            ['lock', 'Secret Lock'],
            ['story', 'Our Story'],
            ['memories', 'Memories'],
            ['reveal', 'Birthday Reveal'],
            ['letter', 'Letter'],
            ['surprise', 'Final Surprise'],
            ['media', 'Media Library'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </Section>
  )
}
