
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Pause,
  Play,
  Timer,
  TrendingUp,
} from 'lucide-react'

import {
  startStudySession,
  completeStudySession,
  getStudySessionHistory,
  getStudySessionSummary,
} from '../services/studySessionService'

const subjects = [
  'Database Management',
  'Operating Systems',
  'Computer Networks',
  'Data Structures',
  'Artificial Intelligence',
  'Programming',
  'Other',
]

function formatDuration(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0)

  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function formatDate(date) {
  if (!date) return 'Date unavailable'

  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStudentEmail() {
  try {
    const user = JSON.parse(
      sessionStorage.getItem('mentormind_user') || '{}',
    )

    return user.email || ''
  } catch {
    return ''
  }
}

function getErrorMessage(error) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || 'Invalid input').join(', ')
  }

  return error.message || 'Something went wrong. Please try again.'
}

function StudySessions() {
  const [studentEmail] = useState(getStudentEmail)

  const [subject, setSubject] = useState('Database Management')
  const [topic, setTopic] = useState('')
  const [activity, setActivity] = useState('Focused study')
  const [plannedMinutes, setPlannedMinutes] = useState(30)
  const [note, setNote] = useState('')

  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState(null)

  const [sessions, setSessions] = useState([])
  const [summary, setSummary] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load session history and summary from the backend.
  const loadSessionData = async () => {
    if (!studentEmail) {
      setError('Your login information is missing. Please log in again.')
      setIsLoading(false)
      return
    }

    try {
      setError('')

      const [historyData, summaryData] = await Promise.all([
        getStudySessionHistory(studentEmail),
        getStudySessionSummary(studentEmail),
      ])

      setSessions(
        Array.isArray(historyData)
          ? historyData
          : historyData.sessions || [],
      )

      setSummary(summaryData)
    } catch (err) {
      console.error('Failed to load study sessions:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessionData()
  }, [studentEmail])

  // Run the timer only while the session is active.
  useEffect(() => {
    if (!isRunning) return undefined

    const intervalId = setInterval(() => {
      setElapsed((previous) => previous + 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isRunning])

  // Start a session and save it in the backend.
  const handleStartSession = async () => {
    if (!studentEmail) {
      setError('Please log in again to start a study session.')
      return
    }

    if (!topic.trim()) {
      setError('Please enter the topic you want to study.')
      return
    }

    if (!activity.trim()) {
      setError('Please enter your study activity.')
      return
    }

    setError('')
    setSuccess('')
    setIsStarting(true)

    try {
      const payload = {
        subject,
        topic: topic.trim(),
        activity: activity.trim(),
        planned_minutes: Number(plannedMinutes),
      }

      const result = await startStudySession(
        studentEmail,
        payload,
      )

      if (!result.session_id) {
        throw new Error('The backend did not return a session ID.')
      }

      setActiveSessionId(result.session_id)
      setElapsed(0)
      setNote('')
      setSessionStarted(true)
      setIsRunning(true)

      setSuccess('Your study session has started.')
      await loadSessionData()
    } catch (err) {
      console.error('Failed to start study session:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsStarting(false)
    }
  }

  const pauseSession = () => {
    setIsRunning(false)
  }

  const resumeSession = () => {
    setIsRunning(true)
  }

  // Complete the session and save actual study time.
  const handleFinishSession = async () => {
    if (!activeSessionId || !studentEmail) {
      setError('Session information is missing. Please try again.')
      return
    }

    setError('')
    setSuccess('')
    setIsRunning(false)
    setIsFinishing(true)

    try {
      // Backend accepts actual_minutes between 1 and 600.
      const actualMinutes = Math.min(
        600,
        Math.max(1, Math.ceil(elapsed / 60)),
      )

      const payload = {
        actual_minutes: actualMinutes,
        notes: note.trim() || null,
      }

      await completeStudySession(
        studentEmail,
        activeSessionId,
        payload,
      )

      setSessionStarted(false)
      setActiveSessionId(null)
      setElapsed(0)
      setNote('')

      setSuccess('Study session completed and saved successfully.')

      await loadSessionData()
    } catch (err) {
      console.error('Failed to complete study session:', err)
      setError(getErrorMessage(err))
      setIsRunning(false)
    } finally {
      setIsFinishing(false)
    }
  }

  const totalStudySeconds =
    (Number(summary?.total_actual_minutes) || 0) * 60

  const completedSessions =
    Number(summary?.completed_sessions) || 0

  const averageSession = completedSessions
    ? Math.round(totalStudySeconds / completedSessions)
    : 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 md:flex">
          <Link to="/" className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap size={23} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              MentorMind
            </span>
          </Link>

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-2">
            <Link to="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              <LayoutDashboard size={19} />
              Dashboard
            </Link>

            <Link to="/tutor" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              <MessageCircle size={19} />
              AI Tutor
            </Link>

            <Link to="/documents" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              <BookOpen size={19} />
              My Documents
            </Link>

            <Link to="/quiz" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              <CheckCircle2 size={19} />
              Practice Quiz
            </Link>

            <Link to="/study-planner" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              <CalendarDays size={19} />
              Study Planner
            </Link>

            <Link to="/study-sessions" className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700">
              <Timer size={19} />
              Study Sessions
            </Link>
          </nav>

          <div className="mt-auto rounded-2xl bg-indigo-50 p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600">
              <TrendingUp size={19} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              Build a habit
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Track your focused study time and stay consistent.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div>
              <p className="text-sm text-slate-500">Workspace / Tracking</p>
              <h1 className="mt-1 text-lg font-bold text-slate-900">
                Study Sessions
              </h1>
            </div>

            <Link to="/dashboard" className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">

            {/* Introduction */}
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <Timer size={14} />
                Focus and track
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Make your study time count
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Start a focused study session, track the time you spend on
                each subject, and review your learning activity.
              </p>
            </div>

            {/* Notifications */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* Summary cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock3 size={18} />
                  <span className="text-sm">Total study time</span>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {formatDuration(totalStudySeconds)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Across completed sessions
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <CheckCircle2 size={18} />
                  <span className="text-sm">Sessions completed</span>
                </div>
                <p className="mt-3 text-2xl font-bold text-green-600">
                  {completedSessions}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Recorded in the backend
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <TrendingUp size={18} />
                  <span className="text-sm">Average session</span>
                </div>
                <p className="mt-3 text-2xl font-bold text-indigo-600">
                  {formatDuration(averageSession)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Average completed duration
                </p>
              </div>
            </div>

            {/* Timer panel */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Timer size={23} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Focus timer
                    </h3>
                    <p className="text-xs text-slate-500">
                      Track your current study session
                    </p>
                  </div>

                  {isRunning && (
                    <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      Running
                    </span>
                  )}
                </div>
              </div>

              <div className="px-5 py-8 sm:px-8 sm:py-10">
                {!sessionStarted ? (
                  <div className="mx-auto max-w-md">
                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Play size={29} />
                      </div>

                      <h4 className="mt-4 text-xl font-bold text-slate-900">
                        Start a study session
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Choose your subject, topic and activity before starting.
                      </p>
                    </div>

                    <div className="mt-7 space-y-5">
                      <div>
                        <label htmlFor="session-subject" className="mb-2 block text-sm font-semibold text-slate-700">
                          Study subject
                        </label>
                        <select
                          id="session-subject"
                          value={subject}
                          onChange={(event) => setSubject(event.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                          {subjects.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="session-topic" className="mb-2 block text-sm font-semibold text-slate-700">
                          Topic
                        </label>
                        <input
                          id="session-topic"
                          type="text"
                          value={topic}
                          onChange={(event) => setTopic(event.target.value)}
                          maxLength={150}
                          placeholder="e.g. Database Normalization"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label htmlFor="session-activity" className="mb-2 block text-sm font-semibold text-slate-700">
                          Study activity
                        </label>
                        <input
                          id="session-activity"
                          type="text"
                          value={activity}
                          onChange={(event) => setActivity(event.target.value)}
                          maxLength={250}
                          placeholder="e.g. Reading notes, solving problems"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label htmlFor="planned-minutes" className="mb-2 block text-sm font-semibold text-slate-700">
                          Planned duration
                        </label>
                        <select
                          id="planned-minutes"
                          value={plannedMinutes}
                          onChange={(event) => setPlannedMinutes(Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                          {[15, 25, 30, 45, 60, 90, 120, 180, 240, 300].map((minutes) => (
                            <option key={minutes} value={minutes}>
                              {minutes} minutes
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartSession}
                      disabled={isStarting || !topic.trim() || !activity.trim()}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Play size={18} />
                      {isStarting ? 'Starting session...' : 'Start studying'}
                    </button>
                  </div>
                ) : (
                  <div className="mx-auto max-w-lg text-center">
                    <p className="text-sm font-semibold text-indigo-600">
                      {subject}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {topic} · {activity}
                    </p>

                    <div className="my-7 rounded-2xl bg-slate-50 px-4 py-8">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Session duration
                      </p>

                      <p className="mt-3 font-mono text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                        {formatDuration(elapsed)}
                      </p>

                      <p className="mt-3 text-xs text-slate-400">
                        {isRunning ? 'Keep going. You are doing great!' : 'Timer paused'}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Planned: {plannedMinutes} minutes
                      </p>
                    </div>

                    <div className="text-left">
                      <label htmlFor="session-note" className="mb-2 block text-sm font-semibold text-slate-700">
                        Session notes (optional)
                      </label>

                      <textarea
                        id="session-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="What did you study or learn?"
                        className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                      <p className="mt-1 text-right text-xs text-slate-400">
                        {note.length}/1000
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      {isRunning ? (
                        <button
                          type="button"
                          onClick={pauseSession}
                          disabled={isFinishing}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pause size={17} />
                          Pause
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={resumeSession}
                          disabled={isFinishing}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          <Play size={17} />
                          Resume
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleFinishSession}
                        disabled={isFinishing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 size={17} />
                        {isFinishing ? 'Saving...' : 'Finish session'}
                      </button>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-slate-400">
                      Finishing saves your session to your account. Avoid refreshing
                      the page while a session is active.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Session history */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Session history
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review your recorded study sessions.
                  </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  {sessions.length} recorded
                </span>
              </div>

              {isLoading ? (
                <p className="mt-6 py-8 text-center text-sm text-slate-500">
                  Loading your study sessions...
                </p>
              ) : sessions.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
                  <CalendarDays size={30} className="mx-auto text-slate-400" />
                  <h4 className="mt-3 font-semibold text-slate-800">
                    No sessions recorded yet
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Finish your first study session to see it here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.session_id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          session.status === 'completed'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          <CheckCircle2 size={20} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {session.subject}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {session.topic} · {session.activity}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(session.started_at)}
                          </p>

                          {session.notes && (
                            <p className="mt-2 break-words text-sm text-slate-600">
                              {session.notes}
                            </p>
                          )}

                          <p className={`mt-2 text-xs font-semibold ${
                            session.status === 'completed'
                              ? 'text-green-600'
                              : 'text-amber-600'
                          }`}>
                            {session.status === 'completed'
                              ? 'Completed'
                              : 'In progress'}
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="font-mono text-lg font-bold text-indigo-700">
                          {formatDuration(
                            (Number(session.actual_minutes) || 0) * 60,
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          {session.status === 'completed'
                            ? 'Actual duration'
                            : `${session.planned_minutes} min planned`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Navigation */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/study-planner" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                Study Planner
                <ArrowRight size={16} />
              </Link>

              <Link to="/tutor" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                Ask AI Tutor
                <ArrowRight size={16} />
              </Link>
            </div>

            <p className="mt-6 text-xs leading-5 text-slate-400">
              Session records and summary statistics are retrieved from the
              MentorMind backend. Pausing and resuming are handled locally
              by the frontend.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default StudySessions
