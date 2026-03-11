import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useWeek } from '../contexts/WeekContext.jsx'
import PageContainer from '../components/layout/PageContainer.jsx'
import ScatterPlot from '../components/ui/ScatterPlot.jsx'
import ActionItem from '../components/ui/ActionItem.jsx'
import ScorePill from '../components/ui/ScorePill.jsx'
import RepModal from '../components/modals/RepModal.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import api from '../lib/api.js'
import { queryKeys } from '../lib/queryKeys.js'

export default function Optimization() {
  const { user, isManager } = useAuth()
  const { selectedWeek: week } = useWeek()
  const [selectedRep, setSelectedRep] = useState(null)

  const { data: statsRaw, isLoading } = useQuery({
    queryKey: queryKeys.stats(week),
    queryFn: () => api.get(`/api/stats${week ? `?week=${week}` : ''}`).then(r => r.data),
    enabled: !!week,
  })

  const { data: allInsights } = useQuery({
    queryKey: queryKeys.allInsights(week),
    queryFn: () => api.get(`/api/insights${week ? `?week=${week}` : ''}`).then(r => r.data),
    enabled: !!week && isManager,
  })

  const stats = isManager
    ? (Array.isArray(statsRaw) ? statsRaw : [])
    : (statsRaw?.own ? [statsRaw.own] : [])

  const scatterCalls = stats.map(s => ({
    id: s.repId,
    label: isManager ? (s.rep?.name?.split(' ')[0] ?? s.repId) : (s.repId === user?.repId ? 'You' : ''),
    x: s.calls ?? 0,
    y: s.sched ?? 0,
  }))

  const scatterContacts = stats.map(s => ({
    id: s.repId,
    label: isManager ? (s.rep?.name?.split(' ')[0] ?? s.repId) : (s.repId === user?.repId ? 'You' : ''),
    x: s.contacts ?? 0,
    y: s.sched ?? 0,
  }))

  // Priority-1 alerts
  const criticalInsights = allInsights
    ? Object.entries(allInsights).flatMap(([repId, d]) =>
        d.insights
          .filter(i => i.priority === 1 && (i.type === 'action' || i.type === 'alert'))
          .map(i => ({ ...i, repId: parseInt(repId), repName: d.repName }))
      )
    : []

  return (
    <PageContainer title="Optimization">
      {isLoading ? <LoadingSkeleton lines={6} height="h-8" /> : (
        <div className="space-y-6">
          {/* Scatter plots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <p className="font-heading text-lg text-text1 mb-2">Volume vs. Conversion</p>
              <p className="text-text3 text-xs mb-4">Top-right: high calls + high schedules = optimal. Bottom-right: volume without conversion.</p>
              <ScatterPlot
                data={scatterCalls}
                xKey="x" yKey="y"
                xLabel="Total Calls"
                yLabel="Schedules"
                highlightId={user?.repId}
                width={460}
                height={280}
              />
            </div>
            <div className="card">
              <p className="font-heading text-lg text-text1 mb-2">Contact Quality vs. Conversion</p>
              <p className="text-text3 text-xs mb-4">Top-right: contacts converting to schedules efficiently. Bottom-right: contacts not closing.</p>
              <ScatterPlot
                data={scatterContacts}
                xKey="x" yKey="y"
                xLabel="Contacts"
                yLabel="Schedules"
                highlightId={user?.repId}
                width={460}
                height={280}
              />
            </div>
          </div>

          {/* Rep cards (manager only) */}
          {isManager && (
            <div>
              <p className="font-heading text-xl text-text1 mb-4">Rep Action Items</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {stats.sort((a, b) => (a.compositeScore ?? 0) - (b.compositeScore ?? 0)).map(s => {
                  const repInsights = allInsights?.[s.repId]?.insights ?? []
                  const topInsight = repInsights.find(i => i.priority === 1 && i.type !== 'maintain')
                  return (
                    <div
                      key={s.repId}
                      className="card cursor-pointer hover:border-white/10 transition-colors"
                      onClick={() => setSelectedRep(s.repId)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-text1">{s.rep?.name ?? s.repId}</span>
                        <ScorePill score={s.compositeScore} size="sm" />
                      </div>
                      {topInsight ? (
                        <ActionItem insight={topInsight} collapsed />
                      ) : (
                        <p className="text-text3 text-xs">No critical alerts</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Critical alerts panel */}
          {criticalInsights.length > 0 && (
            <div className="card">
              <p className="font-heading text-xl text-text1 mb-4">Critical Alerts ({criticalInsights.length})</p>
              <div className="space-y-3">
                {criticalInsights.map((ins, i) => (
                  <div key={i}>
                    <p className="text-xs text-text3 mb-1">{ins.repName}</p>
                    <ActionItem insight={ins} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
