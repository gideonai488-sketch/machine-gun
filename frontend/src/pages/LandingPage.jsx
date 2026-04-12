import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  Smartphone,
  Globe,
  Layers,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const FRAMEWORKS = [
  { id: 'flutter', label: 'Flutter', icon: Smartphone },
  { id: 'react-vite', label: 'React', icon: Globe },
  { id: 'react-native', label: 'React Native', icon: Layers },
]

const EXAMPLES = [
  'A todo app with categories and dark mode',
  'A weather dashboard with 5-day forecast',
  'A personal finance tracker',
  'A recipe app with search and favorites',
  'A habit tracker with streaks',
  'A markdown blog with syntax highlighting',
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [framework, setFramework] = useState('react-vite')
  const [isCreating, setIsCreating] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!prompt.trim() || isCreating) return
    setIsCreating(true)
    try {
      const project = await api.createProject({ prompt: prompt.trim(), framework })
      navigate(`/project/${project.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen h-screen-safe bg-background flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-accent/[0.04] rounded-full blur-[100px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight">DevFlow</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8 sm:pb-16 -mt-6 sm:-mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-10 max-w-2xl"
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-3 sm:mb-4">
            What do you want
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              to build?
            </span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-sm sm:max-w-md mx-auto leading-relaxed">
            Describe your app and DevFlow builds it — code, preview, deploy.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-xl"
        >
          <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black/40">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Describe the app you want to build..."
              rows={2}
              className="w-full bg-transparent resize-none px-2.5 sm:px-3 py-2 text-sm sm:text-base placeholder:text-muted-foreground/50 focus:outline-none leading-relaxed"
              autoFocus
            />

            <div className="flex items-center justify-between pt-1 px-0.5 sm:px-1 gap-2">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {FRAMEWORKS.map((fw) => {
                  const Icon = fw.icon
                  return (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => setFramework(fw.id)}
                      className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        framework === fw.id
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {fw.label}
                    </button>
                  )
                })}
              </div>

              <Button
                type="submit"
                disabled={!prompt.trim() || isCreating}
                size="sm"
                className="rounded-xl px-4 sm:px-5 gap-1.5 h-8 shrink-0 text-xs sm:text-sm"
              >
                {isCreating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="hidden sm:inline">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Build</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-5 sm:mt-8 max-w-xl w-full"
        >
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            <AnimatePresence>
              {EXAMPLES.map((example, i) => (
                <motion.button
                  key={example}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  onClick={() => setPrompt(example)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-full bg-card/60 border border-border/40 text-muted-foreground text-[11px] sm:text-xs hover:text-foreground hover:bg-card hover:border-border/60 transition-all cursor-pointer active:scale-95"
                >
                  {example}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
