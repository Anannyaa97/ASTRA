import { Sun } from 'lucide-react'
import StatusPill from '../components/common/StatusPill'

const LEVEL = { quiet: 'Quiet Sun', normal: 'Normal Sun', stormy: 'Busy Sun' }

// Shown with the training solar storm: what the REAL Sun has been doing, and how that nudged the game storm.
export default function RealSunCheck({ sun }) {
  if (!sun) return null
  const c = sun.counts
  const when = sun.retrieved_at ? new Date(sun.retrieved_at).toLocaleDateString() : null
  return (
    <aside className="g-sun" aria-label="Real Sun check">
      <p className="g-sun-head">
        <Sun size={16} aria-hidden="true" /> Real Sun check
        <StatusPill kind={sun.status} />
        <span className="g-sun-level">{LEVEL[sun.level]}</span>
      </p>
      <p>{sun.message}</p>
      <details className="g-sun-rule">
        <summary>See the numbers and the rule</summary>
        {c && (
          <p className="g-sun-facts">
            NASA DONKI, last {sun.window_days} days{when ? ` (checked ${when})` : ''}: {c.strong_flares} strong flares,{' '}
            {c.magnetic_storms} magnetic storms, {c.particle_events} particle events.
          </p>
        )}
        <p>{sun.rule}</p>
        <p className="g-sun-note">The storm in this game is invented. It is not a real event, and the risk number is not a real dose.</p>
      </details>
    </aside>
  )
}
