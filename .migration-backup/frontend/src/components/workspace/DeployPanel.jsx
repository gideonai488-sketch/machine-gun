import { useState, useEffect } from 'react'
import {
  Globe,
  Smartphone,
  Apple,
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProject } from '@/stores/project-store'
import { api } from '@/lib/api'
import { socket } from '@/lib/socket'
import { cn } from '@/lib/utils'

const DEPLOY_OPTIONS = [
  {
    id: 'web',
    label: 'Publish Website',
    description: 'Build and deploy to a live URL',
    icon: Globe,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'android',
    label: 'Google Play',
    description: 'Build AAB and publish to Play Store',
    icon: Smartphone,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    id: 'ios',
    label: 'App Store',
    description: 'Build IPA and publish via TestFlight',
    icon: Apple,
    color: 'text-white',
    bg: 'bg-white/10',
  },
]

const ANDROID_TRACKS = [
  { id: 'internal', label: 'Internal Testing' },
  { id: 'alpha', label: 'Closed Testing (Alpha)' },
  { id: 'beta', label: 'Open Testing (Beta)' },
  { id: 'production', label: 'Production' },
]

export default function DeployPanel({ open, onClose }) {
  const { project } = useProject()
  const [deploying, setDeploying] = useState(null)
  const [status, setStatus] = useState(null)
  const [liveUrl, setLiveUrl] = useState(null)
  const [error, setError] = useState(null)
  const [androidTrack, setAndroidTrack] = useState('internal')

  useEffect(() => {
    function handleDone(data) {
      setDeploying(null)
      setStatus('success')
      if (data.url) setLiveUrl(data.url)
    }

    function handleError(data) {
      setDeploying(null)
      setStatus('error')
      setError(data.message)
    }

    function handleDeployStatus(data) {
      if (data.liveUrl) setLiveUrl(data.liveUrl)
    }

    socket.on('deploy:done', handleDone)
    socket.on('deploy:error', handleError)
    socket.on('deploy:status', handleDeployStatus)
    return () => {
      socket.off('deploy:done', handleDone)
      socket.off('deploy:error', handleError)
      socket.off('deploy:status', handleDeployStatus)
    }
  }, [])

  async function handleDeploy(type) {
    if (!project?.id || deploying) return
    setDeploying(type)
    setStatus(null)
    setLiveUrl(null)
    setError(null)

    try {
      if (type === 'web') {
        await api.deployWeb(project.id)
      } else {
        const track = type === 'android' ? androidTrack : 'testflight'
        await api.deployMobile(project.id, type, track)
      }
    } catch (err) {
      setDeploying(null)
      setStatus('error')
      setError(err.message)
    }
  }

  function reset() {
    setDeploying(null)
    setStatus(null)
    setLiveUrl(null)
    setError(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl w-full max-w-md mx-0 sm:mx-4 shadow-2xl shadow-slate-300/50 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Deploy</h2>
              <p className="text-[11px] text-muted-foreground">Publish your app to the world</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {status === 'success' && liveUrl ? (
          <div className="px-5 pb-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm text-slate-900 mb-1">Deployed!</h3>
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
              >
                {liveUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Button onClick={reset} variant="outline" className="w-full mt-3 h-9 text-xs">
              Deploy Again
            </Button>
          </div>
        ) : status === 'success' ? (
          <div className="px-5 pb-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm text-slate-900 mb-1">Build Complete!</h3>
              <p className="text-xs text-slate-500">Your app has been built and published.</p>
            </div>
            <Button onClick={reset} variant="outline" className="w-full mt-3 h-9 text-xs">
              Done
            </Button>
          </div>
        ) : status === 'error' ? (
          <div className="px-5 pb-5">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm text-slate-900 mb-1">Deploy Failed</h3>
              <p className="text-xs text-slate-500">{error || 'Something went wrong'}</p>
            </div>
            <Button onClick={reset} variant="outline" className="w-full mt-3 h-9 text-xs">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-2">
            {DEPLOY_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isDeploying = deploying === opt.id
              const isDisabled = deploying && !isDeploying

              return (
                <div key={opt.id}>
                  <button
                    onClick={() => handleDeploy(opt.id)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-[0.98]',
                      isDeploying
                        ? 'bg-red-50/50 border-red-200'
                        : 'hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm',
                      isDisabled && 'opacity-40 pointer-events-none'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', opt.bg)}>
                      {isDeploying ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <Icon className={cn('w-5 h-5', opt.color)} />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                    </div>
                    {isDeploying && (
                      <span className="text-[10px] text-red-500 font-medium shrink-0">Deploying...</span>
                    )}
                  </button>

                  {opt.id === 'android' && !deploying && (
                    <div className="flex gap-1 mt-1.5 ml-14">
                      {ANDROID_TRACKS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setAndroidTrack(t.id)}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] transition-all cursor-pointer',
                            androidTrack === t.id
                              ? 'bg-red-50 text-red-600 font-medium'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
