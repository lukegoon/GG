import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api.js'
import { queryKeys } from '../../lib/queryKeys.js'
import AlertBanner from '../ui/AlertBanner.jsx'
import SuccessBanner from '../ui/SuccessBanner.jsx'

const FIELDS = [
  { key: 'syncSchedule',         label: 'Sync Cron Schedule',   help: 'e.g. */15 7-20 * * 1-5' },
  { key: 'contactRateBenchmark', label: 'Contact Rate Benchmark (%)', help: 'Target contact rate (e.g. 55)' },
  { key: 'schedPctBenchmark',    label: 'Sched % Benchmark',    help: 'Target schedule rate (e.g. 22)' },
  { key: 'hangUpBenchmark',      label: 'Hang-Up Benchmark (%)', help: 'Max hang-up rate (e.g. 30)' },
  { key: 'ngfBenchmark',         label: 'NGF Benchmark (%)',    help: 'Max NGF rate (e.g. 45)' },
  { key: 'pauseBenchmark',       label: 'Pause Benchmark (min)', help: 'Max avg pause minutes (e.g. 40)' },
  { key: 'wrapBenchmark',        label: 'Wrap Benchmark (min)',  help: 'Max avg wrap minutes (e.g. 15)' },
  { key: 'convosoApiKey',        label: 'Convoso API Key',       help: 'Overrides CONVOSO_API_KEY env var', type: 'password' },
  { key: 'hireSheetTab',         label: 'Hires Sheet Tab',      help: 'Google Sheet tab name for hires' },
  { key: 'goalsSheetTab',        label: 'Goals Sheet Tab',      help: 'Google Sheet tab name for goals' },
  { key: 'notesSheetTab',        label: 'Notes Sheet Tab',      help: 'Google Sheet tab name for notes' },
  { key: 'overridesSheetTab',    label: 'Overrides Sheet Tab',  help: 'Google Sheet tab name for overrides' },
]

export default function SettingsForm({ initialSettings = {} }) {
  const qc = useQueryClient()
  const [values, setValues] = useState(() => {
    const init = {}
    for (const f of FIELDS) init[f.key] = initialSettings[f.key] ?? ''
    return init
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.put('/api/settings', { settings: values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings() })
      setSuccess('Settings saved.')
      setError('')
    },
    onError: (err) => setError(err.response?.data?.error ?? 'Save failed'),
  })

  return (
    <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
      {error && <AlertBanner message={error} onClose={() => setError('')} />}
      {success && <SuccessBanner message={success} onClose={() => setSuccess('')} />}
      {FIELDS.map(f => (
        <div key={f.key}>
          <label className="label block mb-1">{f.label}</label>
          <input
            type={f.type ?? 'text'}
            className="input w-full"
            placeholder={f.help}
            value={values[f.key]}
            onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
          />
          <p className="text-xs text-text3 mt-0.5">{f.help}</p>
        </div>
      ))}
      <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Save Settings'}
      </button>
    </form>
  )
}
