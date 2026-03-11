export default function GoalProgressBar({ label, actual, target, format }) {
  if (!target) return null
  const pct = Math.min((actual / target) * 100, 150)
  const color = pct >= 100 ? 'bg-success' : pct >= 75 ? 'bg-accent3' : 'bg-accent2'

  const fmt = v => {
    if (v == null) return '—'
    if (format === 'pct') return (v * 100).toFixed(1) + '%'
    return v.toFixed ? v.toFixed(1) : String(v)
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text2">{label}</span>
        <span className="text-text3 font-mono">
          {fmt(actual)} / <span className="text-text2">{fmt(target)}</span>
          <span className={`ml-2 ${pct >= 100 ? 'text-success' : pct >= 75 ? 'text-accent3' : 'text-accent2'}`}>
            {pct.toFixed(0)}%
          </span>
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}
