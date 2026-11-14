import { useEffect, useState } from 'react'
import { sfx } from '../../game/sound'
import Toggle from './Toggle'

const read = (k) => { try { return localStorage.getItem(k) === '1' } catch { return false } }
const write = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0') } catch { /* private mode: fine */ } }

// Apply the saved "calm mode" choice (called once at start-up and whenever it changes).
export function applyCalm(on) { document.documentElement.dataset.calm = on ? 'true' : 'false' }
export function loadCalm() { applyCalm(read('astra.calm')) }

export default function SettingsCard() {
  const [sound, setSound] = useState(sfx.on)
  const [calm, setCalm] = useState(() => read('astra.calm'))
  useEffect(() => sfx.subscribe(setSound), [])   // stays in step with the speaker button in the game
  return (
    <section aria-label="Settings" className="panel space-y-4 p-4">
      <h2 className="font-extrabold">Settings</h2>
      <Toggle label="Game sounds" hint="Short beeps and chimes" checked={sound}
        onChange={(v) => sfx.set(v)} />
      <Toggle label="Calm mode" hint="Less movement on screen" checked={calm}
        onChange={(v) => { setCalm(v); write('astra.calm', v); applyCalm(v) }} />
    </section>
  )
}
