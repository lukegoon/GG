import Modal from '../layout/Modal.jsx'
import BarChart from '../ui/BarChart.jsx'

const GLOSSARY = {
  contactRate:  { label: 'Contact Rate',   formula: 'contacts / calls',   bench: '≥55%',  desc: 'Percentage of calls where a live human was reached.' },
  schedPct:     { label: 'Schedule Rate',  formula: 'sched / contacts',   bench: '≥22%',  desc: 'Of every contact, how many resulted in a scheduled appointment.' },
  schedHour:    { label: 'Sched / Hour',   formula: 'sched / loginHrs',   bench: 'team avg', desc: 'Productivity metric: schedules produced per hour of logged-in time.' },
  hangUpRate:   { label: 'Hang-Up Rate',   formula: 'hu / contacts',      bench: '≤30%',  desc: 'Contacts who terminated the call before qualification. Reflects opening hook quality.' },
  ngfRate:      { label: 'NGF Rate',       formula: 'ngf / contacts',     bench: '≤45%',  desc: 'Not a Good Fit — contacts disqualified. High NGF indicates poor list targeting or lack of early qualification.' },
  noAnsRate:    { label: 'No-Answer Rate', formula: 'noAns / calls',      bench: '≤42%',  desc: 'Calls where nobody answered. Affected by list quality, call timing, and dialer settings.' },
  pausePct:     { label: 'Pause %',        formula: 'pauseMin / totalMin', bench: 'low',  desc: 'Time spent paused between calls as a % of total logged time.' },
  talkEff:      { label: 'Talk Efficiency',formula: 'talkMin / totalMin', bench: 'high', desc: 'Time spent actually talking as a fraction of total logged time.' },
  eodYesRate:   { label: 'EOD Yes Rate',   formula: 'eodYes / (eodYes+eodNo)', bench: '≥35%', desc: 'End-of-day survey positive responses. Correlates with appointment show rate.' },
  compositeScore:{ label: 'Composite Score', formula: 'weighted percentile rank', bench: '≥70 = top', desc: 'Weighted score across 5 metrics using percentile ranks: Sched% (30), Sched/Hr (25), Contact Rate (20), Talk Eff (15), EOD Yes (10).' },
}

export default function MetricModal({ metric, repStat, allStats, open, onClose }) {
  if (!open || !metric) return null

  const info = GLOSSARY[metric]
  const value = repStat?.[metric]
  const allValues = (allStats ?? []).map(s => s[metric] ?? 0).filter(v => !isNaN(v))

  const chartData = (allStats ?? [])
    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
    .map(s => ({
      id: s.repId,
      label: s.rep?.name?.split(' ')[0] ?? `#${s.repId}`,
      value: s[metric] ?? 0,
      highlight: s.repId === repStat?.repId,
    }))

  const fmt = v => {
    if (v == null) return '—'
    if (metric.includes('Rate') || metric.includes('Pct') || metric === 'talkEff' || metric === 'eodYesRate') {
      return (v * 100).toFixed(1) + '%'
    }
    return v.toFixed(2)
  }

  return (
    <Modal open={open} onClose={onClose} title={info?.label ?? metric} size="md">
      <div className="space-y-5">
        {info && (
          <div className="card-sm space-y-1">
            <p className="text-text1 text-sm">{info.desc}</p>
            <p className="text-text3 text-xs font-mono">formula: {info.formula}</p>
            <p className="text-text3 text-xs">benchmark: {info.bench}</p>
          </div>
        )}

        {repStat && (
          <div>
            <p className="label mb-1">Your Value</p>
            <p className="font-mono text-2xl text-text1">{fmt(value)}</p>
          </div>
        )}

        {chartData.length > 0 && (
          <div>
            <p className="label mb-2">Team Distribution</p>
            <BarChart
              data={chartData}
              height={140}
              highlightId={repStat?.repId}
            />
          </div>
        )}

        {allValues.length > 0 && (
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { l: 'Min',  v: Math.min(...allValues) },
              { l: 'Avg',  v: allValues.reduce((a, b) => a + b, 0) / allValues.length },
              { l: 'Max',  v: Math.max(...allValues) },
            ].map(({ l, v }) => (
              <div key={l} className="card-sm">
                <p className="label">{l}</p>
                <p className="font-mono text-text1 mt-1">{fmt(v)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
