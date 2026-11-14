import { Link } from 'react-router-dom'
import { Database, ExternalLink, ShieldCheck } from 'lucide-react'
import StatusPill from '../components/common/StatusPill'
import { DATASETS, RULES, SIMULATED } from '../data/datasets'

const Row = ({ label, children }) => (
  <div>
    <dt className="text-xs font-bold uppercase tracking-wide text-ink-dim">{label}</dt>
    <dd className="mt-0.5">{children}</dd>
  </div>
)

export default function DataPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="panel space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric/20 text-electric">
            <Database size={24} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-extrabold md:text-3xl">How ASTRA uses NASA data</h1>
        </div>
        <p className="max-w-prose text-ink-dim">
          ASTRA mixes real science with a game. This page lists every source, why it was chosen, where you can see it,
          and what it is <strong>not</strong>, so the science can be checked.
        </p>
        <p className="flex flex-wrap gap-2 text-xs text-ink-dim">
          <span><StatusPill kind="LIVE" /> fetched just now</span>
          <span><StatusPill kind="CACHED" /> saved from an earlier fetch</span>
          <span><StatusPill kind="ARCHIVED" /> real data saved earlier</span>
          <span><StatusPill kind="SIMULATED" /> game scenario</span>
        </p>
      </header>

      <ul className="space-y-4">
        {DATASETS.map((d) => (
          <li key={d.id} className="panel space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold">{d.name}</h2>
              {d.status.map((s) => <StatusPill key={s} kind={s} />)}
              {d.status.length === 0 && <span className="pill border border-white/20 text-ink-dim">LINK ONLY</span>}
            </div>
            <p className="text-sm text-ink-dim">{d.owner}</p>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <Row label="What it is">{d.what}</Row>
              <Row label="Why we chose it">{d.why}</Row>
              <Row label="Where to see it">{d.where}</Row>
              <Row label="How ASTRA uses it">{d.how}</Row>
            </dl>
            <p className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm"><strong>What it is not:</strong> {d.limit}</p>
            <a href={d.link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-electric underline underline-offset-4">
              Open the original source <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>

      <section aria-labelledby="sim-title" className="panel space-y-3 p-5">
        <h2 id="sim-title" className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
          What is invented <StatusPill kind="SIMULATED" />
        </h2>
        <ul className="space-y-2 text-sm">
          {SIMULATED.map(([title, text]) => (
            <li key={title}><strong>{title}.</strong> <span className="text-ink-dim">{text}</span></li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="rules-title" className="panel space-y-3 p-5">
        <h2 id="rules-title" className="flex items-center gap-2 text-lg font-extrabold">
          <ShieldCheck size={20} aria-hidden="true" /> Our rules for data
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-dim">
          {RULES.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <p className="text-sm">
          See the live data in the <Link to="/nasa" className="font-semibold text-electric underline underline-offset-4">NASA Reality Hub</Link>.
        </p>
      </section>
    </div>
  )
}
