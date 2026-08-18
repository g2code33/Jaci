import type { BirthdayConfig, Store } from '../types/config'

/**
 * The default configuration used to seed the store on first run.
 * Everything here is editable from the admin dashboard.
 *
 * IMPORTANT: all personal details are intentionally generic placeholders
 * — replace them through the admin panel. Nothing personal is invented.
 */
export const DEFAULT_CONFIG: BirthdayConfig = {
  name: 'Jacinta Abena Ammoanimaa',
  senderName: '[your name]',
  birthday: '2026-08-22',

  entrance: {
    greeting: 'Jacinta…',
    title: 'I made something for you.',
    messages: [
      "There's something I want you to experience.",
      "Please don't rush through it.",
    ],
    closingLine: '',
    heartColor: '#ff4f9a',
    particleIntensity: 0.45,
    animationIntensity: 0.7,
    lineDuration: 2600,
    transitionDuration: 900,
    background: '#08080c',
  },

  heartIntro: {
    beforeText: 'Before you continue…',
    promptText: "There's one little thing I need you to do.",
  },

  arrow: {
    enabled: true,
    instruction: 'Pull the arrow back…',
    arrowColor: '#ff7ab8',
    heartColor: '#ff4f9a',
    glow: 0.8,
    trailIntensity: 0.7,
    minPullDistance: 70,
    maxPullDistance: 150,
    impactEffect: 'both',
    soundEffects: true,
    impactMessage: '',
  },

  secretLock: {
    title: 'SECRET QUESTION',
    question: 'Which lecture theatre did we meet for the first time?',
    answer: '',
    placeholder: 'Enter the secret word…',
    buttonText: 'UNLOCK ❤️',
    wrongMessage: "Hmm… that's not it. Think about it, Jacinta. 👀❤️",
    correctMessage: "I knew you'd remember. ❤️",
    unlockedMessage: 'You unlocked something…',
    teaserLine: "But there's one more thing.",
    maxAttempts: 0,
    caseSensitive: false,
    trimWhitespace: true,
    lockAnimation: 'both',
    unlockSound: true,
  },

  ready: {
    readyText: 'Are you ready?',
    readyButton: 'YES ❤️',
    sureText: 'Are you sure you are ready?',
    sureButton: "I'M SURE ❤️",
    waitButton: 'WAIT… 😭',
    waitResponses: [
      'Take your time 😂',
      'No pressure… 👀',
      "I knew you'd hesitate. 😭❤️",
    ],
    introLines: [
      'Okay…',
      "Let's begin.",
      "This isn't just a birthday message.",
      "It's a little journey through some of the reasons you mean so much to me.",
    ],
    introButton: "LET'S GO ❤️",
  },

  story: {
    title: 'Our Story',
    subtitle: 'Some moments deserve to be remembered.',
    entries: [
      {
        id: 'placeholder-1',
        title: 'A moment worth remembering',
        description:
          'This is a placeholder entry — open the admin dashboard to replace it with one of your real moments together.',
        hidden: false,
      },
      {
        id: 'placeholder-2',
        title: 'Another moment',
        description:
          'Add dates, photos, videos, captions and locations to bring each memory to life.',
        hidden: false,
      },
    ],
  },

  memories: {
    title: 'Memories',
    subtitle: 'Little fragments of us.',
    items: [],
  },

  things: {
    title: "Things I Don't Say Enough",
    subtitle: '',
    cards: [
      { id: 'thing-1', message: 'I appreciate you.' },
      { id: 'thing-2', message: 'I love the way you…' },
      { id: 'thing-3', message: 'You make ordinary moments feel special.' },
      { id: 'thing-4', message: "I'm grateful that I met you." },
    ],
  },

  heartMoment: {
    intro: "There's something I want you to remember.",
    message: 'You are so loved. ❤️',
    buttonText: 'continue ❤️',
  },

  birthdayReveal: {
    preLines: ['And now…', "The reason you're here."],
    happyText: 'HAPPY BIRTHDAY',
    subText: '❤️',
    intensity: 0.7,
    confetti: true,
    fireworks: true,
    accentColor: '#ff4f9a',
    background: '#08080c',
  },

  letter: {
    title: 'A letter for you.',
    body: '<p>My dearest Jacinta,</p><p>This is where your letter will live. Open the admin dashboard and write it — tell her everything you want her to know.</p><p>With all my love.</p>',
  },

  finalSurprise: {
    teaseLines: ['You thought that was everything?', 'Not quite. 👀'],
    title: 'One more thing…',
    message:
      'This is a placeholder — replace it with the real surprise. It could be a time, a place, or an instruction.',
    buttonText: 'ONE MORE THING…',
    instructions: '',
    dateTime: '',
    location: '',
  },

  closing: {
    message: 'Happy Birthday, Jacinta. ❤️',
    dateLabel: '22.08.2026',
    withLove: 'With love,',
  },

  music: {
    enabled: false,
    url: '',
    title: '',
    autoplay: false,
    loop: true,
  },

  countdown: {
    enabled: false,
    message: 'Something special is coming…',
  },

  easterEggs: {
    enabled: true,
    messages: [
      'Okay okay… I know you\u2019re curious 😂❤️',
      "You found something I didn't expect you to find. 👀",
      'Still here? I love that about you. ❤️',
    ],
  },

  appearance: {
    backgroundColor: '#08080c',
    accentColor: '#ff4f9a',
    textColor: '#f5eff4',
    fontHeading: '"Cormorant Garamond", Georgia, serif',
    fontBody: 'Inter, system-ui, sans-serif',
    animationIntensity: 0.7,
  },

  media: {
    cloudName: '',
    library: [],
  },
}

export const DEFAULT_STORE: Store = {
  draft: structuredClone(DEFAULT_CONFIG),
  published: structuredClone(DEFAULT_CONFIG),
  meta: { version: 1 },
}
