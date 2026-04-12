import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  Smartphone,
  Globe,
  Layers,
  GitBranch,
  Zap,
  Code2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const FRAMEWORKS = [
  { id: 'flutter', label: 'Flutter', icon: Smartphone, color: '#02569B' },
  { id: 'react-vite', label: 'React + Vite', icon: Globe, color: '#61DAFB' },
  { id: 'react-native', label: 'React Native', icon: Layers, color: '#61DAFB' },
]

const EXAMPLE_PROMPTS = [
  'Build a todo app with Flutter and Firebase',
  'Create a weather dashboard with React and OpenWeather API',
  'Make a social media feed app with React Native',
  'Build a habit tracker with Flutter and local storage',
  'Create an e-commerce storefront with React + Vite',
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

  function handleExampleClick(example) {
    setPrompt(example)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold">DevFlow</span>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <GitBranch className="w-4 h-4" />
          Sign in with GitHub
        </Button>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-16 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Cloud IDE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Describe it. Build it.{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ship it.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Tell DevFlow what you want to build. Our AI writes the code, runs it in the cloud,
            and publishes to app stores — all from your browser.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full"
        >
          <div className="relative bg-card border border-border rounded-xl p-4 shadow-lg shadow-primary/5">
            <div className="flex gap-2 mb-3">
              {FRAMEWORKS.map((fw) => {
                const Icon = fw.icon
                return (
                  <button
                    key={fw.id}
                    type="button"
                    onClick={() => setFramework(fw.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      framework === fw.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {fw.label}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What do you want to build?"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={!prompt.trim() || isCreating}
                className="px-6 gap-2"
              >
                {isCreating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <>
                    Build
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 w-full"
        >
          <p className="text-xs text-muted-foreground mb-3 text-center">Try an example</p>
          <div className="flex flex-wrap justify-center gap-2">
            <AnimatePresence>
              {EXAMPLE_PROMPTS.map((example, i) => (
                <motion.button
                  key={example}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground text-xs hover:bg-muted hover:text-foreground transition-colors border border-transparent hover:border-border cursor-pointer"
                >
                  {example}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 w-full"
        >
          {[
            { icon: Code2, title: 'AI Writes Code', desc: 'Claude builds your app from a natural language description' },
            { icon: Globe, title: 'Cloud Sandbox', desc: 'Code runs in isolated cloud containers — no local setup needed' },
            { icon: Smartphone, title: 'Ship to Stores', desc: 'Build and publish to Google Play & App Store in one click' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors"
            >
              <feature.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
