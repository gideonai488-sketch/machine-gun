import { useState } from 'react'
import { Monitor, Smartphone, ExternalLink, RefreshCw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProject } from '@/stores/project-store'
import { cn } from '@/lib/utils'

export default function PreviewPanel() {
  const { project, previewMode, setPreviewMode } = useProject()
  const [refreshKey, setRefreshKey] = useState(0)

  const previewUrl = project?.previewUrl || null

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreviewMode('web')}
            className={cn(
              'p-1.5 rounded transition-colors cursor-pointer',
              previewMode === 'web' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={cn(
              'p-1.5 rounded transition-colors cursor-pointer',
              previewMode === 'mobile' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 ml-1">
            <Upload className="w-3 h-3" />
            Publish
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-black/20 flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          <div
            className={cn(
              'bg-white transition-all duration-300 rounded-lg overflow-hidden shadow-2xl',
              previewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full'
            )}
          >
            <iframe
              key={refreshKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : (
          <div className="text-center">
            <Monitor className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Preview will appear here when the app is running
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
