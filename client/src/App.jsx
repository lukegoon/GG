import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { WeekProvider } from './contexts/WeekContext.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Overview from './pages/Overview.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Metrics from './pages/Metrics.jsx'
import Efficiency from './pages/Efficiency.jsx'
import Optimization from './pages/Optimization.jsx'
import Clients from './pages/Clients.jsx'
import Trends from './pages/Trends.jsx'
import Glossary from './pages/Glossary.jsx'
import Admin from './pages/Admin.jsx'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function ManagerRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== 'MANAGER') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/glossary" element={<Glossary />} />

      <Route path="/" element={
        <ProtectedRoute>
          <WeekProvider>
            <Overview />
          </WeekProvider>
        </ProtectedRoute>
      } />

      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <WeekProvider>
            <Leaderboard />
          </WeekProvider>
        </ProtectedRoute>
      } />

      <Route path="/metrics/:repId?" element={
        <ProtectedRoute>
          <WeekProvider>
            <Metrics />
          </WeekProvider>
        </ProtectedRoute>
      } />

      <Route path="/efficiency" element={
        <ProtectedRoute>
          <WeekProvider>
            <Efficiency />
          </WeekProvider>
        </ProtectedRoute>
      } />

      <Route path="/optimization" element={
        <ProtectedRoute>
          <WeekProvider>
            <Optimization />
          </WeekProvider>
        </ProtectedRoute>
      } />

      <Route path="/clients" element={
        <ManagerRoute>
          <WeekProvider>
            <Clients />
          </WeekProvider>
        </ManagerRoute>
      } />

      <Route path="/trends" element={
        <ProtectedRoute>
          <WeekProvider>
            <Trends />
          </WeekProvider>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ManagerRoute>
          <Admin />
        </ManagerRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
