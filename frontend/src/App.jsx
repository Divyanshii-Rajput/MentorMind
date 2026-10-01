function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <section className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
            M
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            MentorMind
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            The AI That Teaches Like a Human
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Learn through questions, hints, and guided thinking instead of
            simply receiving the answer.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              RAG
            </span>

            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              Socratic Learning
            </span>

            <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              Personalized AI
            </span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App