import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrainCircuit, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { registerAccount } from '../services/authService'

function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    if (formData.password.length < 8) {
      setMessage('Password must contain at least 8 characters.')
      return
    }
    if (new TextEncoder().encode(formData.password).length > 72) {
      setMessage('Password must be no longer than 72 UTF-8 bytes.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match. Please try again.')
      return
    }
    setIsLoading(true)
    try {
      const result = await registerAccount({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })
      sessionStorage.setItem('mentormind_access_token', result.access_token)
      sessionStorage.setItem('mentormind_user', JSON.stringify(result.user))
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Unable to create your account. Please try again.')
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
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Start your personalized learning journey with MentorMind.</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
              <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required minLength={2} maxLength={100} autoComplete="name" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required autoComplete="email" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Create a password (minimum 8 characters)" required minLength={8} maxLength={72} autoComplete="new-password" className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-indigo-600">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</label>
              <div className="relative">
                <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" required autoComplete="new-password" className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-indigo-600">{showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? 'Creating account...' : 'Create Account'} <ArrowRight size={18} /></button>
            {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm leading-6 text-red-700">{message}</p>}
          </form>
          <p className="mt-7 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link></p>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500"><Link to="/" className="hover:text-indigo-600">← Back to home</Link></p>
      </div>
    </div>
  )
}
export default Register
