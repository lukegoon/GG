import { createContext, useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api.js'
import { queryKeys } from '../lib/queryKeys.js'

const WeekContext = createContext(null)

export function WeekProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const weekParam = searchParams.get('week')

  const { data: weeks = [] } = useQuery({
    queryKey: queryKeys.weeks(),
    queryFn: () => api.get('/api/stats/weeks').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const selectedWeek = weekParam || weeks[0] || null

  const setWeek = (week) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('week', week)
      return next
    })
  }

  return (
    <WeekContext.Provider value={{ selectedWeek, setWeek, weeks }}>
      {children}
    </WeekContext.Provider>
  )
}

export function useWeek() {
  return useContext(WeekContext)
}
