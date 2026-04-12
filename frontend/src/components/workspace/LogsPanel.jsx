import { useEffect } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useProject } from '@/stores/project-store'
import { socket } from '@/lib/socket'

export default function LogsPanel() {
  const { buildLogs, addBuildLog, clearBuildLogs } = useProject()

  useEffect(() => {
    function handleLog(data) {
      addBuildLog(data)
    }

    socket.on('build:log', handleLog)
    return () => socket.off('build:log', handleLog)
  }, [addBuildLog])

  return (
    <div className="h-full flex flex-col">
      {buildLogs.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
          <span className="text-xs text-muted-foreground">Build Output</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={clearBuildLogs}
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1">
        {buildLogs.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Build logs will appear here on errors
            </p>
          </div>
        ) : (
          <pre className="p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
            {buildLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.level === 'error'
                    ? 'text-destructive'
                    : log.level === 'warning'
                    ? 'text-warning'
                    : ''
                }
              >
                {log.message}
              </div>
            ))}
          </pre>
        )}
      </ScrollArea>
    </div>
  )
}
