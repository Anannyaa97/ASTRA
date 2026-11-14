import Astronaut from './Crew'
import { CREW, crewIndex } from '../utils/crewTalk'

// The whole screen: a Moon base near the South Pole, drawn in code (SVG).
// Everything moves with the REAL mission state:
//   the day         -> the Sun moves along the horizon, and every shadow stretches away from it
//   low sunlight    -> the Sun is lower and redder, shadows are longer, panels go dark
//   dust            -> panels turn tan
//   power           -> windows dim and flicker
//   water / food    -> tank level, plants wilt, warning marks appear
//   solar storm     -> violet particles, an alarm glow, and the crew walks into the shelter
//   weak link       -> the Earth link turns into a red dashed line
// It is a simplified picture, not a real habitat and not real lighting.
const W = 1600
const BASE = 700
const C = { sun: '#ffb23e', coral: '#ff5d4a', earth: '#54c7e0', leaf: '#8fd694', bone: '#f1e6cc' }

const STARS = Array.from({ length: 120 }, (_, i) => ({
  x: (i * 173) % W, y: (i * 97) % 430, r: 0.6 + ((i * 7) % 5) * 0.35, o: 0.25 + ((i * 11) % 7) * 0.1, tw: i % 5 === 0,
}))
const ROCKS = Array.from({ length: 30 }, (_, i) => ({
  x: (i * 211) % W, y: 735 + ((i * 53) % 270), rx: 8 + ((i * 13) % 26), ry: 3 + ((i * 7) % 7),
}))
const RAD = Array.from({ length: 30 }, (_, i) => ({ x: 20 + ((i * 59) % 1620), d: ((i * 37) % 23) / 10 }))

// A long, tapering shadow cast away from the Sun.
function shadow(x0, w, h, sunX, stretch, dy = 24) {
  const dir = x0 >= sunX ? 1 : -1
  const len = h * stretch * Math.min(1, 0.3 + Math.abs(x0 - sunX) / 1100)
  const dx = dir * len
  return `M${x0 - w / 2} ${BASE} L${x0 + w / 2} ${BASE} L${x0 + dx + w * 0.16} ${BASE + dy} L${x0 + dx - w * 0.16} ${BASE + dy} Z`
}

