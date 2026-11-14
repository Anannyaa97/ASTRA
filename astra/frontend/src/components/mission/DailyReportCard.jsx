import { ArrowDown, ArrowUp } from 'lucide-react'
import { VALUE_LABELS, fmt, signed } from '../../utils/format'

const SHOWN = ['power', 'oxygen', 'water', 'food', 'crew_health', 'research']

// What happened at the end of the day: changes, plus short plain-language notes.
export default function DailyReportCard({ report, nextDay, onContinue, busy }) {
  return (
    <section aria-label={`Day ${report.day} report`} className="panel space-y-4 p-4 md:p-5">
      <h2 className="text-xl font-extrabold">Day {report.day} report</h2>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SHOWN.map((k) => {
          const d = report.deltas[k]
          const moved = Math.abs(d) >= 0.05
          return (
            <li key={k} className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-ink-dim">{VALUE_LABELS[k]}</p>
              <p className="flex items-center gap-1 text-lg font-bold tabular-nums">
                {fmt(report.values[k])}
                {moved && (
                  <span className={`flex items-center text-xs font-semibold ${d > 0 ? 'text-ok' : 'text-warn'}`}>
                    {d > 0 ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />}
                    {signed(d)}
                  </span>
                )}
              </p>
            </li>
          )
        })}
      </ul>

      <p className="text-sm text-ink-dim">
        Power made {fmt(report.flows.power_generated)}, used {fmt(report.flows.power_consumed)}.
        {' '}Water recycled {fmt(report.flows.water_recycled)}, used {fmt(report.flows.water_used)}.
        {' '}Food grown {fmt(report.flows.food_made)}, eaten {fmt(report.flows.food_used)}.
      </p>

      {report.notes.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm">
          {report.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}

      {report.status === 'active' ? (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onContinue}>
          Start day {nextDay}
        </button>
      ) : (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onContinue}>
          See the mission result
        </button>
      )}
    </section>
  )
}
