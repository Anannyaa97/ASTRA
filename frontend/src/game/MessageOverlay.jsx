import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, BookOpen, Clock, EyeOff, Minus, Radio, TrendingDown } from 'lucide-react'
import { api } from '../services/api'
import { SOURCE_LABELS, VALUE_LABELS, describeChange } from '../utils/format'
import { EVENT_LESSON } from '../data/lessons'
import LessonLink from '../components/common/LessonLink'
import RealSunCheck from './RealSunCheck'
import { sfx } from './sound'

const ORDER = ['power', 'oxygen', 'water', 'food', 'research', 'battery', 'shielding', 'crew_health', 'comms']

// A short, game-styled version of the engine's prediction (same data the dashboard preview uses).
function Preview({ preview, loading, error }) {
  if (loading) return <p role="status" className="g-pv-note">Working out what might happen…</p>
  if (error) return <p role="alert" className="g-pv-note" style={{ color: 'var(--g-coral)' }}>{error}</p>
  if (!preview) return <p className="g-pv-note">Pick a choice to see what it might do.</p>
  const changed = ORDER.filter((k) => preview.direction[k] !== 'same')
  const falling = ['power', 'oxygen', 'water', 'food'].filter((k) => (preview.trend_if_nothing?.[k] ?? 0) <= -0.5)
  const later = preview.later ?? []
  return (
    <div aria-live="polite" className="g-pv">
      <p className="g-pv-title">What might happen in the next {preview.horizon_days} days</p>
      <p className="g-pv-sub">Green means better than doing nothing. Amber means worse. The arrow shows where the number ends up.</p>
      {changed.length === 0 ? (
        <p className="g-pv-note"><Minus size={14} aria-hidden="true" /> Nothing much changes compared with doing nothing.</p>
      ) : (
        <ul className="g-pv-list">
          {changed.map((k) => {
            const up = preview.direction[k] === 'up'
            const now = preview.start?.[k]
            const end = preview.forecast?.[preview.forecast.length - 1]?.[k]
            return (
              <li key={k} className={up ? 'up' : 'down'}>
                {(end != null && now != null ? end >= now : up) ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}
                <b>{VALUE_LABELS[k]}</b>
                {now != null && end != null && <em>{Math.round(now * 10) / 10} → {Math.round(end * 10) / 10}</em>}
                <span>{describeChange(k, preview)}</span>
              </li>
            )
          })}
        </ul>
      )}
      {later.length > 0 && (
        <div className="g-pv-box">
          <p><Clock size={15} aria-hidden="true" /> Coming later</p>
          <ul>{later.map((i) => <li key={`${i.after_days}-${i.note}`}>In {i.after_days} {i.after_days === 1 ? 'day' : 'days'}: {i.note}</li>)}</ul>
        </div>
      )}
      {falling.length > 0 && (
        <div className="g-pv-box warn">
          <p><TrendingDown size={15} aria-hidden="true" /> Even if you do nothing</p>
          <ul>{falling.map((k) => <li key={k}>{VALUE_LABELS[k]} is falling by about {Math.abs(preview.trend_if_nothing[k])} a day.</li>)}</ul>
        </div>
      )}
      <p className="g-pv-foot">Simulated prediction, compared with doing nothing. It assumes no other events happen.</p>
    </div>
  )
}

// The full-screen "message from Mission Control". The player reads, picks, sees a preview, then confirms.
export default function MessageOverlay({ mission, busy, onConfirm, onHide }) {
  const event = mission.event
  const [selected, setSelected] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const source = SOURCE_LABELS[event.source]

  useEffect(() => { setSelected(null); setPreview(null); setError(null) }, [event.id, mission.id])
  useEffect(() => {
    if (!selected) return undefined
    let stale = false
    setLoading(true); setError(null); setPreview(null)
    api.preview(mission.id, selected)
      .then((p) => { if (!stale) setPreview(p) })
      .catch((e) => { if (!stale) setError(e.message) })
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  }, [selected, mission.id])

  return (
    <section className="g-msg" aria-labelledby="g-msg-title">
      <header className="g-msg-head">
        <span className="g-display"><Radio size={14} aria-hidden="true" /> Incoming message · Mission Control</span>
        <button type="button" className="g-iconbtn small" onClick={onHide} aria-label="Hide the message and look at the base">
          <EyeOff size={16} aria-hidden="true" />
        </button>
      </header>

      <div className="g-msg-body">
        <div className="g-msg-left">
          <span className={`g-chip ${source.style}`}>{source.text}</span>
          <h2 id="g-msg-title" className="g-display">{event.title}</h2>
          <p>{event.description}</p>
          <LessonLink topic={EVENT_LESSON[event.id]} className="mt-1" />
          {event.id === 'solar_particle_warning' && <RealSunCheck sun={mission.sun} />}
        </div>

        <div className="g-msg-right">
          <p className="g-display g-q">What will you do?</p>
          <div role="radiogroup" aria-label="Choices" className="g-opts">
            {event.options.map((opt, i) => {
              const on = selected === opt.id
              return (
                <div key={opt.id} className="g-opt-wrap">
                  <button type="button" role="radio" aria-checked={on} disabled={!opt.available || busy}
                    className={`g-opt ${on ? 'on' : ''}`} onClick={() => { sfx.play('select'); setSelected(opt.id) }}>
                    <span className="g-opt-key g-display" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                    <span>
                      <b>{opt.label}</b>
                      <small>{opt.description}</small>
                      {!opt.available && <em>{opt.unavailable_reason}</em>}
                    </span>
                  </button>
                  {on && <div className="g-opt-preview"><Preview preview={preview} loading={loading} error={error} /></div>}
                </div>
              )
            })}
          </div>
          <button type="button" className="g-btn g-confirm" disabled={!selected || busy || loading}
            onClick={() => { sfx.play('confirm'); onConfirm(event.id, selected) }}>
            Confirm decision
          </button>
        </div>
      </div>
    </section>
  )
}

// After the decision: what the player chose and why it mattered.
export function LearningCard({ event, result }) {
  const source = event ? SOURCE_LABELS[event.source] : null
  return (
    <section className="g-learn" aria-label="What you learned">
      {event && <span className={`g-chip ${source.style}`}>{source.text}</span>}
      {event && <h2 className="g-display">{event.title}</h2>}
      {result && (
        <>
          <p className="g-learn-pick">You chose: <b>{result.label}</b></p>
          <p className="g-learn-text"><BookOpen size={16} aria-hidden="true" /> {result.learning}</p>
        </>
      )}
    </section>
  )
}
