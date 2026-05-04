import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'

interface FileNode {
  path: string
  name: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant' | 'activity'
  content?: string
  type?: string
  message?: string
  status?: string
}

interface ProjectState {
  project: any | null
  files: FileNode[]
  openFiles: string[]
  activeFile: string | null
  fileContents: Record<string, string>
  chatMessages: ChatMessage[]
  buildStatus: string
  rightPanel: string
  previewMode: string
  previewUrl: string | null
}

const initialState: ProjectState = {
  project: null,
  files: [],
  openFiles: [],
  activeFile: null,
  fileContents: {},
  chatMessages: [],
  buildStatus: 'idle',
  rightPanel: 'preview',
  previewMode: 'desktop',
  previewUrl: null,
}

type Action =
  | { type: 'SET_PROJECT'; payload: any }
  | { type: 'SET_PREVIEW_URL'; payload: string | null }
  | { type: 'SET_FILES'; payload: FileNode[] }
  | { type: 'OPEN_FILE'; payload: string }
  | { type: 'CLOSE_FILE'; payload: string }
  | { type: 'SET_ACTIVE_FILE'; payload: string }
  | { type: 'SET_FILE_CONTENT'; payload: { path: string; content: string } }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'APPEND_LAST_ASSISTANT_MESSAGE'; payload: string }
  | { type: 'ADD_ACTIVITY_MESSAGE'; payload: any }
  | { type: 'UPDATE_ACTIVITY_MESSAGE'; payload: any }
  | { type: 'SET_BUILD_STATUS'; payload: string }
  | { type: 'SET_RIGHT_PANEL'; payload: string }
  | { type: 'SET_PREVIEW_MODE'; payload: string }

function projectReducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case 'SET_PROJECT': {
      const proj = action.payload
      const hydratedMessages = (proj?.chatHistory || []).map((msg: any, i: number) => ({
        ...msg,
        id: msg.id || `history-${i}`,
      }))
      return {
        ...state,
        project: proj,
        previewUrl: proj?.previewUrl || null,
        chatMessages: hydratedMessages.length > 0 ? hydratedMessages : state.chatMessages,
      }
    }
    case 'SET_PREVIEW_URL':
      return { ...state, previewUrl: action.payload }
    case 'SET_FILES':
      return { ...state, files: action.payload }
    case 'OPEN_FILE': {
      const filePath = action.payload
      const alreadyOpen = state.openFiles.includes(filePath)
      return {
        ...state,
        openFiles: alreadyOpen ? state.openFiles : [...state.openFiles, filePath],
        activeFile: filePath,
        rightPanel: 'code',
      }
    }
    case 'CLOSE_FILE': {
      const closing = action.payload
      const newOpen = state.openFiles.filter((f) => f !== closing)
      return {
        ...state,
        openFiles: newOpen,
        activeFile: state.activeFile === closing ? newOpen[newOpen.length - 1] || null : state.activeFile,
      }
    }
    case 'SET_ACTIVE_FILE':
      return { ...state, activeFile: action.payload }
    case 'SET_FILE_CONTENT':
      return {
        ...state,
        fileContents: { ...state.fileContents, [action.payload.path]: action.payload.content },
      }
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] }
    case 'APPEND_LAST_ASSISTANT_MESSAGE': {
      const msgs = [...state.chatMessages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content: (msgs[i].content || '') + action.payload }
          break
        }
      }
      return { ...state, chatMessages: msgs }
    }
    case 'ADD_ACTIVITY_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, { role: 'activity', ...action.payload }],
      }
    case 'UPDATE_ACTIVITY_MESSAGE': {
      const msgs = [...state.chatMessages]
      const idx = msgs.findIndex((m) => m.id === action.payload.id)
      if (idx !== -1) msgs[idx] = { ...msgs[idx], ...action.payload }
      return { ...state, chatMessages: msgs }
    }
    case 'SET_BUILD_STATUS':
      return { ...state, buildStatus: action.payload }
    case 'SET_RIGHT_PANEL':
      return { ...state, rightPanel: action.payload }
    case 'SET_PREVIEW_MODE':
      return { ...state, previewMode: action.payload }
    default:
      return state
  }
}

interface ProjectContextType extends ProjectState {
  setProject: (p: any) => void
  setPreviewUrl: (u: string | null) => void
  setFiles: (f: FileNode[]) => void
  openFile: (p: string) => void
  closeFile: (p: string) => void
  setActiveFile: (p: string) => void
  setFileContent: (path: string, content: string) => void
  addChatMessage: (m: ChatMessage) => void
  appendLastAssistantMessage: (c: string) => void
  addActivityMessage: (a: any) => void
  updateActivityMessage: (a: any) => void
  setBuildStatus: (s: string) => void
  setRightPanel: (t: string) => void
  setPreviewMode: (m: string) => void
}

const ProjectContext = createContext<ProjectContextType | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState)

  const actions = {
    setProject: useCallback((p: any) => dispatch({ type: 'SET_PROJECT', payload: p }), []),
    setPreviewUrl: useCallback((u: string | null) => dispatch({ type: 'SET_PREVIEW_URL', payload: u }), []),
    setFiles: useCallback((f: FileNode[]) => dispatch({ type: 'SET_FILES', payload: f }), []),
    openFile: useCallback((p: string) => dispatch({ type: 'OPEN_FILE', payload: p }), []),
    closeFile: useCallback((p: string) => dispatch({ type: 'CLOSE_FILE', payload: p }), []),
    setActiveFile: useCallback((p: string) => dispatch({ type: 'SET_ACTIVE_FILE', payload: p }), []),
    setFileContent: useCallback((path: string, content: string) =>
      dispatch({ type: 'SET_FILE_CONTENT', payload: { path, content } }), []),
    addChatMessage: useCallback((m: ChatMessage) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: m }), []),
    appendLastAssistantMessage: useCallback((c: string) =>
      dispatch({ type: 'APPEND_LAST_ASSISTANT_MESSAGE', payload: c }), []),
    addActivityMessage: useCallback((a: any) => dispatch({ type: 'ADD_ACTIVITY_MESSAGE', payload: a }), []),
    updateActivityMessage: useCallback((a: any) => dispatch({ type: 'UPDATE_ACTIVITY_MESSAGE', payload: a }), []),
    setBuildStatus: useCallback((s: string) => dispatch({ type: 'SET_BUILD_STATUS', payload: s }), []),
    setRightPanel: useCallback((t: string) => dispatch({ type: 'SET_RIGHT_PANEL', payload: t }), []),
    setPreviewMode: useCallback((m: string) => dispatch({ type: 'SET_PREVIEW_MODE', payload: m }), []),
  }

  return (
    <ProjectContext.Provider value={{ ...state, ...actions }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
