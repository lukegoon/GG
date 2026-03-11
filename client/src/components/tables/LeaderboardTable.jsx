import { useState } from 'react'
import ScorePill from '../ui/ScorePill.jsx'

const COLUMNS = [
  { key: 'rank',        label: '#',        sort: false },
  { key: 'name',        label: 'Rep',      sort: false },
  { key: 'compositeScore', label: 'Score', sort: true,  fmt: v => <ScorePill score={v} size="sm" /> },
  { key: 'calls',       label: 'Calls',    sort: true,  fmt: v => v?.toLocaleString() ?? '—' },
  { key: 'contacts',    label: 'Contacts', sort: true,  fmt: v => v?.toLocaleString() ?? '—' },
  { key: 'sched',       label: 'Sched',    sort: true,  fmt: v => v ?? '—' },
  { key: 'schedPct',    label: 'Sched%',   sort: true,  fmt: v => v != null ? (v * 100).toFixed(1) + '%' : '—' },
  { key: 'schedHour',   label: 'Sch/Hr',   sort: true,  fmt: v => v?.toFixed(2) ?? '—' },
  { key: 'contactRate', label: 'Contact%', sort: true,  fmt: v => v != null ? (v * 100).toFixed(1) + '%' : '—' },
  { key: 'hires',       label: 'Hires',    sort: true,  fmt: v => v ?? '—' },
]

export default function LeaderboardTable({ stats = [], userRole, userRepId, onRowClick }) {
  const [sortKey, setSortKey] = useState('compositeScore')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  // Sort by composite score to assign anonymous labels (must be deterministic)
  const byScore = [...stats].sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0))
  const labelMap = new Map()
  byScore.forEach((s, i) => {
    labelMap.set(s.repId, i < 26
      ? String.fromCharCode(65 + i)
      : `${String.fromCharCode(65 + Math.floor(i / 26) - 1)}${String.fromCharCode(65 + (i % 26))}`)
  })

  // Sort table by selected column
  const sorted = [...stats].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity
    const bv = b[sortKey] ?? -Infinity
    return sortDir === 'desc' ? bv - av : av - bv
  })

  const ranked = sorted.map((s, idx) => {
    const isOwn = s.repId === userRepId
    const displayName = userRole === 'MANAGER'
      ? (s.rep?.name ?? `Rep ${s.repId}`)
      : isOwn
        ? (s.rep?.name ?? `Rep ${s.repId}`)
        : `Rep ${labelMap.get(s.repId) ?? '?'}`

    return { ...s, displayName, isOwn }
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={`text-left py-2 px-3 text-text3 font-normal ${col.sort ? 'cursor-pointer hover:text-text1 select-none' : ''}`}
                onClick={col.sort ? () => handleSort(col.key) : undefined}
              >
                {col.label}
                {col.sort && sortKey === col.key && (
                  <span className="ml-1 text-accent">{sortDir === 'desc' ? '↓' : '↑'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranked.map((row, idx) => (
            <tr
              key={row.repId}
              className={`border-b border-white/3 transition-colors ${
                row.isOwn ? 'bg-accent/5 font-semibold' : ''
              } ${
                onRowClick && (userRole === 'MANAGER') ? 'cursor-pointer hover:bg-white/3' : ''
              }`}
              onClick={() => userRole === 'MANAGER' && onRowClick?.(row)}
            >
              <td className="py-2.5 px-3 text-text3 font-mono">{idx + 1}</td>
              <td className={`py-2.5 px-3 ${row.isOwn ? 'text-accent' : 'text-text1'}`}>
                {row.displayName}
                {row.isOwn && <span className="ml-2 text-xs text-text3">(you)</span>}
              </td>
              {COLUMNS.slice(2).map(col => (
                <td key={col.key} className="py-2.5 px-3 text-text2 font-mono">
                  {col.fmt ? col.fmt(row[col.key]) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!stats.length && <p className="text-center text-text3 py-8">No data for this week.</p>}
    </div>
  )
}
