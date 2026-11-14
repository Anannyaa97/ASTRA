import { useState } from 'react'
import { Rocket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMission } from '../../context/MissionContext'

const LEVELS = [
  { id: 'cadet', label: 'Cadet', hint: 'A friendly first mission' },
  { id: 'commander', label: 'Commander', hint: 'Less sunlight power, smaller supplies and two extra problems' },
]

// Shown on any mission page when there is no active mission yet: an invitation to start one.
export default function NoMission({ title = 'No mission yet' }) {
  const { startMission, busy, error } = useMission()
  const [level, setLevel] = useState('cadet')
  const navigate = useNavigate()

  return (
    <section className="panel mx-auto max-w-xl space-y-5 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-electric to-violet">
          <Rocket aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-extrabold">{title}</h1>
      </div>
      <p className="text-ink-dim">
        Take command of a lunar outpost near the Moon&apos;s South Pole. Keep four astronauts safe for 20 days.
      </p>

      <fieldset>
        <legend className="mb-2 font-bold">Choose your level</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEVELS.map((l) => (
            <label key={l.id} className={`cursor-pointer rounded-xl border p-3 ${level === l.id ? 'border-electric bg-electric/15' : 'border-white/15 bg-white/5'}`}>
              <input type="radio" name="level" value={l.id} checked={level === l.id}
                onChange={() => setLevel(l.id)} className="sr-only" />
              <span className="block font-bold">{l.label}</span>
              <span className="block text-sm text-ink-dim">{l.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p role="alert" className="text-danger">{error}</p>}
      <button type="button" className="btn btn-primary" disabled={busy} onClick={async () => { if (await startMission(level)) navigate('/play') }}>
        Start mission
      </button>
    </section>
  )
}
