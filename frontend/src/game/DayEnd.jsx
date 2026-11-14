import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Award, Moon, Search, Sparkles, Sun } from 'lucide-react'
import { api } from '../services/api'
import { VALUE_LABELS, fmt, signed } from '../utils/format'
import { sfx } from './sound'

const SHOWN = ['power', 'oxygen', 'water', 'food', 'crew_health', 'research']

// A short dark veil between days, so ending a day feels like time passing (not like a page reloading).
export function NightVeil({ day, show }) {
  return (
    <div className={`g-veil ${show ? 'on' : ''}`} aria-hidden={!show} role={show ? 'status' : undefined}>
      {show && (
        <div className="g-veil-in">
          <Moon size={34} aria-hidden="true" />
          <p className="g-display">Day {day} is over</p>
          <span>The Sun slides along the horizon…</span>
        </div>
      )}
    </div>
  )
}

// The end-of-day report, in the game's own style. All numbers are the backend's.
export function DayReport({ report, nextDay, busy, onContinue }) {
  const last = report.status !== 'active'
  return (
    <section className="g-msg g-small" aria-labelledby="g-rep-title">
      <header className="g-msg-head">
        <span className="g-display"><Sun size={14} aria-hidden="true" /> Day {report.day} report</span>
      </header>
      <div className="g-rep">
        <h2 id="g-rep-title" className="g-display">{last ? 'The mission is over' : `Day ${report.day} is done`}</h2>
        <ul className="g-rep-grid">
          {SHOWN.map((k) => {
            const d = report.deltas[k]
            const moved = Math.abs(d) >= 0.05
            return (
              <li key={k}>
                <span>{VALUE_LABELS[k]}</span>
                <b className="g-display">{fmt(report.values[k])}</b>
                {moved
                  ? <em className={d > 0 ? 'up' : 'down'}>{d > 0 ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" />}{signed(d)}</em>
                  : <em className="flat">no change</em>}
              </li>
            )
          })}
        </ul>
        <p className="g-rep-flow">
          Power made {fmt(report.flows.power_generated)}, used {fmt(report.flows.power_consumed)}.
          {' '}Water recycled {fmt(report.flows.water_recycled)}, used {fmt(report.flows.water_used)}.
          {' '}Food grown {fmt(report.flows.food_made)}, eaten {fmt(report.flows.food_used)}.
        </p>
        {report.notes.length > 0 && <ul className="g-rep-notes">{report.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
        <button type="button" className="g-btn" disabled={busy} onClick={onContinue}>
          {last ? 'See the mission result' : `Start day ${nextDay}`}
        </button>
      </div>
    </section>
  )
}

// Bits of golden dust for a success. They are drawn once and fall slowly. Hidden for reduced motion (CSS).
const DUST = Array.from({ length: 28 }, (_, i) => ({ left: (i * 37) % 100, delay: (i % 7) * 0.45, dur: 5 + (i % 5), size: 4 + (i % 4) * 2 }))

// The ending. Success: a celebration with the real score bars and the badges won.
// Failure: a calm "investigation" with the real cause, never a plain GAME OVER.
export function Ending({ mission, busy, onRestart }) {
  const { state } = mission
  const won = state.status === 'success'
  const [report, setReport] = useState(null)
  const [badges, setBadges] = useState(null)
  useEffect(() => { sfx.play(won ? 'win' : 'lose') }, [won])

  useEffect(() => {
    let stale = false
    api.getReport(mission.id).then((r) => { if (!stale) setReport(r) }).catch(() => {})
    api.getAchievements(mission.id).then((a) => { if (!stale) setBadges(a) }).catch(() => {})
    return () => { stale = true }
  }, [mission.id])

  const inv = report?.investigation
  const earned = badges?.badges?.filter((b) => b.earned) ?? []
  const scores = report?.evaluation?.scores ?? {}
  const scoreList = Object.entries(scores).filter(([, v]) => v != null)

  return (
    <section className={`g-msg g-end ${won ? 'won' : 'lost'}`} aria-labelledby="g-end-title">
      {won && <div className="g-dust" aria-hidden="true">{DUST.map((d, i) => (
        <i key={i} style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`, width: d.size, height: d.size }} />
      ))}</div>}
      <header className="g-msg-head">
        <span className="g-display">{won ? <Sparkles size={14} aria-hidden="true" /> : <Search size={14} aria-hidden="true" />} {won ? 'Mission complete' : 'Mission investigation'}</span>
      </header>
      <div className="g-end-body">
        <div className="g-end-main">
          <h2 id="g-end-title" className="g-display">{won ? 'The outpost survived!' : 'Let’s find out what happened'}</h2>
          <p className="g-end-sum">{report ? report.summary : 'Preparing your report…'}</p>

          {!won && inv && (
            <div className="g-end-box">
              <p><b>What happened:</b> {inv.primary_cause}</p>
              <p><b>How to avoid it:</b> {inv.how_to_avoid}</p>
            </div>
          )}

          {won && earned.length > 0 && (
            <div>
              <p className="g-q g-display">Badges you earned</p>
              <ul className="g-badges">{earned.map((b) => <li key={b.id}><Award size={16} aria-hidden="true" /> {b.title}</li>)}</ul>
            </div>
          )}
        </div>

        <div className="g-end-side">
          <p className="g-q g-display">How did you do?</p>
          <ul className="g-scores">
            {scoreList.map(([k, v]) => (
              <li key={k}>
                <span>{k.replace(/_/g, ' ')}</span>
                <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={k.replace(/_/g, ' ')}><i style={{ width: `${v}%` }} /></div>
                <b className="g-display">{Math.round(v)}</b>
              </li>
            ))}
          </ul>
          <p className="g-pv-foot">Simulated educational scores. There is no single winning number; each bar is a different skill.</p>
          <div className="g-end-actions">
            <button type="button" className="g-btn" disabled={busy} onClick={onRestart}>Try the same mission again</button>
            <Link to="/reports" className="g-btn quiet">Full report</Link>
            <Link to="/home" className="g-btn quiet">Leave the game</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
