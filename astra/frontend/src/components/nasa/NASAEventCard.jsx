import { ExternalLink } from 'lucide-react'

const BADGE = {
  FLR: 'border-warn/40 bg-warn/10 text-warn',
  CME: 'border-violet/40 bg-violet/10 text-violet',
  SEP: 'border-danger/40 bg-danger/10 text-danger',
  GST: 'border-electric/40 bg-electric/10 text-electric',
}

// DONKI dates look like 2026-11-01T01:00Z (or just a date). Show the date, in plain words.
export function formatDate(text) {
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return text
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

// One real (or archived) NASA space-weather event. It always says what it is, in kid words.
export default function NASAEventCard({ event }) {
  return (
    <li className="panel space-y-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${BADGE[event.type] ?? ''}`}>
          {event.type_name}
        </span>
        <span className="text-sm text-ink-dim">{formatDate(event.start_time)}</span>
      </div>
      <h3 className="font-extrabold">{event.headline}</h3>
      <p className="text-sm">{event.kid_text}</p>
      {event.detail && <p className="text-sm text-ink-dim">{event.detail}</p>}
      {event.note && (
        <details className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm">
          <summary className="cursor-pointer font-semibold">Scientist&apos;s note</summary>
          <p className="mt-1 text-ink-dim">{event.note}</p>
        </details>
      )}
      <a href={event.link} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-semibold text-electric underline underline-offset-4">
        See it at NASA <ExternalLink size={14} aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </li>
  )
}
