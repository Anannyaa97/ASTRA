// A soft switch (role="switch") with a label. Real on/off state, keyboard friendly.
export default function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-ink-dim">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${checked ? 'border-violet/60 bg-gradient-to-r from-violet to-electric' : 'border-white/20 bg-black/40'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
