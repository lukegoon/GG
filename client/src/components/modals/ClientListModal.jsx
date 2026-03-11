import { useQuery } from '@tanstack/react-query'
import Modal from '../layout/Modal.jsx'
import api from '../../lib/api.js'
import { queryKeys } from '../../lib/queryKeys.js'
import LoadingSkeleton from '../ui/LoadingSkeleton.jsx'

export default function ClientListModal({ listId, open, onClose }) {
  const { data: list, isLoading } = useQuery({
    queryKey: queryKeys.list(listId),
    queryFn: () => api.get(`/api/lists/${listId}`).then(r => r.data),
    enabled: open && !!listId,
  })

  return (
    <Modal open={open} onClose={onClose} title={list?.name ?? 'List Detail'} size="md">
      {isLoading ? <LoadingSkeleton lines={4} /> : list ? (
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="card-sm flex-1">
              <p className="label">Industry</p>
              <p className="text-text1 mt-1">{list.industry ?? '—'}</p>
            </div>
            <div className="card-sm flex-1">
              <p className="label">Source</p>
              <p className="text-text1 mt-1">{list.source ?? '—'}</p>
            </div>
          </div>

          <div>
            <p className="label mb-3">Weekly Performance</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Week', 'Calls', 'Contacts', 'Contact%', 'Sched', 'Sched%'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-text3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(list.listStats ?? []).map(s => {
                  const contactRate = s.calls > 0 ? s.contacts / s.calls : 0
                  const schedRate = s.contacts > 0 ? s.sched / s.contacts : 0
                  return (
                    <tr key={s.id} className="border-b border-white/3">
                      <td className="py-2 px-2 text-text2 font-mono text-xs">
                        {new Date(s.weekStart).toISOString().split('T')[0]}
                      </td>
                      <td className="py-2 px-2 text-text2 font-mono">{s.calls}</td>
                      <td className="py-2 px-2 text-text2 font-mono">{s.contacts}</td>
                      <td className="py-2 px-2 font-mono">
                        <span className={contactRate >= 0.55 ? 'text-success' : 'text-accent2'}>
                          {(contactRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-text2 font-mono">{s.sched}</td>
                      <td className="py-2 px-2 text-text2 font-mono">{(schedRate * 100).toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!list.listStats?.length && <p className="text-text3 text-sm text-center py-4">No stats recorded.</p>}
          </div>
        </div>
      ) : <p className="text-text3">Not found.</p>}
    </Modal>
  )
}
