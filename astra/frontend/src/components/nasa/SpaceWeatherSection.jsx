import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Sun } from 'lucide-react'
import { api } from '../../services/api'
import StatusPill from '../common/StatusPill'
import NASAEventCard from './NASAEventCard'

// Shows NASA DONKI events with an honest label: LIVE (just fetched), CACHED (saved earlier) or ARCHIVED (curated).
const FIRST_SHOWN = 6
const TYPES = [
  { id: 'ALL', label: 'All' },
  { id: 'FLR', label: 'Solar flares' },
  { id: 'CME', label: 'CMEs' },
  { id: 'SEP', label: 'Particle events' },
  { id: 'GST', label: 'Magnetic storms' },
]

export default function SpaceWeatherSection() {
  const [filter, setFilter] = useState('ALL')
  const [showAll, setShowAll] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api.getSpaceWeather(30).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const filtered = useMemo(
    () => (data ? data.events.filter((e) => filter === 'ALL' || e.type === filter) : []),
    [data, filter],
  )
  const shown = showAll ? filtered : filtered.slice(0, FIRST_SHOWN)
  const countFor = (id) => (data ? (id === 'ALL' ? data.events.length : data.events.filter((e) => e.type === id).length) : 0)

  return (
    <section aria-labelledby="sw-title" className="space-y-3">
      <div className="panel space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-warn/20 text-warn">
            <Sun size={24} aria-hidden="true" />
          </span>
          <h2 id="sw-title" className="text-xl font-extrabold md:text-2xl">Space weather</h2>
          {data && <StatusPill kind={data.status} />}
          <button type="button" className="btn btn-ghost ml-auto" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
          </button>
        </div>
        <p className="max-w-prose text-ink-dim">
          The Sun sometimes throws out bursts of energy and particles. NASA scientists watch for them every day.
        </p>

        {data && (
          <div className="space-y-1 text-sm" role="status">
            <p>{data.message}</p>
            <p className="text-ink-dim">
              {data.retrieved_at
                ? `Retrieved from NASA: ${new Date(data.retrieved_at).toLocaleString()}.`
                : 'Not retrieved today. These are curated summaries.'}
              {' '}Source: {data.source}.
            </p>
          </div>
        )}
        <p className="rounded-xl border border-violet/30 bg-violet/10 p-3 text-sm">
          {data?.disclaimer ?? 'These are observations of the Sun, not radiation doses for astronauts.'}
        </p>
      </div>

      {loading && !data && <p role="status" className="p-4 text-ink-dim">Asking NASA…</p>}
      {error && <p role="alert" className="panel p-4 text-danger">{error}</p>}

      {data && data.events.length === 0 && (
        <p className="panel p-4 text-ink-dim">No events to show right now.</p>
      )}
      {data && data.events.length > 0 && (
        <>
          <div role="group" aria-label="Show event type" className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button key={t.id} type="button" aria-pressed={filter === t.id}
                onClick={() => { setFilter(t.id); setShowAll(false) }}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  filter === t.id ? 'border-electric bg-electric/20 text-white' : 'border-white/15 text-ink-dim hover:bg-white/5'
                }`}>
                {t.label} ({countFor(t.id)})
              </button>
            ))}
          </div>
          {filtered.length === 0 && <p className="panel p-4 text-ink-dim">None of this type in this time.</p>}
          <ul className="grid gap-3 md:grid-cols-2">
            {shown.map((e) => <NASAEventCard key={e.id} event={e} />)}
          </ul>
          {filtered.length > FIRST_SHOWN && (
            <button type="button" className="btn btn-ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all ${filtered.length}`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
