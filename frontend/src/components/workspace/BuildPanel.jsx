import { useState } from 'react'
import {
  Smartphone,
  Apple,
  Globe,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProject } from '@/stores/project-store'
import { api } from '@/lib/api'

const PLATFORMS = [
  {
    id: 'android',
    label: 'Android',
    icon: Smartphone,
    description: 'Build AAB for Google Play',
    buildLabel: 'Build AAB',
  },
  {
    id: 'ios',
    label: 'iOS',
    icon: Apple,
    description: 'Build IPA for App Store',
    buildLabel: 'Build IPA',
  },
  {
    id: 'web',
    label: 'Web',
    icon: Globe,
    description: 'Build for web deployment',
    buildLabel: 'Build Web',
  },
]

const TRACKS = [
  { id: 'internal', label: 'Internal Testing' },
  { id: 'alpha', label: 'Alpha' },
  { id: 'beta', label: 'Beta' },
  { id: 'production', label: 'Production' },
]

export default function BuildPanel() {
  const { project, buildStatus } = useProject()
  const [buildingPlatform, setBuildingPlatform] = useState(null)

  async function handleBuild(platform) {
    if (!project?.id || buildingPlatform) return
    setBuildingPlatform(platform)
    try {
      await api.triggerBuild(project.id, platform)
    } catch (err) {
      console.error('Build failed:', err)
    } finally {
      setBuildingPlatform(null)
    }
  }

  async function handlePublish(platform, track) {
    if (!project?.id) return
    try {
      await api.publishApp(project.id, platform, track)
    } catch (err) {
      console.error('Publish failed:', err)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Build Targets
          </h3>
          <div className="space-y-2">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon
              const isBuilding = buildingPlatform === platform.id
              return (
                <div
                  key={platform.id}
                  className="p-3 rounded-lg border border-border bg-background/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{platform.label}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{platform.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs gap-1.5"
                    onClick={() => handleBuild(platform.id)}
                    disabled={isBuilding}
                  >
                    {isBuilding ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Building...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        {platform.buildLabel}
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Publish
          </h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border border-border bg-background/50">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Google Play</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {TRACKS.map((track) => (
                  <Button
                    key={track.id}
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs justify-start"
                    onClick={() => handlePublish('android', track.id)}
                  >
                    <Upload className="w-3 h-3 mr-1.5" />
                    {track.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background/50">
              <div className="flex items-center gap-2 mb-2">
                <Apple className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">App Store</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs justify-start"
                  onClick={() => handlePublish('ios', 'testflight')}
                >
                  <Upload className="w-3 h-3 mr-1.5" />
                  TestFlight
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs justify-start"
                  onClick={() => handlePublish('ios', 'appstore')}
                >
                  <Upload className="w-3 h-3 mr-1.5" />
                  App Store
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
