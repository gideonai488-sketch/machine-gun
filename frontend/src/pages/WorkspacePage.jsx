import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  Eye,
  Code2,
  Share2,
  Rocket,
  Loader2,
  MessageSquare,
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
  initializing: { label: 'Setting up...', variant: 'warning', loading: true },
  building: { label: 'Building...', variant: 'warning', loading: true },
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

  const [mobileTab, setMobileTab] = useState('chat')

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
    <div className="h-screen h-screen-safe flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <header className="h-11 sm:h-12 border-b border-border/50 bg-surface flex items-center justify-between px-3 sm:px-4 shrink-0 safe-area-inset-top">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </div>
            <span className="font-semibold text-xs sm:text-sm hidden sm:block">DevFlow</span>
          </div>

          <div className="h-3.5 w-px bg-border/40 hidden sm:block" />

          <span className="text-[11px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[250px]">
            {project?.name || 'Loading...'}
          </span>

          <Badge variant={status.variant} className="text-[9px] sm:text-[10px] h-4 sm:h-5 px-1.5 sm:px-2 shrink-0">
            {status.loading && <Loader2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5 sm:mr-1 animate-spin" />}
            {status.label}
          </Badge>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 text-[11px] sm:text-xs gap-1 text-muted-foreground px-2 sm:px-3 hidden sm:flex">
            <Share2 className="w-3 h-3" />
            Share
          </Button>
          <Button size="sm" className="h-7 text-[11px] sm:text-xs gap-1 px-2.5 sm:px-3">
            <Rocket className="w-3 h-3" />
            <span className="hidden sm:inline">Deploy</span>
          </Button>
        </div>
      </header>

      {/* Desktop layout: Chat | Preview/Code side by side */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-[380px] lg:w-[420px] min-w-[320px] border-r border-border/50 flex flex-col shrink-0">
          <ChatPanel />
        </div>

        {/* Right: Preview or Code */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center border-b border-border/50 bg-surface px-1 shrink-0">
            {[
              { id: 'preview', label: 'Preview', icon: Eye },
              { id: 'code', label: 'Code', icon: Code2 },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setRightPanel(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer relative',
                    rightPanel === tab.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {rightPanel === tab.id && (
                    <motion.div
                      layoutId="desktop-tab"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full"
                    />
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'preview' ? <PreviewPanel /> : <CodeEditor />}
          </div>
        </div>
      </div>

      {/* Mobile layout: Single panel with bottom tabs */}
      <div className="flex-1 flex flex-col md:hidden overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'chat' && <ChatPanel />}
          {mobileTab === 'preview' && <PreviewPanel />}
          {mobileTab === 'code' && <CodeEditor />}
        </div>

        {/* Mobile bottom tab bar */}
        <nav className="border-t border-border/50 bg-surface flex items-center shrink-0 safe-area-inset-bottom">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'code', label: 'Code', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon
            const active = mobileTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors cursor-pointer active:scale-95',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
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
