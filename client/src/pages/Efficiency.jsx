import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useWeek } from '../contexts/WeekContext.jsx'
import PageContainer from '../components/layout/PageContainer.jsx'
import TimeDistBar from '../components/ui/TimeDistBar.jsx'
import ScatterPlot from '../components/ui/ScatterPlot.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import api from '../lib/api.js'
import { queryKeys } from '../lib/queryKeys.js'

export default function Efficiency() {
  const { user, isManager } = useAuth()
  const { selectedWeek: week } = useWeek()

  const { data: statsRaw, isLoading } = useQuery({
    queryKey: queryKeys.stats(week),
    queryFn: () => api.get(`/api/stats${week ? `?week=${week}` : ''}`).then(r => r.data),
    enabled: !!week,
  })

  const stats = isManager
    ? (Array.isArray(statsRaw) ? statsRaw : [])
    : (statsRaw?.own ? [statsRaw.own] : [])

  const scatterData = stats.map(s => ({
    id: s.repId,
    label: s.rep?.name?.split(' ')[0] ?? `#${s.repId}`,
    x: s.pauseMin ?? 0,
    y: s.schedHour ?? 0,
  }))

  return (
    <PageContainer title="Efficiency">
      {isLoading ? <LoadingSkeleton lines={6} height="h-8" /> : (
        <div className="space-y-6">
          {/* Time distribution bars */}
          <div className="card">
            <p className="font-heading text-lg text-text1 mb-5">Time Allocation by Rep</p>
            <div className="space-y-5">
              {stats.map(s => (
                <div key={s.repId}>
                  <p className="text-sm text-text2 mb-1.5">{s.rep?.name ?? s.repId}</p>
                  <TimeDistBar
                    talkMin={s.talkMin}
                    waitMin={s.waitMin}
                    pauseMin={s.pauseMin}
                    wrapMin={s.wrapMin}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pause time vs sched/hr scatter */}
          {stats.length > 1 && (
            <div className="card">
              <p className="font-heading text-lg text-text1 mb-4">Pause Time vs. Sched/Hr</p>
              <p className="text-text3 text-xs mb-4">Reps in the top-left corner (low pause, high sched/hr) are most efficient.</p>
              <ScatterPlot
                data={scatterData}
                xKey="x"
                yKey="y"
                xLabel="Pause Minutes"
                yLabel="Sched / Hour"
                highlightId={user?.repId}
                width={600}
                height={300}
              />
            </div>
          )}

          {/* Summary table */}
          <div className="card">
            <p className="font-heading text-lg text-text1 mb-4">Time Summary</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Rep', 'Login (hr)', 'Talk (m)', 'Wait (m)', 'Pause (m)', 'Wrap (m)', 'Talk Eff%'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-text3 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => {
                    const total = (s.talkMin ?? 0) + (s.waitMin ?? 0) + (s.pauseMin ?? 0) + (s.wrapMin ?? 0)
                    const eff = total > 0 ? (s.talkMin / total * 100).toFixed(0) + '%' : '—'
                    const isOwn = s.repId === user?.repId
                    return (
                      <tr key={s.repId} className={`border-b border-white/3 ${isOwn ? 'bg-accent/5' : ''}`}>
                        <td className="py-2.5 px-3 text-text1">{s.rep?.name ?? s.repId}</td>
                        <td className="py-2.5 px-3 font-mono text-text2">{s.loginMin ? (s.loginMin / 60).toFixed(1) : '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-text2">{s.talkMin?.toFixed(0) ?? '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-text2">{s.waitMin?.toFixed(0) ?? '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-text2">{s.pauseMin?.toFixed(0) ?? '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-text2">{s.wrapMin?.toFixed(0) ?? '—'}</td>
                        <td className="py-2.5 px-3 font-mono">{eff}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
