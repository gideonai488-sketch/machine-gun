import { Sandbox } from 'e2b'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

const activeSandboxes = new Map<string, Sandbox>()

export async function createSandbox(projectId: string, framework: string): Promise<Sandbox> {
  if (activeSandboxes.has(projectId)) {
    return activeSandboxes.get(projectId)!
  }

  const sandbox = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
    timeoutMs: 10 * 60 * 1000,
  })

  activeSandboxes.set(projectId, sandbox)
  await sandbox.commands.run('mkdir -p /home/user/project', { timeoutMs: 5000 })
  await initializeSandbox(sandbox, framework)

  return sandbox
}

async function initializeSandbox(sandbox: Sandbox, framework: string): Promise<void> {
  switch (framework) {
    case 'react-vite':
      await sandbox.commands.run('cd /home/user/project && npm create vite@latest . -- --template react -y', { timeoutMs: 60000 })
      await sandbox.commands.run('cd /home/user/project && npm install', { timeoutMs: 120000 })
      break
    case 'flutter':
      await sandbox.commands.run('cd /home/user && flutter create project --org com.machinegun --platforms web,android,ios', { timeoutMs: 120000 })
      break
    case 'react-native':
      await sandbox.commands.run('cd /home/user/project && npx react-native@latest init MachineGunApp --directory . --skip-git-init', { timeoutMs: 120000 })
      break
  }
}

export function getSandbox(projectId: string): Sandbox | null {
  return activeSandboxes.get(projectId) ?? null
}

export async function runCommand(projectId: string, command: string, timeoutMs = 30000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  const result = await sandbox.commands.run(command, { timeoutMs, cwd: '/home/user/project' })
  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode }
}

export async function writeFile(projectId: string, path: string, content: string): Promise<void> {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  const fullPath = path.startsWith('/') ? path : `/home/user/project/${path}`
  const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
  await sandbox.commands.run(`mkdir -p "${dir}"`, { timeoutMs: 5000 })
  await sandbox.files.write(fullPath, content)
}

export async function readFile(projectId: string, path: string): Promise<string> {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  const fullPath = path.startsWith('/') ? path : `/home/user/project/${path}`
  return await sandbox.files.read(fullPath)
}

export async function listFiles(projectId: string, path = '/home/user/project'): Promise<FileNode[]> {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  const result = await sandbox.commands.run(
    `find "${path}" -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/build/*' -not -path '*/.dart_tool/*' -not -path '*/.gradle/*' | sort | head -500`,
    { timeoutMs: 10000 }
  )

  if (!result.stdout) return []
  const lines = result.stdout.trim().split('\n').filter(Boolean)
  return buildFileTree(lines, path)
}

function buildFileTree(paths: string[], basePath: string): FileNode[] {
  const root: FileNode[] = []
  const dirMap = new Map<string, FileNode>()

  const sorted = paths
    .map((p) => p.replace(basePath, '').replace(/^\//, ''))
    .filter(Boolean)
    .sort()

  for (const relativePath of sorted) {
    const parts = relativePath.split('/')
    const name = parts[parts.length - 1]
    const parentPath = parts.slice(0, -1).join('/')

    const isDirectory = sorted.some((other) => other !== relativePath && other.startsWith(relativePath + '/'))

    const node: FileNode = {
      name,
      path: relativePath,
      type: isDirectory ? 'directory' : 'file',
      children: isDirectory ? [] : undefined,
    }

    if (isDirectory) dirMap.set(relativePath, node)

    if (parentPath === '') {
      root.push(node)
    } else {
      dirMap.get(parentPath)?.children?.push(node)
    }
  }

  return root
}

export async function startDevServer(projectId: string, framework: string): Promise<string> {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) throw new Error('No sandbox found for project')

  const commands: Record<string, string> = {
    'react-vite': 'cd /home/user/project && npm run dev -- --host 0.0.0.0 --port 5173',
    'flutter': 'cd /home/user/project && flutter run -d web-server --web-port=5173 --web-hostname=0.0.0.0',
    'react-native': 'cd /home/user/project && npx expo start --web --port 5173 --host 0.0.0.0',
  }

  const command = commands[framework] ?? 'cd /home/user/project && npm start'
  await sandbox.commands.run(command, { background: true, timeoutMs: 60000 } as any)
  await new Promise((r) => setTimeout(r, 3000))

  const host = (sandbox as any).getHost(5173)
  return `https://${host}`
}

export async function destroySandbox(projectId: string): Promise<void> {
  const sandbox = activeSandboxes.get(projectId)
  if (sandbox) {
    await (sandbox as any).kill()
    activeSandboxes.delete(projectId)
  }
}
