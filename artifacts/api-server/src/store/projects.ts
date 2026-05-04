import { randomUUID } from 'crypto'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

export interface Project {
  id: string
  name: string
  prompt: string
  framework: string
  status: string
  previewUrl: string | null
  liveUrl: string | null
  sandboxId: string | null
  createdAt: string
  chatHistory: ChatMessage[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | any[]
}

interface MemProject extends Project {
  user_id?: string | null
  preview_url?: string | null
  live_url?: string | null
  sandbox_id?: string | null
  created_at?: string
  updated_at?: string
}

const memProjects = new Map<string, MemProject>()
const memChatHistory = new Map<string, ChatMessage[]>()

function formatProject(p: MemProject): Project {
  return {
    id: p.id,
    name: p.name,
    prompt: p.prompt,
    framework: p.framework,
    status: p.status,
    previewUrl: p.preview_url ?? p.previewUrl ?? null,
    liveUrl: p.live_url ?? p.liveUrl ?? null,
    sandboxId: p.sandbox_id ?? p.sandboxId ?? null,
    createdAt: p.created_at ?? p.createdAt ?? new Date().toISOString(),
    chatHistory: p.chatHistory ?? [],
  }
}

export async function createProject({ prompt, framework, userId }: { prompt: string; framework: string; userId?: string }): Promise<Project> {
  const id = randomUUID()
  const name = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt
  const now = new Date().toISOString()

  const project: MemProject = {
    id,
    user_id: userId ?? null,
    name,
    prompt,
    framework,
    status: 'initializing',
    preview_url: null,
    live_url: null,
    sandbox_id: null,
    created_at: now,
    updated_at: now,
    previewUrl: null,
    liveUrl: null,
    sandboxId: null,
    chatHistory: [],
    createdAt: now,
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabase!.from('projects').insert({
      id, user_id: userId ?? null, name, prompt, framework,
      status: 'initializing', created_at: now, updated_at: now,
    })
    if (error) console.error('Supabase insert project error:', error)
  }

  memProjects.set(id, project)
  memChatHistory.set(id, [])

  return formatProject(project)
}

export async function getProject(id: string): Promise<Project | null> {
  const mem = memProjects.get(id)
  if (mem) return formatProject(mem)

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase!.from('projects').select('*').eq('id', id).single()
    if (data && !error) {
      const p: MemProject = { ...data, chatHistory: [] }
      memProjects.set(id, p)
      return formatProject(p)
    }
  }

  return null
}

export async function updateProject(id: string, updates: Partial<MemProject>): Promise<Project | null> {
  const mem = memProjects.get(id)
  if (mem) {
    Object.assign(mem, updates, { updated_at: new Date().toISOString() })
    if (updates.previewUrl) mem.preview_url = updates.previewUrl
    if (updates.liveUrl) mem.live_url = updates.liveUrl
    if (updates.sandboxId) mem.sandbox_id = updates.sandboxId
  }

  if (isSupabaseConfigured()) {
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (updates.status) dbUpdates['status'] = updates.status
    if (updates.previewUrl) dbUpdates['preview_url'] = updates.previewUrl
    if (updates.liveUrl) dbUpdates['live_url'] = updates.liveUrl
    if (updates.sandboxId) dbUpdates['sandbox_id'] = updates.sandboxId
    const { error } = await supabase!.from('projects').update(dbUpdates).eq('id', id)
    if (error) console.error('Supabase update project error:', error)
  }

  return mem ? formatProject(mem) : null
}

export async function listProjects(userId?: string): Promise<Project[]> {
  if (isSupabaseConfigured() && userId) {
    const { data, error } = await supabase!
      .from('projects').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(50)
    if (data && !error) {
      return data.map((d: any) => formatProject({ ...d, chatHistory: [] }))
    }
  }

  return Array.from(memProjects.values())
    .filter((p) => !userId || p.user_id === userId)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .map(formatProject)
}

export function addChatMessage(projectId: string, message: ChatMessage): void {
  if (!memChatHistory.has(projectId)) memChatHistory.set(projectId, [])
  memChatHistory.get(projectId)!.push(message)

  if (isSupabaseConfigured()) {
    supabase!.from('chat_messages').insert({
      project_id: projectId,
      role: message.role,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
    }).then(({ error }) => {
      if (error) console.error('Supabase insert chat error:', error)
    })
  }
}

export function getChatHistory(projectId: string): ChatMessage[] {
  return memChatHistory.get(projectId) ?? []
}
