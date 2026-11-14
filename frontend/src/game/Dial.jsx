import { levelOf } from '../utils/format'

// An analog dial. A 270 degree sweep, tick marks, a needle that swings to the value, and a number.
// The needle position, the number and a word (Good / Low / Critical) all say the same thing, so colour is never alone.
const START = -135, SWEEP = 270, R = 40
const COLORS = { ok: '#8fd694', warn: '#ffb23e', danger: '#ff5d4a' }
const WORDS = { ok: 'Good', warn: 'Low', danger: 'Critical' }
const xy = (deg, r) => [r * Math.sin((deg * Math.PI) / 180), -r * Math.cos((deg * Math.PI) / 180)]
const arc = (a0, a1, r) => {
  const [x0, y0] = xy(a0, r), [x1, y1] = xy(a1, r)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}
const TICKS = Array.from({ length: 11 }, (_, i) => START + (SWEEP / 10) * i)

export default function Dial({ label, value, hint }) {
  const level = levelOf(Math.round(value))
  const color = COLORS[level]
  const v = Math.max(0, Math.min(100, value))
  const angle = START + (SWEEP * v) / 100
  return (
    <div className="g-dial" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.round(v)} aria-valuetext={`${Math.round(v)} out of 100, ${WORDS[level]}. ${hint ?? ''}`}>
      <svg viewBox="-56 -52 112 100" aria-hidden="true">
        <circle r="50" cy="2" fill="rgba(6,7,13,.55)" />
        <path d={arc(START, START + SWEEP, R)} fill="none" stroke="rgba(241,230,204,.16)" strokeWidth="6" strokeLinecap="round" />
        {v > 0 && <path d={arc(START, angle, R)} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" className="g-arc" />}
        {TICKS.map((a, i) => {
          const [x0, y0] = xy(a, R + 6), [x1, y1] = xy(a, R + (i % 5 === 0 ? 11 : 9))
          return <line key={a} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#f1e6cc" strokeOpacity={i % 5 === 0 ? 0.7 : 0.35} strokeWidth="1.2" />
        })}
        <g className="g-needle" style={{ transform: `rotate(${angle}deg)` }}>
          <line x1="0" y1="4" x2="0" y2="-31" stroke="#f1e6cc" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <circle r="4.5" fill="#f1e6cc" /><circle r="1.8" fill="#150f26" />
        <text y="27" textAnchor="middle" fontSize="15" fontWeight="800" fill="#f1e6cc" style={{ fontFamily: 'Unbounded Variable, sans-serif' }}>{Math.round(v)}</text>
      </svg>
      <div className="g-name g-display">{label}</div>
      <div className="g-word">{WORDS[level]}</div>
    </div>
  )
}
