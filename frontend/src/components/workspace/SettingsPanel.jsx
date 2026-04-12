import {
  GitBranch,
  Key,
  Apple,
  Smartphone,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const CONNECTIONS = [
  {
    id: 'github',
    label: 'GitHub',
    icon: GitBranch,
    description: 'Repository access and OAuth',
    connected: false,
  },
  {
    id: 'anthropic',
    label: 'Anthropic API',
    icon: Key,
    description: 'Claude AI for code generation',
    connected: false,
  },
  {
    id: 'apple',
    label: 'Apple Developer',
    icon: Apple,
    description: 'App Store Connect & signing',
    connected: false,
  },
  {
    id: 'google-play',
    label: 'Google Play',
    icon: Smartphone,
    description: 'Play Console publishing',
    connected: false,
  },
]

export default function SettingsPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Connections
          </h3>
          <div className="space-y-2">
            {CONNECTIONS.map((conn) => {
              const Icon = conn.icon
              return (
                <div
                  key={conn.id}
                  className="p-3 rounded-lg border border-border bg-background/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{conn.label}</p>
                      <p className="text-xs text-muted-foreground">{conn.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conn.connected ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                        Connect
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
