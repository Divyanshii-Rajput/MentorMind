import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrainCircuit, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { loginAccount } from '../services/authService'

function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsLoading(true)
    try {
      const result = await loginAccount({ email: email.trim().toLowerCase(), password })
      sessionStorage.setItem('mentormind_access_token', result.access_token)
      sessionStorage.setItem('mentormind_user', JSON.stringify(result.user))
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Unable to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white"><BrainCircuit size={25} /></div>
          <span className="text-2xl font-bold text-slate-900">Mentor<span className="text-indigo-600">Mind</span></span>
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-indigo-100 sm:p-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back!</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to continue your personalized learning journey.</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required autoComplete="current-password" className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-indigo-600">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
            </button>
            {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm leading-6 text-red-700">{message}</p>}
          </form>
          <p className="mt-7 text-center text-sm text-slate-600">Don't have an account? <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Create an account</Link></p>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500"><Link to="/" className="hover:text-indigo-600">← Back to home</Link></p>
      </div>
    </div>
  )
}
export default Login
