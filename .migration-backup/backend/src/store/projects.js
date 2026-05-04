import { v4 as uuidv4 } from 'uuid'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const memProjects = new Map()
const memChatHistory = new Map()

export async function createProject({ prompt, framework, userId }) {
  const id = uuidv4()
  const name = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt

  const project = {
    id,
    user_id: userId || null,
    name,
    prompt,
    framework,
    status: 'initializing',
    preview_url: null,
    live_url: null,
    sandbox_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('projects').insert(project)
    if (error) console.error('Supabase insert project error:', error)
  }

  memProjects.set(id, { ...project, previewUrl: null, liveUrl: null, chatHistory: [] })
  memChatHistory.set(id, [])

  return formatProject(project)
}

export async function getProject(id) {
  const mem = memProjects.get(id)
  if (mem) return formatProject(mem)

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
    if (data && !error) {
      memProjects.set(id, { ...data, chatHistory: [] })
      return formatProject(data)
    }
  }

  return null
}

export async function updateProject(id, updates) {
  const mem = memProjects.get(id)
  if (mem) {
    Object.assign(mem, updates, { updated_at: new Date().toISOString() })
    if (updates.previewUrl) mem.preview_url = updates.previewUrl
    if (updates.liveUrl) mem.live_url = updates.liveUrl
    if (updates.sandboxId) mem.sandbox_id = updates.sandboxId
  }

  if (isSupabaseConfigured()) {
    const dbUpdates = { updated_at: new Date().toISOString() }
    if (updates.status) dbUpdates.status = updates.status
    if (updates.previewUrl || updates.preview_url) dbUpdates.preview_url = updates.previewUrl || updates.preview_url
    if (updates.liveUrl || updates.live_url) dbUpdates.live_url = updates.liveUrl || updates.live_url
    if (updates.sandboxId || updates.sandbox_id) dbUpdates.sandbox_id = updates.sandboxId || updates.sandbox_id

    const { error } = await supabase.from('projects').update(dbUpdates).eq('id', id)
    if (error) console.error('Supabase update project error:', error)
  }

  return mem ? formatProject(mem) : null
}

export async function listProjects(userId) {
  if (isSupabaseConfigured() && userId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data && !error) return data.map(formatProject)
  }

  return Array.from(memProjects.values())
    .filter((p) => !userId || p.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(formatProject)
}

export async function addChatMessage(projectId, message) {
  if (!memChatHistory.has(projectId)) memChatHistory.set(projectId, [])
  memChatHistory.get(projectId).push(message)

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('chat_messages').insert({
      project_id: projectId,
      role: message.role,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
    })
    if (error) console.error('Supabase insert chat error:', error)
  }
}

export function getChatHistory(projectId) {
  return memChatHistory.get(projectId) || []
}

export async function loadChatHistory(projectId) {
  if (memChatHistory.has(projectId) && memChatHistory.get(projectId).length > 0) {
    return memChatHistory.get(projectId)
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (data && !error) {
      const messages = data.map((m) => ({ role: m.role, content: m.content }))
      memChatHistory.set(projectId, messages)
      return messages
    }
  }

  return []
}

function formatProject(p) {
  return {
    id: p.id,
    name: p.name,
    prompt: p.prompt,
    framework: p.framework,
    status: p.status,
    previewUrl: p.preview_url || p.previewUrl || null,
    liveUrl: p.live_url || p.liveUrl || null,
    sandboxId: p.sandbox_id || p.sandboxId || null,
    createdAt: p.created_at,
    chatHistory: p.chatHistory || [],
  }
}
