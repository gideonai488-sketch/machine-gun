import { useEffect, useRef, useCallback, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  X,
  FileCode,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  PanelLeft,
} from 'lucide-react'
import { useProject } from '@/stores/project-store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const LANGUAGE_MAP = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  dart: 'dart', py: 'python', json: 'json', md: 'markdown',
  yaml: 'yaml', yml: 'yaml', html: 'html', css: 'css',
  scss: 'scss', xml: 'xml', svg: 'xml', sh: 'shell',
  toml: 'ini', gradle: 'groovy', kt: 'kotlin', swift: 'swift',
  java: 'java', rb: 'ruby', go: 'go', rs: 'rust',
}

function getLanguage(filePath) {
  const ext = filePath?.split('.').pop()?.toLowerCase()
  return LANGUAGE_MAP[ext] || 'plaintext'
}

function getFileName(path) {
  return path?.split('/').pop() || ''
}

function FileNode({ node, depth = 0, onSelect, activeFile }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const isDir = node.type === 'directory'
  const isActive = !isDir && activeFile === node.path

  return (
    <div>
      <button
        onClick={() => isDir ? setExpanded(!expanded) : onSelect(node.path)}
        className={cn(
          'flex items-center gap-1.5 w-full px-2 py-1 sm:py-[3px] text-xs hover:bg-muted/30 transition-colors cursor-pointer active:bg-muted/50',
          isActive && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDir ? (
          <>
            {expanded
              ? <ChevronDown className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              : <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            }
            {expanded
              ? <FolderOpen className="w-3.5 h-3.5 text-primary/50 shrink-0" />
              : <Folder className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            }
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <File className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && expanded && node.children?.map((child) => (
        <FileNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
          activeFile={activeFile}
        />
      ))}
    </div>
  )
}

export default function CodeEditor() {
  const {
    project, files, openFiles, activeFile,
    fileContents, openFile, closeFile,
    setActiveFile, setFileContent, setFiles,
  } = useProject()

  const [showTree, setShowTree] = useState(false)
  const saveTimeoutRef = useRef(null)

  const loadFiles = useCallback(async () => {
    if (!project?.id) return
    try {
      const result = await api.getFiles(project.id)
      setFiles(result.files || [])
    } catch (err) {
      console.error('Failed to load files:', err)
    }
  }, [project?.id, setFiles])

  useEffect(() => { loadFiles() }, [loadFiles])

  const loadFileContent = useCallback(async (filePath) => {
    if (!project?.id || fileContents[filePath] !== undefined) return
    try {
      const result = await api.getFileContent(project.id, filePath)
      setFileContent(filePath, result.content)
    } catch (err) {
      setFileContent(filePath, `// Error loading file: ${err.message}`)
    }
  }, [project?.id, fileContents, setFileContent])

  useEffect(() => {
    if (activeFile) loadFileContent(activeFile)
  }, [activeFile, loadFileContent])

  function handleEditorChange(value) {
    if (!activeFile || value === undefined) return
    setFileContent(activeFile, value)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      if (project?.id) api.saveFile(project.id, activeFile, value).catch(console.error)
    }, 1000)
  }

  function handleFileSelect(path) {
    openFile(path)
    setShowTree(false)
  }

  return (
    <div className="h-full flex relative">
      {/* File tree — sidebar on desktop, overlay on mobile */}
      <div className={cn(
        'border-r border-border/40 bg-surface flex flex-col shrink-0 overflow-hidden transition-all',
        showTree
          ? 'absolute inset-0 z-20 w-full sm:relative sm:w-52 lg:w-56'
          : 'hidden sm:flex sm:w-52 lg:w-56'
      )}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Files</span>
          <button
            onClick={() => setShowTree(false)}
            className="p-1 rounded hover:bg-muted/30 sm:hidden cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1 overscroll-contain">
          {files.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/40 px-3 py-4 text-center">No files yet</p>
          ) : (
            files.map((node) => (
              <FileNode
                key={node.path}
                node={node}
                onSelect={handleFileSelect}
                activeFile={activeFile}
              />
            ))
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-border/30 bg-surface overflow-x-auto shrink-0 no-scrollbar">
          <button
            onClick={() => setShowTree(!showTree)}
            className="p-2 sm:hidden text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          {openFiles.map((filePath) => (
            <div
              key={filePath}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-[11px] border-r border-border/20 cursor-pointer transition-colors shrink-0 group',
                activeFile === filePath
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              )}
              onClick={() => setActiveFile(filePath)}
            >
              <span>{getFileName(filePath)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeFile(filePath) }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted/40 rounded transition-all cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex-1">
          {activeFile ? (
            <Editor
              theme="vs-dark"
              language={getLanguage(activeFile)}
              value={fileContents[activeFile] ?? ''}
              onChange={handleEditorChange}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 8, bottom: 8 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                bracketPairColorization: { enabled: true },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center px-6">
                <FileCode className="w-10 h-10 text-muted-foreground/15 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/40">Select a file to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
