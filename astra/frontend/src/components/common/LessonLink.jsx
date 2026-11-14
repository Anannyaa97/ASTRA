import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { lessonById } from '../../data/lessons'

// A small link to the Academy lesson that explains a topic. Shows nothing for an unknown topic.
export default function LessonLink({ topic, className = '' }) {
  const lesson = lessonById(topic)
  if (!lesson) return null
  return (
    <Link to={`/academy#${lesson.id}`}
      className={`inline-flex items-center gap-2 text-sm font-semibold text-electric underline underline-offset-4 ${className}`}>
      <GraduationCap size={16} aria-hidden="true" />
      Learn more: {lesson.title}
    </Link>
  )
}
