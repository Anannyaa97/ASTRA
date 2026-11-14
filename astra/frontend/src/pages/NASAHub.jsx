import { ExternalLink, Globe2, Leaf, Moon, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatusPill from '../components/common/StatusPill'
import SpaceWeatherSection from '../components/nasa/SpaceWeatherSection'
import RadiationSection from '../components/nasa/RadiationSection'
import ResearchCard from '../components/nasa/ResearchCard'
import { BIOLOGY_CARDS, CHECKED_ON } from '../data/biology'
import { LUNAR_FACTS } from '../data/lunar'

export default function NASAHub() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="panel space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric/20 text-electric">
            <Globe2 size={24} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-extrabold md:text-3xl">NASA Reality Hub</h1>
        </div>
        <p className="max-w-prose text-ink-dim">
          What is real, and what is the game? Every box here has a label so you always know.
        </p>
        <p className="text-sm">
          <Link to="/data" className="font-semibold text-electric underline underline-offset-4">
            See which NASA data ASTRA uses, and why
          </Link>
        </p>
        <p className="flex flex-wrap gap-2 text-xs text-ink-dim">
          <span><StatusPill kind="LIVE" /> fetched from NASA just now</span>
          <span><StatusPill kind="CACHED" /> saved from an earlier fetch</span>
          <span><StatusPill kind="ARCHIVED" /> curated NASA summary</span>
          <span><StatusPill kind="SIMULATED" /> game scenario</span>
        </p>
      </header>

      <SpaceWeatherSection />

      <RadiationSection />

      <section aria-label="How space weather connects to the game" className="panel space-y-2 border-warn/30 p-5">
        <h2 className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
          <Rocket size={20} aria-hidden="true" /> From real Sun to training game <StatusPill kind="SIMULATED" />
        </h2>
        <p>
          Real events like the ones above inspired ASTRA&apos;s <strong>Solar Particle Warning</strong> training
          scenario. But the storm in the game is made up. It is not one of these events, and the crew&apos;s
          &quot;radiation risk&quot; in the game is a simple game number, not a real dose.
        </p>
        <Link to="/academy#radiation" className="font-semibold text-electric underline underline-offset-4">
          Learn more: Radiation and shelters
        </Link>
      </section>

      <section aria-labelledby="lunar-title" className="space-y-3">
        <div className="panel space-y-2 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet/20 text-violet">
              <Moon size={24} aria-hidden="true" />
            </span>
            <h2 id="lunar-title" className="text-xl font-extrabold md:text-2xl">The Moon&apos;s South Pole</h2>
            <StatusPill kind="ARCHIVED" />
          </div>
          <p className="text-sm text-ink-dim">
            Short summaries of widely published NASA knowledge. These are not live measurements.
            Find real pictures at the{' '}
            <a href="https://images.nasa.gov/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-electric underline underline-offset-4">
              NASA Image and Video Library <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>.
          </p>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {LUNAR_FACTS.map((f) => (
            <li key={f.title} className="panel space-y-2 p-4">
              <h3 className="font-extrabold">{f.title}</h3>
              <p className="text-sm">{f.text}</p>
              <p className="rounded-lg border border-warn/30 bg-warn/10 p-2 text-sm">
                <span className="font-bold text-warn">In ASTRA: </span>{f.game}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="bio-title" className="space-y-3">
        <div className="panel space-y-2 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-ok/20 text-ok">
              <Leaf size={24} aria-hidden="true" />
            </span>
            <h2 id="bio-title" className="text-xl font-extrabold md:text-2xl">Space biology</h2>
            <StatusPill kind="ARCHIVED" />
          </div>
          <p className="text-sm text-ink-dim">
            Real NASA research about plants and people in space. Each card links to the source and was checked on {CHECKED_ON}.
            We use NASA&apos;s own findings, in simpler words.{' '}
            <a href="https://osdr.nasa.gov/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-electric underline underline-offset-4">
              Explore the NASA Open Science Data Repository <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {BIOLOGY_CARDS.map((card) => <ResearchCard key={card.id} card={card} />)}
        </ul>
      </section>
    </div>
  )
}
