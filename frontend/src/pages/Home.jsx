
import {
  BrainCircuit,
  MessageCircleQuestion,
  FileText,
  ChartNoAxesCombined,
  CalendarCheck,
  Sparkles,
  ArrowRight,
  BookOpenCheck,
  Target,
  Lightbulb,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: MessageCircleQuestion,
    title: 'AI Socratic Tutor',
    description:
      'Learn through guided questions, hints and explanations instead of simply memorizing answers.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: FileText,
    title: 'Document-Based Learning',
    description:
      'Upload your study materials and ask questions based on your own documents.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Target,
    title: 'Personalized Learning',
    description:
      'Get learning recommendations and difficulty adjustments based on your performance.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: BookOpenCheck,
    title: 'Smart Quizzes',
    description:
      'Practice with AI-generated quizzes and understand your mistakes with feedback.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Progress Analytics',
    description:
      'Track your learning progress, identify strengths and discover topics that need attention.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: CalendarCheck,
    title: 'Study Planner',
    description:
      'Organize your learning with personalized study plans and session tracking.',
    color: 'bg-pink-100 text-pink-600',
  },
]

function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BrainCircuit size={25} />
            </div>

            <span className="text-xl font-bold tracking-tight">
              Mentor<span className="text-indigo-600">Mind</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-indigo-600">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-indigo-600">
              How it works
            </a>
            <a href="#about" className="transition hover:text-indigo-600">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
                to="/login"
                className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-indigo-600 sm:block"
            >
                Sign In
            </Link>

            <Link
                to="/register"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
                Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-blue-50" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
                <Sparkles size={16} />
                A smarter way to learn
              </div>

              <h1 className="max-w-2xl text-5xl leading-tight font-bold tracking-tight text-slate-900 md:text-6xl">
                Learn smarter.
                <span className="block text-indigo-600">
                  Think deeper.
                </span>
                Grow faster.
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
                Meet your AI-powered learning companion. Understand difficult
                concepts, ask questions, practice with quizzes and build
                better learning habits with MentorMind.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  Explore Features
                  <ArrowRight size={18} />
                </a>

                <a
                  href="#how-it-works"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
                >
                  How It Works
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Personalized learning
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  AI-powered guidance
                </span>
              </div>
            </div>

            {/* Hero illustration / Dashboard preview */}
            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-indigo-200/50 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />

              <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-indigo-100 sm:p-7">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-sm text-slate-500">
                      Your learning space
                    </p>
                    <h3 className="mt-1 text-lg font-bold">Welcome, Learner!</h3>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <BrainCircuit size={23} />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-indigo-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                    <Sparkles size={17} />
                    AI Learning Assistant
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Let's understand this concept step by step. What do you
                    already know about it?
                  </p>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm text-slate-400">
                    Ask your question...
                    <MessageCircleQuestion
                      size={18}
                      className="text-indigo-600"
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <BookOpenCheck size={19} />
                    </div>
                    <p className="mt-3 text-sm font-semibold">Smart Quizzes</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Practice and improve
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <ChartNoAxesCombined size={19} />
                    </div>
                    <p className="mt-3 text-sm font-semibold">Your Progress</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Track your growth
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Lightbulb size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Keep learning!</p>
                    <p className="text-xs text-slate-500">
                      Every question brings you closer to understanding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="scroll-mt-24 px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold tracking-widest text-indigo-600 uppercase">
                What MentorMind offers
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Everything you need to learn better
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                A collection of intelligent learning tools designed to make
                studying more interactive, organized and personalized.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon

                return (
                  <article
                    key={feature.title}
                    className="rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}
                    >
                      <Icon size={24} />
                    </div>

                    <h3 className="mt-6 text-lg font-bold">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {feature.description}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="scroll-mt-24 bg-slate-50 px-6 py-20 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="text-sm font-bold tracking-widest text-indigo-600 uppercase">
                Simple learning process
              </p>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                How MentorMind works
              </h2>
            </div>

            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {[
                {
                  number: '01',
                  title: 'Bring your learning material',
                  description:
                    'Upload your study documents or choose a topic you want to understand.',
                },
                {
                  number: '02',
                  title: 'Learn with AI guidance',
                  description:
                    'Ask questions, explore explanations and solve problems through guided learning.',
                },
                {
                  number: '03',
                  title: 'Practice and improve',
                  description:
                    'Take quizzes, review your performance and follow your personalized study plan.',
                },
              ].map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-200">
                    {step.number}
                  </div>

                  <h3 className="mt-6 text-lg font-bold">{step.title}</h3>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About / CTA */}
        <section id="about" className="px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 px-7 py-14 text-center text-white shadow-xl shadow-indigo-200 sm:px-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <BrainCircuit size={30} />
            </div>

            <h2 className="mt-6 text-3xl font-bold md:text-4xl">
              Learning should be an experience, not a struggle.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-indigo-100">
              MentorMind brings AI-powered tutoring, personalized practice
              and progress tracking together in one learning platform.
            </p>

            <a
              href="#features"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Discover MentorMind
              <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-indigo-600" size={22} />
            <span className="font-bold">
              Mentor<span className="text-indigo-600">Mind</span>
            </span>
          </div>

          <p className="text-center text-sm text-slate-500">
            Learn smarter. Think deeper. Grow faster.
          </p>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} MentorMind
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home
