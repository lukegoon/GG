// Stacked horizontal bar: talk / wait / pause / wrap proportions
export default function TimeDistBar({ talkMin = 0, waitMin = 0, pauseMin = 0, wrapMin = 0, label }) {
  const total = talkMin + waitMin + pauseMin + wrapMin || 1
  const pct = v => (v / total * 100).toFixed(1)

  const segments = [
    { label: 'Talk',  value: talkMin,  color: '#00e5ff' },
    { label: 'Wait',  value: waitMin,  color: '#7c4dff' },
    { label: 'Pause', value: pauseMin, color: '#f5a623' },
    { label: 'Wrap',  value: wrapMin,  color: '#506070' },
  ].filter(s => s.value > 0)

  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-text2">{label}</p>}
      <div className="flex h-4 rounded overflow-hidden gap-px">
        {segments.map(s => (
          <div
            key={s.label}
            style={{ width: `${pct(s.value)}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.value.toFixed(0)}m (${pct(s.value)}%)`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {segments.map(s => (
          <span key={s.label} className="text-xs text-text3 flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: s.color }} />
            {s.label} {pct(s.value)}%
          </span>
        ))}
      </div>
    </div>
  )
}
