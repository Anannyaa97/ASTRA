import '../../styles/space.css'

// The backdrop for the whole app: deep space, glowing nebula clouds and a slowly turning spiral galaxy.
// Everything is drawn in code (SVG + CSS) from fixed numbers, so it looks the same every time and needs no image files.
const lcg = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 }

const STARS = (() => {
  const r = lcg(7)
  return Array.from({ length: 240 }, () => ({ x: r() * 1600, y: r() * 900, r: 0.4 + r() * 1.3, o: 0.2 + r() * 0.8, tw: r() < 0.14, d: r() * 6 }))
})()

// Two spiral arms of tiny glowing dots. Warm near the core, violet in the middle, ice-blue at the edge.
const ARMS = (() => {
  const r = lcg(21)
  const dots = []
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < 360; i++) {
      const t = i / 360
      const th = arm * Math.PI + t * 3.7 * Math.PI
      const rad = 26 + 420 * Math.pow(t, 0.85)
      const spread = (10 + 46 * t) * (r() - 0.5) * 2
      dots.push({
        x: Math.cos(th) * rad - Math.sin(th) * spread,
        y: Math.sin(th) * rad + Math.cos(th) * spread,
        r: 0.7 + r() * 2.1 * (1 - t * 0.5),
        o: 0.25 + r() * 0.6 * (1 - t * 0.6),
        c: t < 0.25 ? '#ffe0b0' : t < 0.6 ? '#d3c0ff' : '#8fd8ff',
      })
    }
  }
  return dots
})()

export default function SpaceBackdrop({ bright = false }) {
  return (
    <div className={`sb ${bright ? 'sb-bright' : ''}`} aria-hidden="true">
      <div className="sb-nebula n1" />
      <div className="sb-nebula n2" />
      <div className="sb-nebula n3" />
      <div className="sb-galaxy">
        <svg viewBox="-500 -500 1000 1000">
          <defs>
            <radialGradient id="sb-core">
              <stop offset="0" stopColor="#fff4dc" stopOpacity="0.95" />
              <stop offset="0.25" stopColor="#ffc46b" stopOpacity="0.55" />
              <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
            <filter id="sb-haze"><feGaussianBlur stdDeviation="14" /></filter>
          </defs>
          <g className="sb-spin">
            <g filter="url(#sb-haze)" opacity="0.5">
              <ellipse rx="420" ry="140" fill="#7c4dff" opacity="0.25" />
              <ellipse rx="420" ry="140" fill="#2fc4e0" opacity="0.14" transform="rotate(90)" />
            </g>
            {ARMS.map((d, i) => <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(2)} fill={d.c} opacity={d.o.toFixed(2)} />)}
            <circle r="120" fill="url(#sb-core)" />
          </g>
        </svg>
      </div>
      <svg className="sb-stars" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x.toFixed(0)} cy={s.y.toFixed(0)} r={s.r.toFixed(2)} fill="#fff4e0" opacity={s.o.toFixed(2)}
            className={s.tw ? 'sb-tw' : undefined} style={s.tw ? { animationDelay: `${s.d.toFixed(1)}s` } : undefined} />
        ))}
      </svg>
    </div>
  )
}
