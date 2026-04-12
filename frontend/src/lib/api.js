const API_URL = import.meta.env.VITE_BACKEND_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
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
  createProject(data) {
    return request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getProject(id) {
    return request(`/api/projects/${id}`)
  },

  listProjects() {
    return request('/api/projects')
  },

  sendMessage(projectId, message) {
    return request(`/api/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  },

  getFiles(projectId, path = '/') {
    return request(`/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`)
  },

  getFileContent(projectId, path) {
    return request(`/api/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`)
  },

  saveFile(projectId, path, content) {
    return request(`/api/projects/${projectId}/files/content`, {
      method: 'PUT',
      body: JSON.stringify({ path, content }),
    })
  },

  triggerBuild(projectId, platform) {
    return request(`/api/projects/${projectId}/build`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
    })
  },

  publishApp(projectId, platform, track) {
    return request(`/api/projects/${projectId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ platform, track }),
    })
  },
}
