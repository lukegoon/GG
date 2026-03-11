import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWeek } from '../contexts/WeekContext.jsx'
import PageContainer from '../components/layout/PageContainer.jsx'
import ClientListTable from '../components/tables/ClientListTable.jsx'
import ClientListModal from '../components/modals/ClientListModal.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import api from '../lib/api.js'
import { queryKeys } from '../lib/queryKeys.js'

export default function Clients() {
  const { selectedWeek: week } = useWeek()
  const [selectedList, setSelectedList] = useState(null)

  const { data: lists = [], isLoading } = useQuery({
    queryKey: queryKeys.lists(week),
    queryFn: () => api.get(`/api/lists${week ? `?week=${week}` : ''}`).then(r => r.data),
    enabled: !!week,
  })

  const totalCalls = lists.reduce((a, l) => a + (l.weekStat?.calls ?? 0), 0)
  const avgContact = lists.filter(l => l.weekStat?.calls).length
    ? (lists.filter(l => l.weekStat?.calls)
        .reduce((a, l) => a + (l.weekStat?.contactRate ?? 0), 0) /
        lists.filter(l => l.weekStat?.calls).length * 100).toFixed(1) + '%'
    : '—'

  return (
    <PageContainer title="Client Lists">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card">
          <p className="label">Lists Active</p>
          <p className="font-mono text-2xl font-bold text-text1 mt-1">{lists.filter(l => l.weekStat).length}</p>
        </div>
        <div className="card">
          <p className="label">Total Calls</p>
          <p className="font-mono text-2xl font-bold text-text1 mt-1">{totalCalls.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="label">Avg Contact Rate</p>
          <p className="font-mono text-2xl font-bold text-text1 mt-1">{avgContact}</p>
        </div>
      </div>

      <div className="card">
        {isLoading ? <LoadingSkeleton lines={8} /> : (
          <ClientListTable lists={lists} onRowClick={l => setSelectedList(l.id)} />
        )}
      </div>

      <ClientListModal
        listId={selectedList}
        open={!!selectedList}
        onClose={() => setSelectedList(null)}
      />
    </PageContainer>
  )
}
