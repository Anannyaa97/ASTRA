// The visual digital twin of the outpost (spec section 14D). Everything drawn here comes from
// the real simulation state, nothing is decorative:
//   low power      -> habitat windows dim
//   low sunlight   -> sun fades, solar panels go dark
//   low water      -> water tank warning
//   low food       -> plants wilt, greenhouse warning
//   radiation      -> particles fall, crew moves into the shelter
//   weak link      -> Earth link turns into a red dashed line
import { AnimatePresence, motion } from 'framer-motion'
import { CREW, crewIndex, crewTalk } from '../../utils/crewTalk'
import LunarScene from '../../game/LunarScene'
import '../../game/game.css'

export default function HabitatView({ state }) {
  const v = state.values
  const dusty = (state.efficiency?.solar ?? 1) < 0.85
  const lowSun = state.active_conditions.low_sunlight
  const radiation = state.active_conditions.radiation_hazard
  const sheltering = state.sheltering
  const linkOk = v.comms >= 70
  const talk = crewTalk(state)

  const summary = [
    lowSun ? 'Sunlight is low.' : 'The Sun is shining on the panels.',
    v.power < 35 ? 'Power is low and the habitat lights are dim.' : 'Habitat lights are on.',
    v.water < 25 ? 'The water tank is almost empty.' : 'Water tank is fine.',
    v.food < 25 ? 'The plants are wilting.' : 'The plants are healthy.',
    dusty ? 'Moon dust covers the solar panels.' : '',
    sheltering ? 'The crew is sheltering underground.' : 'The crew is in the habitat.',
    radiation ? 'Simulated radiation particles are falling.' : '',
    linkOk ? 'The link to Earth is strong.' : 'The link to Earth is weak.',
  ].filter(Boolean).join(' ')

  return (
    <figure className="panel overflow-hidden p-0">
      <div className="relative aspect-video w-full overflow-hidden" role="img" aria-label={`Lunar habitat. ${summary}`}>
        <LunarScene state={state} talk={talk} />
      </div>
      <CrewRadio talk={talk} sheltering={sheltering} health={v.crew_health} />
      <figcaption className="px-4 py-2 text-xs text-ink-dim">
        A picture of the outpost. It changes as your decisions change the mission. Simulated, not a real habitat.
      </figcaption>
    </figure>
  )
}

const LEVEL_TEXT = { danger: 'text-danger', warn: 'text-warn', ok: 'text-ok' }

// The crew radio: what the astronauts are saying right now, picked from the real mission state.
// aria-live so a screen reader hears new messages without losing its place.
function CrewRadio({ talk, sheltering, health }) {
  return (
    <div className="space-y-2 px-4 pt-3">
      <ul aria-live="polite" aria-label="Crew radio" className="space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {talk.map((t) => {
            const member = CREW[crewIndex(t.who)]
            return (
              <motion.li
                key={`${t.who}-${t.line}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold text-space-950"
                  style={{ background: member.accent }} aria-hidden="true">{member.name[0]}</span>
                <p className="min-w-0">
                  <span className="text-sm font-bold">{member.name}</span>
                  <span className="text-xs text-ink-dim"> ({member.role})</span>
                  <span className={`block ${LEVEL_TEXT[t.level]}`}>{t.line}</span>
                </p>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
      <p className="text-xs text-ink-dim">
        Crew: {CREW.map((c) => `${c.name} (${c.role})`).join(', ')}
        {' \u2014 '}{sheltering ? 'all in the shelter' : health >= 60 ? 'all well' : health >= 30 ? 'feeling unwell' : 'in danger'}
      </p>
    </div>
  )
}
