// What the crew says, chosen from the REAL mission state. Pure and deterministic: the same state gives the
// same lines. Each astronaut has a job, so the right person speaks about the right problem.
//   Ava = Commander (the player's crew leader), Kai = Engineer (power, panels), Mira = Scientist (air, water, food),
//   Leo = Pilot (the link to Earth).
export const CREW = [
  { name: 'Ava', role: 'Commander', accent: '#8b5cf6' },
  { name: 'Kai', role: 'Engineer', accent: '#3d8bff' },
  { name: 'Mira', role: 'Scientist', accent: '#2dd4bf' },
  { name: 'Leo', role: 'Pilot', accent: '#fbbf24' },
]

const RANK = { danger: 0, warn: 1, ok: 2 }

const CALM_LINES = [
  ['Ava', 'All systems look steady, Commander.'],
  ['Kai', 'The panels are humming along nicely.'],
  ['Mira', 'The plants are growing well today.'],
  ['Leo', 'The link to Earth is loud and clear.'],
]

export function crewTalk(state, max = 2) {
  const v = state.values
  const cond = state.active_conditions ?? {}
  const dusty = (state.efficiency?.solar ?? 1) < 0.85
  const say = []
  const add = (who, level, line) => say.push({ who, level, line })

  if (state.sheltering) add('Ava', 'ok', 'Everyone is in the shelter. We will wait out the storm together.')
  else if (cond.radiation_hazard) add('Ava', 'danger', 'The sensors show a solar storm! Should we go to the shelter, Commander?')

  if (v.power < 15) add('Kai', 'danger', 'The lights are flickering. Power is almost gone!')
  else if (v.power < 35) add('Kai', 'warn', 'Power is getting low. Which systems can we switch off?')
  if (dusty) add('Kai', 'warn', 'Moon dust is covering the solar panels, so they make less power.')
  else if (cond.low_sunlight) add('Kai', 'warn', 'The Sun is low in the sky. Our panels make less power.')

  if (v.oxygen < 25) add('Mira', 'danger', 'The air is running low. We need the oxygen system working!')
  if (v.water < 25) add('Mira', 'danger', 'The water tank is almost empty!')
  else if (v.water < 40) add('Mira', 'warn', 'Water is getting low. The plants are thirsty too.')
  if (v.food < 25) add('Mira', 'danger', 'The plants are wilting. We are running out of food.')
  else if (v.food < 40) add('Mira', 'warn', 'Food is getting low. The greenhouse needs more time.')

  if (v.comms < 70) add('Leo', 'warn', 'I cannot reach Earth. The link is weak.')
  if (v.crew_health < 60 && !state.sheltering) add('Ava', 'warn', 'Some of us are feeling unwell, Commander.')

  say.sort((a, b) => RANK[a.level] - RANK[b.level])      // stable: urgent first, then the order added above
  if (say.length === 0) {
    const [who, line] = CALM_LINES[(state.day ?? 0) % CALM_LINES.length]
    return [{ who, level: 'ok', line }]
  }
  return say.slice(0, max)
}

export const crewIndex = (name) => CREW.findIndex((c) => c.name === name)
