import { useEffect, useState } from 'react'
import { Mail, Pause, Sun, Volume2, VolumeX, X } from 'lucide-react'
import '@fontsource-variable/unbounded'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import './game.css'
import { useMission } from '../context/MissionContext'
import { crewTalk } from '../utils/crewTalk'
import { primaryIndicators } from '../utils/format'
import NoMission from '../components/common/NoMission'
import LunarScene from './LunarScene'
import SunArc from './SunArc'
import Dial from './Dial'
import CrewTalk from './CrewTalk'
import PauseMenu from './PauseMenu'
import MessageOverlay, { LearningCard } from './MessageOverlay'
import { DayReport, Ending, NightVeil } from './DayEnd'
import Briefing, { wasBriefed } from './Briefing'
import { sfx } from './sound'

// The game: the whole screen is the Moon base. No sidebar, no dashboard.
// The pause menu holds every other page. All game numbers still come from the backend simulation.
export default function GameScreen() {
  const {
    mission, loading, busy, error, dayReport, decisionResult,
    decide, advanceDay, dismissDayReport, clearError, restart,
  } = useMission()
  const [paused, setPaused] = useState(false)
  const [soundOn, setSoundOn] = useState(sfx.on)       // sound effects: off until the player turns them on
  const [briefed, setBriefed] = useState(false)
  useEffect(() => sfx.subscribe(setSoundOn), [])
  const [night, setNight] = useState(0)                 // the short "day is over" veil
  const [hidden, setHidden] = useState(false)          // the player tucked the message away to look at the base

  // Esc opens the pause menu. (When it is open, the dialog itself handles Esc.)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !paused) setPaused(true) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paused])

  const eventKey = mission?.event ? `${mission.event.id}-${mission.event.decided}` : 'none'
  useEffect(() => { setHidden(false); if (eventKey !== 'none' && !eventKey.endsWith('true')) sfx.play(mission?.event?.id === 'solar_particle_warning' ? 'alarm' : 'message') }, [eventKey]) // eslint-disable-line react-hooks/exhaustive-deps -- a new message always opens by itself

  if (loading) {
    return <div className="game" role="status" style={{ display: 'grid', placeItems: 'center' }}>Loading your mission…</div>
  }
  if (!mission) {
    return (
      <div className="game" style={{ display: 'grid', placeItems: 'center', padding: 16, overflow: 'auto' }}>
        <NoMission title="Start your mission" />
      </div>
    )
  }

  const { state, event, stage } = mission

  // Ending a day: the screen darkens for a moment, the backend runs the day, then the report appears.
  const endDay = async () => {
    sfx.play('night')
    setNight(state.day)
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    await Promise.all([advanceDay(), new Promise((r) => setTimeout(r, calm ? 0 : 1300))])
    setNight(0)
    sfx.play('morning')
  }
  const playAgain = async () => { await restart() }
  const talk = crewTalk(state)
  const dials = primaryIndicators(state.values)
  const active = state.status === 'active'

  const showBrief = active && state.day === 1 && !briefed && !wasBriefed(mission.id)
  let sheet = null
  let message = null
  let compact = false
  let action = null
  if (showBrief) {
    message = <Briefing missionId={mission.id} onDone={() => setBriefed(true)} />
  } else if (dayReport) {
    message = (
      <DayReport report={dayReport} nextDay={state.day} busy={busy}
        onContinue={dismissDayReport} />
    )
  } else if (!active) {
    message = <Ending mission={mission} busy={busy} onRestart={playAgain} />
  } else if (event && !event.decided) {
    if (hidden) {
      action = <button type="button" className="g-btn" onClick={() => setHidden(false)}><Mail size={18} aria-hidden="true" /> Open the message</button>
    } else {
      message = <MessageOverlay mission={mission} busy={busy} onConfirm={decide} onHide={() => setHidden(true)} />
    }
  } else {
    if (event || decisionResult) {
      sheet = <LearningCard event={event} result={decisionResult} />
      compact = true
    }
    action = (
      <button type="button" className="g-btn" disabled={busy} onClick={endDay}>
        <Sun size={18} aria-hidden="true" /> End day {state.day}
      </button>
    )
  }

  return (
    <main className="game" aria-label="ASTRA lunar outpost">
      <LunarScene state={state} talk={talk} />

      <div className={`g-hud ${sheet && !compact ? 'with-sheet' : ''} ${!active && !dayReport ? 'ending' : ''}`}>
        <div className="g-top">
          <div className="g-stage">
            <div className="g-display">Stage {stage.number} · {mission.difficulty === 'commander' ? 'Commander level' : 'Cadet level'}</div>
            <p>{stage.name}</p>
          </div>
          <SunArc day={state.day} total={state.mission_days} status={state.status} />
          <div className="g-tools">
            <button type="button" className="g-iconbtn" aria-pressed={soundOn} onClick={() => sfx.set(!soundOn)}
              aria-label={soundOn ? 'Sound effects are on. Turn them off' : 'Sound effects are off. Turn them on'}>
              {soundOn ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
            </button>
            <button type="button" className="g-iconbtn" onClick={() => setPaused(true)} aria-label="Pause and open the menu">
              <Pause size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div />

        <div className="g-bottom">
          <div className="g-dials" role="group" aria-label="Outpost systems">
            {dials.map((d) => <Dial key={d.key} label={d.label} value={d.value} hint={d.hint} />)}
          </div>
          <CrewTalk talk={talk} />
          <div className="g-action">{action}</div>
        </div>
      </div>

      {message}
      {sheet && <aside className={`g-sheet ${compact ? 'compact' : ''}`} aria-label="Mission update">{sheet}</aside>}

      {error && (
        <div role="alert" className="g-toast">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Dismiss message"><X size={16} /></button>
        </div>
      )}

      <NightVeil show={night > 0} day={night} />
      <PauseMenu open={paused} onClose={() => setPaused(false)} />
    </main>
  )
}
