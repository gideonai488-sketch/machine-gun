import { Zap, Menu, Play, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProject } from '@/stores/project-store'

const STATUS_CONFIG = {
  idle: { label: 'Idle', variant: 'secondary' },
  building: { label: 'Building...', variant: 'warning' },
  success: { label: 'Success', variant: 'success' },
  error: { label: 'Error', variant: 'destructive' },
}

export default function TopBar() {
  const { project, buildStatus, toggleSidebar } = useProject()
  const status = STATUS_CONFIG[buildStatus] || STATUS_CONFIG.idle

  return (
    <header className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-3 shrink-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden w-8 h-8"
        >
          <Menu className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-sm hidden sm:block">DevFlow</span>
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {project?.name || 'Untitled Project'}
        </span>

        <Badge variant={status.variant} className="text-[10px] px-2 py-0">
          {status.label}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 h-7 text-xs">
          <Play className="w-3 h-3" />
          Build
        </Button>
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
