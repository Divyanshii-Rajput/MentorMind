import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Trash2,
} from 'lucide-react'

import {
  getStudyTasks,
  createStudyTask,
  updateStudyTask,
  deleteStudyTask,
  generateStudyPlan,
} from '../services/studyPlanner'


function getToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


function formatDate(dateString) {
  if (!dateString) return 'No due date'

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )
}


function getErrorMessage(error) {
  return (
    error.response?.data?.detail ||
    error.message ||
    'Something went wrong. Please try again.'
  )
}


function StudyPlanner() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Database Management')
  const [dueDate, setDueDate] = useState(getToday())
  const [priority, setPriority] = useState('Medium')
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
    // AI-generated study plan state
  const [aiPlan, setAiPlan] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [studyDays, setStudyDays] = useState(7)
  const [minutesPerDay, setMinutesPerDay] = useState(60)

  const [email] = useState(() => {
    try {
      const user = JSON.parse(
        sessionStorage.getItem('mentormind_user') || '{}'
      )
      return user.email || ''
    } catch {
      return ''
    }
  })

  const today = getToday()

  // Load saved tasks from the backend when the page opens.
  useEffect(() => {
    let isActive = true

    const loadTasks = async () => {
      if (!email) {
        setError('User information not found. Please log in again.')
        setLoading(false)
        return
      }

      try {
        const savedTasks = await getStudyTasks(email)

        if (isActive) {
          setTasks(savedTasks)
        }
      } catch (err) {
        if (isActive) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadTasks()

    return () => {
      isActive = false
    }
  }, [email])


  // Add a new task to MongoDB.
  const addTask = async (event) => {
    event.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please enter a task title.')
      return
    }

    if (!email) {
      setError('Please log in again to add a task.')
      return
    }

    setSaving(true)

    try {
      const newTask = await createStudyTask(email, {
        title: title.trim(),
        subject,
        dueDate,
        priority,
      })

      setTasks((previous) => [...previous, newTask])

      setTitle('')
      setDueDate(getToday())
      setPriority('Medium')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }


  // Update task completion status in MongoDB.
  const toggleTask = async (id) => {
    setError('')

    const existingTask = tasks.find((task) => task.id === id)

    if (!existingTask) return

    try {
      const updatedTask = await updateStudyTask(email, id, {
        completed: !existingTask.completed,
      })

      setTasks((previous) =>
        previous.map((task) =>
          task.id === id ? updatedTask : task
        )
      )
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }


  // Delete a task from MongoDB.
  const deleteTask = async (id) => {
    setError('')

    try {
      await deleteStudyTask(email, id)

      setTasks((previous) =>
        previous.filter((task) => task.id !== id)
      )
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

    // Generate a personalized study plan using learning analytics.
  const handleGeneratePlan = async () => {
    setPlanError('')

    if (!email) {
      setPlanError('Please log in again to generate your study plan.')
      return
    }

    setPlanLoading(true)

    try {
      const generatedPlan = await generateStudyPlan(
        email,
        studyDays,
        minutesPerDay,
      )

      setAiPlan(generatedPlan)
    } catch (err) {
      setPlanError(getErrorMessage(err))
    } finally {
      setPlanLoading(false)
    }
  }
  const completedCount = tasks.filter((task) => task.completed).length
  const pendingCount = tasks.length - completedCount

  const overdueCount = tasks.filter(
    (task) => !task.completed && task.dueDate && task.dueDate < today,
  ).length


  const filteredTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      if (filter === 'Pending') return !task.completed
      if (filter === 'Completed') return task.completed
      return true
    })

    return [...result].sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })
  }, [tasks, filter])


  const priorityStyles = {
    High: 'bg-red-50 text-red-700',
    Medium: 'bg-amber-50 text-amber-700',
    Low: 'bg-green-50 text-green-700',
  }


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
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <LayoutDashboard size={19} />
              Dashboard
            </Link>

            <Link
              to="/tutor"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <MessageCircle size={19} />
              AI Tutor
            </Link>

            <Link
              to="/documents"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <BookOpen size={19} />
              My Documents
            </Link>

            <Link
              to="/quiz"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <CheckCircle2 size={19} />
              Practice Quiz
            </Link>

            <Link
              to="/study-planner"
              className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700"
            >
              <CalendarDays size={19} />
              Study Planner
            </Link>
          </nav>

          <div className="mt-auto rounded-2xl bg-indigo-50 p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600">
              <Clock3 size={19} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              Stay consistent
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Small, regular study sessions can help you reach your learning goals.
            </p>
          </div>
        </aside>


        {/* Main content */}
        <main className="min-w-0 flex-1">

          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div>
              <p className="text-sm text-slate-500">Workspace / Planning</p>
              <h1 className="mt-1 text-lg font-bold text-slate-900">
                Study Planner
              </h1>
            </div>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </header>


          {/* Mobile navigation */}
          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-3 md:hidden">
            <Link
              to="/dashboard"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Dashboard
            </Link>

            <Link
              to="/tutor"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              AI Tutor
            </Link>

            <Link
              to="/documents"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Documents
            </Link>

            <Link
              to="/quiz"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Practice Quiz
            </Link>

            <Link
              to="/study-planner"
              className="shrink-0 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"
            >
              Study Planner
            </Link>
          </nav>


          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">

            {/* Introduction */}
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <CalendarDays size={14} />
                Plan your learning
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Make every study session count
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Organize your subjects, set deadlines, and keep track of your
                learning goals in one place.
              </p>
            </div>


            {/* Error message */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}


            {/* Statistics */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total tasks</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {tasks.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">All study goals</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Completed</p>
                <p className="mt-2 text-2xl font-bold text-green-600">
                  {completedCount}
                </p>
                <p className="mt-1 text-xs text-slate-400">Tasks finished</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pending</p>
                <p className="mt-2 text-2xl font-bold text-indigo-600">
                  {pendingCount}
                </p>
                <p className="mt-1 text-xs text-slate-400">Tasks remaining</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Overdue</p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {overdueCount}
                </p>
                <p className="mt-1 text-xs text-slate-400">Past due dates</p>
              </div>

            </div>

            
            {/* AI Generated Study Plan */}
            <section className="mb-8 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                    <GraduationCap size={15} />
                    Personalized learning
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    Your AI Study Plan
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Get a study schedule based on your learning progress and areas
                    that need improvement.
                  </p>
                </div>
              </div>

              {/* Plan settings */}
              <div className="mt-6 grid gap-4 sm:grid-cols-3">

                <div>
                  <label
                    htmlFor="study-days"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Study duration
                  </label>

                  <select
                    id="study-days"
                    value={studyDays}
                    onChange={(event) => setStudyDays(Number(event.target.value))}
                    disabled={planLoading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="daily-minutes"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Daily study time
                  </label>

                  <select
                    id="daily-minutes"
                    value={minutesPerDay}
                    onChange={(event) => setMinutesPerDay(Number(event.target.value))}
                    disabled={planLoading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleGeneratePlan}
                    disabled={planLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <GraduationCap size={18} />
                    {planLoading
                      ? 'Generating plan...'
                      : aiPlan
                        ? 'Regenerate plan'
                        : 'Generate study plan'}
                  </button>
                </div>

              </div>

              {/* Plan error */}
              {planError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {planError}
                </div>
              )}

              {/* Generated plan */}
              {aiPlan && (
                <div className="mt-7 border-t border-slate-100 pt-6">

                  <div className="rounded-xl bg-indigo-50 p-4">
                    <h4 className="font-semibold text-indigo-900">
                      Plan overview
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-indigo-800">
                      {aiPlan.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-indigo-700">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={15} />
                        {aiPlan.duration_days} days
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={15} />
                        {aiPlan.minutes_per_day} minutes/day
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen size={15} />
                        {aiPlan.total_planned_minutes} total minutes
                      </span>
                    </div>
                  </div>

                  <h4 className="mb-4 mt-6 font-bold text-slate-900">
                    Your daily schedule
                  </h4>

                  <div className="grid gap-4 md:grid-cols-2">

                    {aiPlan.days.map((day) => (
                      <div
                        key={day.day_number}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                              Day {day.day_number}
                            </p>

                            <h5 className="mt-1 font-bold text-slate-900">
                              {day.title}
                            </h5>
                          </div>

                          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {day.total_minutes} min
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">

                          {day.tasks.map((task, index) => {
                            const taskPriority = String(
                              task.priority || 'medium'
                            ).toLowerCase()

                            const taskPriorityStyle = {
                              high: 'bg-red-50 text-red-700',
                              medium: 'bg-amber-50 text-amber-700',
                              low: 'bg-green-50 text-green-700',
                            }

                            return (
                              <div
                                key={`${day.day_number}-${index}`}
                                className="rounded-lg bg-slate-50 p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-slate-500">
                                    {task.subject} · {task.topic}
                                  </span>

                                  <span
                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                      taskPriorityStyle[taskPriority] ||
                                      'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {task.priority} priority
                                  </span>
                                </div>

                                <p className="mt-2 text-sm font-semibold text-slate-800">
                                  {task.activity}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {task.duration_minutes} minutes
                                </p>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                  {task.reason}
                                </p>
                              </div>
                            )
                          })}

                        </div>
                      </div>
                    ))}

                  </div>
                </div>
              )}

            </section>

            <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">

              {/* Task list */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Your study tasks
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage your upcoming learning activities.
                    </p>
                  </div>

                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    aria-label="Filter study tasks"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    <option>All</option>
                    <option>Pending</option>
                    <option>Completed</option>
                  </select>
                </div>


                <div className="mt-6 space-y-3">

                  {loading ? (
                    <div className="py-12 text-center text-sm text-slate-500">
                      Loading your study tasks...
                    </div>
                  ) : filteredTasks.length === 0 ? (

                    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
                      <CalendarDays
                        size={30}
                        className="mx-auto text-slate-400"
                      />

                      <h4 className="mt-3 font-semibold text-slate-800">
                        {filter === 'All'
                          ? 'No study tasks yet'
                          : `No ${filter.toLowerCase()} tasks`}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {filter === 'All'
                          ? 'Add your first task using the form.'
                          : 'Try another filter or add a new task.'}
                      </p>
                    </div>

                  ) : (

                    filteredTasks.map((task) => {
                      const isOverdue =
                        !task.completed &&
                        task.dueDate &&
                        task.dueDate < today

                      return (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                            task.completed
                              ? 'border-green-100 bg-green-50/40'
                              : 'border-slate-200 bg-white'
                          }`}
                        >

                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            aria-label={
                              task.completed
                                ? 'Mark task as pending'
                                : 'Mark task as completed'
                            }
                            className="mt-0.5 shrink-0 text-indigo-600"
                          >
                            {task.completed ? (
                              <CheckCircle2 size={21} className="text-green-600" />
                            ) : (
                              <Circle size={21} />
                            )}
                          </button>


                          <div className="min-w-0 flex-1">

                            <p
                              className={`break-words text-sm font-semibold ${
                                task.completed
                                  ? 'text-slate-400 line-through'
                                  : 'text-slate-800'
                              }`}
                            >
                              {task.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {task.subject}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority]}`}
                              >
                                {task.priority} priority
                              </span>

                              <span
                                className={`inline-flex items-center gap-1 text-xs ${
                                  isOverdue
                                    ? 'font-semibold text-red-600'
                                    : 'text-slate-500'
                                }`}
                              >
                                <CalendarDays size={13} />
                                {isOverdue ? 'Overdue · ' : ''}
                                {formatDate(task.dueDate)}
                              </span>

                            </div>
                          </div>


                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            aria-label={`Delete ${task.title}`}
                            title="Delete task"
                            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>
                      )
                    })

                  )}

                </div>
              </section>


              {/* Add task form */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Plus size={21} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Add a study task
                    </h3>
                    <p className="text-xs text-slate-500">
                      Create a new learning goal
                    </p>
                  </div>
                </div>


                <form onSubmit={addTask} className="mt-6 space-y-4">

                  <div>
                    <label
                      htmlFor="task-title"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Task title
                    </label>

                    <input
                      id="task-title"
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. Revise normalization"
                      maxLength={100}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>


                  <div>
                    <label
                      htmlFor="task-subject"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Subject
                    </label>

                    <select
                      id="task-subject"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option>Database Management</option>
                      <option>Operating Systems</option>
                      <option>Computer Networks</option>
                      <option>Data Structures</option>
                      <option>Artificial Intelligence</option>
                      <option>Programming</option>
                      <option>Other</option>
                    </select>
                  </div>


                  <div>
                    <label
                      htmlFor="task-date"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Due date
                    </label>

                    <input
                      id="task-date"
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>


                  <div>
                    <label
                      htmlFor="task-priority"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Priority
                    </label>

                    <select
                      id="task-priority"
                      value={priority}
                      onChange={(event) => setPriority(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>


                  {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}


                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus size={17} />
                    {saving ? 'Saving...' : 'Add task'}
                  </button>

                </form>
              </section>

            </div>


            {/* Progress section */}
            <section className="mt-7 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white sm:p-7">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <h3 className="text-lg font-bold">
                    Your study progress
                  </h3>

                  <p className="mt-1 text-sm text-indigo-100">
                    {tasks.length === 0
                      ? 'Add tasks to start tracking your progress.'
                      : `${completedCount} out of ${tasks.length} tasks completed.`}
                  </p>
                </div>


                <div className="text-left sm:text-right">
                  <p className="text-3xl font-bold">
                    {tasks.length === 0
                      ? 0
                      : Math.round((completedCount / tasks.length) * 100)}
                    %
                  </p>

                  <p className="text-xs text-indigo-100">
                    Completion rate
                  </p>
                </div>

              </div>


              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{
                    width: `${
                      tasks.length === 0
                        ? 0
                        : (completedCount / tasks.length) * 100
                    }%`,
                  }}
                />
              </div>

            </section>


            {/* Navigation */}
            <div className="mt-7 flex flex-wrap gap-3">

              <Link
                to="/quiz"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Practice Quiz
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/tutor"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Ask AI Tutor
                <ArrowRight size={16} />
              </Link>

            </div>


            <p className="mt-6 text-xs leading-5 text-slate-400">
              Your study tasks are securely saved and synchronized with your
              MentorMind account.
            </p>

          </div>
        </main>
      </div>
    </div>
  )
}

export default StudyPlanner
