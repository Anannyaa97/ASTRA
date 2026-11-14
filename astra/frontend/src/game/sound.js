// Tiny sound effects made in the browser with the Web Audio API. No audio files, nothing to download.
// Sound is OFF until the player turns it on, and the choice is remembered (if the browser allows storage).
const KEY = 'astra.sound'
let ctx = null
let on = false
try { on = localStorage.getItem(KEY) === 'on' } catch { /* storage blocked */ }
const listeners = new Set()

const audio = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// One soft note: a sine/triangle wave with a quick fade in and a smooth fade out.
function note(freq, start, dur, { type = 'sine', gain = 0.12, to = null } = {}) {
  const c = audio(); if (!c) return
  const t = c.currentTime + start
  const o = c.createOscillator(), g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t); o.stop(t + dur + 0.05)
}

const SOUNDS = {
  select: () => note(660, 0, 0.12, { type: 'triangle' }),
  confirm: () => { note(523, 0, 0.14, { type: 'triangle' }); note(784, 0.1, 0.22, { type: 'triangle' }) },
  message: () => { note(880, 0, 0.12); note(1175, 0.14, 0.2) },
  night: () => note(330, 0, 1.1, { type: 'sine', to: 110, gain: 0.1 }),
  morning: () => { note(392, 0, 0.2); note(523, 0.16, 0.2); note(659, 0.32, 0.35) },
  alarm: () => { for (let i = 0; i < 3; i++) note(740, i * 0.3, 0.2, { type: 'square', gain: 0.05 }) },
  win: () => [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.14, 0.45, { type: 'triangle' })),
  lose: () => { note(392, 0, 0.4); note(330, 0.3, 0.4); note(262, 0.6, 0.7) },
}

export const sfx = {
  play(name) { if (on && SOUNDS[name]) { try { SOUNDS[name]() } catch { /* sound is a bonus, never an error */ } } },
  get on() { return on },
  set(value) {
    on = value
    try { localStorage.setItem(KEY, value ? 'on' : 'off') } catch { /* ignore */ }
    listeners.forEach((f) => f(on))
    if (value) SOUNDS.select()   // a little blip so the player hears that it works
  },
  subscribe(f) { listeners.add(f); return () => listeners.delete(f) },
}
