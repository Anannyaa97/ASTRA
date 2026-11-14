import { ArrowDown, ArrowUp, Clock, Minus, TrendingDown } from 'lucide-react'
import { VALUE_LABELS, describeChange } from '../../utils/format'

const ORDER = ['power', 'oxygen', 'water', 'food', 'research', 'battery', 'shielding', 'crew_health', 'comms']

// Predicted effect of an option, produced by the same engine that runs the real mission.
export default function ConsequencePreview({ preview, loading, error }) {
  if (loading) return <p role="status" className="text-sm text-ink-dim">Working out what might happen…</p>
  if (error) return <p role="alert" className="text-sm text-danger">{error}</p>
  if (!preview) return <p className="text-sm text-ink-dim">Pick a choice to see what it might do.</p>

  const changed = ORDER.filter((k) => preview.direction[k] !== 'same')
  const same = ORDER.filter((k) => preview.direction[k] === 'same')
  // Resources that keep dropping even if the player does nothing (so "no change" is not mistaken for "all is well").
  const falling = ['power', 'oxygen', 'water', 'food'].filter((k) => (preview.trend_if_nothing?.[k] ?? 0) <= -0.5)
  const later = preview.later ?? []

  return (
    <div aria-live="polite">
      <h3 className="font-bold">What might happen in the next {preview.horizon_days} days</h3>
      {changed.length === 0 ? (
        <p className="mt-2 text-sm text-ink-dim">Nothing much changes compared with doing nothing.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {changed.map((k) => {
            const up = preview.direction[k] === 'up'
            return (
              <li key={k} className="flex items-center gap-2 text-sm">
                {up
                  ? <ArrowUp size={16} className="shrink-0 text-ok" aria-hidden="true" />
                  : <ArrowDown size={16} className="shrink-0 text-warn" aria-hidden="true" />}
                <span className="font-semibold">{VALUE_LABELS[k]}</span>
                <span className="text-ink-dim">
                  {describeChange(k, preview)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {same.length > 0 && (
        <p className="mt-2 flex items-start gap-2 text-xs text-ink-dim">
          <Minus size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          No change: {same.map((k) => VALUE_LABELS[k]).join(', ')}
        </p>
      )}
      {later.length > 0 && (
        <div className="mt-3 rounded-lg border border-violet/30 bg-violet/10 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-violet">
            <Clock size={16} aria-hidden="true" /> Coming later
          </p>
          <ul className="mt-1 space-y-1 text-sm text-ink-dim">
            {later.map((item) => (
              <li key={`${item.after_days}-${item.note}`}>
                In {item.after_days} {item.after_days === 1 ? 'day' : 'days'}: {item.note}
              </li>
            ))}
          </ul>
        </div>
      )}
      {falling.length > 0 && (
        <div className="mt-3 rounded-lg border border-warn/30 bg-warn/10 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-warn">
            <TrendingDown size={16} aria-hidden="true" /> Even if you do nothing
          </p>
          <ul className="mt-1 space-y-1 text-sm text-ink-dim">
            {falling.map((k) => (
              <li key={k}>
                {VALUE_LABELS[k]} is falling by about {Math.abs(preview.trend_if_nothing[k])} a day.
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-dim">
        Compared with doing nothing. Simulated prediction. It assumes no other events happen.
      </p>
    </div>
  )
}
