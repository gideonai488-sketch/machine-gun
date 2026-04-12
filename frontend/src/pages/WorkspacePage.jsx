import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderTree,
  Hammer,
  Settings,
  Code2,
  MessageSquare,
  Eye,
  Activity,
  FileWarning,
  PanelBottomClose,
  PanelBottomOpen,
} from 'lucide-react'
import { useProject, ProjectProvider } from '@/stores/project-store'
import { connectSocket, disconnectSocket, socket } from '@/lib/socket'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

import TopBar from '@/components/workspace/TopBar'
import FileTree from '@/components/workspace/FileTree'
import BuildPanel from '@/components/workspace/BuildPanel'
import SettingsPanel from '@/components/workspace/SettingsPanel'
import CodeEditor from '@/components/workspace/CodeEditor'
import ChatPanel from '@/components/workspace/ChatPanel'
import PreviewPanel from '@/components/workspace/PreviewPanel'
import ActivityPanel from '@/components/workspace/ActivityPanel'
import LogsPanel from '@/components/workspace/LogsPanel'

const SIDEBAR_TABS = [
  { id: 'files', label: 'Files', icon: FolderTree },
  { id: 'build', label: 'Build', icon: Hammer },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const MAIN_TABS = [
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'chat', label: 'Claude Chat', icon: MessageSquare },
]

const BOTTOM_TABS = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'logs', label: 'Logs', icon: FileWarning },
]

function WorkspaceContent() {
  const { projectId } = useParams()
  const {
    project,
    setProject,
    sidebarTab,
    setSidebarTab,
    mainTab,
    setMainTab,
    bottomTab,
    setBottomTab,
    sidebarOpen,
    toggleSidebar,
    bottomPanelOpen,
    toggleBottomPanel,
    setBuildStatus,
    addActivity,
    updateActivity,
    setFiles,
    setFileContent,
  } = useProject()

  useEffect(() => {
    async function loadProject() {
      try {
        const proj = await api.getProject(projectId)
        setProject(proj)
        connectSocket(projectId)
      } catch (err) {
        console.error('Failed to load project:', err)
      }
    }

    loadProject()

    return () => {
      disconnectSocket()
    }
  }, [projectId, setProject])

  useEffect(() => {
    function handleFilesUpdated(data) {
      setFiles(data.files)
    }

    function handleFileChanged(data) {
      setFileContent(data.path, data.content)
    }

    function handleBuildStatus(data) {
      setBuildStatus(data.status)
    }

    socket.on('files:updated', handleFilesUpdated)
    socket.on('file:changed', handleFileChanged)
    socket.on('build:status', handleBuildStatus)

    return () => {
      socket.off('files:updated', handleFilesUpdated)
      socket.off('file:changed', handleFileChanged)
      socket.off('build:status', handleBuildStatus)
    }
  }, [setFiles, setFileContent, setBuildStatus])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-border bg-card/30 flex flex-col overflow-hidden shrink-0"
            >
              <div className="flex border-b border-border">
                {SIDEBAR_TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSidebarTab(tab.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors cursor-pointer',
                        sidebarTab === tab.id
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex-1 overflow-hidden">
                {sidebarTab === 'files' && <FileTree />}
                {sidebarTab === 'build' && <BuildPanel />}
                {sidebarTab === 'settings' && <SettingsPanel />}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-border">
            {MAIN_TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors cursor-pointer',
                    mainTab === tab.id
                      ? 'text-primary border-b-2 border-primary bg-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
            <div className="flex-1" />
            <button
              onClick={toggleSidebar}
              className="px-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden md:flex items-center"
              title="Toggle sidebar"
            >
              <FolderTree className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {mainTab === 'editor' && <CodeEditor />}
            {mainTab === 'chat' && <ChatPanel />}
          </div>

          <div className="flex items-center border-t border-border border-b border-b-border">
            {BOTTOM_TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (bottomTab === tab.id && bottomPanelOpen) {
                      toggleBottomPanel()
                    } else {
                      setBottomTab(tab.id)
                      if (!bottomPanelOpen) toggleBottomPanel()
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                    bottomTab === tab.id && bottomPanelOpen
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              )
            })}
            <div className="flex-1" />
            <button
              onClick={toggleBottomPanel}
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {bottomPanelOpen ? (
                <PanelBottomClose className="w-3.5 h-3.5" />
              ) : (
                <PanelBottomOpen className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {bottomPanelOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 280 }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-border overflow-hidden shrink-0"
              >
                <div className="h-full">
                  {bottomTab === 'preview' && <PreviewPanel />}
                  {bottomTab === 'activity' && <ActivityPanel />}
                  {bottomTab === 'logs' && <LogsPanel />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
