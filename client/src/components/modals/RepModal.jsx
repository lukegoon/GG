import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Modal from '../layout/Modal.jsx'
import ScorePill from '../ui/ScorePill.jsx'
import ActionItem from '../ui/ActionItem.jsx'
import PerformanceBand from '../ui/PerformanceBand.jsx'
import GoalProgressBar from '../ui/GoalProgressBar.jsx'
import NoteForm from '../forms/NoteForm.jsx'
import LoadingSkeleton from '../ui/LoadingSkeleton.jsx'
import api from '../../lib/api.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function RepModal({ repId, week, open, onClose, teamStats }) {
  const { isManager } = useAuth()

  const { data: repData, isLoading: loadingStat } = useQuery({
    queryKey: queryKeys.repStats(repId, week),
    queryFn: () => api.get(`/api/stats/${repId}?week=${week}`).then(r => r.data),
    enabled: open && !!repId && !!week,
  })

  const { data: insights = [], isLoading: loadingInsights } = useQuery({
    queryKey: queryKeys.insights(repId, week),
    queryFn: () => api.get(`/api/insights/${repId}?week=${week}`).then(r => r.data),
    enabled: open && !!repId && !!week,
  })

  const { data: goals = [] } = useQuery({
    queryKey: queryKeys.goals(repId, week),
    queryFn: () => api.get(`/api/goals/${repId}?week=${week}`).then(r => r.data),
    enabled: open && !!repId && !!week,
  })

  const { data: notes = [] } = useQuery({
    queryKey: queryKeys.notes(repId, week),
    queryFn: () => api.get(`/api/notes/${repId}?week=${week}`).then(r => r.data),
    enabled: open && !!repId && !!week,
  })

  const stat = repData?.stat
  const teamAvg = repData?.teamAvg ?? {}
  const allStats = teamStats ?? []

  const bands = stat ? [
    { label: 'Contact Rate',  key: 'contactRate', format: 'pct' },
    { label: 'Schedule Rate', key: 'schedPct',    format: 'pct' },
    { label: 'Sched / Hour',  key: 'schedHour',   format: null  },
    { label: 'Hang-Up Rate',  key: 'hangUpRate',  format: 'pct' },
  ] : []

  return (
    <Modal open={open} onClose={onClose} size="lg"
      title={stat ? `${stat.rep?.name ?? 'Rep'} — Week of ${week}` : 'Rep Detail'}>
      {loadingStat ? <LoadingSkeleton lines={6} height="h-5" /> : stat ? (
        <div className="space-y-6">
          {/* Score */}
          <div className="flex items-center gap-4">
            <ScorePill score={stat.compositeScore} size="lg" />
            <div className="text-sm text-text2">
              Rank #{repData?.rank ?? '?'} · {stat.calls} calls · {stat.contacts} contacts · {stat.sched} scheduled
            </div>
            {isManager && (
              <Link to={`/metrics/${repId}?week=${week}`} className="btn-ghost text-xs ml-auto" onClick={onClose}>
                Full Metrics →
              </Link>
            )}
          </div>

          {/* Performance bands */}
          {bands.length > 0 && (
            <div>
              <p className="label mb-3">vs. Team</p>
              <div className="divide-y divide-white/5">
                {bands.map(b => {
                  const vals = allStats.map(s => s[b.key] ?? 0)
                  return (
                    <PerformanceBand
                      key={b.key}
                      label={b.label}
                      value={stat[b.key] ?? 0}
                      min={Math.min(...vals)}
                      avg={teamAvg[b.key] ?? 0}
                      max={Math.max(...vals)}
                      format={b.format}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Goals */}
          {goals.length > 0 && (
            <div>
              <p className="label mb-3">Goals</p>
              <div className="space-y-2">
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

          {/* Insights */}
          <div>
            <p className="label mb-3">Action Items</p>
            {loadingInsights ? <LoadingSkeleton lines={2} /> : (
              <div className="space-y-2">
                {insights.filter(i => i.type !== 'maintain').slice(0, 5).map((ins, i) => (
                  <ActionItem key={i} insight={ins} />
                ))}
                {!insights.length && <p className="text-text3 text-sm">No action items this week.</p>}
              </div>
            )}
          </div>

          {/* Notes */}
          {isManager && (
            <div>
              <p className="label mb-3">Manager Notes</p>
              {notes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {notes.map(n => (
                    <div key={n.id} className="card-sm text-sm text-text2">
                      <p>{n.content}</p>
                      <p className="text-xs text-text3 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <NoteForm repId={repId} weekStart={week} />
            </div>
          )}
        </div>
      ) : <p className="text-text3">No data found for this rep and week.</p>}
    </Modal>
  )
}
