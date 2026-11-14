import { SOURCE_LABELS } from '../../utils/format'
import { EVENT_LESSON } from '../../data/lessons'
import LessonLink from '../common/LessonLink'

// Today's event. The source tag is always shown so a game scenario is never mistaken for real NASA data.
export default function MissionEventCard({ event }) {
  const source = SOURCE_LABELS[event.source]
  return (
    <article className="panel p-4 md:p-5">
      <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold ${source.style}`}>
        {source.text}
      </span>
      <h2 className="mt-3 text-xl font-extrabold md:text-2xl">{event.title}</h2>
      <p className="mt-2 max-w-prose text-ink-dim">{event.description}</p>
      <LessonLink topic={EVENT_LESSON[event.id]} className="mt-3" />
    </article>
  )
}
