export default function ScorePill({ score, size = 'md' }) {
  const s = score ?? 0
  const color = s >= 70 ? 'bg-success/20 text-success border-success/30'
    : s >= 40 ? 'bg-accent3/20 text-accent3 border-accent3/30'
    : 'bg-accent2/20 text-accent2 border-accent2/30'

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-2xl px-4 py-2 font-bold' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center rounded-full border font-mono font-semibold ${color} ${sizeClass}`}>
      {s.toFixed(1)}
    </span>
  )
}
