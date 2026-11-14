import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, FlaskConical, Globe2, GraduationCap, Home, LayoutDashboard, MessageCircle, Play, FileText } from 'lucide-react'

const ITEMS = [
  { to: '/what-if', label: 'What if? Lab', icon: FlaskConical },
  { to: '/advisor', label: 'Mission Advisor', icon: MessageCircle },
  { to: '/academy', label: 'Academy', icon: GraduationCap },
  { to: '/nasa', label: 'NASA Reality Hub', icon: Globe2 },
  { to: '/achievements', label: 'Achievements', icon: Award },
  { to: '/reports', label: 'Mission reports', icon: FileText },
  { to: '/simulator', label: 'Dashboard view', icon: LayoutDashboard },
  { to: '/home', label: 'Leave the game', icon: Home },
]

// The pause menu is where every page of the app lives, so the game screen itself stays clean.
// A native dialog gives focus trapping and Esc to close with no extra code.
export default function PauseMenu({ open, onClose }) {
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={ref} className="g-pause" aria-labelledby="g-pause-title" onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}>
      <h2 id="g-pause-title" className="g-display" style={{ fontSize: '1.4rem', padding: '22px 22px 14px', margin: 0 }}>Paused</h2>
      <nav aria-label="Game menu">
        <button type="button" className="g-menuitem primary" autoFocus onClick={onClose}><Play size={18} aria-hidden="true" /> Back to the mission</button>
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <button key={to} type="button" className="g-menuitem" onClick={() => navigate(to)}>
            <Icon size={18} aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>
    </dialog>
  )
}
