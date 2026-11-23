
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  ClipboardList,
  CalendarDays,
  Timer,
  BarChart3,
  Clock3,
  Target,
  Trophy,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  AlertCircle,
  Lightbulb,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Tutor', path: '/tutor', icon: MessageCircle },
  { name: 'Documents', path: '/documents', icon: FileText },
  { name: 'Quiz', path: '/quiz', icon: ClipboardList },
  { name: 'Study Planner', path: '/study-planner', icon: CalendarDays },
  { name: 'Study Sessions', path: '/study-sessions', icon: Timer },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
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

function formatTimeAgo(dateValue) {
  if (!dateValue) return 'Date unavailable'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  const difference = Date.now() - date.getTime()
  const minutes = Math.floor(difference / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minutes ago`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours} hours ago`

  const days = Math.floor(hours / 24)

  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`

  return formatDate(dateValue)
}

function getArray(data, possibleKeys = []) {
  if (Array.isArray(data)) return data

  if (data && typeof data === 'object') {
    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) return data[key]
    }
  }

  return []
}

function getText(item) {
  if (typeof item === 'string') return item

  if (item && typeof item === 'object') {
    return (
      item.recommendation ||
      item.description ||
      item.message ||
      item.title ||
      item.topic ||
      item.name ||
      'Learning recommendation'
    )
  }

  return String(item ?? '')
}

function getWeeklyActivity(sessions) {
  const days = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - i)

    const daySessions = sessions.filter((session) => {
      const sessionDate = new Date(
        session.completed_at || session.started_at
      )

      if (Number.isNaN(sessionDate.getTime())) return false

      return sessionDate.toDateString() === date.toDateString()
    })

    const minutes = daySessions.reduce((total, session) => {
      return total + Number(session.actual_minutes || 0)
    }, 0)

    days.push({
      day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      hours: minutes / 60,
    })
  }

  return days
}

function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [overview, setOverview] = useState({})
  const [subjects, setSubjects] = useState([])
  const [quizHistory, setQuizHistory] = useState([])
  const [sessionSummary, setSessionSummary] = useState({})
  const [sessionHistory, setSessionHistory] = useState([])
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [performanceTrend, setPerformanceTrend] = useState([])

  useEffect(() => {
    let isMounted = true

    async function fetchAnalytics() {
      try {
        const user = JSON.parse(
          sessionStorage.getItem('mentormind_user') || '{}'
        )

        if (!user.email) {
          if (isMounted) {
            setError('Unable to identify the logged-in user.')
            setLoading(false)
          }
          return
        }

        const email = encodeURIComponent(user.email)

        const results = await Promise.allSettled([
          api.get(`/api/analytics/${email}/overview`),
          api.get(`/api/analytics/${email}/strengths-weaknesses`),
          api.get(`/api/analytics/${email}/recommendations`),
          api.get(`/api/analytics/${email}/performance-trend`),
          api.get(`/api/progress/${email}/subjects`),
          api.get(`/api/progress/${email}/quiz-history`),
          api.get(`/api/study-sessions/${email}/summary`),
          api.get(`/api/study-sessions/${email}/history`, {
            params: { limit: 50 },
          }),
        ])

        if (!isMounted) return

        const getResult = (index) => {
          return results[index].status === 'fulfilled'
            ? results[index].value.data
            : null
        }

        const overviewData = getResult(0) || {}
        const strengthsData = getResult(1) || {}
        const recommendationsData = getResult(2)
        const trendData = getResult(3)
        const subjectData = getResult(4)
        const quizData = getResult(5)
        const sessionSummaryData = getResult(6) || {}
        const sessionHistoryData = getResult(7)

        setOverview(overviewData)
        setStrengthsWeaknesses(strengthsData)

        setSubjects(
          getArray(subjectData, ['subjects', 'data'])
        )

        setQuizHistory(
          getArray(quizData, ['quiz_history', 'history', 'data'])
        )

        setSessionSummary(sessionSummaryData)

        setSessionHistory(
          getArray(sessionHistoryData, ['sessions', 'history', 'data'])
        )

        setRecommendations(
          getArray(recommendationsData, [
            'recommendations',
            'items',
            'data',
          ])
        )

        setPerformanceTrend(
          getArray(trendData, ['trend', 'performance_trend', 'data'])
        )

        const failedRequests = results.filter(
          (result) => result.status === 'rejected'
        ).length

        if (failedRequests === results.length) {
          setError('Unable to load analytics. Please try again.')
        } else if (failedRequests > 0) {
          setError('Some analytics information could not be loaded.')
        }
      } catch (err) {
        console.error('Analytics loading error:', err)

        if (isMounted) {
          setError('Unable to load analytics information.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchAnalytics()

    return () => {
      isMounted = false
    }
  }, [])

  const weeklyActivity = getWeeklyActivity(sessionHistory)

  const totalWeeklyHours = weeklyActivity.reduce(
    (total, item) => total + item.hours,
    0
  )

  const maxHours = Math.max(
    ...weeklyActivity.map((item) => item.hours),
    1
  )

  const totalStudyHours = (
    Number(sessionSummary.total_actual_minutes || 0) / 60
  ).toFixed(1)

  const totalSessions = Number(
    sessionSummary.completed_sessions ?? 0
  )

  const totalQuizzes = Number(
    overview.total_quiz_attempts ?? quizHistory.length
  )

  const averageScore = overview.average_quiz_score

  const averageAccuracy =
    averageScore === null || averageScore === undefined
      ? '—'
      : `${Number(averageScore).toFixed(1)}%`

  const strengths = getArray(strengthsWeaknesses, [
    'strengths',
    'strong_topics',
  ])

  const weaknesses = getArray(strengthsWeaknesses, [
    'weaknesses',
    'weak_topics',
  ])

  const recentActivities = [
    ...quizHistory.map((quiz) => ({
      id: `quiz-${quiz.quiz_id}`,
      title: 'Completed a quiz',
      detail: `${quiz.subject || 'General'}${
        quiz.topic ? ` · ${quiz.topic}` : ''
      } · Score: ${quiz.score_percentage ?? 0}%`,
      date: quiz.submitted_at,
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-50',
    })),

    ...sessionHistory.map((session) => ({
      id: `session-${session.session_id}`,
      title: 'Study session',
      detail: `${session.subject || 'General'}${
        session.topic ? ` · ${session.topic}` : ''
      } · ${session.actual_minutes ?? session.planned_minutes ?? 0} minutes`,
      date: session.completed_at || session.started_at,
      icon: Timer,
      color: 'text-violet-600 bg-violet-50',
    })),
  ]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-slate-50 md:flex">

      {/* Sidebar */}
      <aside className="w-full border-b border-slate-200 bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <Link to="/dashboard" className="text-2xl font-bold text-indigo-600">
          MentorMind
        </Link>

        <p className="mt-2 mb-6 text-xs text-slate-400">
          YOUR PERSONAL LEARNING SPACE
        </p>

        <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = item.path === '/analytics'

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  active
                    ? 'bg-indigo-50 font-semibold text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-500">
                Your learning overview
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-800">
                Progress & Analytics
              </h1>

              <p className="mt-2 text-slate-500">
                Understand your learning habits and track your performance.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Back to Dashboard <ArrowUpRight size={16} />
            </Link>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Overview Cards */}
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Study Time"
              value={loading ? '...' : `${totalStudyHours} hrs`}
              subtitle="Total recorded study time"
              icon={Clock3}
              color="bg-blue-50 text-blue-600"
            />

            <StatCard
              title="Study Sessions"
              value={loading ? '...' : totalSessions}
              subtitle="Sessions completed"
              icon={Timer}
              color="bg-violet-50 text-violet-600"
            />

            <StatCard
              title="Quizzes Completed"
              value={loading ? '...' : totalQuizzes}
              subtitle="Quiz attempts"
              icon={Target}
              color="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              title="Average Accuracy"
              value={loading ? '...' : averageAccuracy}
              subtitle="Across your quiz attempts"
              icon={Trophy}
              color="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Additional Overview */}
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              title="Subjects Tracked"
              value={loading ? '...' : overview.subjects_tracked ?? 0}
              subtitle="Subjects in your learning history"
              icon={BookOpenIcon}
              color="bg-indigo-50 text-indigo-600"
            />

            <StatCard
              title="Topics Tracked"
              value={loading ? '...' : overview.topics_tracked ?? 0}
              subtitle="Topics explored"
              icon={CheckCircle2}
              color="bg-teal-50 text-teal-600"
            />
          </div>

          {/* Weekly Activity and Subject Performance */}
          <div className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* Weekly Activity */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Weekly Study Activity
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Recorded study hours for each day
                  </p>
                </div>

                <TrendingUp className="text-indigo-600" />
              </div>

              {loading ? (
                <div className="flex h-52 items-center justify-center text-sm text-slate-500">
                  Loading weekly activity...
                </div>
              ) : (
                <>
                  <div className="flex h-52 items-end justify-around gap-3 border-b border-slate-200 pb-2">
                    {weeklyActivity.map((item) => (
                      <div
                        key={item.day}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="text-xs font-medium text-slate-600">
                          {item.hours.toFixed(1)}h
                        </span>

                        <div
                          className="w-full max-w-12 rounded-t-lg bg-indigo-500 transition hover:bg-indigo-700"
                          style={{
                            height: `${(item.hours / maxHours) * 75}%`,
                            minHeight: item.hours > 0 ? '4px' : '0px',
                          }}
                          title={`${item.hours.toFixed(1)} study hours`}
                        />

                        <span className="text-xs text-slate-500">
                          {item.day}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    Total study time this week:{' '}
                    <strong className="text-slate-800">
                      {totalWeeklyHours.toFixed(1)} hours
                    </strong>
                  </p>
                </>
              )}
            </section>

            {/* Subject Performance */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800">
                  Subject-wise Performance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Accuracy based on your learning attempts
                </p>
              </div>

              {loading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading subject performance...
                </p>
              ) : subjects.length === 0 ? (
                <EmptyState message="No subject performance data available yet." />
              ) : (
                <div className="space-y-6">
                  {subjects.map((subject, index) => {
                    const score = Math.min(
                      100,
                      Math.max(0, Number(subject.accuracy_percentage || 0))
                    )

                    const colors = [
                      'bg-blue-500',
                      'bg-violet-500',
                      'bg-emerald-500',
                      'bg-orange-500',
                    ]

                    return (
                      <div key={subject.subject || index}>
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-700">
                            {subject.subject || 'Subject'}
                          </span>

                          <span className="font-semibold text-slate-800">
                            {score.toFixed(1)}%
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {subject.total_attempts ?? 0} learning attempts
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Quiz History */}
          <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-800">
                Quiz Performance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review your recent quiz scores
              </p>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading quiz history...
              </p>
            ) : quizHistory.length === 0 ? (
              <EmptyState message="No quiz attempts found. Complete a quiz to see your performance here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-3 font-medium">Subject</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Score</th>
                      <th className="px-3 py-3 font-medium">Performance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {quizHistory.map((quiz, index) => {
                      const score = Number(
                        quiz.score_percentage || 0
                      )

                      return (
                        <tr
                          key={quiz.quiz_id || index}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-3 py-4 font-medium text-slate-700">
                            {quiz.subject || 'General'}
                            {quiz.topic && (
                              <span className="block text-xs font-normal text-slate-400">
                                {quiz.topic}
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-4 text-slate-500">
                            {formatDate(quiz.submitted_at)}
                          </td>

                          <td className="px-3 py-4 font-semibold text-slate-800">
                            {score}%
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                score >= 80
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : score >= 70
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {score >= 80
                                ? 'Excellent'
                                : score >= 70
                                  ? 'Good'
                                  : 'Needs practice'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Strengths and Weaknesses */}
          <div className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-2">

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <Trophy size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Your Strengths
                  </h2>

                  <p className="text-sm text-slate-500">
                    Topics where you are performing well
                  </p>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : strengths.length === 0 ? (
                <EmptyState message="More learning attempts are needed to identify your strengths." />
              ) : (
                <div className="space-y-3">
                  {strengths.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3"
                    >
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />

                      <p className="text-sm text-slate-700">
                        {getText(item)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                  <Target size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Areas to Improve
                  </h2>

                  <p className="text-sm text-slate-500">
                    Topics that may need more practice
                  </p>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : weaknesses.length === 0 ? (
                <EmptyState message="More learning attempts are needed to identify improvement areas." />
              ) : (
                <div className="space-y-3">
                  {weaknesses.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl bg-orange-50 p-3"
                    >
                      <Target
                        size={18}
                        className="mt-0.5 shrink-0 text-orange-600"
                      />

                      <p className="text-sm text-slate-700">
                        {getText(item)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Performance Trend */}
          <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <TrendingUp size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Performance Trend
                </h2>

                <p className="text-sm text-slate-500">
                  Your recent quiz performance
                </p>
              </div>
            </div>

            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Loading performance trend...
              </p>
            ) : performanceTrend.length === 0 ? (
              <EmptyState message="Complete more quizzes to build your performance trend." />
            ) : (
              <div className="space-y-4">
                {performanceTrend.map((item, index) => {
                  const score = Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        item.score_percentage ??
                        item.accuracy_percentage ??
                        item.average_score ??
                        0
                      )
                    )
                  )

                  return (
                    <div key={item.quiz_id || index}>
                      <div className="mb-2 flex justify-between gap-3 text-sm">
                        <span className="text-slate-600">
                          {formatDate(
                            item.submitted_at ||
                            item.date ||
                            item.created_at
                          )}
                        </span>

                        <span className="font-semibold text-slate-800">
                          {score.toFixed(1)}%
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Recommendations */}
          <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Lightbulb size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Personalized Recommendations
                </h2>

                <p className="text-sm text-slate-500">
                  Suggestions to improve your learning
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading recommendations...</p>
            ) : recommendations.length === 0 ? (
              <EmptyState message="Your personalized recommendations will appear as you build your learning history." />
            ) : (
              <div className="space-y-3">
                {recommendations.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-amber-50 p-4"
                  >
                    <Lightbulb
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-sm leading-6 text-slate-700">
                      {getText(item)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-5 text-lg font-bold text-slate-800">
              Recent Learning Activity
            </h2>

            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Loading recent activities...
              </p>
            ) : recentActivities.length === 0 ? (
              <EmptyState message="No recent learning activities found." />
            ) : (
              <div className="space-y-5">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${activity.color}`}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800">
                          {activity.title}
                        </p>

                        <p className="text-sm text-slate-500">
                          {activity.detail}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {formatTimeAgo(activity.date)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Quick Links */}
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuickLink
              title="Take a Quiz"
              description="Test your knowledge"
              to="/quiz"
            />

            <QuickLink
              title="Start Studying"
              description="Record a study session"
              to="/study-sessions"
            />

            <QuickLink
              title="Plan Your Learning"
              description="Manage your study tasks"
              to="/study-planner"
            />
          </div>

        </div>
      </main>
    </div>
  )
}

function BookOpenIcon({ size = 20 }) {
  return <ClipboardList size={size} />
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <h3 className="mt-4 text-2xl font-bold text-slate-800">
        {value}
      </h3>

      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  )
}

function QuickLink({ title, description, to }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <ArrowUpRight size={18} className="text-indigo-600" />
      </div>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Link>
  )
}

export default Analytics
