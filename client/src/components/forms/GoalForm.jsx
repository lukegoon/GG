import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api.js'
import { queryKeys } from '../../lib/queryKeys.js'
import AlertBanner from '../ui/AlertBanner.jsx'
import SuccessBanner from '../ui/SuccessBanner.jsx'

const METRICS = [
  { key: 'sched',       label: 'Schedules',     placeholder: '40' },
  { key: 'hires',       label: 'Hires',         placeholder: '5' },
  { key: 'contactRate', label: 'Contact Rate',   placeholder: '0.55' },
  { key: 'schedPct',    label: 'Schedule Rate',  placeholder: '0.22' },
  { key: 'schedHour',   label: 'Sched / Hour',   placeholder: '2.5' },
]

export default function GoalForm({ repId, weekStart, existingGoals = [] }) {
  const qc = useQueryClient()
  const [values, setValues] = useState(() => {
    const init = {}
    for (const m of METRICS) {
      const existing = existingGoals.find(g => g.metric === m.key)
      init[m.key] = existing ? String(existing.target) : ''
    }
    return init
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.put(`/api/goals/${repId}`, {
      weekStart,
      goals: METRICS
        .filter(m => values[m.key] !== '')
        .map(m => ({ metric: m.key, target: parseFloat(values[m.key]) })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals(repId, weekStart) })
      setSuccess('Goals saved.')
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error ?? 'Save failed'),
  })

  return (
    <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
      {error && <AlertBanner message={error} onClose={() => setError('')} />}
      {success && <SuccessBanner message={success} onClose={() => setSuccess('')} />}
      {METRICS.map(m => (
        <div key={m.key}>
          <label className="label block mb-1">{m.label}</label>
          <input
            type="number"
            step="any"
            className="input w-full"
            placeholder={m.placeholder}
            value={values[m.key]}
            onChange={e => setValues(v => ({ ...v, [m.key]: e.target.value }))}
          />
        </div>
      ))}
      <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Save Goals'}
      </button>
    </form>
  )
}
