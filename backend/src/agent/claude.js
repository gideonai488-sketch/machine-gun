import Anthropic from '@anthropic-ai/sdk'
import { AGENT_TOOLS } from './tools.js'
import * as sandboxManager from '../sandbox/manager.js'
import * as codemagic from '../services/codemagic.js'
import { addChatMessage, getChatHistory, getProject, updateProject } from '../store/projects.js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are Machine Gun AI, an expert software engineer powering a cloud IDE. Users describe what they want to build and you build it for them.

You have a full Linux cloud computer with shell access. The project lives at /home/user/project. The user NEVER sees the terminal, file system, or any raw output — they only see a chat and a live preview of the running app.

Rules:
- Write production-quality, complete code. Never use placeholder comments.
- Always implement actual working logic.
- Follow best practices for the framework.
- When starting a new project, create the full file structure and all configs.
- Install dependencies before importing them.
- If a command fails, read the error and fix it automatically without telling the user about raw errors.
- Keep your chat messages brief and friendly — tell the user what you're building, not implementation details.
- When writing files, always provide complete file content.
- After making changes, make sure the dev server is running so the preview updates.
- Never show raw terminal output, file paths, or error logs to the user. Summarize in plain english.
- You can run multiple tools in sequence to complete a task.`

const projectLocks = new Map()

async function acquireLock(projectId) {
  while (projectLocks.get(projectId)) {
    await new Promise((r) => setTimeout(r, 100))
  }
  projectLocks.set(projectId, true)
}

function releaseLock(projectId) {
  projectLocks.delete(projectId)
}

function humanizeActivity(toolName, toolInput) {
  switch (toolName) {
    case 'write_file': {
      const name = toolInput.path?.split('/').pop() || toolInput.path
      return { message: `Creating ${name}`, type: 'file_write' }
    }
    case 'read_file': {
      const name = toolInput.path?.split('/').pop() || toolInput.path
      return { message: `Reading ${name}`, type: 'file_read' }
    }
    case 'run_command': {
      const cmd = toolInput.command || ''
      if (cmd.includes('npm install') || cmd.includes('npm i ') || cmd.includes('yarn add') || cmd.includes('flutter pub'))
        return { message: 'Installing packages', type: 'install' }
      if (cmd.includes('npm run build') || cmd.includes('flutter build'))
        return { message: 'Building project', type: 'build' }
      if (cmd.includes('npm run dev') || cmd.includes('npm start') || cmd.includes('flutter run'))
        return { message: 'Starting dev server', type: 'command' }
      if (cmd.includes('npm create') || cmd.includes('npx create'))
        return { message: 'Scaffolding project', type: 'command' }
      if (cmd.includes('mkdir'))
        return { message: 'Setting up project structure', type: 'command' }
      return { message: 'Running a command', type: 'command' }
    }
    case 'list_files':
      return { message: 'Scanning project files', type: 'file_read' }
    case 'search_code':
      return { message: `Searching codebase`, type: 'file_read' }
    case 'trigger_build':
      return { message: `Building for ${toolInput.platform}`, type: 'build' }
    case 'publish_app':
      return { message: `Publishing to ${toolInput.platform}`, type: 'build' }
    default:
      return { message: 'Working...', type: 'command' }
  }
}

async function executeTool(projectId, toolName, toolInput) {
  switch (toolName) {
    case 'read_file': {
      try {
        return await sandboxManager.readFile(projectId, toolInput.path)
      } catch (err) {
        return `Error: ${err.message}`
      }
    }

    case 'write_file': {
      try {
        await sandboxManager.writeFile(projectId, toolInput.path, toolInput.content)
        return `Successfully wrote ${toolInput.path}`
      } catch (err) {
        return `Error: ${err.message}`
      }
    }

    case 'run_command': {
      try {
        const result = await sandboxManager.runCommand(projectId, toolInput.command, 120000)
        return `Exit code: ${result.exitCode}\nStdout: ${result.stdout}\nStderr: ${result.stderr}`
      } catch (err) {
        return `Error running command: ${err.message}`
      }
    }

    case 'list_files': {
      try {
        const files = await sandboxManager.listFiles(
          projectId,
          toolInput.path ? `/home/user/project/${toolInput.path}` : '/home/user/project'
        )
        return JSON.stringify(files, null, 2)
      } catch (err) {
        return `Error listing files: ${err.message}`
      }
    }

    case 'search_code': {
      try {
        const result = await sandboxManager.runCommand(
          projectId,
          `grep -rn "${toolInput.query}" /home/user/project --include="*.{js,jsx,ts,tsx,dart,py,json,yaml,yml,html,css,md}" | head -50`,
          15000
        )
        return result.stdout || 'No matches found'
      } catch (err) {
        return `Error searching: ${err.message}`
      }
    }

    case 'trigger_build': {
      try {
        const project = getProject(projectId)
        const framework = project?.framework || 'react-vite'

        if (!process.env.CODEMAGIC_API_TOKEN || !process.env.CODEMAGIC_APP_ID) {
          return `Build for ${toolInput.platform} is ready to go. To enable cloud builds, connect your Codemagic account in Settings with CODEMAGIC_API_TOKEN and CODEMAGIC_APP_ID.`
        }

        const workflowMap = {
          android: 'android-release',
          ios: 'ios-release',
          web: 'web-release',
        }

        const workflowId = workflowMap[toolInput.platform]
        if (!workflowId) return `Unknown platform: ${toolInput.platform}`

        const result = await codemagic.startBuild({
          appId: process.env.CODEMAGIC_APP_ID,
          workflowId,
          branch: 'main',
        })

        return `Build started for ${toolInput.platform}. Build ID: ${result.buildId}. Codemagic is now building your ${toolInput.platform === 'android' ? 'AAB' : toolInput.platform === 'ios' ? 'IPA' : 'web'} artifact. You can track progress in the Codemagic dashboard.`
      } catch (err) {
        return `Failed to trigger build: ${err.message}`
      }
    }

    case 'publish_app': {
      try {
        if (!process.env.CODEMAGIC_API_TOKEN || !process.env.CODEMAGIC_APP_ID) {
          return `Publishing to ${toolInput.platform} (${toolInput.track}) is ready to go. To enable automatic publishing, connect your Codemagic account and configure store credentials (Google Play service account or App Store Connect API key) in the Codemagic dashboard.`
        }

        const workflowMap = {
          android: 'android-release',
          ios: 'ios-release',
        }

        const workflowId = workflowMap[toolInput.platform]
        if (!workflowId) return `Unknown platform: ${toolInput.platform}`

        const environment = {
          variables: {
            PUBLISH_TRACK: toolInput.track,
          },
        }

        const result = await codemagic.startBuild({
          appId: process.env.CODEMAGIC_APP_ID,
          workflowId,
          branch: 'main',
          environment,
        })

        return `Publish build started for ${toolInput.platform} on track "${toolInput.track}". Build ID: ${result.buildId}. Codemagic will build and publish to ${toolInput.platform === 'android' ? 'Google Play' : 'App Store Connect'} automatically.`
      } catch (err) {
        return `Failed to publish: ${err.message}`
      }
    }

    default:
      return `Unknown tool: ${toolName}`
  }
}

export async function handleChat(projectId, userMessage, io, socketRoom) {
  await acquireLock(projectId)

  try {
    const emitActivity = (activity) => {
      io.to(socketRoom).emit('activity', activity)
    }

    const emitChatStream = (data) => {
      io.to(socketRoom).emit('chat:stream', data)
    }

    addChatMessage(projectId, { role: 'user', content: userMessage })

    const history = getChatHistory(projectId)
    const messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    emitChatStream({ type: 'start' })

    let fullResponse = ''
    let continueLoop = true

    while (continueLoop) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS,
        messages,
      })

      continueLoop = false

      const textBlocks = response.content.filter((b) => b.type === 'text')
      const toolBlocks = response.content.filter((b) => b.type === 'tool_use')

      for (const block of textBlocks) {
        fullResponse += block.text
        emitChatStream({ type: 'delta', content: block.text })
      }

      if (toolBlocks.length > 0) {
        const toolResults = []

        for (const block of toolBlocks) {
          const activityId = `${block.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          const { message: actMsg, type: actType } = humanizeActivity(block.name, block.input)

          emitActivity({
            id: activityId,
            type: actType,
            message: actMsg,
            status: 'running',
          })

          const result = await executeTool(projectId, block.name, block.input)
          const succeeded = !result.startsWith?.('Error')

          emitActivity({
            id: activityId,
            type: actType,
            message: actMsg,
            status: succeeded ? 'success' : 'error',
            update: true,
          })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: typeof result === 'string' ? result : JSON.stringify(result),
          })
        }

        messages.push({
          role: 'assistant',
          content: response.content,
        })

        messages.push({
          role: 'user',
          content: toolResults,
        })

        continueLoop = true
      }

      if (response.stop_reason === 'end_turn' && toolBlocks.length === 0) {
        break
      }
    }

    emitChatStream({ type: 'done' })

    if (fullResponse) {
      addChatMessage(projectId, { role: 'assistant', content: fullResponse })
    }

    const files = await sandboxManager.listFiles(projectId).catch(() => [])
    io.to(socketRoom).emit('files:updated', { files })

    return fullResponse
  } finally {
    releaseLock(projectId)
  }
}
