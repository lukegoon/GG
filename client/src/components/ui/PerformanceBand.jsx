// Horizontal band: shows rep value vs team min/avg/max
export default function PerformanceBand({ label, value, min, avg, max, format, onClick }) {
  if (max == null || max <= 0) return null
  const range = max - min || 1
  const toX = v => Math.max(0, Math.min(100, ((v - min) / range) * 100))

  const fmt = v => {
    if (v == null) return '—'
    if (format === 'pct') return (v * 100).toFixed(1) + '%'
    if (format === 'min') return v.toFixed(0) + 'm'
    return v.toFixed(2)
  }

  const repX = toX(value)
  const avgX = toX(avg)
  const color = value >= avg ? '#00e676' : value >= avg * 0.85 ? '#f5a623' : '#ff3d71'

  return (
    <div
      className={`py-3 ${onClick ? 'cursor-pointer hover:bg-white/3 -mx-2 px-2 rounded' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-text2">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>{fmt(value)}</span>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full">
        {/* Band from min to max (full width) */}
        <div className="absolute inset-0 bg-white/3 rounded-full" />
        {/* Avg marker */}
        <div
          className="absolute top-0 w-px h-2 bg-text3"
          style={{ left: `${avgX}%` }}
          title={`Team avg: ${fmt(avg)}`}
        />
        {/* Rep dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-bg"
          style={{ left: `calc(${repX}% - 6px)`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-xs text-text3 font-mono">{fmt(min)}</span>
        <span className="text-xs text-text3 font-mono">{fmt(max)}</span>
      </div>
    </div>
  )
}
