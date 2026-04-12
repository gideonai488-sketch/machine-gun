import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  Eye,
  Code2,
  Share2,
  Rocket,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProject, ProjectProvider } from '@/stores/project-store'
import { connectSocket, disconnectSocket, socket } from '@/lib/socket'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

import ChatPanel from '@/components/workspace/ChatPanel'
import PreviewPanel from '@/components/workspace/PreviewPanel'
import CodeEditor from '@/components/workspace/CodeEditor'

const STATUS_CONFIG = {
  idle: { label: 'Ready', variant: 'secondary' },
  initializing: { label: 'Setting up...', variant: 'warning' },
  building: { label: 'Building...', variant: 'warning' },
  success: { label: 'Live', variant: 'success' },
  error: { label: 'Error', variant: 'destructive' },
  ready: { label: 'Live', variant: 'success' },
}

function WorkspaceContent() {
  const { projectId } = useParams()
  const {
    project,
    setProject,
    setPreviewUrl,
    rightPanel,
    setRightPanel,
    buildStatus,
    setBuildStatus,
    setFiles,
    setFileContent,
  } = useProject()

  const status = STATUS_CONFIG[project?.status || buildStatus] || STATUS_CONFIG.idle

  useEffect(() => {
    async function init() {
      try {
        const proj = await api.getProject(projectId)
        setProject(proj)
        connectSocket(projectId)
      } catch (err) {
        console.error('Failed to load project:', err)
      }
    }
    init()
    return () => disconnectSocket()
  }, [projectId, setProject])

  useEffect(() => {
    function handleProjectUpdated(data) {
      if (data.previewUrl) setPreviewUrl(data.previewUrl)
      if (data.status) setBuildStatus(data.status)
    }
    function handleFilesUpdated(data) {
      setFiles(data.files)
    }
    function handleFileChanged(data) {
      setFileContent(data.path, data.content)
    }

    socket.on('project:updated', handleProjectUpdated)
    socket.on('files:updated', handleFilesUpdated)
    socket.on('file:changed', handleFileChanged)
    socket.on('build:status', (data) => setBuildStatus(data.status))

    return () => {
      socket.off('project:updated', handleProjectUpdated)
      socket.off('files:updated', handleFilesUpdated)
      socket.off('file:changed', handleFileChanged)
      socket.off('build:status')
    }
  }, [setPreviewUrl, setBuildStatus, setFiles, setFileContent])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top bar — minimal */}
      <header className="h-11 border-b border-border/60 bg-card/60 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">DevFlow</span>
          </div>

          <div className="h-4 w-px bg-border/50" />

          <span className="text-xs text-muted-foreground truncate max-w-[250px]">
            {project?.name || 'Loading...'}
          </span>

          <Badge variant={status.variant} className="text-[10px] h-5 px-2">
            {status.label === 'Setting up...' && (
              <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
            )}
            {status.label}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground">
            <Share2 className="w-3 h-3" />
            Share
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1.5">
            <Rocket className="w-3 h-3" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Main layout: Chat | Preview/Code */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-[420px] min-w-[320px] max-w-[500px] border-r border-border/60 flex flex-col shrink-0">
          <ChatPanel />
        </div>

        {/* Right: Preview or Code */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center border-b border-border/60 bg-card/30 px-2 shrink-0">
            <button
              onClick={() => setRightPanel('preview')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer relative',
                rightPanel === 'preview'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
              {rightPanel === 'preview' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
            <button
              onClick={() => setRightPanel('code')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer relative',
                rightPanel === 'code'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code
              {rightPanel === 'code' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'preview' ? <PreviewPanel /> : <CodeEditor />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <ProjectProvider>
      <WorkspaceContent />
    </ProjectProvider>
  )
}
