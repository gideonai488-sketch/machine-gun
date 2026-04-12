import { useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  FileCode,
  Terminal,
  Wrench,
  Rocket,
  AlertTriangle,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProject } from '@/stores/project-store'
import { socket } from '@/lib/socket'
import { cn } from '@/lib/utils'

const ACTIVITY_ICONS = {
  file_write: FileCode,
  file_read: FileCode,
  command: Terminal,
  install: Package,
  build: Rocket,
  fix: Wrench,
  error: AlertTriangle,
}

function ActivityItem({ activity }) {
  const Icon = ACTIVITY_ICONS[activity.type] || Terminal
  const isLoading = activity.status === 'running'
  const isSuccess = activity.status === 'success'
  const isError = activity.status === 'error'

  return (
    <div className="flex items-start gap-3 py-2 px-3">
      <div className={cn(
        'w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5',
        isError ? 'bg-destructive/20' : isSuccess ? 'bg-success/20' : 'bg-muted'
      )}>
        {isLoading ? (
          <Loader2 className="w-3 h-3 text-primary animate-spin" />
        ) : isError ? (
          <XCircle className="w-3 h-3 text-destructive" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-3 h-3 text-success" />
        ) : (
          <Icon className="w-3 h-3 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-tight">
          {activity.message}
          {isSuccess && <span className="text-success ml-1.5">✓</span>}
        </p>
        {activity.detail && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {activity.detail}
          </p>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
        {activity.time}
      </span>
    </div>
  )
}

export default function ActivityPanel() {
  const { activities, addActivity, updateActivity } = useProject()

  useEffect(() => {
    function handleActivity(data) {
      if (data.update) {
        updateActivity(data)
      } else {
        addActivity(data)
      }
    }

    socket.on('activity', handleActivity)
    return () => socket.off('activity', handleActivity)
  }, [addActivity, updateActivity])

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Terminal className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Agent activity will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {activities.map((activity, i) => (
              <ActivityItem key={activity.id || i} activity={activity} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
