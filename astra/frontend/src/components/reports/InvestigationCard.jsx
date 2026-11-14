import { Search } from 'lucide-react'
import ResourceChart from './ResourceChart'
import { VALUE_LABELS } from '../../utils/format'

// Mission Investigation Report: explains WHY the mission failed using the real history (spec section 7).
export default function InvestigationCard({ investigation: inv }) {
  const name = VALUE_LABELS[inv.resource] ?? inv.resource
  const data = inv.resource_history.map((h) => ({ day: h.day, [name]: h[inv.resource] }))

  return (
    <section aria-label="Mission investigation report" className="panel space-y-5 border-danger/40 p-5">
      <h2 className="flex items-center gap-2 text-xl font-extrabold">
        <Search size={22} className="text-danger" aria-hidden="true" /> Mission investigation report
      </h2>

      <div>
        <h3 className="font-bold">What happened</h3>
        <p className="mt-1">{inv.primary_cause} This happened on day {inv.failure_day}.</p>
        <p className="mt-1 text-sm text-ink-dim">
          The trouble started on day {inv.decline_started_day}, when {name.toLowerCase()} began to fall and never recovered.
        </p>
      </div>

      <div>
        <h3 className="font-bold">The {name.toLowerCase()} story</h3>
        <ResourceChart data={data} series={[{ key: name, label: name, color: '#f87171' }]}
          description={`${name} level for each mission day`} />
      </div>

      {inv.relevant_decisions.length > 0 && (
        <div>
          <h3 className="font-bold">Decisions that mattered</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-dim">
            {inv.relevant_decisions.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-bold">How to avoid it</h3>
        <p className="mt-1">{inv.how_to_avoid}</p>
      </div>

      <div>
        <h3 className="font-bold">The science</h3>
        <p className="mt-1">{inv.science_note}</p>
      </div>
    </section>
  )
}
