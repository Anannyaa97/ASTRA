import { Link, useNavigate } from 'react-router-dom'
import { Lightbulb, X } from 'lucide-react'
import { useMission } from '../context/MissionContext'
import NoMission from '../components/common/NoMission'
import HabitatView from '../components/mission/HabitatView'
import StageBanner from '../components/mission/StageBanner'
import MissionEventCard from '../components/mission/MissionEventCard'
import DecisionPanel from '../components/mission/DecisionPanel'
import DailyReportCard from '../components/mission/DailyReportCard'
import ResourceDashboard from '../components/resources/ResourceDashboard'

export default function Simulator() {
  const navigate = useNavigate()
  const {
    mission, loading, busy, error, dayReport, decisionResult,
    decide, advanceDay, dismissDayReport, clearError,
  } = useMission()

  if (loading) return <p role="status" className="p-6 text-ink-dim">Loading your mission…</p>
  if (!mission) return <NoMission title="Start your mission" />

  const { state, event } = mission
  const history = mission.history
  // Compare with the day before the one being shown, so arrows mean "change since last day".
  const previous = (dayReport ? history.at(-2) : history.at(-1))?.values

  let panel
  if (dayReport) {
    panel = (
      <DailyReportCard
        report={dayReport}
        nextDay={state.day}
        busy={busy}
        onContinue={() => {
          dismissDayReport()
          if (dayReport.status !== 'active') navigate('/reports')
        }}
      />
    )
  } else if (state.status !== 'active') {
    panel = (
      <section className="panel space-y-3 p-5">
        <h2 className="text-xl font-extrabold">{state.status === 'success' ? 'Mission complete!' : 'Mission ended'}</h2>
        <Link to="/reports" className="btn btn-primary">See the mission report</Link>
      </section>
    )
  } else if (event && !event.decided) {
    panel = (
      <>
        <MissionEventCard event={event} />
        <DecisionPanel mission={mission} busy={busy} onConfirm={decide} />
      </>
    )
  } else {
    panel = (
      <>
        {event ? <MissionEventCard event={event} /> : (
          <section className="panel p-5">
            <h2 className="text-xl font-extrabold">A quiet day</h2>
            <p className="mt-2 text-ink-dim">Nothing unusual is happening. The outpost keeps running with your current settings.</p>
          </section>
        )}
        {decisionResult && (
          <section aria-label="What you learned" className="panel border-violet/40 p-4 md:p-5">
            <h3 className="flex items-center gap-2 font-extrabold text-violet">
              <Lightbulb size={18} aria-hidden="true" /> Learning moment
            </h3>
            <p className="mt-1 text-sm text-ink-dim">You chose: {decisionResult.label}</p>
            <p className="mt-2 max-w-prose">{decisionResult.learning}</p>
          </section>
        )}
        <button type="button" className="btn btn-primary w-full sm:w-auto" disabled={busy} onClick={advanceDay}>
          End day {state.day}
        </button>
      </>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <StageBanner mission={mission} />

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Dismiss message" className="shrink-0 rounded p-1 hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <HabitatView state={state} />
          <ResourceDashboard values={state.values} previous={previous} />
        </div>
        <div className="space-y-4">{panel}</div>
      </div>
    </div>
  )
}
