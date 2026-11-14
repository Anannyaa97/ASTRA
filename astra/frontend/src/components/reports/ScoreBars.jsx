import { SCORE_LABELS, levelOf, LEVEL_STYLES } from '../../utils/format'

// Several scores instead of one (spec section 7). A score of null means "not tested yet".
export default function ScoreBars({ scores }) {
  return (
    <ul className="space-y-3">
      {Object.entries(SCORE_LABELS).map(([key, label]) => {
        const value = scores[key]
        const style = LEVEL_STYLES[levelOf(value ?? 0)]
        return (
          <li key={key}>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{label}</span>
              <span className="tabular-nums text-ink-dim">{value == null ? 'Not tested this mission' : `${Math.round(value)} out of 100`}</span>
            </div>
            <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={value == null ? undefined : Math.round(value)}
              className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/10">
              {value != null && <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${value}%` }} />}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
