import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { api } from '../../services/api'
import ConsequencePreview from './ConsequencePreview'

// The player picks an option, sees a preview from the real engine, then confirms.
export default function DecisionPanel({ mission, busy, onConfirm }) {
  const event = mission.event
  const [selected, setSelected] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // A new event starts with nothing selected.
  useEffect(() => { setSelected(null); setPreview(null); setError(null) }, [event.id, mission.id])

  useEffect(() => {
    if (!selected) return undefined
    let stale = false   // ignore answers that arrive after the player picked something else
    setLoading(true); setError(null); setPreview(null)
    api.preview(mission.id, selected)
      .then((p) => { if (!stale) setPreview(p) })
      .catch((e) => { if (!stale) setError(e.message) })
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  }, [selected, mission.id])

  return (
    <section aria-label="Your decision" className="panel space-y-4 p-4 md:p-5">
      <h3 className="text-lg font-extrabold">What will you do?</h3>

      <div role="radiogroup" aria-label="Choices" className="grid gap-3">
        {event.options.map((opt) => {
          const on = selected === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!opt.available || busy}
              onClick={() => setSelected(opt.id)}
              className={`flex min-h-16 items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                on ? 'border-electric bg-electric/15' : 'border-white/15 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span aria-hidden="true"
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-electric bg-electric' : 'border-white/40'}`}>
                {on && <Check size={14} />}
              </span>
              <span>
                <span className="block font-bold">{opt.label}</span>
                <span className="block text-sm text-ink-dim">{opt.description}</span>
                {!opt.available && <span className="mt-1 block text-sm font-semibold text-danger">{opt.unavailable_reason}</span>}
              </span>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-space-900/60 p-4">
        <ConsequencePreview preview={preview} loading={loading} error={error} />
      </div>

      <button type="button" className="btn btn-primary w-full sm:w-auto"
        disabled={!selected || busy || loading} onClick={() => onConfirm(event.id, selected)}>
        Confirm decision
      </button>
    </section>
  )
}
