import { useEffect, useRef, useState } from 'react'
import { Stage } from '@/components/Stage'
import { useExperience } from '@/context/ExperienceContext'
import { countdownTo, type CountdownParts } from '@/lib/utils'

interface Props {
  onDone: () => void
}

export function Countdown({ onDone }: Props) {
  const { config } = useExperience()
  const [parts, setParts] = useState<CountdownParts>(() => countdownTo(config.birthday))
  const doneRef = useRef(false)

  useEffect(() => {
    const tick = () => {
      const p = countdownTo(config.birthday)
      setParts(p)
      if (p.done && !doneRef.current) {
        doneRef.current = true
        const t = setTimeout(onDone, 1500)
        return () => clearTimeout(t)
      }
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [config.birthday, onDone])

  const cells: Array<{ label: string; value: number }> = [
    { label: 'Days', value: parts.days },
    { label: 'Hours', value: parts.hours },
    { label: 'Minutes', value: parts.minutes },
    { label: 'Seconds', value: parts.seconds },
  ]

  return (
    <Stage>
      <p className="mb-10 font-body text-xs uppercase tracking-[0.4em] text-white/50">
        {config.countdown.message || 'Something special is coming…'}
      </p>
      <div className="grid grid-cols-4 gap-3 sm:gap-6">
        {cells.map((c) => (
          <div
            key={c.label}
            className="glass flex w-[4.5rem] flex-col items-center rounded-2xl py-5 sm:w-28 sm:py-7"
          >
            <span className="font-display text-3xl font-light tabular-nums text-glow sm:text-6xl">
              {String(c.value).padStart(2, '0')}
            </span>
            <span className="mt-2 font-body text-[10px] uppercase tracking-[0.25em] text-white/45 sm:text-xs">
              {c.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-10 font-display text-lg italic text-white/50">❤</p>
    </Stage>
  )
}
