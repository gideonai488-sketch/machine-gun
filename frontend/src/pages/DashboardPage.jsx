import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Smartphone,
  Globe,
  Layers,
  ArrowRight,
  Clock,
  Settings,
  LogOut,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/stores/auth-store'
import { api } from '@/lib/api'
import FalconIcon from '@/components/icons/FalconIcon'
import { cn } from '@/lib/utils'

const FRAMEWORKS = [
  { id: 'flutter', label: 'Flutter', icon: Smartphone },
  { id: 'react-vite', label: 'React', icon: Globe },
  { id: 'react-native', label: 'React Native', icon: Layers },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [projects, setProjects] = useState([])
  const [prompt, setPrompt] = useState('')
  const [framework, setFramework] = useState('react-vite')
  const [isCreating, setIsCreating] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    api.listProjects().then(setProjects).catch(console.error)
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!prompt.trim() || isCreating) return
    setIsCreating(true)
    try {
      const project = await api.createProject({ prompt: prompt.trim(), framework })
      navigate(`/project/${project.id}`)
    } catch (err) {
      console.error('Failed:', err)
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <FalconIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900">Machine Gun</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
            >
              {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-20 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 w-48 py-1">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.user_metadata?.name || user?.email}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </Link>
                  <button
                    onClick={() => { signOut(); setShowMenu(false) }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
            What do you want to build?
          </h1>
          <p className="text-sm text-slate-500 mb-5">Describe your app and Machine Gun builds it for you.</p>

          <form onSubmit={handleCreate} className="mb-8 sm:mb-12">
            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-sm">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreate(e) }
                }}
                placeholder="A habit tracker with streaks and weekly stats..."
                rows={2}
                className="w-full bg-transparent resize-none px-2.5 sm:px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none leading-relaxed text-slate-800"
                autoFocus
              />
              <div className="flex items-center justify-between pt-1 px-0.5 gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {FRAMEWORKS.map((fw) => {
                    const Icon = fw.icon
                    return (
                      <button
                        key={fw.id}
                        type="button"
                        onClick={() => setFramework(fw.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                          framework === fw.id
                            ? 'bg-red-50 text-red-600'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {fw.label}
                      </button>
                    )
                  })}
                </div>
                <Button type="submit" disabled={!prompt.trim() || isCreating} size="sm" className="rounded-xl px-4 gap-1.5 h-8 shrink-0">
                  {isCreating ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Create</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Recent Projects</h2>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <FolderOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-1">No projects yet</p>
              <p className="text-xs text-slate-400">Create your first project above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((project, i) => (
                <motion.button
                  key={project.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <FalconIcon className="w-4 h-4 text-red-500" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
                  </div>
                  <h3 className="font-medium text-sm text-slate-900 mb-1 line-clamp-2">{project.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{project.framework}</span>
                    <span className="text-[10px] text-slate-400">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
