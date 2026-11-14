// Mission ladder progress. Client-side only -- nothing here is sent to
// the backend or stored in the database. One mission must be finished
// successfully before the next one unlocks.
const KEY = 'astra.ladder'

export const LADDER = [
  { id: 'cadet', title: 'First Landing', hint: 'A friendly first mission' },
  { id: 'storm_season', title: 'Storm Season', hint: 'Solar storms hit harder. Shielding matters.' },
  { id: 'the_long_night', title: 'The Long Night', hint: 'A tighter power budget, with no spare sunlight.' },
  { id: 'commander', title: 'Commander', hint: 'Less sunlight power, smaller supplies and two extra problems.' },
]

function doneSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function isUnlocked(id) {
  const index = LADDER.findIndex((l) => l.id === id)
  if (index <= 0) return true
  const done = doneSet()
  return done.has(LADDER[index - 1].id)
}

export function isDone(id) {
  return doneSet().has(id)
}

export function markDone(id) {
  try {
    const done = doneSet()
    done.add(id)
    localStorage.setItem(KEY, JSON.stringify([...done]))
  } catch {
    // localStorage can throw (private browsing, etc.) -- never let that break the game
  }
}
