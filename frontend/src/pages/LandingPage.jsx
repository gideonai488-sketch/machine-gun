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
  { id: 'react-vite', label: 'React + Vite', icon: Globe },
  { id: 'react-native', label: 'React Native', icon: Layers },
]

const EXAMPLES = [
  'A todo app with categories, due dates, and dark mode',
  'A weather dashboard that shows 5-day forecast with charts',
  'A personal finance tracker with expense categories',
  'A recipe app with search, favorites, and meal planning',
  'A habit tracker with streaks and weekly stats',
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
      const project = await api.createProject({
        prompt: prompt.trim(),
        framework,
      })
      navigate(`/project/${project.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/[0.07] rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">DevFlow</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20 -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 max-w-2xl"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-4">
            What do you want
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              to build?
            </span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            Describe your app and DevFlow will build it for you — code, preview, and deploy, all in one place.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-3 shadow-2xl shadow-black/30">
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
              rows={3}
              className="w-full bg-transparent resize-none px-3 py-2 text-sm sm:text-base placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
              autoFocus
            />

            <div className="flex items-center justify-between pt-1 px-1">
              <div className="flex items-center gap-1.5">
                {FRAMEWORKS.map((fw) => {
                  const Icon = fw.icon
                  return (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => setFramework(fw.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
                className="rounded-xl px-5 gap-2 h-8"
              >
                {isCreating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </motion.div>
                    Creating...
                  </>
                ) : (
                  <>
                    Build
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
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 max-w-2xl w-full"
        >
          <div className="flex flex-wrap justify-center gap-2">
            <AnimatePresence>
              {EXAMPLES.map((example, i) => (
                <motion.button
                  key={example}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                  onClick={() => setPrompt(example)}
                  className="px-3 py-1.5 rounded-full bg-card/60 border border-border/40 text-muted-foreground text-xs hover:text-foreground hover:bg-card hover:border-border transition-all cursor-pointer"
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
