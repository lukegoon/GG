import LoadingSkeleton from './LoadingSkeleton.jsx'

export default function KpiCard({ title, value, unit, delta, trend, loading, onClick, subtitle }) {
  if (loading) return (
    <div className="card">
      <LoadingSkeleton lines={2} height="h-5" />
    </div>
  )

  const deltaColor = !delta ? 'text-text3'
    : trend === 'up' ? 'text-success'
    : trend === 'down' ? 'text-accent2'
    : 'text-text3'

  return (
    <div
      className={`card flex flex-col gap-1 ${onClick ? 'cursor-pointer hover:border-white/10 transition-colors' : ''}`}
      onClick={onClick}
    >
      <p className="label">{title}</p>
      <div className="flex items-end gap-2">
        <span className="font-mono text-2xl font-bold text-text1">
          {value ?? '—'}
          {unit && <span className="text-sm text-text2 font-normal ml-1">{unit}</span>}
        </span>
        {delta !== undefined && delta !== null && (
          <span className={`text-xs font-mono pb-0.5 ${deltaColor}`}>
            {delta > 0 ? '+' : ''}{typeof delta === 'number' ? delta.toFixed(1) : delta}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-text3">{subtitle}</p>}
    </div>
  )
}
