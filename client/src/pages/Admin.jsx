import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageContainer from '../components/layout/PageContainer.jsx'
import SettingsForm from '../components/forms/SettingsForm.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import AlertBanner from '../components/ui/AlertBanner.jsx'
import SuccessBanner from '../components/ui/SuccessBanner.jsx'
import api from '../lib/api.js'
import { queryKeys } from '../lib/queryKeys.js'

const TABS = ['Settings', 'Reps', 'Users', 'Sync History', 'Manual Sync']

export default function Admin() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('Settings')
  const [syncError, setSyncError] = useState('')
  const [syncSuccess, setSyncSuccess] = useState('')
  const [weekOverride, setWeekOverride] = useState('')

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => api.get('/api/settings').then(r => r.data),
  })

  const { data: reps = [], isLoading: repsLoading } = useQuery({
    queryKey: queryKeys.reps(),
    queryFn: () => api.get('/api/reps').then(r => r.data),
    enabled: tab === 'Reps',
  })

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.users(),
    queryFn: () => api.get('/api/users').then(r => r.data),
    enabled: tab === 'Users',
  })

  const { data: syncLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: queryKeys.syncLogs(),
    queryFn: () => api.get('/api/sync/logs?limit=30').then(r => r.data),
    enabled: tab === 'Sync History',
    refetchInterval: tab === 'Sync History' ? 10000 : false,
  })

  const syncMutation = useMutation({
    mutationFn: () => api.post('/api/sync', weekOverride ? { weekStart: weekOverride } : {}),
    onSuccess: () => {
      setSyncSuccess('Sync started. Watch the status indicator in the header.')
      setSyncError('')
      qc.invalidateQueries({ queryKey: queryKeys.syncLogs() })
    },
    onError: err => setSyncError(err.response?.data?.error ?? 'Sync failed to start'),
  })

  const toggleRepActive = async (rep) => {
    await api.patch(`/api/reps/${rep.id}`, { active: !rep.active })
    qc.invalidateQueries({ queryKey: queryKeys.reps() })
  }

  const resetPassword = async (userId, newPassword) => {
    await api.patch(`/api/users/${userId}/password`, { newPassword })
  }

  const statusColor = s => s === 'success' ? 'text-success' : s === 'error' ? 'text-accent2' : 'text-accent3'

  return (
    <PageContainer title="Admin">
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'btn-primary' : 'btn-ghost'}>
            {t}
          </button>
        ))}
      </div>

      {/* SETTINGS TAB */}
      {tab === 'Settings' && (
        <div className="max-w-lg">
          <div className="card">
            {settings ? (
              <SettingsForm initialSettings={settings} />
            ) : <LoadingSkeleton lines={6} />}
          </div>
        </div>
      )}

      {/* REPS TAB */}
      {tab === 'Reps' && (
        <div className="card">
          <p className="font-heading text-lg text-text1 mb-4">Rep Management</p>
          {repsLoading ? <LoadingSkeleton lines={6} /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Name', 'Email', 'Convoso ID', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-text3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reps.map(r => (
                  <tr key={r.id} className="border-b border-white/3">
                    <td className="py-2.5 px-3 text-text1">{r.name}</td>
                    <td className="py-2.5 px-3 text-text2 text-xs">{r.email}</td>
                    <td className="py-2.5 px-3 font-mono text-text3 text-xs">{r.convosoId ?? '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={r.active ? 'badge-green' : 'badge-red'}>{r.active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => toggleRepActive(r)}
                        className={r.active ? 'btn-danger' : 'btn-ghost text-xs'}
                      >
                        {r.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'Users' && (
        <div className="card">
          <p className="font-heading text-lg text-text1 mb-4">User Accounts</p>
          {usersLoading ? <LoadingSkeleton lines={6} /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Email', 'Role', 'Rep', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-text3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-white/3">
                    <td className="py-2.5 px-3 text-text1 text-xs">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={u.role === 'MANAGER' ? 'badge-purple' : 'badge-blue'}>{u.role}</span>
                    </td>
                    <td className="py-2.5 px-3 text-text2">{u.rep?.name ?? '—'}</td>
                    <td className="py-2.5 px-3 text-text3 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3">
                      <button
                        className="btn-ghost text-xs"
                        onClick={() => {
                          const pw = window.prompt(`New password for ${u.email}:`)
                          if (pw) resetPassword(u.id, pw)
                        }}
                      >
                        Reset PW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SYNC HISTORY TAB */}
      {tab === 'Sync History' && (
        <div className="card">
          <p className="font-heading text-lg text-text1 mb-4">Sync Logs</p>
          {logsLoading ? <LoadingSkeleton lines={6} /> : (
            <div className="space-y-2">
              {syncLogs.map(log => (
                <div key={log.id} className="card-sm text-sm flex items-start justify-between gap-4">
                  <div>
                    <span className={`font-semibold ${statusColor(log.status)}`}>{log.status.toUpperCase()}</span>
                    <span className="text-text3 text-xs ml-3">{new Date(log.startedAt).toLocaleString()}</span>
                    {log.weekStart && (
                      <span className="text-text3 text-xs ml-3">Week: {new Date(log.weekStart).toISOString().split('T')[0]}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-text2 text-xs">{log.recordsUpdated} records</p>
                    {log.completedAt && (
                      <p className="text-text3 text-xs">{Math.round((new Date(log.completedAt) - new Date(log.startedAt)) / 1000)}s</p>
                    )}
                  </div>
                  {log.errorMessage && (
                    <p className="text-accent2 text-xs mt-1 font-mono col-span-2">{log.errorMessage}</p>
                  )}
                </div>
              ))}
              {!syncLogs.length && <p className="text-text3 text-center py-6">No sync history yet.</p>}
            </div>
          )}
        </div>
      )}

      {/* MANUAL SYNC TAB */}
      {tab === 'Manual Sync' && (
        <div className="max-w-sm">
          <div className="card space-y-4">
            <p className="font-heading text-lg text-text1">Manual Sync</p>
            <p className="text-text2 text-sm">Trigger an immediate sync from Convoso and Google Sheets. Progress is shown in the header sync indicator.</p>

            {syncError && <AlertBanner message={syncError} onClose={() => setSyncError('')} />}
            {syncSuccess && <SuccessBanner message={syncSuccess} onClose={() => setSyncSuccess('')} />}

            <div>
              <label className="label block mb-1">Week Override (optional)</label>
              <input
                type="date"
                className="input w-full"
                value={weekOverride}
                onChange={e => setWeekOverride(e.target.value)}
                placeholder="Leave blank for current week"
              />
              <p className="text-text3 text-xs mt-0.5">Leave blank to sync the most recent Monday.</p>
            </div>

            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="btn-primary w-full"
            >
              {syncMutation.isPending ? 'Starting Sync…' : '↻ Run Sync Now'}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
