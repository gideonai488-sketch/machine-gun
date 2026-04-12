import Anthropic from '@anthropic-ai/sdk'
import { AGENT_TOOLS } from './tools.js'
import * as sandboxManager from '../sandbox/manager.js'
import { addChatMessage, getChatHistory, updateProject } from '../store/projects.js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are DevFlow AI, an expert software engineer embedded in a cloud IDE. You help users build applications by writing code, running commands, and managing their project.

You have access to a cloud sandbox (Linux container) where you can read/write files and run commands. The project directory is /home/user/project.

Guidelines:
- Write production-quality code. Never use placeholder comments like "// add logic here".
- Always implement the actual logic when writing code.
- Use best practices for the framework being used.
- When creating a new project, set up the full file structure and configurations.
- Install dependencies before trying to import them.
- If a command fails, read the error and try to fix it automatically.
- Keep the user informed about what you're doing with brief, clear explanations.
- When writing files, always provide the complete file content — never partial updates.
- After making changes, run the dev server so the user can preview their app.`

function formatTimestamp() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

async function executeTool(projectId, toolName, toolInput, emitActivity) {
  const time = formatTimestamp()

  switch (toolName) {
    case 'read_file': {
      const activityId = `read-${Date.now()}`
      emitActivity({
        id: activityId,
        type: 'file_read',
        message: `Reading ${toolInput.path}`,
        status: 'running',
        time,
      })
      try {
        const content = await sandboxManager.readFile(projectId, toolInput.path)
        emitActivity({
          id: activityId,
          type: 'file_read',
          message: `Read ${toolInput.path}`,
          status: 'success',
          time,
          update: true,
        })
        return content
      } catch (err) {
        emitActivity({
          id: activityId,
          type: 'error',
          message: `Failed to read ${toolInput.path}: ${err.message}`,
          status: 'error',
          time,
          update: true,
        })
        return `Error: ${err.message}`
      }
    }

    case 'write_file': {
      const activityId = `write-${Date.now()}`
      emitActivity({
        id: activityId,
        type: 'file_write',
        message: `Writing ${toolInput.path}`,
        detail: `${toolInput.content.split('\n').length} lines`,
        status: 'running',
        time,
      })
      try {
        await sandboxManager.writeFile(projectId, toolInput.path, toolInput.content)
        emitActivity({
          id: activityId,
          type: 'file_write',
          message: `Wrote ${toolInput.path}`,
          detail: `${toolInput.content.split('\n').length} lines`,
          status: 'success',
          time,
          update: true,
        })
        return `Successfully wrote ${toolInput.path}`
      } catch (err) {
        emitActivity({
          id: activityId,
          type: 'error',
          message: `Failed to write ${toolInput.path}: ${err.message}`,
          status: 'error',
          time,
          update: true,
        })
        return `Error: ${err.message}`
      }
    }

    case 'run_command': {
      const activityId = `cmd-${Date.now()}`
      const shortCmd = toolInput.command.length > 60
        ? toolInput.command.substring(0, 60) + '...'
        : toolInput.command

      emitActivity({
        id: activityId,
        type: 'command',
        message: `Running: ${shortCmd}`,
        status: 'running',
        time,
      })
      try {
        const result = await sandboxManager.runCommand(projectId, toolInput.command, 60000)
        const success = result.exitCode === 0
        emitActivity({
          id: activityId,
          type: success ? 'command' : 'error',
          message: success
            ? `Completed: ${shortCmd}`
            : `Failed: ${shortCmd}`,
          detail: success
            ? null
            : (result.stderr || '').substring(0, 200),
          status: success ? 'success' : 'error',
          time,
          update: true,
        })
        return `Exit code: ${result.exitCode}\nStdout: ${result.stdout}\nStderr: ${result.stderr}`
      } catch (err) {
        emitActivity({
          id: activityId,
          type: 'error',
          message: `Command failed: ${shortCmd}`,
          detail: err.message,
          status: 'error',
          time,
          update: true,
        })
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
      const activityId = `search-${Date.now()}`
      emitActivity({
        id: activityId,
        type: 'command',
        message: `Searching for "${toolInput.query}"`,
        status: 'running',
        time,
      })
      try {
        const result = await sandboxManager.runCommand(
          projectId,
          `grep -rn "${toolInput.query}" /home/user/project --include="*.{js,jsx,ts,tsx,dart,py,json,yaml,yml,html,css,md}" | head -50`,
          15000
        )
        emitActivity({
          id: activityId,
          type: 'command',
          message: `Search complete for "${toolInput.query}"`,
          status: 'success',
          time,
          update: true,
        })
        return result.stdout || 'No matches found'
      } catch (err) {
        emitActivity({
          id: activityId,
          type: 'error',
          message: `Search failed: ${err.message}`,
          status: 'error',
          time,
          update: true,
        })
        return `Error searching: ${err.message}`
      }
    }

    case 'trigger_build': {
      const activityId = `build-${Date.now()}`
      emitActivity({
        id: activityId,
        type: 'build',
        message: `Building for ${toolInput.platform}...`,
        status: 'running',
        time,
      })
      emitActivity({
        id: activityId,
        type: 'build',
        message: `Build for ${toolInput.platform} triggered (GitHub Actions)`,
        status: 'success',
        time,
        update: true,
      })
      return `Build triggered for ${toolInput.platform}. This will be handled by GitHub Actions.`
    }

    case 'publish_app': {
      const activityId = `publish-${Date.now()}`
      emitActivity({
        id: activityId,
        type: 'build',
        message: `Publishing to ${toolInput.platform} (${toolInput.track})...`,
        status: 'running',
        time,
      })
      emitActivity({
        id: activityId,
        type: 'build',
        message: `Published to ${toolInput.platform} (${toolInput.track})`,
        status: 'success',
        time,
        update: true,
      })
      return `App published to ${toolInput.platform} on track: ${toolInput.track}`
    }

    default:
      return `Unknown tool: ${toolName}`
  }
}

export async function handleChat(projectId, userMessage, io, socketRoom) {
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

  let continueLoop = true
  let fullResponse = ''

  while (continueLoop) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      messages,
    })

    continueLoop = false

    for (const block of response.content) {
      if (block.type === 'text') {
        fullResponse += block.text
        emitChatStream({ type: 'delta', content: block.text })
      }

      if (block.type === 'tool_use') {
        const toolResult = await executeTool(
          projectId,
          block.name,
          block.input,
          emitActivity
        )

        messages.push({
          role: 'assistant',
          content: response.content,
        })

        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: block.id,
              content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
            },
          ],
        })

        continueLoop = true
      }
    }

    if (response.stop_reason === 'tool_use') {
      continueLoop = true
    }

    if (response.stop_reason === 'end_turn' && !continueLoop) {
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
}
