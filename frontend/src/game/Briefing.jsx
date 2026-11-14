import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Gauge, Rocket, Users } from 'lucide-react'
import { CREW } from '../utils/crewTalk'
import { sfx } from './sound'

const KEY = (id) => `astra.briefed.${id}`
export const wasBriefed = (id) => { try { return localStorage.getItem(KEY(id)) === '1' } catch { return false } }
const markBriefed = (id) => { try { localStorage.setItem(KEY(id), '1') } catch { /* ignore */ } }

const SLIDES = [
  {
    icon: Rocket, title: 'Welcome, Commander!',
    text: 'You are in charge of a small Moon base near the Moon’s south pole. There, the Sun stays low and the shadows are long. Your job: keep the crew safe for 20 days.',
  },
  {
    icon: Users, title: 'Meet your crew',
    text: 'Four astronauts trust your decisions. They will talk to you as things change.', crew: true,
  },
  {
    icon: Gauge, title: 'Watch the three dials',
    text: 'Power runs everything. Life support is air and water. Protection guards the crew from space radiation. Every choice helps one dial and costs another. There is no perfect answer, only trade-offs.',
  },
]

// The opening briefing, shown once for each new mission. It can be skipped at any time.
export default function Briefing({ missionId, onDone }) {
  const [i, setI] = useState(0)
  const btn = useRef(null)
  const last = i === SLIDES.length - 1
  const s = SLIDES[i]
  const Icon = s.icon
  const finish = () => { markBriefed(missionId); onDone() }

  useEffect(() => { btn.current?.focus() }, [i])

  return (
    <section className="g-msg g-brief" aria-labelledby="g-brief-title">
      <div className="g-brief-body" key={i}>
        <span className="g-brief-icon"><Icon size={30} aria-hidden="true" /></span>
        <p className="g-display g-end-kicker">Mission briefing · {i + 1} of {SLIDES.length}</p>
        <h2 id="g-brief-title" className="g-display">{s.title}</h2>
        <p className="g-brief-text">{s.text}</p>
        {s.crew && (
          <ul className="g-brief-crew">
            {CREW.map((c) => (
              <li key={c.name} style={{ '--c': c.accent }}><i aria-hidden="true">{c.name[0]}</i><b>{c.name}</b><span>{c.role}</span></li>
            ))}
          </ul>
        )}
        <div className="g-end-actions">
          <button ref={btn} type="button" className="g-btn" onClick={() => { sfx.play('select'); last ? finish() : setI(i + 1) }}>
            {last ? 'Begin the mission' : <>Next <ArrowRight size={18} aria-hidden="true" /></>}
          </button>
          {!last && <button type="button" className="g-btn quiet" onClick={finish}>Skip</button>}
        </div>
        <p className="g-pv-foot">A fictional training outpost. All numbers are game units, not real NASA measurements.</p>
      </div>
    </section>
  )
}
