// One astronaut. Origin is at the feet. The visor glows in the crew's health colour, the shoulder patch is that
// astronaut's own colour, and a ring pulses around whoever is speaking.
export default function Astronaut({ tint, accent, speaking, delay = 0 }) {
  return (
    <g className="g-bob" style={{ animationDelay: `${delay}s` }} aria-hidden="true">
      {speaking && <circle cx="0" cy="-13" r="21" fill="none" stroke={accent} strokeWidth="1.6" className="g-ring" />}
      <rect x="-8.5" y="-18" width="5.5" height="11" rx="2.2" fill="#8d86a8" />
      <rect x="-5.5" y="-15" width="11" height="14" rx="4.2" fill="#f4eee0" stroke="#150f26" strokeWidth="1" />
      <rect x="-5.5" y="-13" width="4.2" height="3.2" rx="1" fill={accent} />
      <rect x="-5.5" y="-4.5" width="4.4" height="4.5" rx="1.6" fill="#cfc6b0" />
      <rect x="1.1" y="-4.5" width="4.4" height="4.5" rx="1.6" fill="#cfc6b0" />
      <circle cx="0" cy="-20.5" r="7" fill="#fbf6ea" stroke="#150f26" strokeWidth="1" />
      <ellipse cx="0.6" cy="-20.5" rx="4.7" ry="3.7" fill="#1b1238" />
      <ellipse cx="0.6" cy="-20.5" rx="4.7" ry="3.7" fill={tint} opacity="0.6" />
      <ellipse cx="-1" cy="-21.8" rx="1.5" ry="0.9" fill="#fff" opacity="0.85" />
    </g>
  )
}
