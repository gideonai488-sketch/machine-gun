import { useState } from 'react'
import {
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  RefreshCw,
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

  const device = DEVICES.find((d) => d.id === previewMode) || DEVICES[0]
  const isFullWidth = previewMode === 'desktop'

  return (
    <div className="h-full flex flex-col bg-background">
      {/* URL bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-border/50 bg-surface shrink-0">
        <div className="hidden sm:flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5">
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

        <div className="flex-1 flex items-center bg-muted/20 rounded-lg border border-border/30 px-2.5 sm:px-3 h-7">
          <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
            {previewUrl || 'Preview will appear when your app is running'}
          </span>
        </div>

        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 bg-[#09090b] flex items-center justify-center overflow-hidden p-0 sm:p-3">
        {previewUrl ? (
          <div
            className={cn(
              'bg-white overflow-hidden transition-all duration-300',
              isFullWidth
                ? 'w-full h-full'
                : 'rounded-lg shadow-2xl shadow-black/50 border border-border/10',
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
              src={previewUrl}
              className="w-full h-full border-0"
              title="App Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          </div>
        ) : (
          <div className="text-center px-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Monitor className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground/50 font-medium">
              Your app will appear here
            </p>
            <p className="text-xs text-muted-foreground/30 mt-1">
              Start a conversation to build your app
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
