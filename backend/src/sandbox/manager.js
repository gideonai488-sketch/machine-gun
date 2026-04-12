import { Sandbox } from 'e2b'

const activeSandboxes = new Map()

export async function createSandbox(projectId, framework) {
  if (activeSandboxes.has(projectId)) {
    return activeSandboxes.get(projectId)
  }

  const sandbox = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
    timeoutMs: 10 * 60 * 1000,
  })

  activeSandboxes.set(projectId, sandbox)

  await initializeSandbox(sandbox, framework)

  return sandbox
}

async function initializeSandbox(sandbox, framework) {
  switch (framework) {
    case 'flutter':
      break
    case 'react-vite':
      await sandbox.commands.run('mkdir -p /home/user/project && cd /home/user/project && npm create vite@latest . -- --template react -y', { timeoutMs: 60000 })
      await sandbox.commands.run('cd /home/user/project && npm install', { timeoutMs: 120000 })
      break
    case 'react-native':
      break
    default:
      await sandbox.commands.run('mkdir -p /home/user/project', { timeoutMs: 10000 })
  }
}

export async function getSandbox(projectId) {
  return activeSandboxes.get(projectId) || null
}

export async function runCommand(projectId, command, timeoutMs = 30000) {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  const result = await sandbox.commands.run(command, {
    timeoutMs,
    cwd: '/home/user/project',
  })

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  }
}

export async function writeFile(projectId, path, content) {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  const fullPath = path.startsWith('/') ? path : `/home/user/project/${path}`

  const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
  await sandbox.commands.run(`mkdir -p "${dir}"`, { timeoutMs: 5000 })

  await sandbox.files.write(fullPath, content)
}

export async function readFile(projectId, path) {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  const fullPath = path.startsWith('/') ? path : `/home/user/project/${path}`
  const content = await sandbox.files.read(fullPath)
  return content
}

export async function listFiles(projectId, path = '/home/user/project') {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  const result = await sandbox.commands.run(
    `find "${path}" -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/build/*' -not -path '*/.dart_tool/*' | head -500`,
    { timeoutMs: 10000 }
  )

  if (!result.stdout) return []

  const lines = result.stdout.trim().split('\n').filter(Boolean)
  return buildFileTree(lines, path)
}

function buildFileTree(paths, basePath) {
  const root = []
  const dirMap = new Map()

  const sorted = paths
    .map((p) => p.replace(basePath, '').replace(/^\//, ''))
    .filter(Boolean)
    .sort()

  for (const relativePath of sorted) {
    const parts = relativePath.split('/')
    const name = parts[parts.length - 1]
    const parentPath = parts.slice(0, -1).join('/')

    const isDirectory = sorted.some(
      (other) => other !== relativePath && other.startsWith(relativePath + '/')
    )

    const node = {
      name,
      path: relativePath,
      type: isDirectory ? 'directory' : 'file',
      children: isDirectory ? [] : undefined,
    }

    if (isDirectory) {
      dirMap.set(relativePath, node)
    }

    if (parentPath === '') {
      root.push(node)
    } else {
      const parent = dirMap.get(parentPath)
      if (parent) {
        parent.children.push(node)
      }
    }
  }

  return root
}

export async function destroySandbox(projectId) {
  const sandbox = activeSandboxes.get(projectId)
  if (sandbox) {
    await sandbox.kill()
    activeSandboxes.delete(projectId)
  }
}

export async function startDevServer(projectId, framework) {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  let command
  switch (framework) {
    case 'react-vite':
      command = 'cd /home/user/project && npm run dev -- --host 0.0.0.0 --port 5173'
      break
    case 'flutter':
      command = 'cd /home/user/project && flutter run -d web-server --web-port=5173 --web-hostname=0.0.0.0'
      break
    default:
      command = 'cd /home/user/project && npm start'
  }

  const process = await sandbox.commands.run(command, {
    background: true,
    timeoutMs: 60000,
  })

  const host = sandbox.getHost(5173)
  return `https://${host}`
}
