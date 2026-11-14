import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

// The backend simulation is the only authority for game state.
// This context just holds the latest mission the server sent us.
const KEY = 'astra.missionId'
const readId = () => {
  try { const v = localStorage.getItem(KEY); return v ? Number(v) : null } catch { return null }
}
const saveId = (id) => {
  try { id == null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, String(id)) } catch { /* storage blocked */ }
}

const MissionContext = createContext(null)

export function MissionProvider({ children }) {
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [decisionResult, setDecisionResult] = useState(null) // what the player just chose, plus the lesson
  const [dayReport, setDayReport] = useState(null)           // the daily report waiting to be read

  useEffect(() => {
    const id = readId()
    if (!id) { setLoading(false); return }
    api.getMission(id)
      .then(setMission)
      .catch((e) => {
        if (e.status === 404) saveId(null) // mission no longer exists
        else setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const run = useCallback(async (fn) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError(e.message)
      // 409 = our screen was out of date; fetch the truth again.
      if (e.status === 409) {
        const id = readId()
        if (id) api.getMission(id).then(setMission).catch(() => {})
      }
      return null
    } finally {
      setBusy(false)
    }
  }, [])

  const resetTransient = () => { setDecisionResult(null); setDayReport(null) }

  // `level` is 'cadet' or 'commander'. Returns the new mission, or null if it failed.
  const startMission = (level = 'cadet') => run(async () => {
    const body = typeof level === 'string' ? { difficulty: level } : level
    const m = await api.startMission(body)
    saveId(m.id); resetTransient(); setMission(m)
    return m
  })

  const decide = (eventId, optionId) => run(async () => {
    const r = await api.decide(mission.id, eventId, optionId)
    setMission(r.mission)
    setDecisionResult({ ...r.decision, learning: r.learning })
    return r
  })

  const advanceDay = () => run(async () => {
    const r = await api.advance(mission.id)
    setMission(r.mission); setDecisionResult(null); setDayReport(r.report)
    return r
  })

  // Same seed, fresh chance. Returns the new mission, or null if it failed.
  const restart = () => run(async () => {
    const r = await api.restart(mission.id)
    saveId(r.mission.id); resetTransient(); setMission(r.mission)
    return r.mission
  })

  const value = {
    mission, loading, busy, error, decisionResult, dayReport,
    startMission, decide, advanceDay, restart,
    dismissDayReport: () => setDayReport(null),
    clearError: () => setError(null),
  }
  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>
}

export function useMission() {
  const ctx = useContext(MissionContext)
  if (!ctx) throw new Error('useMission must be used inside <MissionProvider>')
  return ctx
}
