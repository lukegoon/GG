import ScorePill from './ScorePill.jsx'

const COMPONENTS = [
  { key: 'schedPct',    label: 'Sched%',  format: v => (v * 100).toFixed(1) + '%' },
  { key: 'schedHour',   label: 'Sched/Hr',format: v => v.toFixed(2) },
  { key: 'contactRate', label: 'Contact', format: v => (v * 100).toFixed(1) + '%' },
  { key: 'talkEff',     label: 'Talk Eff',format: v => (v * 100).toFixed(0) + '%' },
  { key: 'eodYesRate',  label: 'EOD Yes', format: v => (v * 100).toFixed(0) + '%' },
]

function percentileColor(val, allVals) {
  if (!allVals.length) return 'bg-white/5 text-text3'
  const sorted = [...allVals].sort((a, b) => a - b)
  const rank = sorted.filter(v => v < val).length / sorted.length
  if (rank >= 0.75) return 'bg-success/20 text-success'
  if (rank >= 0.25) return 'bg-accent3/20 text-accent3'
  return 'bg-accent2/20 text-accent2'
}

export default function CompositeMatrix({ stats = [], userRepId }) {
  if (!stats.length) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-text3 py-2 pr-3 font-normal">Rep</th>
            <th className="text-center text-text3 py-2 px-2 font-normal">Score</th>
            {COMPONENTS.map(c => (
              <th key={c.key} className="text-center text-text3 py-2 px-2 font-normal">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0)).map((s, i) => {
            const isOwn = s.repId === userRepId
            return (
              <tr key={s.repId} className={`border-b border-white/3 ${isOwn ? 'bg-accent/5' : ''}`}>
                <td className={`py-2 pr-3 font-medium ${isOwn ? 'text-accent' : 'text-text2'}`}>
                  {s.rep?.name ?? `Rep ${i + 1}`}
                </td>
                <td className="py-2 px-2 text-center">
                  <ScorePill score={s.compositeScore} size="sm" />
                </td>
                {COMPONENTS.map(c => {
                  const val = s[c.key] ?? 0
                  const allVals = stats.map(r => r[c.key] ?? 0)
                  const colorClass = percentileColor(val, allVals)
                  return (
                    <td key={c.key} className="py-2 px-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded font-mono ${colorClass}`}>
                        {c.format(val)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
