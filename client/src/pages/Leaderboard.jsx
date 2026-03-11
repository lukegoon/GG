import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useWeek } from '../contexts/WeekContext.jsx'
import PageContainer from '../components/layout/PageContainer.jsx'
import LeaderboardTable from '../components/tables/LeaderboardTable.jsx'
import CompositeMatrix from '../components/ui/CompositeMatrix.jsx'
import RepModal from '../components/modals/RepModal.jsx'
import { useState } from 'react'
import api from '../lib/api.js'
import { queryKeys } from '../lib/queryKeys.js'

export default function Leaderboard() {
  const { user, isManager } = useAuth()
  const { selectedWeek: week } = useWeek()
  const [selectedRep, setSelectedRep] = useState(null)
  const [tab, setTab] = useState('table')

  const { data: statsRaw, isLoading } = useQuery({
    queryKey: queryKeys.stats(week),
    queryFn: () => api.get(`/api/stats${week ? `?week=${week}` : ''}`).then(r => r.data),
    enabled: !!week,
  })

  const stats = isManager
    ? (Array.isArray(statsRaw) ? statsRaw : [])
    : (statsRaw?.own ? [statsRaw.own] : [])

  return (
    <PageContainer title="Leaderboard">
      <div className="flex gap-2 mb-5">
        {['table', 'matrix'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'btn-primary' : 'btn-ghost'}
          >
            {t === 'table' ? 'Rankings' : 'Score Matrix'}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-8 text-center text-text3">Loading…</div>
        ) : tab === 'table' ? (
          <LeaderboardTable
            stats={stats}
            userRole={user?.role}
            userRepId={user?.repId}
            onRowClick={isManager ? r => setSelectedRep(r.repId) : null}
          />
        ) : (
          <CompositeMatrix stats={stats} userRepId={user?.repId} />
        )}
      </div>

      {selectedRep && (
        <RepModal
          repId={selectedRep}
          week={week}
          open={!!selectedRep}
          onClose={() => setSelectedRep(null)}
          teamStats={stats}
        />
      )}
    </PageContainer>
  )
}
