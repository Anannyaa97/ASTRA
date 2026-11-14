import { useApiStatus } from '../../hooks/useApiStatus'

const LABELS = {
  checking: { text: 'Calling Mission Control…', dot: 'bg-warn animate-pulse' },
  online: { text: 'Mission Control link: online', dot: 'bg-ok' },
  offline: { text: 'Mission Control link: offline', dot: 'bg-danger' },
}

export default function ApiStatus() {
  const status = useApiStatus()
  const { text, dot } = LABELS[status]
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-ink-dim">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
      {text}
    </p>
  )
}
