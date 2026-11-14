import { Link } from 'react-router-dom'

// Big ring showing how far through the mission you are, with the four supplies listed underneath.
export default function ProgressRing({ daysDone, totalDays, supplies }) {
  const percent = Math.round((daysDone / totalDays) * 100)
  const R = 70, C = 2 * Math.PI * R
  return (
    <section aria-label="Mission progress" className="panel flex flex-col items-center p-5">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" role="img" aria-label={`${percent} percent of the mission is complete`}>
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c6cf0" /><stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="14" />
          <circle cx="90" cy="90" r={R} fill="none" stroke="url(#ring-grad)" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - percent / 100)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <span className="text-3xl font-extrabold">{percent}%</span>
          <span className="text-xs text-ink-dim">Completed</span>
        </div>
      </div>
      <ul className="mt-4 w-full space-y-1.5 text-sm">
        {supplies.map((s) => (
          <li key={s.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
            <span className="font-semibold">{Math.round(s.value)}%</span>
          </li>
        ))}
      </ul>
      <Link to="/reports" className="btn btn-primary mt-4 w-full justify-center">View Details</Link>
    </section>
  )
}
