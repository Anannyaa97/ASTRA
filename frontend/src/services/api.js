// Thin wrapper around fetch. All calls go to /api (proxied to FastAPI in dev).
// Set VITE_API_URL at build time when the backend is hosted elsewhere (e.g. Render).
const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    const err = new Error('Cannot reach Mission Control. Is the backend running?')
    err.status = 0
    throw err
  }
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch { /* body was not JSON */ }
    const err = new Error(detail || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return res.json()
}

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) })

export const api = {
  health: () => request('/api/health'),
  listMissions: () => request('/api/missions'),
  startMission: (body) => post('/api/missions/start', body),
  getMission: (id) => request(`/api/missions/${id}`),
  getAchievements: (id) => request(`/api/missions/${id}/achievements`),
  getProfile: (id) => request(`/api/missions/${id}/profile`),
  getRadiation: () => request('/api/nasa/radiation'),
  getSpaceWeather: (days = 30) => request(`/api/nasa/space-weather?days=${days}`),
  getAdvice: (id) => request(`/api/missions/${id}/advice`),
  preview: (id, optionId) => post(`/api/missions/${id}/preview`, { option_id: optionId }),
  decide: (id, eventId, optionId) => post(`/api/missions/${id}/decision`, { event_id: eventId, option_id: optionId }),
  advance: (id) => post(`/api/missions/${id}/advance-day`),
  getReport: (id) => request(`/api/missions/${id}/report`),
  restart: (id) => post(`/api/missions/${id}/restart`),
  experimentOptions: () => request('/api/experiments/options'),
  runExperiment: (body) => post('/api/experiments/run', body),
}
