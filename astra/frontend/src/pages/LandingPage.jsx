import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Rocket, ShieldCheck, Wind, Zap } from 'lucide-react'
import '@fontsource-variable/unbounded'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '../styles/space.css'
import SpaceBackdrop from '../components/common/SpaceBackdrop'
import MoonHorizon from '../components/common/MoonHorizon'
import ApiStatus from '../components/common/ApiStatus'
import StatusPill from '../components/common/StatusPill'

const PILLARS = [
  { icon: Zap, title: 'Power', text: 'Share limited electricity between life support, plants and science.' },
  { icon: Wind, title: 'Life support', text: 'Keep the air and water flowing for your crew.' },
  { icon: ShieldCheck, title: 'Protection', text: 'Get ready for solar storms and space radiation.' },
]

export default function LandingPage() {
  return (
    <div className="land">
      <SpaceBackdrop bright />

      <header className="land-nav glass">
        <span className="logo"><Rocket size={18} aria-hidden="true" /> ASTRA</span>
        <nav aria-label="Main">
          <Link to="/academy">Academy</Link>
          <Link to="/nasa">NASA Hub</Link>
          <StatusPill kind="SIMULATED" className="ml-2" />
        </nav>
      </header>

      <main>
        <section className="land-hero" aria-labelledby="land-title">
          <MoonHorizon className="land-moon" />

          <div className="land-word">
            <span className="land-orbit" aria-hidden="true"><i /></span>
            <h1 id="land-title">ASTRA</h1>
          </div>
          <p className="land-kicker">Junior Astronaut Mission Trainer</p>

          <div className="land-card glass">
            <h2>Your mission. Your decisions.<br /><span>Their survival.</span></h2>
            <p className="land-lead">
              Command a Moon base near the south pole, where the Sun hangs low and the shadows are long.
              Every choice changes what happens next. In space there is no perfect answer, only trade-offs.
            </p>
            <div className="land-actions">
              <Link to="/play" className="btn btn-primary">Enter Mission Control <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link to="/academy" className="btn btn-ghost"><GraduationCap size={18} aria-hidden="true" /> Astronaut Academy</Link>
            </div>
            <ApiStatus />
          </div>
        </section>

        <section className="land-more" aria-label="What you will manage">
          <h2>Three dials. <span>One crew.</span></h2>
          <ul className="land-grid">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="glass">
                <span className="ico"><Icon size={22} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
          <p className="land-note">
            ASTRA is a training game. Numbers in the game are made-up learning units, not real NASA measurements.
            Real NASA data is always labelled LIVE, CACHED or ARCHIVED, with its source.
          </p>
          <p className="land-note">&copy; 2026 Anannya A K &middot; Team Orbitelle &middot; MIT License</p>
        </section>
      </main>
    </div>
  )
}
