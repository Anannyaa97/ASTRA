import { useEffect, useState } from 'react'
import { FlaskConical, Play, RotateCcw } from 'lucide-react'
import { api } from '../services/api'
import { useMission } from '../context/MissionContext'
import StatusPill from '../components/common/StatusPill'
import LabResults from '../components/lab/LabResults'

const zeros = (options) => Object.fromEntries(options.map((o) => [o.key, 0]))

function valueText(option, value) {
  if (value === 0) return 'No change'
  return option.unit === '%' ? `${value > 0 ? '+' : ''}${value}%` : `+${value} points`
}

export default function WhatIfLab() {
  const { mission } = useMission()
  const missionActive = Boolean(mission) && mission.state.status === 'active'

  const [options, setOptions] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [params, setParams] = useState({})
  const [days, setDays] = useState(7)
  const [storm, setStorm] = useState(false)
  const [from, setFrom] = useState('mission')
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.experimentOptions()
      .then((data) => { setOptions(data.params); setParams(zeros(data.params)) })
      .catch((e) => setLoadError(e.message))
  }, [])

  const source = missionActive && from === 'mission' ? 'mission' : 'fresh'

  async function run() {
    setRunning(true)
    setError(null)
    try {
      const body = { days, storm, params, ...(source === 'mission' ? { mission_id: mission.id } : {}) }
      setResult(await api.runExperiment(body))
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  function reset() {
    setParams(zeros(options))
    setStorm(false)
    setDays(7)
    setResult(null)
    setError(null)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="panel space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric/20 text-electric">
            <FlaskConical size={24} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-extrabold md:text-3xl">What If? Lab</h1>
          <StatusPill kind="SIMULATED" />
        </div>
        <p className="max-w-prose text-ink-dim">
          Change the outpost with the sliders and see what would happen. The lab works on a copy,
          so your real mission is never changed.
        </p>
      </header>

      {loadError && <p role="alert" className="panel p-4 text-danger">{loadError}</p>}
      {!options && !loadError && <p role="status" className="p-4 text-ink-dim">Getting the lab ready…</p>}

      {options && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <section aria-label="Set up your experiment" className="panel h-fit space-y-5 p-5">
            <h2 className="text-xl font-extrabold">Set up your experiment</h2>

            <fieldset className="space-y-2">
              <legend className="mb-1 font-semibold">Start from</legend>
              <label className={`flex items-center gap-2 ${missionActive ? '' : 'opacity-50'}`}>
                <input type="radio" name="from" value="mission" disabled={!missionActive}
                  checked={source === 'mission'} onChange={() => setFrom('mission')} />
                {missionActive ? `My mission (day ${mission.state.day})` : 'My mission (no active mission)'}
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="from" value="fresh"
                  checked={source === 'fresh'} onChange={() => setFrom('fresh')} />
                A fresh outpost
              </label>
            </fieldset>

            {options.map((o) => {
              const id = `lab-${o.key}`
              const value = params[o.key] ?? 0
              return (
                <div key={o.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor={id} className="font-semibold">{o.label}</label>
                    <output htmlFor={id} className="text-sm font-bold text-electric">{valueText(o, value)}</output>
                  </div>
                  <p className="text-xs text-ink-dim">{o.question}</p>
                  <input
                    id={id} type="range" min={o.min} max={o.max} step={o.step} value={value}
                    onChange={(e) => setParams({ ...params, [o.key]: Number(e.target.value) })}
                    className="mt-2 h-8 w-full cursor-pointer accent-electric"
                  />
                </div>
              )
            })}

            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 h-5 w-5" checked={storm} onChange={(e) => setStorm(e.target.checked)} />
              <span>
                <span className="font-semibold">Add a training solar storm</span>
                <span className="block text-xs text-ink-dim">A made-up 3-day storm, so you can test shielding.</span>
              </span>
            </label>

            <div>
              <label htmlFor="lab-days" className="font-semibold">How many days?</label>
              <select id="lab-days" value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-white/20 bg-space-800 p-3">
                {[3, 5, 7, 10].map((d) => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" disabled={running} onClick={run}>
                <Play size={18} aria-hidden="true" /> {running ? 'Running…' : 'Run the experiment'}
              </button>
              <button type="button" className="btn btn-ghost" disabled={running} onClick={reset}>
                <RotateCcw size={18} aria-hidden="true" /> Reset
              </button>
            </div>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          </section>

          <div aria-live="polite">
            {result ? (
              <LabResults result={result} />
            ) : (
              <section className="panel p-5 text-ink-dim">
                <h2 className="mb-2 text-xl font-extrabold text-ink">Ready when you are</h2>
                <p>Move a slider, then press <strong>Run the experiment</strong>. You will see the normal outpost
                  next to your what-if outpost, with a simple explanation.</p>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
