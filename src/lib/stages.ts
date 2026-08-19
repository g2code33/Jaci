import type { StageId } from '@/types/config'

export const STAGE_LABELS: Array<{ id: StageId; label: string }> = [
  { id: 'countdown', label: 'Countdown' },
  { id: 'entrance', label: 'Entrance' },
  { id: 'heart', label: 'Heart' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'lock', label: 'Secret Lock' },
  { id: 'ready', label: 'Ready' },
  { id: 'intro', label: 'Story Intro' },
  { id: 'story', label: 'Our Story' },
  { id: 'memories', label: 'Memories' },
  { id: 'things', label: "Things I Don't Say" },
  { id: 'heartmoment', label: 'Heart Moment' },
  { id: 'reveal', label: 'Birthday Reveal' },
  { id: 'letter', label: 'Letter' },
  { id: 'surprise', label: 'Final Surprise' },
  { id: 'closing', label: 'Closing' },
]
