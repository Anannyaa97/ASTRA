import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ExternalLink, CloudFog, Droplets, GraduationCap, Radio, ShieldCheck, Sprout, Sun, Wind } from 'lucide-react'
import StatusPill from '../components/common/StatusPill'
import { LESSONS } from '../data/lessons'

const ICONS = { Sun, Wind, Droplets, Sprout, ShieldCheck, CloudFog, Radio }

function Lesson({ lesson, selected }) {
  const ref = useRef(null)
  // When another page links here (/academy#water), open that lesson and scroll to it.
  useEffect(() => {
    if (selected && ref.current) {
      ref.current.open = true
      ref.current.scrollIntoView({ block: 'start' })
    }
  }, [selected])
  const Icon = ICONS[lesson.icon] ?? GraduationCap
  return (
    // A native details element: keyboard and screen reader friendly with no extra code.
    <details ref={ref} id={lesson.id} className="panel group scroll-mt-4">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 md:p-5 [&::-webkit-details-marker]:hidden">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-electric/20 text-electric">
          <Icon size={26} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold leading-tight">{lesson.title}</span>
          <span className="mt-0.5 block text-sm text-ink-dim">{lesson.bigIdea}</span>
        </span>
        <ChevronDown className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="space-y-4 border-t border-white/10 p-4 md:p-5">
        <section aria-label="How it works">
          <h3 className="mb-1 font-bold">How it works</h3>
          <ul className="list-disc space-y-1 pl-5">
            {lesson.how.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>

        <section aria-label="In real space" className="rounded-xl border border-violet/30 bg-violet/10 p-3">
          <h3 className="mb-1 font-bold text-violet">In real space</h3>
          <p className="text-sm">{lesson.real}</p>
        </section>

        <section aria-label="In the game" className="rounded-xl border border-warn/30 bg-warn/10 p-3">
          <h3 className="mb-1 flex items-center gap-2 font-bold text-warn">In ASTRA <StatusPill kind="SIMULATED" /></h3>
          <p className="text-sm">{lesson.game}</p>
        </section>

        <p>
          <Link to={lesson.tryIt.to} className="font-semibold text-electric underline underline-offset-4">
            {lesson.tryIt.text}
          </Link>
        </p>
        {lesson.more && (
          <p>
            <a href={lesson.more.href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-electric underline underline-offset-4">
              {lesson.more.text} <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        )}
      </div>
    </details>
  )
}

export default function Academy() {
  const selected = useLocation().hash.slice(1)
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="panel space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric/20 text-electric">
            <GraduationCap size={24} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-extrabold md:text-3xl">Astronaut Academy</h1>
        </div>
        <p className="max-w-prose text-ink-dim">
          Short lessons on how a Moon outpost really works. Tap a lesson to open it.
        </p>
      </header>

      <div className="space-y-3">
        {LESSONS.map((lesson) => <Lesson key={lesson.id} lesson={lesson} selected={selected === lesson.id} />)}
      </div>

      <p className="text-xs text-ink-dim">
        The &quot;In real space&quot; boxes are simple summaries of well-known facts. The numbers inside the
        game are simplified game units, not real NASA measurements.
      </p>
    </div>
  )
}
