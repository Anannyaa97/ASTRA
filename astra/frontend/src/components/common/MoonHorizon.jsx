// A huge Moon rising at the bottom of the landing page, with a tiny outpost on its edge and Earth in the sky.
// Pure SVG: the circle is centred far below the screen so only the top of the Moon shows.
const CX = 800, CY = 1480, R = 1100
const yAt = (x) => CY - Math.sqrt(R * R - (x - CX) ** 2)

const CRATERS = [
  [250, 70, 90, 16], [470, 130, 60, 11], [640, 52, 120, 20], [900, 96, 80, 13], [1040, 170, 100, 16], [1290, 60, 70, 11], [1430, 140, 90, 15], [130, 160, 70, 10],
]

export default function MoonHorizon({ className }) {
  const ox = 1130, oy = yAt(ox), tilt = (Math.atan((ox - CX) / Math.sqrt(R * R - (ox - CX) ** 2)) * 180) / Math.PI
  return (
    <svg className={className} viewBox="0 0 1600 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="mh-body" cx="260" cy="420" r="1500" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f2dfc0" />
          <stop offset="0.2" stopColor="#bfaebb" />
          <stop offset="0.5" stopColor="#6d6283" />
          <stop offset="0.82" stopColor="#2a2140" />
          <stop offset="1" stopColor="#0e0a1c" />
        </radialGradient>
        <linearGradient id="mh-rim" x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd27a" /><stop offset="0.45" stopColor="#ffb23e" stopOpacity="0.7" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mh-earth" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#bdf0ff" /><stop offset="0.5" stopColor="#3aa6d6" /><stop offset="1" stopColor="#0f3563" />
        </radialGradient>
        <radialGradient id="mh-halo"><stop offset="0" stopColor="#ffb23e" stopOpacity="0.55" /><stop offset="1" stopColor="#ffb23e" stopOpacity="0" /></radialGradient>
        <filter id="mh-blur"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="mh-blur2"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {/* Earth and the link from the outpost */}
      <circle cx="1330" cy="190" r="86" fill="#54c7e0" opacity="0.16" filter="url(#mh-blur)" />
      <circle cx="1330" cy="190" r="40" fill="url(#mh-earth)" />
      <path d="M1300 176 q14 -10 30 -4 q-6 14 -22 16 z M1336 200 q12 -6 20 4 q-8 10 -18 6 z" fill="#8fd694" opacity="0.7" />
      <line x1="1149" y1={oy - 59} x2="1304" y2="212" stroke="#54c7e0" strokeWidth="1.6" strokeDasharray="2 7" strokeLinecap="round" opacity="0.8" />

      {/* Warm glow where the low Sun grazes the horizon */}
      <ellipse cx="170" cy={yAt(170) + 10} rx="360" ry="60" fill="url(#mh-halo)" />

      {/* The Moon */}
      <circle cx={CX} cy={CY} r={R} fill="url(#mh-body)" />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#mh-rim)" strokeWidth="9" filter="url(#mh-blur)" opacity="0.8" />
      <circle cx={CX} cy={CY} r={R - 1} fill="none" stroke="url(#mh-rim)" strokeWidth="2.5" />
      {CRATERS.map(([x, dy, rx, ry], i) => {
        const y = yAt(x) + dy
        return (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#1a1230" opacity="0.38" />
            <path d={`M${x - rx} ${y} A${rx} ${ry} 0 0 1 ${x + rx} ${y}`} fill="none" stroke="#fff3dc" strokeWidth="2" opacity="0.28" />
          </g>
        )
      })}

      {/* A tiny outpost on the rim: long shadow, dome, greenhouse, panels, antenna */}
      <g transform={`translate(${ox} ${oy.toFixed(1)}) rotate(${tilt.toFixed(1)})`}>
        <ellipse cx="90" cy="3" rx="120" ry="5" fill="#0a0716" opacity="0.7" filter="url(#mh-blur2)" />
        <rect x="-64" y="-22" width="4" height="22" fill="#8c80a8" />
        <path d="M-92 -20 l34 -8 l4 10 l-34 8 z" fill="#4c6ad6" stroke="#c7d2ff" strokeOpacity="0.5" />
        <path d="M-132 -14 l34 -8 l4 10 l-34 8 z" fill="#3b57c0" stroke="#c7d2ff" strokeOpacity="0.4" />
        <path d="M-36 0 A36 36 0 0 1 36 0 Z" fill="#d9cfe3" stroke="#fff6e0" strokeOpacity="0.5" />
        <circle cx="-14" cy="-16" r="4.5" fill="#ffb23e" /><circle cx="2" cy="-22" r="4.5" fill="#ffb23e" /><circle cx="18" cy="-14" r="4.5" fill="#ffb23e" />
        <line x1="0" y1="-36" x2="0" y2="-62" stroke="#e7def2" strokeWidth="2" /><circle cx="0" cy="-64" r="3.5" fill="#54c7e0" />
        <rect x="36" y="-9" width="34" height="9" rx="3" fill="#a79bbb" />
        <path d="M70 0 A26 24 0 0 1 122 0 Z" fill="#7fe0b8" fillOpacity="0.45" stroke="#bff5dc" strokeOpacity="0.7" />
        <path d="M88 -2 q4 -16 8 0 M102 -2 q4 -18 8 0" fill="none" stroke="#8fd694" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  )
}
