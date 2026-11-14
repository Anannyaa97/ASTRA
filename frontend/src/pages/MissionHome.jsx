import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Rocket, User } from 'lucide-react'
import { useMission } from '../context/MissionContext'
import NoMission from '../components/common/NoMission'
import HabitatView from '../components/mission/HabitatView'
import StageBanner from '../components/mission/StageBanner'
import ResourceDashboard from '../components/resources/ResourceDashboard'
import { fmt } from '../utils/format'
import ProgressRing from '../components/dashboard/ProgressRing'
import SettingsCard from '../components/dashboard/SettingsCard'
import { AreaTrend, LineTrend } from '../components/dashboard/TrendCards'

export default function MissionHome() {
  const { mission, loading } = useMission()
  const [showNew, setShowNew] = useState(false)
  useEffect(() => setShowNew(false), [mission?.id])

  if (loading) return <p role="status" className="p-6 text-ink-dim">Loading your mission…</p>
  if (!mission) return <NoMission title="Welcome to Mission Control" />

  const { state, warnings, objectives, decisions } = mission
  const health = state.values.crew_health
  const crewColor = health >= 60 ? 'text-ok' : health >= 30 ? 'text-warn' : 'text-danger'
  const previous = mission.history.at(-1)?.values
  const ended = state.status !== 'active'
  const series = mission.history.map((h) => ({ day: h.day, ...h.values }))
  const supplies = [
    { label: 'Power', value: state.values.power, color: '#54c7e0' },
    { label: 'Oxygen', value: state.values.oxygen, color: '#5eead4' },
    { label: 'Water', value: state.values.water, color: '#b39bff' },
    { label: 'Food', value: state.values.food, color: '#ffb23e' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{mission.label}</h1>
          <p className="text-sm text-ink-dim">
            {mission.player} · {mission.difficulty === 'commander' ? 'Commander' : 'Cadet'} level
            {ended && (state.status === 'success' ? ', mission complete' : ', mission ended')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={ended ? '/reports' : '/play'} className="btn btn-primary">
            <Rocket size={18} aria-hidden="true" /> {ended ? 'See the report' : 'Continue mission'}
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => setShowNew(!showNew)} aria-expanded={showNew}>
            New mission
          </button>
        </div>
      </header>

      {showNew && <NoMission title="Start a new mission" />}

      <StageBanner mission={mission} />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <HabitatView state={state} />
          <ResourceDashboard values={state.values} previous={previous} />
        </div>

        <div className="space-y-4">
          <section aria-label="Crew" className="panel p-4">
            <h2 className="font-extrabold">Crew</h2>
            <p className="mt-2 flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => <User key={i} size={26} className={crewColor} aria-hidden="true" />)}
              <span className="ml-2 text-sm text-ink-dim">
                4 astronauts, health {fmt(health)} out of 100
              </span>
            </p>
          </section>

          <section aria-label="Warnings" className="panel p-4">
            <h2 className="font-extrabold">Warnings</h2>
            {warnings.length === 0 ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-ok">
                <CheckCircle2 size={18} aria-hidden="true" /> All systems normal.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {warnings.map((w, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${w.level === 'danger' ? 'text-danger' : 'text-warn'}`}>
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{w.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Objectives" className="panel p-4">
            <h2 className="font-extrabold">Objectives</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-dim">
              {objectives.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </section>

          <section aria-label="Latest events" className="panel p-4">
            <h2 className="font-extrabold">Latest decisions</h2>
            {decisions.length === 0 ? (
              <p className="mt-2 text-sm text-ink-dim">No decisions yet. Your first event arrives on day 2.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {decisions.slice(-4).reverse().map((d) => (
                  <li key={d.day}>
                    <span className="font-semibold">Day {d.day}: {d.event_title}</span>
                    <span className="block text-ink-dim">You chose: {d.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProgressRing daysDone={ended ? state.day : state.day - 1} totalDays={state.mission_days} supplies={supplies} />
        <div className="flex flex-col gap-4">
          <LineTrend title="Power" data={series} dataKey="power" big={fmt(state.values.power)}
            caption="Power reserve at the end of each day" />
          <SettingsCard />
        </div>
        <AreaTrend title="Research points" data={series} dataKey="research" big={fmt(state.values.research)}
          caption="Science collected so far" />
        <LineTrend title="Food" data={series} dataKey="food" big={fmt(state.values.food)}
          caption="Food stored in the habitat" />
      </div>
    </div>
  )
}
