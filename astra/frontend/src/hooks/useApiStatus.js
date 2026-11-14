import { useEffect, useState } from 'react'
import { api } from '../services/api'

// Returns 'checking' | 'online' | 'offline'. Re-checks every 15 seconds.
export function useApiStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let cancelled = false
    const check = () =>
      api.health()
        .then(() => !cancelled && setStatus('online'))
        .catch(() => !cancelled && setStatus('offline'))
    check()
    const id = setInterval(check, 15000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return status
}
