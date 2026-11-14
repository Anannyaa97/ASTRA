// Shows the current stage, its goal and how far through the mission the player is.
export default function StageBanner({ mission }) {
  const { state, stage } = mission
  // While playing, today is not finished yet. Once the mission has ended, the last day counts as done.
  const ended = state.status !== 'active'
  const daysDone = ended ? state.day : state.day - 1
  const pct = Math.round((daysDone / state.mission_days) * 100)
  const dayLabel = state.status === 'success'
    ? `Mission complete: day ${state.mission_days} of ${state.mission_days}`
    : state.status === 'failed'
      ? `Mission ended on day ${state.day} of ${state.mission_days}`
      : `Day ${state.day} of ${state.mission_days}`
  return (
    <section aria-label="Mission progress" className="panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-extrabold">Stage {stage.number}: {stage.name}</h2>
        <p className="font-bold text-electric">{dayLabel}</p>
      </div>
      <p className="mt-1 text-sm text-ink-dim">{stage.goal}</p>
      <div role="progressbar" aria-label="Mission progress" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={pct} className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-electric to-violet transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </section>
  )
}
