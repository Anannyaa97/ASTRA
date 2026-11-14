import { AnimatePresence, motion } from 'framer-motion'
import { CREW, crewIndex } from '../utils/crewTalk'

// What the crew is saying right now, from the real mission state. aria-live so a screen reader hears new lines.
export default function CrewTalk({ talk }) {
  return (
    <div className="g-talk">
      <ul aria-live="polite" aria-label="Crew radio">
        <AnimatePresence mode="popLayout" initial={false}>
          {talk.map((t) => {
            const member = CREW[crewIndex(t.who)]
            return (
              <motion.li key={`${t.who}-${t.line}`} layout className="g-line"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <span className="g-avatar" style={{ background: member.accent }} aria-hidden="true">{member.name[0]}</span>
                <div>
                  <div className="g-who g-display">{member.name}, {member.role}</div>
                  <p className={`g-say ${t.level}`}>{t.line}</p>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </div>
  )
}
