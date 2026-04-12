import { useEffect, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { X, FileCode } from 'lucide-react'
import { useProject } from '@/stores/project-store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const LANGUAGE_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  dart: 'dart',
  py: 'python',
  json: 'json',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  xml: 'xml',
  svg: 'xml',
  sh: 'shell',
  bash: 'shell',
  toml: 'ini',
  gradle: 'groovy',
  kt: 'kotlin',
  swift: 'swift',
  m: 'objective-c',
  h: 'objective-c',
  java: 'java',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
}

function getLanguage(filePath) {
  const ext = filePath?.split('.').pop()?.toLowerCase()
  return LANGUAGE_MAP[ext] || 'plaintext'
}

function getFileName(path) {
  return path?.split('/').pop() || ''
}

export default function CodeEditor() {
  const {
    project,
    openFiles,
    activeFile,
    fileContents,
    setActiveFile,
    closeFile,
    setFileContent,
  } = useProject()

  const editorRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  const loadFileContent = useCallback(async (filePath) => {
    if (!project?.id || fileContents[filePath] !== undefined) return
    try {
      const result = await api.getFileContent(project.id, filePath)
      setFileContent(filePath, result.content)
    } catch (err) {
      console.error('Failed to load file:', err)
      setFileContent(filePath, `// Error loading file: ${err.message}`)
    }
  }, [project?.id, fileContents, setFileContent])

  useEffect(() => {
    if (activeFile) {
      loadFileContent(activeFile)
    }
  }, [activeFile, loadFileContent])

  function handleEditorChange(value) {
    if (!activeFile || value === undefined) return
    setFileContent(activeFile, value)

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      if (project?.id) {
        api.saveFile(project.id, activeFile, value).catch(console.error)
      }
    }, 1000)
  }

  function handleEditorMount(editor) {
    editorRef.current = editor
  }

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileCode className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Open a file from the explorer to start editing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center border-b border-border bg-card/50 overflow-x-auto">
        {openFiles.map((filePath) => (
          <div
            key={filePath}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-border cursor-pointer transition-colors shrink-0 group',
              activeFile === filePath
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
            onClick={() => setActiveFile(filePath)}
          >
            <span>{getFileName(filePath)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeFile(filePath)
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1">
        <Editor
          theme="vs-dark"
          language={getLanguage(activeFile)}
          value={fileContents[activeFile] ?? ''}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
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
            guides: { bracketPairs: true },
          }}
        />
      </div>
    </div>
  )
}
