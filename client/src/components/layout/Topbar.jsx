import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useWeek } from '../../contexts/WeekContext.jsx'
import { useSyncStatus } from '../../hooks/useSyncStatus.js'
import api from '../../lib/api.js'

const NAV = [
  { to: '/',             label: 'Overview',      roles: ['MANAGER', 'REP'] },
  { to: '/leaderboard',  label: 'Leaderboard',   roles: ['MANAGER', 'REP'] },
  { to: '/metrics',      label: 'Metrics',       roles: ['MANAGER', 'REP'] },
  { to: '/efficiency',   label: 'Efficiency',    roles: ['MANAGER', 'REP'] },
  { to: '/optimization', label: 'Optimization',  roles: ['MANAGER', 'REP'] },
  { to: '/trends',       label: 'Trends',        roles: ['MANAGER', 'REP'] },
  { to: '/clients',      label: 'Clients',       roles: ['MANAGER'] },
  { to: '/admin',        label: 'Admin',         roles: ['MANAGER'] },
]

export default function Topbar() {
  const { user, logout, isManager } = useAuth()
  const { selectedWeek, setWeek, weeks } = useWeek() ?? {}
  const { status, connected } = useSyncStatus()
  const location = useLocation()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.post('/api/sync')
    } catch (err) {
      console.error('Sync error:', err)
    } finally {
      setTimeout(() => setSyncing(false), 2000)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isSyncing = syncing || status?.event === 'sync_start'

  return (
    <header className="bg-surface border-b border-white/5 sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="font-heading text-xl text-accent tracking-widest shrink-0">
          RECRUIT<span className="text-text2">IQ</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {NAV.filter(n => n.roles.includes(user?.role)).map(n => (
            <Link
              key={n.to}
              to={n.to}
              className={`text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                location.pathname === n.to || location.pathname.startsWith(n.to + '/')
                  ? 'bg-white/8 text-text1'
                  : 'text-text2 hover:text-text1 hover:bg-white/5'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Week selector */}
          {weeks && weeks.length > 0 && setWeek && (
            <select
              value={selectedWeek ?? ''}
              onChange={e => setWeek(e.target.value)}
              className="input text-xs py-1 px-2"
            >
              {weeks.map(w => (
                <option key={w} value={w}>
                  Week of {new Date(w + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </option>
              ))}
            </select>
          )}

          {/* Sync indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${
              isSyncing ? 'bg-accent3 animate-pulse' :
              status?.event === 'sync_error' ? 'bg-accent2' :
              connected ? 'bg-success' : 'bg-text3'
            }`} />
            <span className="text-text3 hidden sm:block">
              {isSyncing ? 'Syncing…' :
               status?.event === 'sync_complete' ? `${status.recordsUpdated} updated` :
               status?.event === 'sync_error' ? 'Sync error' :
               connected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Sync button (manager only) */}
          {isManager && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="btn-ghost text-xs disabled:opacity-50"
            >
              {isSyncing ? '⟳' : '↻'} Sync
            </button>
          )}

          {/* Glossary */}
          <Link to="/glossary" className="btn-ghost text-xs hidden md:block">Glossary</Link>

          {/* User */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text2 hidden sm:block">{user?.email}</span>
            <button onClick={handleLogout} className="btn-ghost text-xs">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
