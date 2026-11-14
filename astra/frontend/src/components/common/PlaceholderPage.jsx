import { motion } from 'framer-motion'
import { Construction } from 'lucide-react'

// Honest placeholder for modules that are not built yet.
// It says so plainly instead of faking functionality.
export default function PlaceholderPage({ icon: Icon, title, purpose, phase, plans = [] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel mx-auto max-w-3xl p-6 md:p-10"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-electric/20 text-electric">
          <Icon size={26} aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
      </div>
      <p className="mb-6 text-lg text-ink-dim">{purpose}</p>

      <div className="rounded-xl border border-warn/40 bg-warn/10 p-4">
        <p className="mb-2 flex items-center gap-2 font-bold text-warn">
          <Construction size={18} aria-hidden="true" /> Not built yet – planned for {phase}
        </p>
        {plans.length > 0 && (
          <ul className="list-disc space-y-1 pl-6 text-sm text-ink-dim">
            {plans.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
      </div>
    </motion.section>
  )
}
