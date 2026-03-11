import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.jsx'
import PageContainer from '../components/layout/PageContainer.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import ScorePill from '../components/ui/ScorePill.jsx'
import api from '../lib/api.js'
import { queryKeys } from '../lib/queryKeys.js'

const TREND_METRICS = [
  { key: 'sched',       label: 'Schedules',      color: '#00e5ff' },
  { key: 'hires',       label: 'Hires',           color: '#00e676' },
  { key: 'contactRate', label: 'Contact Rate',    color: '#f5a623', pct: true },
  { key: 'schedPct',    label: 'Schedule Rate',   color: '#7c4dff', pct: true },
  { key: 'compositeScore', label: 'Score',        color: '#ff3d71' },
]

function Sparkline({ data, metric, color, pct, width = 120, height = 40 }) {
  if (!data?.length) return <span className="text-text3 text-xs">—</span>
  const vals = data.map(d => d[metric] ?? 0)
  const min = Math.min(...vals)
  const max = Math.max(...vals) || 1
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1 || 1)) * width
    const y = height - ((v - min) / (max - min || 1)) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r={3} fill={color} />
    </svg>
  )
}

export default function Trends() {
  const { user, isManager } = useAuth()
  const [repId, setRepId] = useState(user?.repId)
  const [numWeeks, setNumWeeks] = useState(8)

  const { data: reps = [] } = useQuery({
    queryKey: queryKeys.reps(),
    queryFn: () => api.get('/api/reps').then(r => r.data),
    enabled: isManager,
  })

  const { data: trends = [], isLoading } = useQuery({
    queryKey: queryKeys.repTrends(repId, numWeeks),
    queryFn: () => api.get(`/api/stats/${repId}/trends?weeks=${numWeeks}`).then(r => r.data),
    enabled: !!repId,
  })

  const latest = trends[trends.length - 1]

  return (
    <PageContainer title="Trends">
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        {isManager && reps.length > 0 && (
          <div>
            <label className="label mr-2">Rep:</label>
            <select className="input" value={repId ?? ''} onChange={e => setRepId(parseInt(e.target.value))}>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label mr-2">Range:</label>
          {[4, 8, 12].map(n => (
            <button
              key={n}
              onClick={() => setNumWeeks(n)}
              className={`mr-2 ${numWeeks === n ? 'btn-primary' : 'btn-ghost'}`}
            >
              {n}w
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <LoadingSkeleton lines={6} height="h-6" /> : trends.length < 2 ? (
        <div className="card text-center py-12">
          <p className="text-text3">Not enough data yet — need at least 2 weeks of stats to show trends.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metric cards with sparklines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TREND_METRICS.map(m => {
              const val = latest?.[m.key]
              const prev = trends[trends.length - 2]?.[m.key]
              const delta = val != null && prev != null ? val - prev : null
              const fmt = v => v == null ? '—' : m.pct ? (v * 100).toFixed(1) + '%' : v.toFixed ? v.toFixed(1) : v

              return (
                <div key={m.key} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="label">{m.label}</p>
                      <p className="font-mono text-2xl font-bold text-text1 mt-1">{fmt(val)}</p>
                      {delta != null && (
                        <p className={`text-xs font-mono mt-0.5 ${delta >= 0 ? 'text-success' : 'text-accent2'}`}>
                          {delta >= 0 ? '+' : ''}{fmt(delta)} vs prev week
                        </p>
                      )}
                    </div>
                    <Sparkline data={trends} metric={m.key} color={m.color} pct={m.pct} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Trend table */}
          <div className="card overflow-x-auto">
            <p className="font-heading text-lg text-text1 mb-4">Week-by-Week</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 px-3 text-text3 font-normal">Week</th>
                  {TREND_METRICS.map(m => (
                    <th key={m.key} className="text-left py-2 px-3 text-text3 font-normal">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...trends].reverse().map(t => (
                  <tr key={t.id ?? t.weekStart} className="border-b border-white/3">
                    <td className="py-2.5 px-3 font-mono text-text3 text-xs">
                      {new Date(t.weekStart).toISOString().split('T')[0]}
                    </td>
                    {TREND_METRICS.map(m => (
                      <td key={m.key} className="py-2.5 px-3 font-mono text-text2">
                        {t[m.key] != null ? (m.pct ? (t[m.key] * 100).toFixed(1) + '%' : t[m.key].toFixed?.(1) ?? t[m.key]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
