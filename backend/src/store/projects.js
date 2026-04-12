import { v4 as uuidv4 } from 'uuid'

const projects = new Map()

export function createProject({ prompt, framework }) {
  const id = uuidv4()
  const name = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt
  const project = {
    id,
    name,
    prompt,
    framework,
    status: 'initializing',
    previewUrl: null,
    sandboxId: null,
    createdAt: new Date().toISOString(),
    chatHistory: [],
    files: [],
  }
  projects.set(id, project)
  return project
}

export function getProject(id) {
  return projects.get(id) || null
}

export function updateProject(id, updates) {
  const project = projects.get(id)
  if (!project) return null
  const updated = { ...project, ...updates }
  projects.set(id, updated)
  return updated
}

export function listProjects() {
  return Array.from(projects.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
}

export function addChatMessage(projectId, message) {
  const project = projects.get(projectId)
  if (!project) return
  project.chatHistory.push(message)
}

export function getChatHistory(projectId) {
  const project = projects.get(projectId)
  return project?.chatHistory || []
}
