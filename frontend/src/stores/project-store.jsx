import { createContext, useContext, useReducer, useCallback } from 'react'

const ProjectContext = createContext(null)

const initialState = {
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

function projectReducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, project: action.payload, previewUrl: action.payload?.previewUrl || null }

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

    case 'UPDATE_LAST_ASSISTANT_MESSAGE': {
      const msgs = [...state.chatMessages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content: action.payload }
          break
        }
      }
      return { ...state, chatMessages: msgs }
    }

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
      if (idx !== -1) {
        msgs[idx] = { ...msgs[idx], ...action.payload }
      }
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

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState)

  const actions = {
    setProject: useCallback((p) => dispatch({ type: 'SET_PROJECT', payload: p }), []),
    setPreviewUrl: useCallback((u) => dispatch({ type: 'SET_PREVIEW_URL', payload: u }), []),
    setFiles: useCallback((f) => dispatch({ type: 'SET_FILES', payload: f }), []),
    openFile: useCallback((p) => dispatch({ type: 'OPEN_FILE', payload: p }), []),
    closeFile: useCallback((p) => dispatch({ type: 'CLOSE_FILE', payload: p }), []),
    setActiveFile: useCallback((p) => dispatch({ type: 'SET_ACTIVE_FILE', payload: p }), []),
    setFileContent: useCallback((path, content) =>
      dispatch({ type: 'SET_FILE_CONTENT', payload: { path, content } }), []),
    addChatMessage: useCallback((m) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: m }), []),
    updateLastAssistantMessage: useCallback((c) =>
      dispatch({ type: 'UPDATE_LAST_ASSISTANT_MESSAGE', payload: c }), []),
    appendLastAssistantMessage: useCallback((c) =>
      dispatch({ type: 'APPEND_LAST_ASSISTANT_MESSAGE', payload: c }), []),
    addActivityMessage: useCallback((a) =>
      dispatch({ type: 'ADD_ACTIVITY_MESSAGE', payload: a }), []),
    updateActivityMessage: useCallback((a) =>
      dispatch({ type: 'UPDATE_ACTIVITY_MESSAGE', payload: a }), []),
    setBuildStatus: useCallback((s) => dispatch({ type: 'SET_BUILD_STATUS', payload: s }), []),
    setRightPanel: useCallback((t) => dispatch({ type: 'SET_RIGHT_PANEL', payload: t }), []),
    setPreviewMode: useCallback((m) => dispatch({ type: 'SET_PREVIEW_MODE', payload: m }), []),
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
