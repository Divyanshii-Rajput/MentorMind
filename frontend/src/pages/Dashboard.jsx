
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logoutAccount } from '../services/authService'
import api from '../services/api'

import {
  BrainCircuit,
  LayoutDashboard,
  MessageCircle,
  FileText,
  ClipboardList,
  CalendarDays,
  ChartNoAxesCombined,
  BookOpen,
  Clock3,
  Target,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Lightbulb,
  LogOut,
  Play,
  Upload,
  History,
} from 'lucide-react'

const navigation = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Tutor', path: '/tutor', icon: MessageCircle },
  { label: 'My Documents', path: '/documents', icon: FileText },
  { label: 'Smart Quizzes', path: '/quiz', icon: ClipboardList },
  { label: 'Study Planner', path: '/study-planner', icon: CalendarDays },
  { label: 'Study Sessions', path: '/study-sessions', icon: Clock3 },
  { label: 'My Progress', path: '/analytics', icon: ChartNoAxesCombined },
]

const learningTools = [
  {
    title: 'AI Tutor',
    description:
      'Understand concepts through interactive questions and guided explanations.',
    path: '/tutor',
    action: 'Start learning',
    icon: MessageCircle,
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    title: 'My Documents',
    description:
      'Upload your study materials and learn directly from your documents.',
    path: '/documents',
    action: 'Explore documents',
    icon: FileText,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Smart Quizzes',
    description:
      'Test your understanding with personalized AI-generated quizzes.',
    path: '/quiz',
    action: 'Practice now',
    icon: ClipboardList,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Study Planner',
    description:
      'Organize your study time with a personalized learning schedule.',
    path: '/study-planner',
    action: 'Plan your learning',
    icon: CalendarDays,
    color: 'bg-emerald-100 text-emerald-600',
  },
]

