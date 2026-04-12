import { motion } from 'framer-motion'
import { ArrowRight, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/stores/auth-store'
import FalconIcon from '@/components/icons/FalconIcon'

export default function LandingPage() {
  const { loginWithGithub } = useAuth()

  return (
    <div className="min-h-screen h-screen-safe bg-white flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-red-500/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-rose-400/[0.03] rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <FalconIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Machine Gun</span>
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={loginWithGithub}>
          <GitBranch className="w-3.5 h-3.5" />
          Sign in with GitHub
        </Button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8 sm:pb-16 -mt-6 sm:-mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12 max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/25"
          >
            <FalconIcon className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
          </motion.div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-3 sm:mb-4 text-slate-900">
            Build apps at
            <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">
              machine gun speed
            </span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-lg max-w-sm sm:max-w-lg mx-auto leading-relaxed">
            Describe your idea. Our AI builds it, previews it live, and deploys it — all from your browser or phone.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <Button size="lg" className="rounded-xl px-8 gap-2 h-12 text-base shadow-lg shadow-red-500/25" onClick={loginWithGithub}>
            <GitBranch className="w-4 h-4" />
            Get Started with GitHub
          </Button>
          <p className="text-xs text-slate-400">Free to start. No credit card required.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full"
        >
          {[
            { title: 'Describe it', desc: 'Tell AI what you want in plain English' },
            { title: 'Watch it build', desc: 'See code generated and app preview live' },
            { title: 'Deploy instantly', desc: 'Publish to web, Google Play, or App Store' },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition-all text-center"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-2.5 text-red-500 font-bold text-sm">
                {i + 1}
              </div>
              <h3 className="font-semibold text-sm text-slate-900 mb-1">{step.title}</h3>
              <p className="text-xs text-slate-500">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
