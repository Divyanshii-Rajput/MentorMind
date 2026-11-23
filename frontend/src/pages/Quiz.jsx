
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react'

import { generateQuiz, submitQuiz } from '../services/quizService'

const subjects = [
  'Database Management',
  'Operating Systems',
  'Computer Networks',
  'Data Structures',
  'Artificial Intelligence',
  'Programming',
  'Other',
]

const getSavedDocuments = () => {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem('mentormind_documents') || '[]',
    )

    return Array.isArray(saved)
      ? saved.filter(
          (document) =>
            document.status === 'Indexed successfully' &&
            document.serverDocumentId,
        )
      : []
  } catch {
    return []
  }
}

const getDocumentName = (document) => {
  return (
    document.originalFilename ||
    document.original_filename ||
    document.fileName ||
    document.name ||
    'Uploaded PDF'
  )
}

const getErrorMessage = (error) => {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || 'Invalid input').join(', ')
  }

  return error.message || 'Something went wrong. Please try again.'
}

function Quiz() {
  const [documents] = useState(getSavedDocuments)

  const [selectedDocumentId, setSelectedDocumentId] = useState(
    documents[0]?.serverDocumentId || '',
  )

  const [subject, setSubject] = useState('Database Management')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('beginner')
  const [numQuestions, setNumQuestions] = useState(5)

  const [quizData, setQuizData] = useState(null)
  const [questions, setQuestions] = useState([])

  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answers, setAnswers] = useState({})

  const [quizResult, setQuizResult] = useState(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const question = questions[currentQuestion]
  const totalQuestions = questions.length

  const percentage = Math.round(
    Number(quizResult?.score_percentage || 0),
  )

  const startQuiz = async () => {
    if (!selectedDocumentId) {
      setError('Please select an indexed document.')
      return
    }

    if (!topic.trim()) {
      setError('Please enter a topic for your quiz.')
      return
    }

    setError('')
    setIsGenerating(true)

    try {
      const payload = {
        document_id: selectedDocumentId,
        subject,
        topic: topic.trim(),
        difficulty,
        num_questions: Number(numQuestions),
        top_k: 5,
      }

      const result = await generateQuiz(payload)

      if (!result.questions || result.questions.length === 0) {
        throw new Error(
          'No questions were generated. Try another topic or document.',
        )
      }

      setQuizData(result)
      setQuestions(result.questions)

      setCurrentQuestion(0)
      setSelectedAnswer(null)
      setAnswers({})
      setQuizResult(null)

      setQuizFinished(false)
      setQuizStarted(true)
    } catch (err) {
      console.error('Quiz generation failed:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsGenerating(false)
    }
  }

  const submitFinalQuiz = async (finalAnswers) => {
    if (!quizData?.quiz_id) {
      setError('Quiz information is missing. Please generate a new quiz.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const formattedAnswers = questions.map((item) => ({
        question_id: item.id,
        selected_option_id: finalAnswers[item.id],
      }))

      const result = await submitQuiz(
        quizData.quiz_id,
        formattedAnswers,
      )

      setAnswers(finalAnswers)
      setQuizResult(result)
      setQuizFinished(true)
    } catch (err) {
      console.error('Quiz submission failed:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToNextQuestion = () => {
    if (!selectedAnswer || !question) return

    const updatedAnswers = {
      ...answers,
      [question.id]: selectedAnswer,
    }

    if (currentQuestion === totalQuestions - 1) {
      submitFinalQuiz(updatedAnswers)
      return
    }

    setAnswers(updatedAnswers)
    setCurrentQuestion((previous) => previous + 1)
    setSelectedAnswer(null)
  }

  const restartQuiz = () => {
    setQuizStarted(false)
    setQuizFinished(false)

    setQuizData(null)
    setQuestions([])
    setQuizResult(null)

    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setAnswers({})

    setError('')
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
              className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700"
            >
              <CircleHelp size={19} />
              Practice Quiz
            </Link>
          </nav>

          <div className="mt-auto rounded-2xl bg-indigo-50 p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600">
              <Trophy size={19} />
            </div>

            <h3 className="text-sm font-semibold text-slate-800">
              Practice makes progress
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Test your understanding and learn from every answer.
            </p>
          </div>
        </aside>

        {/* Main area */}
        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div>
              <p className="text-sm text-slate-500">
                Workspace / Practice
              </p>

              <h1 className="mt-1 text-lg font-bold text-slate-900">
                Practice Quiz
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

          <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">

            {/* Configuration screen */}
            {!quizStarted && (
              <section>
                <div className="mb-8">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                    <CircleHelp size={14} />
                    AI-powered practice
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Ready for a quick challenge?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                    Generate a personalized quiz from your uploaded study material.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <h3 className="text-lg font-bold text-slate-900">
                    Configure your quiz
                  </h3>

                  {/* Document selection */}
                  <div className="mt-6">
                    <label
                      htmlFor="document"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Select study document
                    </label>

                    <select
                      id="document"
                      value={selectedDocumentId}
                      onChange={(event) =>
                        setSelectedDocumentId(event.target.value)
                      }
                      disabled={documents.length === 0}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                    >
                      {documents.length === 0 && (
                        <option value="">
                          No indexed documents available
                        </option>
                      )}

                      {documents.map((document) => (
                        <option
                          key={document.serverDocumentId}
                          value={document.serverDocumentId}
                        >
                          {getDocumentName(document)}
                        </option>
                      ))}
                    </select>

                    {documents.length === 0 && (
                      <p className="mt-2 text-xs text-amber-700">
                        Upload and successfully index a PDF before generating a quiz.
                        {' '}
                        <Link
                          to="/documents"
                          className="font-semibold underline"
                        >
                          Go to My Documents
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="mt-6">
                    <label
                      htmlFor="subject"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Select subject
                    </label>

                    <select
                      id="subject"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      {subjects.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic */}
                  <div className="mt-6">
                    <label
                      htmlFor="topic"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Enter topic
                    </label>

                    <input
                      id="topic"
                      type="text"
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      placeholder="e.g. Database Normalization, Deadlocks, SQL Joins"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Enter the specific topic you want to practise from your document.
                    </p>
                  </div>

                  {/* Difficulty */}
                  <div className="mt-6">
                    <label
                      htmlFor="difficulty"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Choose difficulty
                    </label>

                    <select
                      id="difficulty"
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  {/* Number of questions */}
                  <div className="mt-6">
                    <label
                      htmlFor="numQuestions"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Number of questions
                    </label>

                    <select
                      id="numQuestions"
                      value={numQuestions}
                      onChange={(event) =>
                        setNumQuestions(Number(event.target.value))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                        <option key={number} value={number}>
                          {number} {number === 1 ? 'question' : 'questions'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quiz information */}
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <CircleHelp size={17} />
                        <span className="text-xs font-medium">
                          Questions
                        </span>
                      </div>

                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {numQuestions}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock3 size={17} />
                        <span className="text-xs font-medium">
                          Estimated time
                        </span>
                      </div>

                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {numQuestions} minutes
                      </p>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Generate button */}
                  <button
                    type="button"
                    onClick={startQuiz}
                    disabled={
                      isGenerating ||
                      documents.length === 0 ||
                      !selectedDocumentId
                    }
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating
                      ? 'Generating your quiz...'
                      : 'Generate quiz'}

                    {!isGenerating && <ArrowRight size={18} />}
                  </button>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-xl bg-indigo-50 p-4">
                  <CircleHelp size={18} className="mt-0.5 shrink-0 text-indigo-600" />

                  <p className="text-xs leading-5 text-indigo-800">
                    <strong>AI-generated quiz:</strong> Questions are generated
                    using the selected indexed document and your chosen topic.
                    Your answers are evaluated by the backend after submission.
                  </p>
                </div>
              </section>
            )}

            {/* Active quiz */}
            {quizStarted && !quizFinished && question && (
              <section>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">
                      {subject} / {topic}
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      Practice session
                    </h2>
                  </div>

                  <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold capitalize text-indigo-700">
                    {difficulty}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      Question {currentQuestion + 1} of {totalQuestions}
                    </span>

                    <span className="text-slate-500">
                      {Math.round(
                        ((currentQuestion + 1) / totalQuestions) * 100,
                      )}
                      % completed
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{
                        width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Question card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Question {currentQuestion + 1}
                  </p>

                  <h3 className="mt-3 text-lg font-bold leading-7 text-slate-900 sm:text-xl">
                    {question.question}
                  </h3>

                  <div className="mt-6 space-y-3">
                    {question.options.map((option, index) => {
                      const isSelected = selectedAnswer === option.id

                      const optionStyle = isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedAnswer(option.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition ${optionStyle}`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-600 shadow-sm">
                            {String.fromCharCode(65 + index)}
                          </span>

                          <span className="flex-1">
                            {option.text}
                          </span>

                          {isSelected && (
                            <CheckCircle2
                              size={19}
                              className="shrink-0 text-indigo-600"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <p className="mt-5 text-xs text-slate-400">
                    Your answer will be evaluated after you submit the complete quiz.
                  </p>

                  {error && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={restartQuiz}
                      disabled={isSubmitting}
                      className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Exit quiz
                    </button>

                    <button
                      type="button"
                      onClick={goToNextQuestion}
                      disabled={!selectedAnswer || isSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSubmitting
                        ? 'Evaluating answers...'
                        : currentQuestion === totalQuestions - 1
                          ? 'Submit quiz'
                          : 'Next question'}

                      {!isSubmitting && <ArrowRight size={17} />}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Quiz results */}
            {quizFinished && quizResult && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                  <Trophy size={40} />
                </div>

                <p className="mt-6 text-sm font-semibold text-indigo-600">
                  Quiz completed
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {percentage >= 80
                    ? 'Excellent work!'
                    : percentage >= 50
                      ? 'Good effort!'
                      : 'Keep practising!'}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  You have completed the {subject} quiz on {topic}.
                </p>

                {/* Score cards */}
                <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3">
                  <div className="rounded-xl bg-indigo-50 p-5">
                    <p className="text-sm text-indigo-600">
                      Correct answers
                    </p>

                    <p className="mt-2 text-3xl font-bold text-indigo-700">
                      {quizResult.correct_answers}/{quizResult.total_questions}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">
                      Accuracy
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {percentage}%
                    </p>
                  </div>
                </div>

                <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-3">
                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-xs text-green-700">
                      Correct
                    </p>

                    <p className="mt-1 text-xl font-bold text-green-700">
                      {quizResult.correct_answers}
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-xs text-red-700">
                      Incorrect
                    </p>

                    <p className="mt-1 text-xl font-bold text-red-700">
                      {quizResult.incorrect_answers}
                    </p>
                  </div>
                </div>

                {/* Adaptive status */}
                {quizResult.adaptive_status && (
                  <div className="mt-5 rounded-xl bg-indigo-50 p-4 text-left">
                    <p className="text-sm font-semibold text-indigo-800">
                      Adaptive learning update
                    </p>

                    <p className="mt-1 text-xs leading-5 text-indigo-700">
                      {quizResult.adaptive_status}
                    </p>
                  </div>
                )}

                {/* Answer review */}
                <div className="mt-8 text-left">
                  <h3 className="mb-3 font-bold text-slate-900">
                    Answer review
                  </h3>

                  <div className="space-y-3">
                    {questions.map((item, index) => {
                      const feedback = quizResult.feedback?.find(
                        (entry) => entry.question_id === item.id,
                      )

                      const selectedOption = item.options.find(
                        (option) =>
                          option.id === answers[item.id],
                      )

                      const correctOption = item.options.find(
                        (option) =>
                          option.id === feedback?.correct_option_id,
                      )

                      const isCorrect = feedback?.is_correct

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start gap-2">
                            {isCorrect ? (
                              <CheckCircle2
                                size={18}
                                className="mt-0.5 shrink-0 text-green-600"
                              />
                            ) : (
                              <XCircle
                                size={18}
                                className="mt-0.5 shrink-0 text-red-500"
                              />
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                {index + 1}. {item.question}
                              </p>

                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                Your answer:{' '}
                                {selectedOption?.text || 'Not available'}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-green-700">
                                Correct answer:{' '}
                                {correctOption?.text || 'Not available'}
                              </p>

                              {feedback?.explanation && (
                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                  <strong>Explanation:</strong>{' '}
                                  {feedback.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={restartQuiz}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <RotateCcw size={17} />
                    Try another quiz
                  </button>

                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Back to dashboard
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Quiz
