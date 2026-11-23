
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { uploadDocument } from '../services/documentService'
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    FileText,
    FileUp,
    FolderOpen,
    GraduationCap,
    Info,
    LayoutDashboard,
    MessageCircle,
    Plus,
    Trash2,
    UploadCloud,
    X,
    LoaderCircle,
    AlertCircle,
} from 'lucide-react'

function Documents() {
    const fileInputRef = useRef(null)

    const [documents, setDocuments] = useState(() => {
        try {
            return JSON.parse(
                sessionStorage.getItem('mentormind_documents') || '[]'
            )
        } catch {
            return []
        }
    })
    const [error, setError] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    useEffect(() => {
        sessionStorage.setItem(
            'mentormind_documents',
            JSON.stringify(documents)
        )
    }, [documents])
    const MAX_FILE_SIZE = 10 * 1024 * 1024

    // Upload one PDF to the FastAPI backend.
    const processUpload = async (file, localId) => {
        try {
            const result = await uploadDocument(file)

            setDocuments((previous) =>
                previous.map((document) =>
                    document.id === localId
                        ? {
                            ...document,
                            status: 'Indexed successfully',
                            serverDocumentId: result.document_id,
                            indexingResult: result,
                            uploadError: '',
                        }
                        : document
                )
            )
        } catch (err) {
            console.error('Document upload error:', err)

            const errorMessage =
                err.response?.data?.detail ||
                'Upload failed. Please try again.'

            setDocuments((previous) =>
                previous.map((document) =>
                    document.id === localId
                        ? {
                            ...document,
                            status: 'Upload failed',
                            uploadError: errorMessage,
                        }
                        : document
                )
            )
        }
    }

    // Validate selected files and upload valid PDFs.
    const handleFiles = async (fileList) => {
        setError('')

        const selectedFiles = Array.from(fileList)

        if (selectedFiles.length === 0) return

        const validFiles = []

        selectedFiles.forEach((file) => {
            const isPdf =
                file.type === 'application/pdf' ||
                file.name.toLowerCase().endsWith('.pdf')

            if (!isPdf) {
                setError('Only PDF files are supported.')
                return
            }

            if (file.size > MAX_FILE_SIZE) {
                setError(`${file.name} is larger than the 10 MB limit.`)
                return
            }

            if (file.size === 0) {
                setError(`${file.name} is empty.`)
                return
            }

            const localId = `${Date.now()}-${Math.random()}`

            validFiles.push({
                id: localId,
                name: file.name,
                size: file.size,
                status: 'Uploading',
                serverDocumentId: null,
                uploadError: '',
            })
        })

        if (validFiles.length > 0) {
            setDocuments((previous) => [
                ...previous,
                ...validFiles,
            ])

            // Upload files one by one.
            for (const document of validFiles) {
                const originalFile = selectedFiles.find(
                    (file) =>
                        file.name === document.name &&
                        file.size === document.size &&
                        !validFiles.some(
                            (other) =>
                                other.id !== document.id &&
                                other.name === file.name &&
                                other.size === file.size &&
                                other._processed
                        )
                )

                // Each file is matched by its corresponding selection order
                // below, so duplicate filenames are also supported.
                const fileIndex = validFiles.findIndex(
                    (item) => item.id === document.id
                )

                const fileToUpload = selectedFiles.filter(
                    (file) =>
                        (file.type === 'application/pdf' ||
                            file.name.toLowerCase().endsWith('.pdf')) &&
                        file.size > 0 &&
                        file.size <= MAX_FILE_SIZE
                )[fileIndex]

                if (fileToUpload) {
                    await processUpload(fileToUpload, document.id)
                }
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleDrop = (event) => {
        event.preventDefault()
        setIsDragging(false)
        handleFiles(event.dataTransfer.files)
    }

    const removeDocument = (id) => {
        setDocuments((previous) =>
            previous.filter((document) => document.id !== id)
        )
    }

    const formatFileSize = (bytes) => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`
        }

        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    const getStatusStyle = (status) => {
        if (status === 'Indexed successfully') {
            return 'bg-green-50 text-green-700'
        }

        if (status === 'Upload failed') {
            return 'bg-red-50 text-red-700'
        }

        return 'bg-amber-50 text-amber-700'
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
                            className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700"
                        >
                            <FolderOpen size={19} />
                            My Documents
                        </Link>
                    </nav>

                    <div className="mt-auto rounded-2xl bg-indigo-50 p-4">
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600">
                            <BookOpen size={19} />
                        </div>

                        <h3 className="text-sm font-semibold text-slate-800">
                            Learn smarter
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Add your study material to prepare for personalized learning.
                        </p>
                    </div>
                </aside>

                {/* Main content */}
                <main className="min-w-0 flex-1">

                    {/* Header */}
                    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
                        <div>
                            <p className="text-sm text-slate-500">
                                Workspace / Documents
                            </p>

                            <h1 className="mt-1 text-lg font-bold text-slate-900">
                                My Documents
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

                    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">

                        {/* Page introduction */}
                        <div className="mb-8">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                                <FileText size={14} />
                                Your learning resources
                            </div>

                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Build your personal learning library
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                                Upload lecture notes, textbooks, or study material in PDF format.
                                Your documents will be processed and indexed for AI-powered learning.
                            </p>
                        </div>

                        {/* Upload area */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                            <div
                                onDragOver={(event) => {
                                    event.preventDefault()
                                    setIsDragging(true)
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-5 py-12 text-center transition ${
                                    isDragging
                                        ? 'border-indigo-500 bg-indigo-100'
                                        : 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-400 hover:bg-indigo-50'
                                }`}
                            >
                                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                                    <UploadCloud size={32} />
                                </div>

                                <h3 className="text-lg font-semibold text-slate-900">
                                    Upload your study material
                                </h3>

                                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    Drag and drop your PDF files here, or browse your computer to select them.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                                >
                                    <Plus size={18} />
                                    Select PDF files
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    multiple
                                    className="hidden"
                                    onChange={(event) => handleFiles(event.target.files)}
                                />

                                <p className="mt-4 text-xs text-slate-400">
                                    PDF files only · Maximum size: 10 MB per file
                                </p>
                            </div>

                            {error && (
                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <Info size={18} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>

                                    <button
                                        type="button"
                                        onClick={() => setError('')}
                                        className="ml-auto"
                                        aria-label="Dismiss error"
                                    >
                                        <X size={17} />
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Document list */}
                        <section className="mt-9">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Your documents
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {documents.length}{' '}
                                        {documents.length === 1
                                            ? 'file selected'
                                            : 'files selected'}
                                    </p>
                                </div>
                            </div>

                            {documents.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                        <FileUp size={27} />
                                    </div>

                                    <h4 className="mt-4 font-semibold text-slate-800">
                                        No documents added yet
                                    </h4>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Your uploaded PDF files will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map((document) => (
                                        <div
                                            key={document.id}
                                            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                                                    <FileText size={24} />
                                                </div>

                                                <div className="min-w-0">
                                                    <h4 className="truncate text-sm font-semibold text-slate-800">
                                                        {document.name}
                                                    </h4>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {formatFileSize(document.size)} · PDF document
                                                    </p>

                                                    {document.serverDocumentId && (
                                                        <p className="mt-1 break-all text-xs text-slate-400">
                                                            ID: {document.serverDocumentId}
                                                        </p>
                                                    )}

                                                    {document.uploadError && (
                                                        <p className="mt-1 text-xs text-red-600">
                                                            {document.uploadError}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusStyle(document.status)}`}
                                                >
                                                    {document.status === 'Uploading' ? (
                                                        <LoaderCircle size={14} className="animate-spin" />
                                                    ) : document.status === 'Indexed successfully' ? (
                                                        <CheckCircle2 size={14} />
                                                    ) : document.status === 'Upload failed' ? (
                                                        <AlertCircle size={14} />
                                                    ) : (
                                                        <Info size={14} />
                                                    )}

                                                    {document.status}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => removeDocument(document.id)}
                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                    aria-label={`Remove ${document.name} from this list`}
                                                    title="Remove from list"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Next step card */}
                        <section className="mt-9 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
                            <div>
                                <h3 className="text-lg font-bold">
                                    Ready to start learning?
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-indigo-100">
                                    Continue to the AI Tutor and explore your learning workspace.
                                </p>
                            </div>

                            <Link
                                to="/tutor"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                            >
                                Open AI Tutor
                                <ArrowRight size={17} />
                            </Link>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Documents
