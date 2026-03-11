import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useWeek } from '../contexts/WeekContext.jsx'
import PageContainer from '../components/layout/PageContainer.jsx'
import PerformanceBand from '../components/ui/PerformanceBand.jsx'
import TimeDistBar from '../components/ui/TimeDistBar.jsx'
import GoalProgressBar from '../components/ui/GoalProgressBar.jsx'
import NoteForm from '../components/forms/NoteForm.jsx'
import MetricModal from '../components/modals/MetricModal.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import ScorePill from '../components/ui/ScorePill.jsx'
import api from '../lib/api.js'
import { queryKeys } from '../lib/queryKeys.js'

const METRIC_BANDS = [
  { key: 'contactRate', label: 'Contact Rate',   format: 'pct' },
  { key: 'schedPct',    label: 'Schedule Rate',  format: 'pct' },
  { key: 'schedHour',   label: 'Sched / Hour',   format: null  },
  { key: 'hangUpRate',  label: 'Hang-Up Rate',   format: 'pct' },
  { key: 'ngfRate',     label: 'NGF Rate',        format: 'pct' },
  { key: 'noAnsRate',   label: 'No-Answer Rate', format: 'pct' },
]

export default function Metrics() {
  const { repId: repIdParam } = useParams()
  const { user, isManager } = useAuth()
  const { selectedWeek: week } = useWeek()
  const [activeMetric, setActiveMetric] = useState(null)
  const [repId, setRepId] = useState(() => repIdParam ? parseInt(repIdParam) : user?.repId)

  const { data: reps = [] } = useQuery({
    queryKey: queryKeys.reps(),
    queryFn: () => api.get('/api/reps').then(r => r.data),
    enabled: isManager,
  })

  const { data: repData, isLoading } = useQuery({
    queryKey: queryKeys.repStats(repId, week),
    queryFn: () => api.get(`/api/stats/${repId}?week=${week}`).then(r => r.data),
    enabled: !!repId && !!week,
  })

  const { data: allStats = [] } = useQuery({
    queryKey: queryKeys.stats(week),
    queryFn: () => api.get(`/api/stats?week=${week}`).then(r => r.data),
    enabled: !!week && isManager,
  })

  const { data: goals = [] } = useQuery({
    queryKey: queryKeys.goals(repId, week),
    queryFn: () => api.get(`/api/goals/${repId}?week=${week}`).then(r => r.data),
    enabled: !!repId && !!week,
  })

  const { data: notes = [] } = useQuery({
    queryKey: queryKeys.notes(repId, week),
    queryFn: () => api.get(`/api/notes/${repId}?week=${week}`).then(r => r.data),
    enabled: !!repId && !!week,
  })

  const stat = repData?.stat
  const teamAvg = repData?.teamAvg ?? {}
  const statsForBands = isManager ? allStats : (stat ? [stat] : [])

  const bandMinMax = (key) => {
    const vals = statsForBands.map(s => s[key] ?? 0)
    return { min: Math.min(...vals, 0), max: Math.max(...vals, 0.01) }
  }

  return (
    <PageContainer title="Metrics">
      {isManager && reps.length > 0 && (
        <div className="mb-5">
          <label className="label mr-2">Rep:</label>
          <select
            className="input"
            value={repId ?? ''}
            onChange={e => setRepId(parseInt(e.target.value))}
          >
            {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      )}

      {isLoading ? <LoadingSkeleton lines={10} height="h-6" /> : stat ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: performance bands */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <p className="font-heading text-lg text-text1">{stat.rep?.name ?? 'Rep'}</p>
                <ScorePill score={stat.compositeScore} size="lg" />
              </div>
              <div className="divide-y divide-white/5">
                {METRIC_BANDS.map(b => {
                  const { min, max } = bandMinMax(b.key)
                  return (
                    <PerformanceBand
                      key={b.key}
                      label={b.label}
                      value={stat[b.key] ?? 0}
                      min={min}
                      avg={teamAvg[b.key] ?? 0}
                      max={max}
                      format={b.format}
                      onClick={() => setActiveMetric(b.key)}
                    />
                  )
                })}
              </div>
            </div>

            {/* Time distribution */}
            <div className="card">
              <p className="font-heading text-lg text-text1 mb-4">Time Allocation</p>
              <TimeDistBar
                talkMin={stat.talkMin}
                waitMin={stat.waitMin}
                pauseMin={stat.pauseMin}
                wrapMin={stat.wrapMin}
              />
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { l: 'Talk', v: stat.talkMin },
                  { l: 'Wait', v: stat.waitMin },
                  { l: 'Pause', v: stat.pauseMin },
                  { l: 'Wrap', v: stat.wrapMin },
                ].map(({ l, v }) => (
                  <div key={l} className="card-sm text-center">
                    <p className="label">{l}</p>
                    <p className="font-mono text-text1 mt-1">{v?.toFixed(0) ?? 0}m</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: goals + notes */}
          <div className="space-y-4">
            {goals.length > 0 && (
              <div className="card">
                <p className="font-heading text-lg text-text1 mb-4">Goals</p>
                <div className="space-y-3">
                  {goals.map(g => (
                    <GoalProgressBar
                      key={g.id}
                      label={g.metric}
                      actual={stat[g.metric] ?? 0}
                      target={g.target}
                      format={g.metric.includes('Rate') || g.metric.includes('Pct') ? 'pct' : null}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <p className="font-heading text-lg text-text1 mb-4">Manager Notes</p>
              {notes.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {notes.map(n => (
                    <div key={n.id} className="card-sm text-sm text-text2">
                      <p>{n.content}</p>
                      <p className="text-xs text-text3 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-text3 text-sm mb-4">No notes yet.</p>}
              {isManager && <NoteForm repId={repId} weekStart={week} />}
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-text3">No stats found. Run a sync to load data.</p>
        </div>
      )}

      <MetricModal
        metric={activeMetric}
        repStat={stat}
        allStats={statsForBands}
        open={!!activeMetric}
        onClose={() => setActiveMetric(null)}
      />
    </PageContainer>
  )
}
