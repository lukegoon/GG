import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useWeek } from '../contexts/WeekContext.jsx'
import PageContainer from '../components/layout/PageContainer.jsx'
import KpiCard from '../components/ui/KpiCard.jsx'
import ActionItem from '../components/ui/ActionItem.jsx'
import GoalProgressBar from '../components/ui/GoalProgressBar.jsx'
import ScorePill from '../components/ui/ScorePill.jsx'
import RepModal from '../components/modals/RepModal.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import api from '../lib/api.js'
import { queryKeys } from '../lib/queryKeys.js'

export default function Overview() {
  const { user, isManager } = useAuth()
  const { selectedWeek: week } = useWeek()
  const [selectedRep, setSelectedRep] = useState(null)

  const { data: statsData, isLoading } = useQuery({
    queryKey: queryKeys.stats(week),
    queryFn: () => api.get(`/api/stats${week ? `?week=${week}` : ''}`).then(r => r.data),
    enabled: !!week,
  })

  const { data: allInsights } = useQuery({
    queryKey: queryKeys.allInsights(week),
    queryFn: () => api.get(`/api/insights${week ? `?week=${week}` : ''}`).then(r => r.data),
    enabled: !!week && isManager,
  })

  const { data: ownInsights = [] } = useQuery({
    queryKey: queryKeys.insights(user?.repId, week),
    queryFn: () => api.get(`/api/insights/${user.repId}?week=${week}`).then(r => r.data),
    enabled: !!week && !isManager && !!user?.repId,
  })

  const { data: goals = [] } = useQuery({
    queryKey: queryKeys.goals(user?.repId, week),
    queryFn: () => api.get(`/api/goals/${user.repId}?week=${week}`).then(r => r.data),
    enabled: !!week && !isManager && !!user?.repId,
  })

  if (isManager) {
    const stats = Array.isArray(statsData) ? statsData : []
    const totals = stats.reduce((acc, s) => ({
      calls: acc.calls + (s.calls ?? 0),
      contacts: acc.contacts + (s.contacts ?? 0),
      sched: acc.sched + (s.sched ?? 0),
      hires: acc.hires + (s.hires ?? 0),
    }), { calls: 0, contacts: 0, sched: 0, hires: 0 })

    const avgScore = stats.length
      ? (stats.reduce((a, s) => a + (s.compositeScore ?? 0), 0) / stats.length).toFixed(1)
      : null
    const avgContactRate = stats.length
      ? (stats.reduce((a, s) => a + (s.contactRate ?? 0), 0) / stats.length * 100).toFixed(1)
      : null

    // Top priority-1 insights across all reps
    const topInsights = allInsights
      ? Object.entries(allInsights).flatMap(([repId, d]) =>
          d.insights.filter(i => i.priority === 1).map(i => ({ ...i, repName: d.repName, repId: parseInt(repId) }))
        ).slice(0, 5)
      : []

    return (
      <PageContainer title="Overview">
        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <KpiCard title="Total Calls" value={totals.calls.toLocaleString()} loading={isLoading} />
          <KpiCard title="Contacts" value={totals.contacts.toLocaleString()} loading={isLoading} />
          <KpiCard title="Scheduled" value={totals.sched.toLocaleString()} loading={isLoading} />
          <KpiCard title="Hires" value={totals.hires.toLocaleString()} loading={isLoading} />
          <KpiCard title="Avg Contact %" value={avgContactRate ? avgContactRate + '%' : '—'} loading={isLoading} />
          <KpiCard title="Avg Score" value={avgScore} loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team leaderboard preview */}
          <div className="lg:col-span-2 card">
            <p className="font-heading text-lg text-text1 mb-4">Team This Week</p>
            {isLoading ? <LoadingSkeleton lines={8} /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Rep', 'Score', 'Sched', 'Hires', 'Contact%'].map(h => (
                      <th key={h} className="text-left py-2 pr-3 text-text3 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...stats].sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0)).map(s => (
                    <tr
                      key={s.repId}
                      className="border-b border-white/3 cursor-pointer hover:bg-white/3"
                      onClick={() => setSelectedRep(s.repId)}
                    >
                      <td className="py-2 pr-3 text-text1">{s.rep?.name ?? s.repId}</td>
                      <td className="py-2 pr-3"><ScorePill score={s.compositeScore} size="sm" /></td>
                      <td className="py-2 pr-3 text-text2 font-mono">{s.sched}</td>
                      <td className="py-2 pr-3 text-text2 font-mono">{s.hires}</td>
                      <td className="py-2 pr-3 font-mono text-text2">{s.contactRate != null ? (s.contactRate * 100).toFixed(1) + '%' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Top insights */}
          <div className="card">
            <p className="font-heading text-lg text-text1 mb-4">Top Alerts This Week</p>
            {topInsights.length > 0 ? (
              <div className="space-y-2">
                {topInsights.map((ins, i) => (
                  <div key={i}>
                    <p className="text-xs text-text3 mb-1">{ins.repName}</p>
                    <ActionItem insight={ins} collapsed />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text3 text-sm">{isLoading ? 'Loading…' : 'No critical alerts this week.'}</p>
            )}
          </div>
        </div>

        {selectedRep && (
          <RepModal
            repId={selectedRep}
            week={week}
            open={!!selectedRep}
            onClose={() => setSelectedRep(null)}
            teamStats={Array.isArray(statsData) ? statsData : []}
          />
        )}
      </PageContainer>
    )
  }

  // REP VIEW
  const own = statsData?.own
  const rank = statsData?.rank
  const totalReps = statsData?.teamAvg ? 12 : null // Approximation until count endpoint

  return (
    <PageContainer title="My Performance">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard title="Calls" value={own?.calls} loading={isLoading} />
        <KpiCard title="Contacts" value={own?.contacts} loading={isLoading} />
        <KpiCard title="Scheduled" value={own?.sched} loading={isLoading} />
        <KpiCard title="Hires" value={own?.hires} loading={isLoading} />
        <KpiCard title="Contact %" value={own?.contactRate != null ? (own.contactRate * 100).toFixed(1) + '%' : null} loading={isLoading} />
        <KpiCard title="Score" value={own ? <ScorePill score={own.compositeScore} size="sm" /> : null} loading={isLoading} />
      </div>

      {rank && <p className="text-text2 text-sm mb-6">You are ranked #{rank} this week.</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        {goals.length > 0 && (
          <div className="card">
            <p className="font-heading text-lg text-text1 mb-4">Goals</p>
            <div className="space-y-3">
              {goals.map(g => (
                <GoalProgressBar
                  key={g.id}
                  label={g.metric}
                  actual={own?.[g.metric] ?? 0}
                  target={g.target}
                  format={g.metric.includes('Rate') || g.metric.includes('Pct') ? 'pct' : null}
                />
              ))}
            </div>
          </div>
        )}

        {/* My insights */}
        <div className="card">
          <p className="font-heading text-lg text-text1 mb-4">Action Items</p>
          {ownInsights.length > 0 ? (
            <div className="space-y-2">
              {ownInsights.filter(i => i.type !== 'maintain').map((ins, i) => (
                <ActionItem key={i} insight={ins} />
              ))}
            </div>
          ) : (
            <p className="text-text3 text-sm">{isLoading ? 'Loading…' : 'No action items this week.'}</p>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
