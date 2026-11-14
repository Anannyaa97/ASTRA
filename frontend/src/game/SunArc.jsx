// The day counter, drawn as the Sun's path across the sky: one dot for every mission day.
// Passed days are filled, today is the Sun itself, days still to come are empty rings.
const P0 = [16, 86], P1 = [160, -26], P2 = [304, 86]
const at = (t) => [
  (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t ** 2 * P2[0],
  (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t ** 2 * P2[1],
]

export default function SunArc({ day, total, status }) {
  const ended = status !== 'active'
  const label = status === 'success' ? `Mission complete, all ${total} days done`
    : status === 'failed' ? `Mission ended on day ${day} of ${total}` : `Day ${day} of ${total}`
  return (
    <div className="g-sunarc" role="img" aria-label={label}>
      <svg viewBox="0 0 320 100" aria-hidden="true">
        <path d={`M${P0} Q${P1} ${P2}`} fill="none" stroke="rgba(241,230,204,.2)" strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" />
        {Array.from({ length: total }, (_, i) => {
          const [x, y] = at(total === 1 ? 0 : i / (total - 1))
          const today = !ended && i === day - 1
          const done = ended ? i < day : i < day - 1
          if (today) {
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="15" fill="#ffb23e" opacity="0.22" />
                <circle cx={x} cy={y} r="8.5" fill="#ffd27a" stroke="#ff9a3e" strokeWidth="2" />
              </g>
            )
          }
          return <circle key={i} cx={x} cy={y} r="3.6" fill={done ? '#f1e6cc' : 'none'} stroke="#f1e6cc" strokeOpacity={done ? 1 : 0.45} strokeWidth="1.5" />
        })}
      </svg>
      <p className="g-day g-display">{ended ? (status === 'success' ? 'Done' : `Day ${day}`) : `Day ${day}`} <span className="g-of">of {total}</span></p>
    </div>
  )
}
