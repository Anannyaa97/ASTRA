import { useEffect, useState } from 'react'
import { AlertOctagon, AlertTriangle, CheckCircle2, Compass, HeartPulse, Info, MessageCircle, Sun, Wrench } from 'lucide-react'
import { api } from '../services/api'
import { useMission } from '../context/MissionContext'
import NoMission from '../components/common/NoMission'
import StatusPill from '../components/common/StatusPill'

const ICONS = { commander: Compass, engineer: Wrench, life_support: HeartPulse, space_weather: Sun }

// Each level has a word and an icon as well as a color, so meaning never depends on color alone.
const LEVELS = {
  danger: { Icon: AlertOctagon, word: 'Urgent', text: 'text-danger', box: 'border-danger/40 bg-danger/10' },
  warn: { Icon: AlertTriangle, word: 'Heads up', text: 'text-warn', box: 'border-warn/40 bg-warn/10' },
  info: { Icon: Info, word: 'Tip', text: 'text-electric', box: 'border-electric/40 bg-electric/10' },
  ok: { Icon: CheckCircle2, word: 'All good', text: 'text-ok', box: 'border-ok/30 bg-ok/10' },
}

function AdvisorCard({ advisor, wide }) {
  const Icon = ICONS[advisor.id] ?? MessageCircle
  return (
    <section aria-label={advisor.name} className={`panel space-y-3 p-5 ${wide ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-electric/20 text-electric">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-extrabold leading-tight">{advisor.name}</h2>
          <p className="text-xs text-ink-dim">{advisor.focus}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {advisor.messages.map((m) => {
          const { Icon: LevelIcon, word, text, box } = LEVELS[m.level]
          return (
            <li key={m.headline} className={`rounded-xl border p-3 ${box}`}>
              <p className={`flex items-center gap-2 text-sm font-bold ${text}`}>
                <LevelIcon size={16} aria-hidden="true" />
                {word}: {m.headline}
              </p>
              <p className="mt-1 text-sm">{m.text}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function MissionAdvisor() {
  const { mission, loading } = useMission()
  const [advice, setAdvice] = useState(null)
  const [error, setError] = useState(null)

  // Ask again whenever the mission moves on (new day, or a decision was made).
  const missionId = mission?.id
  const refreshKey = mission ? `${mission.state.day}-${mission.event?.decided}-${mission.state.status}` : null
  useEffect(() => {
    if (!missionId) return
    setError(null)
    api.getAdvice(missionId).then(setAdvice).catch((e) => setError(e.message))
  }, [missionId, refreshKey])

  if (loading) return <p role="status" className="p-6 text-ink-dim">Loading…</p>
  if (!mission) return <NoMission title="Meet your advisors" />

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="panel space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric/20 text-electric">
            <MessageCircle size={24} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-extrabold md:text-3xl">Mission Advisor</h1>
          <StatusPill kind="SIMULATED" />
        </div>
        <p className="max-w-prose text-ink-dim">
          Four experts read your outpost and share hints for day {mission.state.day}.
          They never change anything. You make the decisions.
        </p>
      </header>

      {error && <p role="alert" className="panel p-4 text-danger">{error}</p>}
      {!advice && !error && <p role="status" className="p-4 text-ink-dim">Asking your advisors…</p>}

      {advice && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {advice.advisors.map((a, i) => <AdvisorCard key={a.id} advisor={a} wide={i === 0} />)}
          </div>
          <p className="text-xs text-ink-dim">{advice.disclaimer}</p>
        </>
      )}
    </div>
  )
}
