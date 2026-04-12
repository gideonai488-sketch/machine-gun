import { useState } from 'react'
import {
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'
import { useProject } from '@/stores/project-store'
import { cn } from '@/lib/utils'

const DEVICES = [
  { id: 'desktop', icon: Monitor, width: '100%', height: '100%', label: 'Desktop' },
  { id: 'tablet', icon: Tablet, width: '768px', height: '1024px', label: 'Tablet' },
  { id: 'mobile', icon: Smartphone, width: '375px', height: '812px', label: 'Mobile' },
]

export default function PreviewPanel() {
  const { previewUrl, previewMode, setPreviewMode } = useProject()
  const [refreshKey, setRefreshKey] = useState(0)
  const [url, setUrl] = useState('')

  const device = DEVICES.find((d) => d.id === previewMode) || DEVICES[0]
  const isFullWidth = previewMode === 'desktop'

  const displayUrl = previewUrl || url

  return (
    <div className="h-full flex flex-col bg-background">
      {/* URL bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-card/50 shrink-0">
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          {DEVICES.map((d) => {
            const Icon = d.icon
            return (
              <button
                key={d.id}
                onClick={() => setPreviewMode(d.id)}
                title={d.label}
                className={cn(
                  'p-1.5 rounded-md transition-all cursor-pointer',
                  previewMode === d.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            )
          })}
        </div>

        <div className="flex-1 flex items-center bg-muted/30 rounded-lg border border-border/40 px-3 h-7">
          <span className="text-xs text-muted-foreground truncate">
            {displayUrl || 'Preview will appear when your app is running'}
          </span>
        </div>

        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {displayUrl && (
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 bg-[#1a1a2e] flex items-center justify-center overflow-hidden p-4">
        {displayUrl ? (
          <div
            className={cn(
              'bg-white rounded-lg overflow-hidden shadow-2xl shadow-black/40 transition-all duration-300',
              !isFullWidth && 'border border-border/20'
            )}
            style={{
              width: isFullWidth ? '100%' : device.width,
              height: isFullWidth ? '100%' : device.height,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            <iframe
              key={refreshKey}
              src={displayUrl}
              className="w-full h-full border-0"
              title="App Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground/60 font-medium">
              Your app preview will appear here
            </p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              Start a conversation to build your app
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
