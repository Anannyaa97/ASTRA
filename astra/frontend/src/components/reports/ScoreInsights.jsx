import { Lightbulb } from 'lucide-react'
import { SCORE_LABELS } from '../../utils/format'
import LessonLink from '../common/LessonLink'

// Explains each weak score using the real mission history: what happened (why) and what to try (tip).
export default function ScoreInsights({ insights }) {
  if (!insights || insights.length === 0) return null
  return (
    <section aria-label="Why some scores were lower" className="panel p-5">
      <h2 className="mb-1 text-xl font-extrabold">Why some scores were lower</h2>
      <p className="mb-3 text-sm text-ink-dim">
        These come from what really happened in your mission. Use them to plan a better try next time.
      </p>
      <ul className="space-y-4">
        {insights.map((item) => (
          <li key={item.category} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-bold">
              {SCORE_LABELS[item.category] ?? item.category}
              <span className="ml-2 text-sm font-normal text-ink-dim">{Math.round(item.score)} out of 100</span>
            </p>
            <p className="mt-1 text-sm">{item.why}</p>
            <p className="mt-2 flex items-start gap-2 text-sm text-violet">
              <Lightbulb size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span><span className="font-semibold">Try this:</span> {item.tip}</span>
            </p>
            <LessonLink topic={item.topic} className="mt-2" />
          </li>
        ))}
      </ul>
    </section>
  )
}
