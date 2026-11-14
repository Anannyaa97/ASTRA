import { useEffect, useState } from 'react'
import {
  Award, CheckCircle2, Droplets, FlaskConical, Flag, HeartPulse, Lock, Rocket, ShieldCheck, Sprout, Star, Sun, Trophy, Wind,
} from 'lucide-react'
import { api } from '../services/api'
import { useMission } from '../context/MissionContext'
import NoMission from '../components/common/NoMission'
import StatusPill from '../components/common/StatusPill'
import ProfileCard from '../components/reports/ProfileCard'

const ICONS = { Rocket, Flag, HeartPulse, Wind, Droplets, Sun, Sprout, FlaskConical, ShieldCheck, Star }

// An earned badge is bright and says "Earned"; a locked one is dim, shows a lock and how to unlock it.
function Badge({ badge }) {
  const Icon = ICONS[badge.icon] ?? Award
  return (
    <li className={`panel flex items-start gap-3 p-4 ${badge.earned ? 'border-ok/40' : 'opacity-80'}`}>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${badge.earned ? 'bg-ok/20 text-ok' : 'bg-white/5 text-ink-dim'}`}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="font-extrabold leading-tight">{badge.title}</h2>
        <p className={`mt-0.5 flex items-center gap-1 text-xs font-bold ${badge.earned ? 'text-ok' : 'text-ink-dim'}`}>
          {badge.earned
            ? <><CheckCircle2 size={14} aria-hidden="true" /> Earned</>
            : <><Lock size={14} aria-hidden="true" /> Locked</>}
        </p>
        <p className="mt-1 text-sm">{badge.earned ? badge.detail : badge.how}</p>
      </div>
    </li>
  )
}

export default function Achievements() {
  const { mission, loading } = useMission()
  const [data, setData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  // Ask again whenever the mission moves on.
  const missionId = mission?.id
  const refreshKey = mission ? `${mission.state.day}-${mission.event?.decided}-${mission.state.status}` : null
  useEffect(() => {
    if (!missionId) return
    setError(null)
    api.getAchievements(missionId).then(setData).catch((e) => setError(e.message))
    api.getProfile(missionId).then(setProfile).catch((e) => setError(e.message))
  }, [missionId, refreshKey])

  if (loading) return <p role="status" className="p-6 text-ink-dim">Loading…</p>
  if (!mission) return <NoMission title="Earn your badges" />

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="panel space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric/20 text-electric">
            <Trophy size={24} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-extrabold md:text-3xl">Achievements</h1>
          <StatusPill kind="SIMULATED" />
        </div>
        <p className="max-w-prose text-ink-dim">
          Your style and your badges come from the choices you really made in this mission. Most badges are awarded when the mission ends well.
        </p>
        {data && (
          <p className="font-bold" role="status">{data.earned} of {data.total} badges earned</p>
        )}
      </header>

      {error && <p role="alert" className="panel p-4 text-danger">{error}</p>}
      {!data && !error && <p role="status" className="p-4 text-ink-dim">Counting your badges…</p>}

      <ProfileCard profile={profile} />

      {data && (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.badges.map((b) => <Badge key={b.id} badge={b} />)}
        </ul>
      )}
    </div>
  )
}
