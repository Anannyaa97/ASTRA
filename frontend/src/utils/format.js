// Shared display helpers. These only format numbers for display; they never change game values.

export const LEVEL_STYLES = {
  ok: { bar: 'bg-ok', text: 'text-ok', word: 'Good' },
  warn: { bar: 'bg-warn', text: 'text-warn', word: 'Low' },
  danger: { bar: 'bg-danger', text: 'text-danger', word: 'Critical' },
}

export function levelOf(value) {
  if (value >= 50) return 'ok'
  if (value >= 25) return 'warn'
  return 'danger'
}

export const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export const signed = (n) => `${n > 0 ? '+' : ''}${fmt(n)}`

// Child-friendly names for every value the API can return.
export const VALUE_LABELS = {
  power: 'Power',
  oxygen: 'Oxygen',
  water: 'Water',
  food: 'Food',
  shielding: 'Protection',
  crew_health: 'Crew health',
  battery: 'Backup battery',
  research: 'Research',
  comms: 'Link to Earth',
}

export const SOURCE_LABELS = {
  REAL_NASA_OBSERVATION: { text: 'Real NASA observation', style: 'border-ok/50 bg-ok/10 text-ok' },
  NASA_INSPIRED_TRAINING: { text: 'NASA-inspired training scenario', style: 'border-violet/50 bg-violet/15 text-violet' },
  SIMULATED_ENGINEERING: { text: 'Simulated engineering event', style: 'border-warn/50 bg-warn/10 text-warn' },
}

export const SCORE_LABELS = {
  crew_safety: 'Crew safety',
  resource_management: 'Resource management',
  research_progress: 'Research progress',
  emergency_response: 'Emergency response',
  sustainability: 'Sustainability',
}

// The three big indicators the player always sees (spec section 9).
export function primaryIndicators(values) {
  return [
    { key: 'power', label: 'Power', value: values.power, hint: 'Electricity for every system' },
    {
      key: 'life', label: 'Life support', value: Math.min(values.oxygen, values.water),
      hint: `Oxygen ${fmt(values.oxygen)}, water ${fmt(values.water)}`,
    },
    { key: 'protection', label: 'Protection', value: values.shielding, hint: 'Shelter and shielding' },
  ]
}

// Plain-words sentence for one line of a prediction. The engine compares an option with
// "doing nothing", so a number can be BETTER than doing nothing and still go down.
// Saying that out loud stops "it said higher, but it dropped" confusion.
export function describeChange(key, preview) {
  const now = preview.start?.[key]
  const end = preview.forecast?.[preview.forecast.length - 1]?.[key]
  const diff = Math.abs(preview.change_vs_no_action[key])
  const better = preview.direction[key] === 'up'
  const amount = Math.round(diff * 10) / 10
  if (now == null || end == null) return `${amount} ${better ? 'more' : 'less'} than if you did nothing`
  const rises = end - now > 0.5
  const falls = end - now < -0.5
  if (better) {
    if (falls) return `still goes down, but ${amount} less than if you did nothing`
    return rises ? `goes up, ${amount} more than if you did nothing` : `stays steady, ${amount} better than if you did nothing`
  }
  if (rises) return `still goes up, but ${amount} less than if you did nothing`
  return falls ? `goes down, ${amount} more than if you did nothing` : `${amount} less than if you did nothing`
}
