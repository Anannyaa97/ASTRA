import { ArrowDown, ArrowUp } from 'lucide-react'
import { LEVEL_STYLES, fmt, levelOf, signed } from '../../utils/format'

// One resource: icon, name, bar, number and change since the last day.
export default function ResourceCard({ icon: Icon, label, value, hint, delta = 0, large = false }) {
  const level = levelOf(value)
  const style = LEVEL_STYLES[level]
  const moved = Math.abs(delta) >= 0.5

  return (
    <div className={`panel ${large ? 'p-4' : 'p-3'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-bold">
          {Icon && <Icon size={large ? 22 : 18} className={style.text} aria-hidden="true" />}
          {label}
        </span>
        <span className={`font-extrabold tabular-nums ${large ? 'text-2xl' : 'text-lg'}`}>
          {fmt(value)}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        aria-valuetext={`${fmt(value)} out of 100, ${style.word}`}
        className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"
      >
        <div className={`h-full rounded-full transition-all duration-500 ${style.bar}`} style={{ width: `${value}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-dim">
        <span>{hint}</span>
        <span className={`flex shrink-0 items-center gap-0.5 font-semibold ${!moved ? '' : delta > 0 ? 'text-ok' : 'text-warn'}`}>
          {moved && (delta > 0 ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
          {moved ? `${signed(delta)} since last day` : style.word}
        </span>
      </div>
    </div>
  )
}
