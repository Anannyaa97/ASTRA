import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useMission } from '../context/MissionContext'
import NoMission from '../components/common/NoMission'
import StatusPill from '../components/common/StatusPill'
import ScoreBars from '../components/reports/ScoreBars'
import ResourceChart from '../components/reports/ResourceChart'
import InvestigationCard from '../components/reports/InvestigationCard'
import ScoreInsights from '../components/reports/ScoreInsights'

const SERIES = [
  { key: 'Power', label: 'Power', color: '#fbbf24' },
  { key: 'Oxygen', label: 'Oxygen', color: '#3d8bff' },
  { key: 'Water', label: 'Water', color: '#2dd4bf' },
  { key: 'Food', label: 'Food', color: '#a78bfa' },
  { key: 'Crew health', label: 'Crew health', color: '#e8edff' },
]

export default function Reports() {
  const navigate = useNavigate()
  const { mission, loading, busy, restart } = useMission()
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  const missionId = mission?.id
  const dayKey = mission ? `${mission.status}-${mission.state.day}` : null
  useEffect(() => {
    if (!missionId) return
    setError(null)
    api.getReport(missionId).then(setReport).catch((e) => setError(e.message))
  }, [missionId, dayKey])

  if (loading) return <p role="status" className="p-6 text-ink-dim">Loading…</p>
  if (!mission) return <NoMission title="No mission report yet" />
  if (error) return <p role="alert" className="p-6 text-danger">{error}</p>
  if (!report || report.mission_id !== missionId) return <p role="status" className="p-6 text-ink-dim">Preparing your report…</p>

  const chartData = report.history.map((h) => ({
    day: h.day, Power: h.values.power, Oxygen: h.values.oxygen, Water: h.values.water,
    Food: h.values.food, 'Crew health': h.values.crew_health,
  }))
  const heading = report.status === 'success' ? 'Mission complete' : report.status === 'failed' ? 'Mission ended' : 'Progress so far'

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="panel space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold md:text-3xl">{heading}</h1>
          <StatusPill kind="SIMULATED" />
        </div>
        <p className="text-lg">{report.summary}</p>
        <p className="text-xs text-ink-dim">{report.disclaimer}</p>
      </header>

      {report.investigation && <InvestigationCard investigation={report.investigation} />}

      <section aria-label="Mission evaluation" className="panel p-5">
        <h2 className="mb-3 text-xl font-extrabold">How did you do?</h2>
        <ScoreBars scores={report.evaluation.scores} />
        {report.evaluation.overall != null && (
          <p className="mt-4 text-sm text-ink-dim">
            Average of the categories tested: {Math.round(report.evaluation.overall)} out of 100.
            There is no single winning score. Each category shows a different skill.
          </p>
        )}
      </section>

      <ScoreInsights insights={report.score_insights} />

      <section aria-label="Resource history" className="panel p-5">
        <h2 className="mb-3 text-xl font-extrabold">Your outpost, day by day</h2>
        <ResourceChart data={chartData} series={SERIES} description="Power, oxygen, water, food and crew health for each mission day" />
      </section>

      {report.learning_outcomes.length > 0 && (
        <section aria-label="What you learned" className="panel p-5">
          <h2 className="mb-2 text-xl font-extrabold">What you learned</h2>
          <ul className="list-disc space-y-2 pl-5 text-ink-dim">
            {report.learning_outcomes.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </section>
      )}

      {report.decisions.length > 0 && (
        <section aria-label="Your decisions" className="panel p-5">
          <h2 className="mb-2 text-xl font-extrabold">Your decisions</h2>
          <ul className="space-y-2 text-sm">
            {report.decisions.map((d) => (
              <li key={d.day}><span className="font-semibold">Day {d.day}, {d.event_title}:</span> {d.label}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3 pb-6">
        {report.final ? (
          <button type="button" className="btn btn-primary" disabled={busy}
            onClick={async () => { if (await restart()) navigate('/play') }}>
            Try the same scenario again
          </button>
        ) : (
          <Link to="/play" className="btn btn-primary">Back to the mission</Link>
        )}
        <Link to="/home" className="btn btn-ghost">Mission Home</Link>
      </div>
    </div>
  )
}
