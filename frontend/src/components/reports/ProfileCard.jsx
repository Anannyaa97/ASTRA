import { Compass, FlaskConical, Siren, Wrench, Sparkles } from 'lucide-react'

const ICONS = { Compass, Wrench, Siren, FlaskConical }

// Your play style, worked out from the decisions you really made. Never a grade.
export default function ProfileCard({ profile }) {
  if (!profile) return null
  const top = Math.max(1, ...profile.styles.map((s) => s.count))
  const Icon = profile.profile ? ICONS[profile.profile.icon] ?? Sparkles : Sparkles

  return (
    <section aria-label="Engineering Decision Profile" className="panel space-y-4 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet/20 text-violet">
          <Icon size={26} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-dim">Your engineering style</p>
          {profile.ready ? (
            <>
              <h2 className="text-2xl font-extrabold">{profile.profile.title}</h2>
              <p className="mt-1">{profile.profile.blurb}</p>
              {profile.close_with.length > 0 && (
                <p className="mt-1 text-sm text-ink-dim">Very close behind: {profile.close_with.join(', ')}.</p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-extrabold">Your style is still a mystery</h2>
              <p className="mt-1">{profile.message}</p>
            </>
          )}
        </div>
      </div>

      <ul className="space-y-3">
        {profile.styles.map((s) => {
          const StyleIcon = ICONS[s.icon] ?? Sparkles
          return (
            <li key={s.id}>
              <p className="flex items-center gap-2 text-sm font-bold">
                <StyleIcon size={16} aria-hidden="true" />
                {s.title}
                <span className="font-normal text-ink-dim">{s.count} {s.count === 1 ? 'choice' : 'choices'}</span>
              </p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <div className="h-full rounded-full bg-violet" style={{ width: `${(s.count / top) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-dim">
                {s.rule}
                {s.examples.length > 0 && ` For example: ${s.examples.map((e) => `day ${e.day}, ${e.label}`).join('; ')}.`}
              </p>
            </li>
          )
        })}
      </ul>

      {profile.ready && (
        <p className="flex items-start gap-2 rounded-xl border border-violet/30 bg-violet/10 p-3 text-sm">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-violet" aria-hidden="true" />
          <span><span className="font-semibold">Next time:</span> {profile.profile.tip}</span>
        </p>
      )}
      <p className="text-xs text-ink-dim">{profile.note}</p>
    </section>
  )
}
