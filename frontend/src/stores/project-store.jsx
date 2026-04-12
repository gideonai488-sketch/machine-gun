import { createContext, useContext, useReducer, useCallback } from 'react'

const ProjectContext = createContext(null)

const initialState = {
  project: null,
  files: [],
  openFiles: [],
  activeFile: null,
  fileContents: {},
  chatMessages: [],
  activities: [],
  buildLogs: [],
  buildStatus: 'idle',
  sidebarTab: 'files',
  mainTab: 'editor',
  bottomTab: 'preview',
  sidebarOpen: true,
  bottomPanelOpen: true,
  previewMode: 'web',
}

function projectReducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, project: action.payload }

    case 'SET_FILES':
      return { ...state, files: action.payload }

    case 'OPEN_FILE': {
      const filePath = action.payload
      const alreadyOpen = state.openFiles.includes(filePath)
      return {
        ...state,
        openFiles: alreadyOpen ? state.openFiles : [...state.openFiles, filePath],
        activeFile: filePath,
        mainTab: 'editor',
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

    case 'UPDATE_LAST_ASSISTANT_MESSAGE':
      return {
        ...state,
        chatMessages: state.chatMessages.map((msg, i) =>
          i === state.chatMessages.length - 1 && msg.role === 'assistant'
            ? { ...msg, content: action.payload }
            : msg
        ),
      }

    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, action.payload] }

    case 'UPDATE_ACTIVITY': {
      return {
        ...state,
        activities: state.activities.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
      }
    }

    case 'ADD_BUILD_LOG':
      return { ...state, buildLogs: [...state.buildLogs, action.payload] }

    case 'CLEAR_BUILD_LOGS':
      return { ...state, buildLogs: [] }

    case 'SET_BUILD_STATUS':
      return { ...state, buildStatus: action.payload }

    case 'SET_SIDEBAR_TAB':
      return { ...state, sidebarTab: action.payload }

    case 'SET_MAIN_TAB':
      return { ...state, mainTab: action.payload }

    case 'SET_BOTTOM_TAB':
      return { ...state, bottomTab: action.payload }

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }

    case 'TOGGLE_BOTTOM_PANEL':
      return { ...state, bottomPanelOpen: !state.bottomPanelOpen }

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
    setFiles: useCallback((f) => dispatch({ type: 'SET_FILES', payload: f }), []),
    openFile: useCallback((p) => dispatch({ type: 'OPEN_FILE', payload: p }), []),
    closeFile: useCallback((p) => dispatch({ type: 'CLOSE_FILE', payload: p }), []),
    setActiveFile: useCallback((p) => dispatch({ type: 'SET_ACTIVE_FILE', payload: p }), []),
    setFileContent: useCallback((path, content) => dispatch({ type: 'SET_FILE_CONTENT', payload: { path, content } }), []),
    addChatMessage: useCallback((m) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: m }), []),
    updateLastAssistantMessage: useCallback((c) => dispatch({ type: 'UPDATE_LAST_ASSISTANT_MESSAGE', payload: c }), []),
    addActivity: useCallback((a) => dispatch({ type: 'ADD_ACTIVITY', payload: a }), []),
    updateActivity: useCallback((a) => dispatch({ type: 'UPDATE_ACTIVITY', payload: a }), []),
    addBuildLog: useCallback((l) => dispatch({ type: 'ADD_BUILD_LOG', payload: l }), []),
    clearBuildLogs: useCallback(() => dispatch({ type: 'CLEAR_BUILD_LOGS' }), []),
    setBuildStatus: useCallback((s) => dispatch({ type: 'SET_BUILD_STATUS', payload: s }), []),
    setSidebarTab: useCallback((t) => dispatch({ type: 'SET_SIDEBAR_TAB', payload: t }), []),
    setMainTab: useCallback((t) => dispatch({ type: 'SET_MAIN_TAB', payload: t }), []),
    setBottomTab: useCallback((t) => dispatch({ type: 'SET_BOTTOM_TAB', payload: t }), []),
    toggleSidebar: useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []),
    toggleBottomPanel: useCallback(() => dispatch({ type: 'TOGGLE_BOTTOM_PANEL' }), []),
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
