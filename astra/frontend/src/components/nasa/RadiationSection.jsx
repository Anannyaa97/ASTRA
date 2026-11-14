import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, RefreshCw, Satellite } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../services/api'
import StatusPill from '../common/StatusPill'

const tip = { background: '#120d24', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, color: '#f4ecda' }
const num = (v) => Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })

// Real radiation readings from instruments on the International Space Station (NASA RadLab).
export default function RadiationSection() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    api.getRadiation().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const chart = data ? data.hourly.map((h) => ({ hour: `${String(h.hour).padStart(2, '0')}:00`, rate: h.average })) : []

  return (
    <section aria-labelledby="rad-title" className="space-y-3">
      <div className="panel space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric/20 text-electric">
            <Satellite size={24} aria-hidden="true" />
          </span>
          <h2 id="rad-title" className="text-xl font-extrabold md:text-2xl">Real radiation on the space station</h2>
          {data && <StatusPill kind={data.status} />}
          <button type="button" className="btn btn-ghost ml-auto" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
          </button>
        </div>

        {loading && !data && <p role="status" className="text-ink-dim">Asking NASA…</p>}
        {error && <p role="alert" className="text-danger">{error}</p>}

        {data && (
          <>
            <ul className="list-disc space-y-1 pl-5 text-ink-dim">
              {data.explain.map((line) => <li key={line}>{line}</li>)}
            </ul>

            <div role="status" className="space-y-1 text-sm">
              <p>{data.message}</p>
              <p className="text-ink-dim">
                {data.retrieved_at ? `Retrieved from NASA: ${new Date(data.retrieved_at).toLocaleString()}. ` : 'Not retrieved today. '}
                Readings are from <strong>{data.data_day}</strong>, measured on the {data.spacecraft} by {data.instruments}.
                Source: {data.source}.
              </p>
            </div>

            <figure className="m-0" aria-label="Average radiation dose rate for each hour of the day">
              <figcaption className="mb-1 text-sm font-semibold">Average dose rate each hour ({data.unit})</figcaption>
              <div className="h-56 w-full">
                <ResponsiveContainer>
                  <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                    <XAxis dataKey="hour" stroke="#c0b6cf" tick={{ fontSize: 11 }} interval={3} />
                    <YAxis stroke="#c0b6cf" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tip} cursor={{ fill: 'rgba(255,255,255,.06)' }}
                      formatter={(v) => [`${num(v)} µGy/h`, 'Average']} />
                    <Bar dataKey="rate" fill="#54c7e0" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </figure>

            <dl className="grid gap-3 sm:grid-cols-3">
              {[
                ['Lowest reading', data.summary.minimum],
                ['Average of the day', data.summary.average],
                ['Highest reading', data.summary.maximum],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <dt className="text-xs text-ink-dim">{label}</dt>
                  <dd className="text-2xl font-extrabold">{num(value)} <span className="text-xs font-normal text-ink-dim">µGy/h</span></dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-ink-dim">Based on {num(data.summary.readings)} readings.</p>

            <p className="rounded-xl border border-violet/30 bg-violet/10 p-3 text-sm">{data.disclaimer}</p>
            <a href={data.source_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-electric underline underline-offset-4">
              Open NASA RadLab <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </>
        )}
      </div>
    </section>
  )
}