export default function LunarScene({ state, talk }) {
  const v = state.values
  const lowSun = !!state.active_conditions?.low_sunlight
  const radiation = !!state.active_conditions?.radiation_hazard
  const sheltering = !!state.sheltering
  const dusty = (state.efficiency?.solar ?? 1) < 0.85
  const linkOk = v.comms >= 70
  const waterLow = v.water < 25
  const foodLow = v.food < 25
  const powerLow = v.power < 35
  const crewTint = v.crew_health >= 60 ? C.leaf : v.crew_health >= 30 ? C.sun : C.coral
  const speaking = new Set((talk ?? []).map((t) => crewIndex(t.who)))
  const paused = sheltering || state.greenhouse_level === 0
  const plants = state.greenhouse_level === 0 ? 0 : Math.min(3, state.greenhouse_level + 1)

  // The Sun creeps along the horizon as the mission goes on. Day 1 is far left, the last day far right.
  const p = Math.min(1, Math.max(0, (state.day - 1) / Math.max(1, state.mission_days - 1)))
  const sunX = 130 + p * 1340
  const sunY = 458 - 62 * Math.sin(Math.PI * p) + (lowSun ? 46 : 0)
  const stretch = lowSun ? 3.4 : 2.3
  const warm = lowSun ? '#d98258' : '#e2c394'

  const panelAngle = (x) => Math.max(-32, Math.min(32, ((sunX - x) / W) * 70))
  const windowOpacity = v.power >= 35 ? 1 : v.power >= 15 ? 0.5 : 0.14

  const crew = sheltering
    ? [520, 548, 576, 604].map((x) => ({ x, y: 806, s: 1.7 }))
    : [738, 782, 826, 870].map((x) => ({ x, y: 792, s: 2.1 }))

  return (
    <svg className="g-scene" viewBox={`0 120 ${W} 900`} preserveAspectRatio="xMidYMax slice" role="img"
      aria-label="A Moon base near the South Pole. The Sun sits low on the horizon and the buildings cast long shadows.">
      <defs>
        <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04050b" /><stop offset="0.7" stopColor="#0b0a1c" /><stop offset="1" stopColor="#1d1531" />
        </linearGradient>
        <radialGradient id="g-ground" gradientUnits="userSpaceOnUse" cx={sunX} cy="610" r="1150">
          <stop offset="0" stopColor={warm} /><stop offset="0.22" stopColor="#a58a8f" /><stop offset="0.55" stopColor="#4b3b63" /><stop offset="1" stopColor="#1a1229" />
        </radialGradient>
        <radialGradient id="g-rim" gradientUnits="userSpaceOnUse" cx={sunX} cy="500" r="520">
          <stop offset="0" stopColor="#ffe0a3" /><stop offset="1" stopColor="#ffe0a3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-body" gradientUnits="userSpaceOnUse" x1={sunX < 800 ? 640 : 960} y1="0" x2={sunX < 800 ? 960 : 640} y2="0">
          <stop offset="0" stopColor="#f3e8cf" /><stop offset="0.45" stopColor="#a398ad" /><stop offset="1" stopColor="#3a2f55" />
        </linearGradient>
        <radialGradient id="g-earth" cx="0.5" cy="0.5" r="0.62" fx={sunX < 1290 ? 0.28 : 0.72} fy="0.42">
          <stop offset="0" stopColor="#d9f3fb" /><stop offset="0.35" stopColor="#54c7e0" /><stop offset="0.72" stopColor="#1b5a8a" /><stop offset="1" stopColor="#07203a" />
        </radialGradient>
        <radialGradient id="g-sunglow"><stop offset="0" stopColor={lowSun ? '#ff8a4c' : '#ffd27a'} stopOpacity="0.55" /><stop offset="1" stopColor="#ffb23e" stopOpacity="0" /></radialGradient>
        <radialGradient id="g-vig" cx="0.5" cy="0.55" r="0.75"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#02020a" stopOpacity="0.7" /></radialGradient>
        <linearGradient id="g-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9be3d0" stopOpacity="0.38" /><stop offset="1" stopColor="#4aa08a" stopOpacity="0.16" /></linearGradient>
        <linearGradient id="g-mod" gradientUnits="userSpaceOnUse" x1="0" y1="656" x2="0" y2="700">
          <stop offset="0" stopColor="#d3c8d8" /><stop offset="0.5" stopColor="#8a7fa2" /><stop offset="1" stopColor="#3d3258" />
        </linearGradient>
        <linearGradient id="g-mound" gradientUnits="userSpaceOnUse" x1="0" y1="730" x2="0" y2="800">
          <stop offset="0" stopColor="#a69bb8" /><stop offset="1" stopColor="#40345c" />
        </linearGradient>
        <filter id="g-soft"><feGaussianBlur stdDeviation="3.5" /></filter>
      </defs>

      {/* sky */}
      <rect width={W} height="1020" fill="url(#g-sky)" />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} className={s.tw ? 'g-star-tw' : undefined}
          style={s.tw ? { animationDelay: `${(i % 9) * 0.35}s` } : undefined} />
      ))}

      {/* Earth hangs low near the horizon, lit from the Sun's side */}
      <g>
        <circle cx="1290" cy="300" r="62" fill="url(#g-earth)" />
        <circle cx="1290" cy="300" r="62" fill="none" stroke={C.earth} strokeOpacity="0.45" strokeWidth="2" />
        <circle cx="1290" cy="300" r="76" fill={C.earth} opacity="0.07" />
      </g>
      <line x1="808" y1="538" x2="1236" y2="322" stroke={linkOk ? C.earth : C.coral} strokeWidth="2.2"
        strokeDasharray={linkOk ? '2 7' : '10 8'} strokeLinecap="round" opacity={linkOk ? 0.75 : 0.95} />

      {/* the Sun, behind the far ridge */}
      <g className="g-sun-move" style={{ transform: `translate(${sunX}px, ${sunY}px)` }}>
        <circle r="210" fill="url(#g-sunglow)" className="g-sunpulse" />
        <circle r="30" fill={lowSun ? '#ff9a54' : '#ffd88a'} />
      </g>

      {/* far ridge with a bright edge facing the Sun */}
      <path d="M0 520 L120 480 L210 505 L330 450 L470 500 L610 470 L760 512 L900 462 L1040 505 L1180 455 L1330 500 L1460 468 L1600 505 L1600 580 L0 580 Z" fill="#150f26" />
      <path d="M0 520 L120 480 L210 505 L330 450 L470 500 L610 470 L760 512 L900 462 L1040 505 L1180 455 L1330 500 L1460 468 L1600 505" fill="none" stroke="url(#g-rim)" strokeWidth="3" />

      {/* ground, lit by the low Sun */}
      <path d="M0 560 Q400 538 800 556 T1600 546 L1600 1020 L0 1020 Z" fill="url(#g-ground)" />
      {ROCKS.map((r, i) => <ellipse key={i} cx={r.x} cy={r.y} rx={r.rx} ry={r.ry} fill="#120c20" opacity="0.28" />)}

      {/* long shadows, all pointing away from the Sun */}
      <g fill="#05030c" opacity="0.8" filter="url(#g-soft)" aria-hidden="true">
        <path d={shadow(800, 260, 130, sunX, stretch)} />
        <path d={shadow(1170, 190, 95, sunX, stretch)} />
        <path d={shadow(1330, 60, 90, sunX, stretch)} />
        {[250, 360, 470].map((x) => <path key={x} d={shadow(x, 120, 78, sunX, stretch, 18)} />)}
        <path d={shadow(580, 150, 54, sunX, stretch, 12)} />
      </g>

      {/* solar array: panels turn to face the Sun */}
      {[250, 360, 470].map((x) => (
        <g key={x}>
          <rect x={x - 3} y="655" width="6" height="45" fill="#5d5372" />
          <g transform={`rotate(${panelAngle(x)} ${x} 648)`}>
            <rect x={x - 54} y="616" width="108" height="64" rx="4" fill={lowSun ? '#1e2b63' : '#2e57b4'} stroke="#c9d6ff" strokeOpacity="0.55" />
            {[1, 2, 3].map((k) => <line key={k} x1={x - 54 + k * 27} y1="616" x2={x - 54 + k * 27} y2="680" stroke="#0f1a44" strokeOpacity="0.6" />)}
            <line x1={x - 54} y1="648" x2={x + 54} y2="648" stroke="#0f1a44" strokeOpacity="0.6" />
            {!lowSun && <rect x={x - 54} y="616" width="108" height="64" rx="4" fill="#fff" opacity="0.08" />}
            {dusty && <rect x={x - 54} y="616" width="108" height="64" rx="4" fill="#b78d5b" opacity="0.62" />}
          </g>
        </g>
      ))}
      {dusty && <Warn x={360} y={596} />}

      {/* modules joining the buildings */}
      <rect x="520" y="656" width="160" height="44" rx="12" fill="url(#g-mod)" stroke="#fff6e0" strokeOpacity="0.25" />
      <rect x="920" y="656" width="170" height="44" rx="12" fill="url(#g-mod)" stroke="#fff6e0" strokeOpacity="0.25" />

      {/* greenhouse */}
      <path d="M1075 700 A95 95 0 0 1 1265 700 Z" fill="url(#g-glass)" stroke="#d2f0e3" strokeOpacity="0.6" strokeWidth="2" />
      {!paused && !foodLow && <path d="M1085 700 A85 85 0 0 1 1255 700 Z" fill={C.leaf} opacity="0.12" />}
      {[0, 1, 2].slice(0, plants).map((i) => (
        <g key={i} opacity={paused ? 0.5 : 1}>
          <path d={`M${1128 + i * 42} 700 q-12 -30 0 -50 q12 20 0 50`} fill={foodLow ? '#a8803f' : C.leaf} />
          <path d={`M${1128 + i * 42} 700 q10 -18 20 -22 q-4 14 -20 22`} fill={foodLow ? '#8a6830' : '#b6ecb0'} opacity="0.9" />
        </g>
      ))}
      <path d="M1170 605 L1170 700 M1110 640 Q1170 612 1230 640" fill="none" stroke="#d2f0e3" strokeOpacity="0.35" />
      {(foodLow || v.food < 35) && <Warn x={1268} y={618} danger={foodLow} />}

      {/* water tank */}
      <rect x="1300" y="610" width="60" height="90" rx="14" fill="#14233f" stroke={waterLow ? C.coral : '#7ab7d6'} strokeWidth={waterLow ? 3 : 1.5} />
      <rect x="1306" y={616 + 78 * (1 - v.water / 100)} width="48" height={78 * (v.water / 100)} rx="9" fill={waterLow ? C.coral : C.earth} opacity="0.9" />
      {v.water < 40 && <Warn x={1330} y={594} danger={waterLow} />}

      {/* main dome */}
      <path d="M670 700 A130 130 0 0 1 930 700 Z" fill="url(#g-body)" stroke="#fff6e0" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M700 700 A100 100 0 0 1 900 700" fill="none" stroke="#2a2040" strokeOpacity="0.28" />
      <path d="M740 700 A60 60 0 0 1 860 700" fill="none" stroke="#2a2040" strokeOpacity="0.28" />
      {[[745, 634], [800, 606], [855, 634]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="11" fill={C.sun} stroke="#2a2040" strokeWidth="2"
          opacity={v.power < 15 ? undefined : windowOpacity} className={v.power < 15 ? 'g-flicker' : undefined} />
      ))}
      <rect x="778" y="650" width="44" height="50" rx="9" fill="#1c1530" stroke={C.coral} strokeWidth="2" />
      <rect x="788" y="660" width="24" height="22" rx="5" fill={C.sun} opacity={v.power >= 15 ? 0.7 : 0.1} />
      {powerLow && <Warn x={800} y={560} danger={v.power < 15} />}

      {/* antenna */}
      <line x1="800" y1="570" x2="800" y2="540" stroke="#cfc6d8" strokeWidth="3" />
      <path d="M786 530 Q800 552 814 530" fill="none" stroke="#e7dff0" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="800" cy="526" r="5" fill={linkOk ? C.earth : C.coral} />

      {/* shelter bunker, in front */}
      <path d="M440 800 Q560 700 680 800 Z" fill="url(#g-mound)" stroke="#fff6e0" strokeOpacity="0.25" />
      <rect x="532" y="752" width="56" height="48" rx="8" fill="#0d0819" stroke={sheltering ? C.leaf : '#6e6488'} strokeWidth={sheltering ? 3.5 : 2} />
      {sheltering && <rect x="538" y="758" width="44" height="42" rx="6" fill={C.leaf} opacity="0.28" />}

      {/* crew */}
      {crew.map((c, i) => (
        <g key={CREW[i].name} className="g-walk" style={{ transform: `translate(${c.x}px, ${c.y}px) scale(${c.s})` }}>
          <Astronaut tint={crewTint} accent={CREW[i].accent} speaking={speaking.has(i)} delay={i * 0.4} />
        </g>
      ))}
      {sheltering && <text x="560" y="858" textAnchor="middle" fontSize="20" fill={C.leaf} fontWeight="700" fontFamily="Atkinson Hyperlegible, sans-serif">Crew in the shelter</text>}

      {/* foreground rocks frame the view */}
      <path d="M0 1020 L0 790 L58 760 L126 784 L196 836 L236 1020 Z" fill="#0a0713" />
      <path d="M0 790 L58 760 L126 784" fill="none" stroke="url(#g-rim)" strokeWidth="2.5" />
      <path d="M1600 1020 L1600 780 L1530 752 L1452 790 L1398 846 L1366 1020 Z" fill="#0a0713" />
      <path d="M1600 780 L1530 752 L1452 790" fill="none" stroke="url(#g-rim)" strokeWidth="2.5" />
      <rect y="120" width={W} height="900" fill="url(#g-vig)" pointerEvents="none" />

      {/* simulated solar storm */}
      {radiation && (
        <g aria-hidden="true" pointerEvents="none">
          <rect y="120" width={W} height="900" fill="#7c4dff" opacity="0.07" />
          <rect x="4" y="124" width={W - 8} height="892" fill="none" stroke={C.coral} strokeWidth="8" className="g-alarm" />
          {RAD.map((r, i) => (
            <line key={i} className="g-rad" x1={r.x} y1="120" x2={r.x - 10} y2="146" stroke="#d6c9ff" strokeWidth="3" strokeLinecap="round"
              style={{ animationDelay: `${r.d}s` }} />
          ))}
        </g>
      )}
    </svg>
  )
}

// A small warning mark. The picture never relies on colour alone: this "!" sits on the problem system.
function Warn({ x, y, danger = true }) {
  return (
    <g aria-hidden="true">
      <circle cx={x} cy={y} r="14" fill={danger ? C.coral : C.sun} stroke="#1a0f12" strokeWidth="2" />
      <text x={x} y={y + 6} textAnchor="middle" fontSize="19" fontWeight="800" fill="#1a0f12" fontFamily="Atkinson Hyperlegible, sans-serif">!</text>
    </g>
  )
}
