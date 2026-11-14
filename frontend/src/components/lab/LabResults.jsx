import { useState } from 'react'
import { ArrowDown, ArrowUp, Lightbulb, Minus } from 'lucide-react'
import ResourceChart from '../reports/ResourceChart'
import StatusPill from '../common/StatusPill'
import { VALUE_LABELS, fmt, signed } from '../../utils/format'

const KEYS = ['power', 'oxygen', 'water', 'food', 'crew_health', 'research']

const DIRECTION = {
  up: { Icon: ArrowUp, word: 'higher', style: 'text-ok' },
  down: { Icon: ArrowDown, word: 'lower', style: 'text-warn' },
  same: { Icon: Minus, word: 'about the same', style: 'text-ink-dim' },
}

// Before-and-after results of one experiment: summary cards, a two-line chart and a plain explanation.
export default function LabResults({ result }) {
  const [metric, setMetric] = useState('power')

  const dayCount = Math.max(result.normal.series.length, result.what_if.series.length)
  const rows = Array.from({ length: dayCount }, (_, i) => ({
    day: i,
    Normal: result.normal.series[i]?.values[metric],
    'What if': result.what_if.series[i]?.values[metric],
  }))
  const lines = [
    { key: 'Normal', label: 'Normal run', color: '#9fb0dc' },
    { key: 'What if', label: 'What-if run', color: '#fbbf24', dashed: true },
  ]
  const early = [
    result.normal.ended_early && `Normal run: ${result.normal.ended_early}`,
    result.what_if.ended_early && `What-if run: ${result.what_if.ended_early}`,
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      <header className="panel space-y-1 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-extrabold">What happened?</h2>
          <StatusPill kind="SIMULATED" />
        </div>
        <p className="text-sm text-ink-dim">
          {result.start}, {result.days} {result.days === 1 ? 'day' : 'days'}
          {result.storm ? ', with a training solar storm' : ''}.
        </p>
      </header>

      {early.length > 0 && (
        <div role="alert" className="rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm">
          {early.map((text) => <p key={text}>{text}</p>)}
        </div>
      )}

      <section aria-label="Explanation" className="panel p-5">
        <ul className="space-y-2">
          {result.explanation.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Lightbulb size={16} className="mt-1 shrink-0 text-violet" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Normal run compared with what-if run" className="panel p-5">
        <h3 className="mb-3 font-extrabold">At the end</h3>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {KEYS.map((key) => {
            const { Icon, word, style } = DIRECTION[result.direction[key]]
            return (
              <li key={key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-ink-dim">{VALUE_LABELS[key]}</p>
                <p className="mt-1 text-sm">
                  <span className="block">Normal run: <span className="font-bold">{fmt(result.normal.final[key])}</span></span>
                  <span className="block">What-if run: <span className="font-bold">{fmt(result.what_if.final[key])}</span></span>
                </p>
                <p className={`mt-1 flex items-center gap-1 text-sm font-semibold ${style}`}>
                  <Icon size={16} aria-hidden="true" />
                  {result.direction[key] === 'same' ? word : `${signed(result.change[key])}, ${word}`}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label="Chart" className="panel p-5">
        <h3 className="mb-2 font-extrabold">Day by day</h3>
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Choose what to chart">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={metric === key}
              onClick={() => setMetric(key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                metric === key ? 'border-electric bg-electric/20 text-white' : 'border-white/15 text-ink-dim hover:bg-white/5'
              }`}
            >
              {VALUE_LABELS[key]}
            </button>
          ))}
        </div>
        <ResourceChart
          data={rows}
          series={lines}
          description={`${VALUE_LABELS[metric]} for each lab day, normal run compared with what-if run`}
        />
        <p className="mt-2 text-xs text-ink-dim">Solid line: normal run. Dashed line: what-if run.</p>
      </section>

      <p className="text-xs text-ink-dim">{result.disclaimer}</p>
    </div>
  )
}
