import { useState, useEffect, useCallback } from 'react'
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  RefreshCw,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProject } from '@/stores/project-store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const FILE_ICONS = {
  js: '🟨',
  jsx: '⚛️',
  ts: '🔷',
  tsx: '⚛️',
  dart: '🎯',
  py: '🐍',
  json: '📋',
  md: '📝',
  yaml: '⚙️',
  yml: '⚙️',
  html: '🌐',
  css: '🎨',
  svg: '🖼️',
}

function getFileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  return FILE_ICONS[ext] || null
}

function FileNode({ node, depth = 0 }) {
  const { openFile, activeFile } = useProject()
  const [expanded, setExpanded] = useState(depth < 2)

  const isDirectory = node.type === 'directory'
  const isActive = !isDirectory && activeFile === node.path
  const icon = getFileIcon(node.name)

  function handleClick() {
    if (isDirectory) {
      setExpanded(!expanded)
    } else {
      openFile(node.path)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1.5 w-full px-2 py-1 text-xs hover:bg-muted/50 transition-colors text-left cursor-pointer',
          isActive && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDirectory ? (
          <>
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            {expanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 h-3 shrink-0" />
            {icon ? (
              <span className="text-[10px] shrink-0">{icon}</span>
            ) : (
              <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDirectory && expanded && node.children?.length > 0 && (
        <div>
          {node.children
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
              return a.name.localeCompare(b.name)
            })
            .map((child) => (
              <FileNode key={child.path} node={child} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  )
}

export default function FileTree() {
  const { project, files, setFiles } = useProject()
  const [loading, setLoading] = useState(false)

  const loadFiles = useCallback(async () => {
    if (!project?.id) return
    setLoading(true)
    try {
      const result = await api.getFiles(project.id)
      setFiles(result.files || [])
    } catch (err) {
      console.error('Failed to load files:', err)
    } finally {
      setLoading(false)
    }
  }, [project?.id, setFiles])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Explorer
        </span>
        <button
          onClick={loadFiles}
          className="p-1 hover:bg-muted rounded transition-colors cursor-pointer"
          disabled={loading}
        >
          <RefreshCw className={cn('w-3 h-3 text-muted-foreground', loading && 'animate-spin')} />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {files.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Folder className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {loading ? 'Loading files...' : 'No files yet. Start building!'}
              </p>
            </div>
          ) : (
            files.map((node) => <FileNode key={node.path} node={node} />)
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
