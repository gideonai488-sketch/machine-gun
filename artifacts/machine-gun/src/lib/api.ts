import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_BACKEND_URL || ''

async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  if (!API_URL) {
    throw new Error('Coming soon')
  }

  const token = await getAuthToken()

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || 'Request failed')
  }

  return res.json()
}

export const api = {
  createProject(data: { prompt: string; framework: string }) {
    return request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getProject(id: string) {
    return request(`/api/projects/${id}`)
  },

  listProjects() {
    return request('/api/projects')
  },

  sendMessage(projectId: string, message: string) {
    return request(`/api/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  },

  getFiles(projectId: string, path = '/') {
    return request(`/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`)
  },

  getFileContent(projectId: string, path: string) {
    return request(`/api/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`)
  },

  saveFile(projectId: string, path: string, content: string) {
    return request(`/api/projects/${projectId}/files/content`, {
      method: 'PUT',
      body: JSON.stringify({ path, content }),
    })
  },

  deployWeb(projectId: string) {
    return request(`/api/projects/${projectId}/deploy/web`, {
      method: 'POST',
    })
  },

  deployMobile(projectId: string, platform: string, track: string) {
    return request(`/api/projects/${projectId}/deploy/mobile`, {
      method: 'POST',
      body: JSON.stringify({ platform, track }),
    })
  },

  getBuildStatus(projectId: string, buildId: string) {
    return request(`/api/projects/${projectId}/build/${buildId}`)
  },

  cancelBuild(projectId: string, buildId: string) {
    return request(`/api/projects/${projectId}/build/${buildId}/cancel`, {
      method: 'POST',
    })
  },
}
