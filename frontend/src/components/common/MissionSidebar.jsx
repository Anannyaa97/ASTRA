import { NavLink, Link } from 'react-router-dom'
import {
  Rocket, LayoutDashboard, Gamepad2, FlaskConical, Globe2,
  GraduationCap, MessageCircle, FileSearch, Trophy, Info, Database,
} from 'lucide-react'
import ApiStatus from './ApiStatus'

export const NAV_ITEMS = [
  { to: '/home', label: 'Mission Home', icon: LayoutDashboard },
  { to: '/play', label: 'Play', icon: Gamepad2 },
  { to: '/what-if', label: 'What If? Lab', icon: FlaskConical },
  { to: '/nasa', label: 'NASA Reality Hub', icon: Globe2 },
  { to: '/academy', label: 'Academy', icon: GraduationCap },
  { to: '/advisor', label: 'Mission Advisor', icon: MessageCircle },
  { to: '/reports', label: 'Reports', icon: FileSearch },
  { to: '/achievements', label: 'Achievements', icon: Trophy },
  { to: '/data', label: 'NASA data', icon: Database },
  { to: '/about', label: 'About', icon: Info },
]

export default function MissionSidebar() {
  return (
    <aside className="panel m-3 flex flex-col gap-2 p-3 md:sticky md:top-3 md:h-[calc(100vh-1.5rem)] md:w-64 md:shrink-0">
      <Link to="/" className="mb-2 flex items-center gap-3 rounded-xl p-2">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#ffd27a] to-[#ff9a3e] text-[#1a1020] shadow-[0_8px_24px_rgba(255,178,62,.4)]">
          <Rocket size={22} aria-hidden="true" />
        </span>
        <span>
          <span className="block bg-gradient-to-b from-[#fffaf0] to-[#ffb23e] bg-clip-text font-[Unbounded_Variable] text-2xl font-extrabold tracking-[0.12em] text-transparent drop-shadow-[0_0_14px_rgba(255,178,62,.45)]">ASTRA</span>
          <span className="block text-[11px] text-ink-dim">Junior Mission Trainer</span>
        </span>
      </Link>

      {/* Horizontal scroll on phones, vertical list from md up */}
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto md:flex-1 md:flex-col md:overflow-visible">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-warn/15 text-white ring-1 ring-warn/50 shadow-[0_0_24px_rgba(255,178,62,.15)]'
                  : 'text-ink-dim hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="hidden border-t border-white/10 pt-3 md:block">
        <ApiStatus />
        <p className="mt-2 text-[11px] text-ink-dim">&copy; 2026 Team Orbitelle</p>
      </div>
    </aside>
  )
}
