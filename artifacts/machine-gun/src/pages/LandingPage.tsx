import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/stores/auth-store'
import FalconIcon from '@/components/icons/FalconIcon'

export default function LandingPage() {
  const navigate = useNavigate()
  const { signUp, signIn } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password || loading) return
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp(email, password, name)
        setCheckEmail(true)
      } else {
        await signIn(email, password)
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen h-screen-safe bg-white flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-red-500/[0.04] rounded-full blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <FalconIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Machine Gun</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-8"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-red-500/25"
          >
            <FalconIcon className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
          </motion.div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Build apps at{' '}
            <span className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
              machine gun speed
            </span>
          </h1>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Describe your idea. AI builds it, previews it live, and deploys it.
          </p>
        </motion.div>

        {checkEmail ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center"
          >
            <Mail className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Check your email</h3>
            <p className="text-sm text-slate-500">We sent a confirmation link to <strong>{email}</strong></p>
            <button
              onClick={() => { setCheckEmail(false); setMode('signin') }}
              className="mt-4 text-sm text-red-500 font-medium cursor-pointer hover:underline"
            >
              Back to sign in
            </button>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-sm"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-slate-200/50 space-y-3">
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 text-slate-800 placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-500 px-1">{error}</p>
              )}

              <Button type="submit" disabled={loading} className="w-full h-10 rounded-xl gap-2 bg-red-500 hover:bg-red-600 text-white border-0">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'signup' ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-slate-500 pt-1">
                {mode === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setMode('signup'); setError('') }} className="text-red-500 font-medium cursor-pointer hover:underline">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setMode('signin'); setError('') }} className="text-red-500 font-medium cursor-pointer hover:underline">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.form>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg sm:max-w-2xl w-full"
        >
          {[
            { title: 'Describe it', desc: 'Tell AI what you want in plain English' },
            { title: 'Watch it build', desc: 'See code generated and app preview live' },
            { title: 'Deploy instantly', desc: 'Publish to web, Play Store, or App Store' },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition-all text-center"
            >
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-2 text-red-500 font-bold text-xs">
                {i + 1}
              </div>
              <h3 className="font-semibold text-sm text-slate-900 mb-0.5">{step.title}</h3>
              <p className="text-[11px] text-slate-500">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
