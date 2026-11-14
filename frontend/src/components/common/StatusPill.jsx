// Data-honesty label used on every NASA / simulated data display.
const STYLES = {
  LIVE: 'bg-ok/15 text-ok border-ok/40',
  CACHED: 'bg-electric/15 text-electric border-electric/40',
  ARCHIVED: 'bg-violet/15 text-violet border-violet/40',
  SIMULATED: 'bg-warn/15 text-warn border-warn/40',
}

export default function StatusPill({ kind = 'SIMULATED', className = '' }) {
  return (
    <span className={`pill border ${STYLES[kind] ?? STYLES.SIMULATED} ${className}`}>
      {kind}
    </span>
  )
}
