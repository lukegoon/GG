import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api.js'
import { queryKeys } from '../../lib/queryKeys.js'
import AlertBanner from '../ui/AlertBanner.jsx'

export default function NoteForm({ repId, weekStart, onSaved }) {
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post(`/api/notes/${repId}`, { weekStart, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notes(repId, weekStart) })
      setContent('')
      setError('')
      onSaved?.()
    },
    onError: (err) => setError(err.response?.data?.error ?? 'Save failed'),
  })

  return (
    <form onSubmit={e => { e.preventDefault(); if (content.trim()) mutation.mutate() }} className="space-y-2">
      {error && <AlertBanner message={error} onClose={() => setError('')} />}
      <textarea
        className="input w-full resize-none"
        rows={3}
        placeholder="Add a note for this rep…"
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <button
        type="submit"
        className="btn-primary text-xs"
        disabled={mutation.isPending || !content.trim()}
      >
        {mutation.isPending ? 'Saving…' : 'Add Note'}
      </button>
    </form>
  )
}
