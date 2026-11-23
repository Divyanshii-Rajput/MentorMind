
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { askRAGQuestion } from '../services/ragService'
import {
    BrainCircuit,
    MessageCircle,
    Plus,
    Send,
    Paperclip,
    Sparkles,
    BookOpen,
    ChevronDown,
    Menu,
    PanelLeftClose,
    User,
    Bot,
    Lightbulb,
    GraduationCap,
} from 'lucide-react'

const suggestions = [
    'Explain this concept in simple terms',
    'Give me a real-world example',
    'Help me understand this step by step',
    'Ask me questions to test my understanding',
]

const initialMessages = [
    {
        id: 1,
        role: 'assistant',
        text: "Hello! I'm your MentorMind AI Tutor. I'm here to help you understand concepts, not just memorize answers.\n\nWhat would you like to learn today? You can ask me a question, choose a subject, or explore a topic step by step.",
    },
]

// Correct escaped Markdown symbols returned in some AI responses.
function normalizeMarkdown(text) {
    return text.replace(/\\([#*_|`>])/g, '$1')
}

function Tutor() {
    const [messages, setMessages] = useState(initialMessages)
    const [input, setInput] = useState('')
    const [subject, setSubject] = useState('General')
    const [learningMode, setLearningMode] = useState('Socratic')
    const [showHistory, setShowHistory] = useState(true)
    const [notice, setNotice] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()

        const question = input.trim()

        if (!question || isLoading) return

        setMessages((previous) => [
            ...previous,
            {
                id: Date.now(),
                role: 'user',
                text: question,
            },
        ])

        setInput('')
        setNotice('')
        setIsLoading(true)

        try {
            const data = await askRAGQuestion(question)

            setMessages((previous) => [
                ...previous,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    text: data.answer,
                },
            ])
        } catch (error) {
            console.error('Tutor API error:', error)

            const errorMessage =
                error.response?.data?.detail ||
                'Unable to get a response from the AI Tutor. Please try again.'

            setMessages((previous) => [
                ...previous,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    text: `Sorry, something went wrong: ${errorMessage}`,
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    function handleSuggestion(suggestion) {
        setInput(suggestion)
        setNotice('')
    }

    function startNewChat() {
        setMessages(initialMessages)
        setInput('')
        setNotice('')
    }

    return (
        <div className="flex h-screen min-h-[600px] overflow-hidden bg-slate-50 text-slate-900">
            {/* Conversation sidebar */}
            <aside
                className={`${
                    showHistory ? 'flex' : 'hidden'
                } w-72 shrink-0 flex-col border-r border-slate-200 bg-white`}
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                            <BrainCircuit size={21} />
                        </div>
                        <span className="text-lg font-bold">
                            Mentor<span className="text-indigo-600">Mind</span>
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setShowHistory(false)}
                        aria-label="Hide conversation sidebar"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                        <PanelLeftClose size={19} />
                    </button>
                </div>

                <div className="p-4">
                    <button
                        type="button"
                        onClick={startNewChat}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        New conversation
                    </button>
                </div>

                <div className="px-5 pt-3">
                    <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                        Workspace
                    </p>

                    <Link
                        to="/dashboard"
                        className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <GraduationCap size={18} />
                        Dashboard
                    </Link>

                    <div className="mt-2 flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700">
                        <MessageCircle size={18} />
                        AI Tutor
                    </div>
                </div>

                <div className="mt-8 px-5">
                    <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                        Recent conversations
                    </p>

                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-center">
                        <MessageCircle className="mx-auto text-slate-300" size={22} />
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                            Your saved conversations will appear here after chat history is
                            connected.
                        </p>
                    </div>
                </div>

                <div className="mt-auto border-t border-slate-100 p-4">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                            <User size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">Student</p>
                            <p className="text-xs text-slate-500">Learner account</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main tutor workspace */}
            <main className="flex min-w-0 flex-1 flex-col">
                {/* Top navigation */}
                <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-7">
                    <div className="flex min-w-0 items-center gap-3">
                        {!showHistory && (
                            <button
                                type="button"
                                onClick={() => setShowHistory(true)}
                                aria-label="Show conversation sidebar"
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <Menu size={20} />
                            </button>
                        )}

                        <div className="min-w-0">
                            <h1 className="truncate text-base font-bold sm:text-lg">
                                AI Learning Tutor
                            </h1>
                            <p className="text-xs text-slate-500">
                                Learn through guided thinking
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        
                        <Link
                            to="/dashboard"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:text-sm"
                        >
                            Dashboard
                        </Link>
                    </div>
                </header>

                {/* Subject and learning mode */}
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-7">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <BookOpen size={17} />
                        <span>Subject</span>
                    </div>

                    <div className="relative">
                        <select
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pr-8 pl-3 text-sm font-medium outline-none focus:border-indigo-400"
                        >
                            <option>General</option>
                            <option>Computer Science</option>
                            <option>Database Management</option>
                            <option>Operating Systems</option>
                            <option>Computer Networks</option>
                            <option>Artificial Intelligence</option>
                            <option>Programming</option>
                        </select>
                        <ChevronDown
                            size={15}
                            className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    <div className="ml-0 flex items-center gap-2 sm:ml-3">
                        <Sparkles size={16} className="text-indigo-600" />
                        <span className="text-sm text-slate-500">Learning mode</span>
                    </div>

                    <div className="relative">
                        <select
                            value={learningMode}
                            onChange={(event) => setLearningMode(event.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pr-8 pl-3 text-sm font-medium outline-none focus:border-indigo-400"
                        >
                            <option>Socratic</option>
                            <option>Concept Explanation</option>
                            <option>Practice Questions</option>
                        </select>
                        <ChevronDown
                            size={15}
                            className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-slate-400"
                        />
                    </div>
                </div>

                {/* Chat messages */}
                <section className="flex-1 overflow-y-auto px-4 py-7 sm:px-8">
                    <div className="mx-auto max-w-3xl space-y-7">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${
                                    message.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                            >
                                <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                        message.role === 'assistant'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {message.role === 'assistant' ? (
                                        <Bot size={20} />
                                    ) : (
                                        <User size={19} />
                                    )}
                                </div>

                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-4 sm:max-w-[78%] ${
                                        message.role === 'assistant'
                                            ? 'rounded-tl-sm border border-slate-200 bg-white text-slate-700'
                                            : 'rounded-tr-sm bg-indigo-600 text-white'
                                    }`}
                                >
                                    <p className="mb-2 text-xs font-semibold opacity-70">
                                        {message.role === 'assistant' ? 'MentorMind Tutor' : 'You'}
                                    </p>

                                    {message.role === 'assistant' ? (
                                        <div className="text-sm leading-7 text-slate-700">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({ ...props }) => (
                                                        <h1 className="mb-3 mt-4 text-xl font-bold text-slate-900" {...props} />
                                                    ),
                                                    h2: ({ ...props }) => (
                                                        <h2 className="mb-2 mt-4 text-lg font-bold text-slate-900" {...props} />
                                                    ),
                                                    h3: ({ ...props }) => (
                                                        <h3 className="mb-2 mt-3 text-base font-semibold text-slate-900" {...props} />
                                                    ),
                                                    p: ({ ...props }) => (
                                                        <p className="mb-3 leading-7" {...props} />
                                                    ),
                                                    ul: ({ ...props }) => (
                                                        <ul className="mb-3 ml-5 list-disc space-y-1" {...props} />
                                                    ),
                                                    ol: ({ ...props }) => (
                                                        <ol className="mb-3 ml-5 list-decimal space-y-1" {...props} />
                                                    ),
                                                    li: ({ ...props }) => (
                                                        <li className="pl-1" {...props} />
                                                    ),
                                                    strong: ({ ...props }) => (
                                                        <strong className="font-semibold text-slate-900" {...props} />
                                                    ),
                                                    table: ({ ...props }) => (
                                                        <div className="my-3 overflow-x-auto">
                                                            <table className="min-w-full border-collapse border border-slate-300 text-left" {...props} />
                                                        </div>
                                                    ),
                                                    th: ({ ...props }) => (
                                                        <th className="border border-slate-300 bg-slate-100 px-3 py-2 font-semibold" {...props} />
                                                    ),
                                                    td: ({ ...props }) => (
                                                        <td className="border border-slate-300 px-3 py-2" {...props} />
                                                    ),
                                                    pre: ({ ...props }) => (
                                                        <pre className="my-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-white" {...props} />
                                                    ),
                                                    code: ({ className, ...props }) => (
                                                        <code
                                                            className={`${className || ''} rounded bg-slate-100 px-1 py-0.5 font-mono text-indigo-700`}
                                                            {...props}
                                                        />
                                                    ),
                                                }}
                                            >
                                                {normalizeMarkdown(message.text)}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap text-sm leading-7 text-white">
                                            {message.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                    <Bot size={20} />
                                </div>

                                <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-4">
                                    <p className="text-xs font-semibold text-slate-500">
                                        MentorMind Tutor
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Thinking and preparing your answer...
                                    </p>
                                </div>
                            </div>
                        )}

                        {messages.length === 1 && (
                            <div className="pt-3">
                                <p className="mb-3 text-sm font-semibold text-slate-700">
                                    Try asking:
                                </p>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => handleSuggestion(suggestion)}
                                            className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Lightbulb
                                                    size={16}
                                                    className="shrink-0 text-indigo-500"
                                                />
                                                {suggestion}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {notice && (
                            <div
                                role="status"
                                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800"
                            >
                                {notice}
                            </div>
                        )}
                    </div>
                </section>

                {/* Message composer */}
                <div className="border-t border-slate-200 bg-white px-4 py-5 sm:px-8">
                    <div className="mx-auto max-w-3xl">
                        <form
                            onSubmit={handleSubmit}
                            className="rounded-2xl border border-slate-300 bg-white p-3 shadow-sm transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50"
                        >
                            <textarea
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault()
                                        event.currentTarget.form.requestSubmit()
                                    }
                                }}
                                rows={2}
                                placeholder="Ask a question or explore a concept..."
                                className="max-h-36 min-h-14 w-full resize-y bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-slate-400"
                            />

                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Paperclip size={16} />
                                    <span>
                                        Ask questions based on your uploaded study materials.
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <span className="hidden sm:inline">Send</span>
                                    <Send size={17} />
                                </button>
                            </div>
                        </form>

                        <p className="mt-3 text-center text-xs text-slate-400">
                            MentorMind uses guided learning to help you understand concepts.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Tutor
