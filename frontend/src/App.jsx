
import { Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Tutor from './pages/Tutor'
import Documents from './pages/Documents'
import Quiz from './pages/Quiz'
import StudyPlanner from './pages/StudyPlanner'
import StudySessions from './pages/StudySessions'
import Analytics from './pages/Analytics'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/study-planner" element={<StudyPlanner />} />
        <Route path="/study-sessions" element={<StudySessions />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}

export default App
