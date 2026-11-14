import { useState } from 'react'
import {
  Battery, ChevronDown, FlaskConical, HeartPulse, Radio, Salad, Shield, Wind, Zap, Droplets,
} from 'lucide-react'
import ResourceCard from './ResourceCard'
import { primaryIndicators } from '../../utils/format'

const PRIMARY_ICONS = { power: Zap, life: Wind, protection: Shield }

const DETAILS = [
  { key: 'oxygen', label: 'Oxygen', icon: Wind },
  { key: 'water', label: 'Water', icon: Droplets },
  { key: 'food', label: 'Food', icon: Salad },
  { key: 'crew_health', label: 'Crew health', icon: HeartPulse },
  { key: 'battery', label: 'Backup battery', icon: Battery },
  { key: 'comms', label: 'Link to Earth', icon: Radio },
]

// Three big indicators first. Everything else is one tap away so kids are not overwhelmed.
export default function ResourceDashboard({ values, previous }) {
  const [open, setOpen] = useState(false)
  const before = previous ?? values
  const delta = (key) => values[key] - before[key]
  const lifeDelta = Math.min(values.oxygen, values.water) - Math.min(before.oxygen, before.water)
  const deltas = { power: delta('power'), life: lifeDelta, protection: delta('shielding') }

  return (
    <section aria-label="Resources" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {primaryIndicators(values).map((p) => (
          <ResourceCard key={p.key} large icon={PRIMARY_ICONS[p.key]} label={p.label}
            value={p.value} hint={p.hint} delta={deltas[p.key]} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="more-details"
        className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-electric hover:bg-white/5"
      >
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        {open ? 'Hide details' : 'Show more details'}
      </button>

      {open && (
        <div id="more-details" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DETAILS.map(({ key, label, icon }) => (
            <ResourceCard key={key} icon={icon} label={label} value={values[key]} delta={delta(key)}
              hint={key === 'battery' ? 'Emergency power' : key === 'comms' ? 'Needed to send research home' : ''} />
          ))}
          <div className="panel p-3">
            <span className="flex items-center gap-2 font-bold">
              <FlaskConical size={18} className="text-violet" aria-hidden="true" /> Research
            </span>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              {values.research}<span className="text-sm font-semibold text-ink-dim"> points</span>
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
