import { Link } from 'react-router-dom'
import { ArrowLeft, Key, Smartphone, Apple, CheckCircle2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth, getUserMeta } from '@/stores/auth-store'
import FalconIcon from '@/components/icons/FalconIcon'

const CONNECTIONS = [
  { id: 'anthropic', label: 'Anthropic API', desc: 'Claude AI for code generation', icon: Key, connected: true },
  { id: 'e2b', label: 'E2B Sandbox', desc: 'Cloud compute for running code', icon: Key, connected: true },
  { id: 'codemagic', label: 'Codemagic', desc: 'Mobile builds and store publishing', icon: Smartphone, connected: false },
  { id: 'apple', label: 'Apple Developer', desc: 'App Store Connect publishing', icon: Apple, connected: false },
  { id: 'google', label: 'Google Play', desc: 'Play Console publishing', icon: Smartphone, connected: false },
]

export default function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center gap-3">
          <Link to="/dashboard" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <FalconIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-slate-900">Settings</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Profile</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg">
              {getUserMeta(user).name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{getUserMeta(user).name || 'User'}</p>
              <p className="text-sm text-slate-500 truncate">{user?.email || 'No email'}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Connections</h2>
          <div className="space-y-2">
            {CONNECTIONS.map((conn) => {
              const Icon = conn.icon
              return (
                <div key={conn.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{conn.label}</p>
                    <p className="text-xs text-slate-500">{conn.desc}</p>
                  </div>
                  {conn.connected ? (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Connect
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Account</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-red-500 border-red-200 hover:bg-red-50 gap-1.5"
              onClick={signOut}
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