function formatDate(dateValue) {
  if (!dateValue) return 'Date unavailable'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatAccuracy(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const accuracy = Number(value)

  if (!Number.isFinite(accuracy)) return '—'

  return `${accuracy.toFixed(1)}%`
}

function Dashboard() {
  const navigate = useNavigate()

  const [dashboardData, setDashboardData] = useState({
    completedSessions: 0,
    quizzesCompleted: 0,
    accuracy: null,
    topicsLearned: 0,
    recentActivities: [],
  })

  const [loading, setLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchDashboardData() {
      try {
        const user = JSON.parse(
          sessionStorage.getItem('mentormind_user') || '{}'
        )

        const email = user.email

        if (!email) {
          if (isMounted) {
            setDashboardError(
              'Unable to identify the logged-in user.'
            )
            setLoading(false)
          }
          return
        }

        const encodedEmail = encodeURIComponent(email)

        const results = await Promise.allSettled([
          api.get(`/api/progress/${encodedEmail}`),
          api.get(`/api/progress/${encodedEmail}/quiz-history`),
          api.get(`/api/study-sessions/${encodedEmail}/summary`),
          api.get(`/api/study-sessions/${encodedEmail}/history`, {
            params: { limit: 5 },
          }),
        ])

        if (!isMounted) return

        const progress =
          results[0].status === 'fulfilled'
            ? results[0].value.data
            : {}

        const quizHistory =
          results[1].status === 'fulfilled' &&
          Array.isArray(results[1].value.data)
            ? results[1].value.data
            : []

        const sessionSummary =
          results[2].status === 'fulfilled'
            ? results[2].value.data
            : {}

        const sessionHistory =
          results[3].status === 'fulfilled' &&
          Array.isArray(results[3].value.data)
            ? results[3].value.data
            : []

        const quizActivities = quizHistory.map((quiz) => ({
          id: `quiz-${quiz.quiz_id}`,
          title: 'Quiz completed',
          description: `${quiz.subject || 'General'}${
            quiz.topic ? ` · ${quiz.topic}` : ''
          } · Score: ${quiz.score_percentage ?? 0}%`,
          date: quiz.submitted_at,
          type: 'quiz',
        }))

        const sessionActivities = sessionHistory.map((session) => ({
          id: `session-${session.session_id}`,
          title: session.activity || 'Study session',
          description: `${session.subject || 'General'}${
            session.topic ? ` · ${session.topic}` : ''
          } · ${session.status || 'in progress'}`,
          date: session.completed_at || session.started_at,
          type: 'session',
        }))

        const recentActivities = [
          ...quizActivities,
          ...sessionActivities,
        ]
          .sort((a, b) => {
            return new Date(b.date || 0) - new Date(a.date || 0)
          })
          .slice(0, 5)

        setDashboardData({
          completedSessions: sessionSummary.completed_sessions ?? 0,
          quizzesCompleted: quizHistory.length,
          accuracy: progress.accuracy_percentage ?? null,
          topicsLearned: progress.topics_tracked ?? 0,
          recentActivities,
        })

        const failedRequests = results.filter(
          (result) => result.status === 'rejected'
        ).length

        if (failedRequests === results.length) {
          setDashboardError(
            'Unable to load dashboard data. Please try again.'
          )
        } else if (failedRequests > 0) {
          setDashboardError(
            'Some dashboard information could not be loaded.'
          )
        }
      } catch (error) {
        console.error('Dashboard loading error:', error)

        if (isMounted) {
          setDashboardError(
            'Unable to load dashboard information.'
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const statistics = [
    {
      label: 'Study Sessions',
      value: dashboardData.completedSessions,
      description: 'Sessions completed',
      icon: Clock3,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Quizzes Completed',
      value: dashboardData.quizzesCompleted,
      description: 'Quizzes attempted',
      icon: ClipboardList,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Learning Accuracy',
      value: formatAccuracy(dashboardData.accuracy),
      description: 'Based on learning results',
      icon: Target,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Topics Learned',
      value: dashboardData.topicsLearned,
      description: 'Topics explored',
      icon: BookOpen,
      color: 'bg-orange-100 text-orange-600',
    },
  ]

  function handleLogout() {
    logoutAccount()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <Link to="/" className="flex items-center gap-3 px-6 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BrainCircuit size={24} />
            </div>
            <span className="text-xl font-bold">
              Mentor<span className="text-indigo-600">Mind</span>
            </span>
          </Link>

          <div className="px-4 pt-5">
            <p className="px-3 text-xs font-semibold tracking-widest text-slate-400 uppercase">
              Learning Workspace
            </p>

            <nav className="mt-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`
                    }
                  >
                    <Icon size={19} />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-2xl bg-indigo-50 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600">
                <Lightbulb size={19} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                Keep growing!
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Small learning steps every day lead to big improvements.
              </p>
            </div>

            <Link
              to="/"
              className="mt-4 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              <ArrowRight size={18} className="rotate-180" />
              Back to website
            </Link>
          </div>
        </aside>

        {/* Main area */}
        <main className="min-w-0 flex-1">

          {/* Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-lg sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 lg:hidden">
                <BrainCircuit size={21} />
              </div>

              <div>
                <p className="text-xs text-slate-500">MentorMind Workspace</p>
                <h2 className="text-base font-bold sm:text-lg">Dashboard</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <LogOut size={16} />
                Sign out
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <GraduationCap size={21} />
              </div>
            </div>
          </header>

          {/* Mobile navigation */}
          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            {navigation.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-50 text-slate-600'
                    }`
                  }
                >
                  <Icon size={15} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8">

            {/* Welcome banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-blue-600 p-7 text-white sm:p-10">
              <div className="absolute -top-16 right-0 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -right-10 -bottom-24 h-64 w-64 rounded-full bg-blue-300/20 blur-2xl" />

              <div className="relative max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">
                  <Sparkles size={14} />
                  Your personalized learning space
                </div>

                <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
                  Welcome to MentorMind!
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
                  Ready to learn something new today? Explore concepts, ask
                  questions and improve your understanding one step at a time.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/tutor"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                  >
                    <Play size={17} />
                    Start learning
                  </Link>

                  <Link
                    to="/documents"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <Upload size={17} />
                    Upload study material
                  </Link>
                </div>
              </div>
            </section>

            {/* Statistics */}
            <section id="learning-overview">
              <div className="mb-5">
                <h2 className="text-xl font-bold">Learning Overview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your learning statistics based on your activity in MentorMind.
                </p>

                {dashboardError && (
                  <p className="mt-2 text-xs text-amber-600">
                    {dashboardError}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statistics.map((stat) => {
                  const Icon = stat.icon

                  return (
                    <article
                      key={stat.label}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                          {stat.label}
                        </p>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                          <Icon size={20} />
                        </div>
                      </div>

                      <p className="mt-4 text-3xl font-bold">
                        {loading ? '...' : stat.value}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {stat.description}
                      </p>
                    </article>
                  )
                })}
              </div>
            </section>

            {/* Learning tools */}
            <section id="learning-tools">
              <div className="mb-5">
                <h2 className="text-xl font-bold">Your Learning Tools</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Everything you need for a better learning experience.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {learningTools.map((tool) => {
                  const Icon = tool.icon

                  return (
                    <Link
                      key={tool.title}
                      to={tool.path}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                        <Icon size={23} />
                      </div>

                      <h3 className="mt-5 font-bold">{tool.title}</h3>

                      <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">
                        {tool.description}
                      </p>

                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-600">
                        {tool.action}
                        <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* Quick actions */}
            <section className="grid gap-5 xl:grid-cols-2">

              {/* Recent Activity */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <History size={21} />
                  </div>
                  <div>
                    <h2 className="font-bold">Recent Activity</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Your latest learning activities.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {loading ? (
                    <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Loading your recent activity...
                    </div>
                  ) : dashboardData.recentActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 px-4 py-8 text-center">
                      <BookOpen size={28} className="text-slate-400" />

                      <h3 className="mt-3 text-sm font-semibold text-slate-700">
                        No activity to display yet
                      </h3>

                      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                        Start a learning session or attempt a quiz to build your activity history.
                      </p>

                      <Link
                        to="/study-sessions"
                        className="mt-4 text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Start a study session →
                      </Link>
                    </div>
                  ) : (
                    dashboardData.recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            activity.type === 'quiz'
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {activity.type === 'quiz' ? (
                            <ClipboardList size={18} />
                          ) : (
                            <Clock3 size={18} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-slate-800">
                            {activity.title}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {activity.description}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Learning Journey */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Lightbulb size={21} />
                  </div>
                  <div>
                    <h2 className="font-bold">Your Learning Journey</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      A few ways to get started.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    to="/documents"
                    className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4 transition hover:bg-indigo-100"
                  >
                    <FileText className="shrink-0 text-indigo-600" size={20} />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Upload study material
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Learn from your own PDFs.
                      </p>
                    </div>
                    <ArrowRight size={17} className="text-indigo-600" />
                  </Link>

                  <Link
                    to="/tutor"
                    className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 transition hover:bg-emerald-100"
                  >
                    <MessageCircle className="shrink-0 text-emerald-600" size={20} />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Ask the AI Tutor
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Explore a topic through guided questions.
                      </p>
                    </div>
                    <ArrowRight size={17} className="text-emerald-600" />
                  </Link>

                  <Link
                    to="/quiz"
                    className="flex items-center gap-3 rounded-xl bg-purple-50 p-4 transition hover:bg-purple-100"
                  >
                    <ClipboardList className="shrink-0 text-purple-600" size={20} />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Test your knowledge
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Practice with personalized quizzes.
                      </p>
                    </div>
                    <ArrowRight size={17} className="text-purple-600" />
                  </Link>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
              MentorMind · Learn smarter. Think deeper. Grow faster.
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
