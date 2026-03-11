import { useState } from 'react'

export default function ClientListTable({ lists = [], onRowClick }) {
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')

  const industries = [...new Set(lists.map(l => l.industry).filter(Boolean))].sort()

  const filtered = lists.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase())
    const matchIndustry = !industry || l.industry === industry
    return matchSearch && matchIndustry
  })

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input
          className="input flex-1"
          placeholder="Search lists…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-40" value={industry} onChange={e => setIndustry(e.target.value)}>
          <option value="">All Industries</option>
          {industries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {['List Name', 'Industry', 'Calls', 'Contacts', 'Contact%', 'Sched', 'Sched%'].map(h => (
                <th key={h} className="text-left py-2 px-3 text-text3 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => {
              const s = l.weekStat
              return (
                <tr
                  key={l.id}
                  className={`border-b border-white/3 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/3' : ''}`}
                  onClick={() => onRowClick?.(l)}
                >
                  <td className="py-2.5 px-3 text-text1 font-medium">{l.name}</td>
                  <td className="py-2.5 px-3 text-text2">{l.industry ?? '—'}</td>
                  <td className="py-2.5 px-3 text-text2 font-mono">{s?.calls?.toLocaleString() ?? '—'}</td>
                  <td className="py-2.5 px-3 text-text2 font-mono">{s?.contacts?.toLocaleString() ?? '—'}</td>
                  <td className="py-2.5 px-3 font-mono">
                    {s?.contactRate != null
                      ? <span className={s.contactRate >= 0.55 ? 'text-success' : 'text-accent2'}>{(s.contactRate * 100).toFixed(1)}%</span>
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-text2 font-mono">{s?.sched ?? '—'}</td>
                  <td className="py-2.5 px-3 font-mono">
                    {s?.schedRate != null ? (s.schedRate * 100).toFixed(1) + '%' : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!filtered.length && <p className="text-center text-text3 py-8">No lists found.</p>}
      </div>
    </div>
  )
}
