import { useQuery } from '@tanstack/react-query'
import Modal from '../layout/Modal.jsx'
import api from '../../lib/api.js'
import { queryKeys } from '../../lib/queryKeys.js'

export default function SyncStatusModal({ open, onClose }) {
  const { data: logs = [] } = useQuery({
    queryKey: queryKeys.syncLogs(),
    queryFn: () => api.get('/api/sync/logs?limit=20').then(r => r.data),
    enabled: open,
    refetchInterval: open ? 5000 : false,
  })

  const statusColor = s => s === 'success' ? 'text-success' : s === 'error' ? 'text-accent2' : 'text-accent3'

  return (
    <Modal open={open} onClose={onClose} title="Sync History" size="md">
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="card-sm text-sm">
            <div className="flex items-center justify-between">
              <span className={`font-semibold ${statusColor(log.status)}`}>{log.status.toUpperCase()}</span>
              <span className="text-text3 text-xs font-mono">
                {new Date(log.startedAt).toLocaleString()}
              </span>
            </div>
            {log.weekStart && (
              <p className="text-text3 text-xs mt-0.5">Week: {new Date(log.weekStart).toISOString().split('T')[0]}</p>
            )}
            <p className="text-text2 text-xs mt-0.5">{log.recordsUpdated} records updated</p>
            {log.errorMessage && (
              <p className="text-accent2 text-xs mt-1 font-mono">{log.errorMessage}</p>
            )}
            {log.completedAt && (
              <p className="text-text3 text-xs mt-0.5">
                Duration: {Math.round((new Date(log.completedAt) - new Date(log.startedAt)) / 1000)}s
              </p>
            )}
          </div>
        ))}
        {!logs.length && <p className="text-text3 text-sm text-center py-4">No sync history yet.</p>}
      </div>
    </Modal>
  )
}
