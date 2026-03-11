import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useSyncStatus() {
  const [status, setStatus] = useState(null)
  const [connected, setConnected] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}`)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        setStatus(msg)

        if (msg.event === 'sync_complete') {
          queryClient.invalidateQueries({ queryKey: ['stats'] })
          queryClient.invalidateQueries({ queryKey: ['weeks'] })
          queryClient.invalidateQueries({ queryKey: ['trends'] })
          queryClient.invalidateQueries({ queryKey: ['insights'] })
          queryClient.invalidateQueries({ queryKey: ['syncLogs'] })
        }
      } catch {
        // ignore malformed messages
      }
    }

    return () => ws.close()
  }, [queryClient])

  return { status, connected }
}
