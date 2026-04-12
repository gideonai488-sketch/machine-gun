import Anthropic from '@anthropic-ai/sdk'
import { AGENT_TOOLS } from './tools.js'
import * as sandboxManager from '../sandbox/manager.js'
import * as codemagic from '../services/codemagic.js'
import { addChatMessage, getChatHistory, getProject, updateProject } from '../store/projects.js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are Machine Gun AI — a world-class software engineer. You don't talk, you build.

## CORE BEHAVIOR: SHUT UP AND BUILD
- When the user asks for something, DO NOT explain what you're about to do.
- DO NOT share your plan. DO NOT narrate your steps. DO NOT ask clarifying questions unless absolutely critical.
- Just start building. Immediately. Use your tools. Write code. Install packages. Get it done.
- Think deeply INTERNALLY about what the user really wants. Read between the lines. Understand the full picture.
- ONLY speak to the user AFTER you're done building — give a short, confident summary of what you built.

## COMMUNICATION RULES
- BEFORE building: Say NOTHING. Just start using tools.
- DURING building: Say NOTHING. The activity feed shows progress automatically.
- AFTER building: One short message. Example: "Done — added dark mode with a toggle in the header. Check the preview."
- Keep it under 2 sentences. No bullet points. No technical details. No code snippets.
- If something went wrong and you fixed it, don't even mention it. Just deliver the working result.
- Only mention problems if you genuinely cannot fix them after 3 retries.

## HOW YOU THINK (internally, never shown to user)
1. Read the user's message. Think about what they ACTUALLY want, not just what they literally said.
2. If the project exists, call list_files and read_file on key files to understand current state.
3. Never blindly overwrite. Always read first, then write the full improved version.
4. Plan your approach internally. Figure out all files that need changing.
5. Execute everything in sequence. Install deps, write files, restart server.
6. If a command fails, diagnose silently, fix it, retry (up to 3 times).
7. Make sure the dev server is running so the preview updates.
8. Only THEN send a brief message to the user.

## YOUR ENVIRONMENT
- Full Linux cloud computer. Project at /home/user/project.
- User sees ONLY chat + live preview. No terminal, no file system, no raw output ever.
- Hot reload is active — code changes appear in preview automatically.

## CODE QUALITY
- Production-quality only. Zero placeholders. Zero "// TODO". Zero "// add logic here".
- Every function has real, complete, working logic with error handling.
- Follow existing code style, naming conventions, and patterns in the project.
- Write COMPLETE file contents, never partial diffs.
- Install dependencies before importing them.

## FRAMEWORK KNOWLEDGE
- React + Vite: functional components, hooks, Tailwind CSS, dev on port 5173
- Flutter: StatelessWidget/StatefulWidget, Material Design, dart, dev on port 5173
- React Native: functional components, hooks, React Navigation, expo on port 5173

## NEVER DO THIS
- Never explain your plan before building
- Never narrate steps ("First I'll...", "Now I'm going to...")
- Never show raw errors, terminal output, file paths, or stack traces
- Never write placeholder code
- Never ask "would you like me to..." — just do it
- Never list what you're about to do in bullet points
- Never say "Let me..." — just do it silently`

const MAX_CONVERSATION_MESSAGES = 40
const MAX_ERROR_RETRIES = 3

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
      return { message: 'Searching codebase', type: 'file_read' }
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
        return `Successfully wrote ${toolInput.path} (${toolInput.content.split('\n').length} lines)`
      } catch (err) {
        return `Error: ${err.message}`
      }
    }

    case 'run_command': {
      try {
        const result = await sandboxManager.runCommand(projectId, toolInput.command, 120000)
        const output = []
        if (result.stdout) output.push(`stdout:\n${result.stdout}`)
        if (result.stderr) output.push(`stderr:\n${result.stderr}`)
        return `Exit code: ${result.exitCode}\n${output.join('\n')}`
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
        if (!process.env.CODEMAGIC_API_TOKEN || !process.env.CODEMAGIC_APP_ID) {
          return `Build for ${toolInput.platform} is ready. To enable cloud builds, connect Codemagic in Settings.`
        }
        const workflowMap = { android: 'android-release', ios: 'ios-release', web: 'web-release' }
        const workflowId = workflowMap[toolInput.platform]
        if (!workflowId) return `Unknown platform: ${toolInput.platform}`
        const result = await codemagic.startBuild({ appId: process.env.CODEMAGIC_APP_ID, workflowId, branch: 'main' })
        return `Build started for ${toolInput.platform}. Build ID: ${result.buildId}.`
      } catch (err) {
        return `Failed to trigger build: ${err.message}`
      }
    }

    case 'publish_app': {
      try {
        if (!process.env.CODEMAGIC_API_TOKEN || !process.env.CODEMAGIC_APP_ID) {
          return `Publishing to ${toolInput.platform} (${toolInput.track}) is ready. Connect Codemagic and store credentials in Settings.`
        }
        const workflowMap = { android: 'android-release', ios: 'ios-release' }
        const workflowId = workflowMap[toolInput.platform]
        if (!workflowId) return `Unknown platform: ${toolInput.platform}`
        const result = await codemagic.startBuild({
          appId: process.env.CODEMAGIC_APP_ID,
          workflowId,
          branch: 'main',
          environment: { variables: { PUBLISH_TRACK: toolInput.track } },
        })
        return `Publish build started for ${toolInput.platform} (${toolInput.track}). Build ID: ${result.buildId}.`
      } catch (err) {
        return `Failed to publish: ${err.message}`
      }
    }

    default:
      return `Unknown tool: ${toolName}`
  }
}

function buildContextPrefix(project) {
  const parts = [`Project framework: ${project.framework}`]
  if (project.previewUrl) parts.push(`Preview URL: ${project.previewUrl}`)
  parts.push(`Project name: ${project.name}`)
  return parts.join('\n')
}

function trimConversation(messages) {
  if (messages.length <= MAX_CONVERSATION_MESSAGES) return messages

  const firstUserMessage = messages[0]
  const recentMessages = messages.slice(-MAX_CONVERSATION_MESSAGES + 2)

  return [
    firstUserMessage,
    {
      role: 'assistant',
      content: '[Earlier conversation trimmed for context window. The project has been built and modified based on previous messages. Read the current codebase to understand the current state.]',
    },
    ...recentMessages,
  ]
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

    const project = getProject(projectId)
    const contextPrefix = project ? buildContextPrefix(project) : ''

    const enrichedMessage = contextPrefix
      ? `[Context: ${contextPrefix}]\n\nUser message: ${userMessage}`
      : userMessage

    addChatMessage(projectId, { role: 'user', content: userMessage })

    const history = getChatHistory(projectId)
    let messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    if (messages.length > 0) {
      messages[messages.length - 1] = {
        role: 'user',
        content: enrichedMessage,
      }
    }

    messages = trimConversation(messages)

    emitChatStream({ type: 'start' })

    let fullResponse = ''
    let continueLoop = true
    let loopCount = 0
    const maxLoops = 25

    while (continueLoop && loopCount < maxLoops) {
      loopCount++

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16384,
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

          const isError = result.startsWith?.('Error') ||
            (result.includes?.('Exit code:') && !result.includes('Exit code: 0'))

          emitActivity({
            id: activityId,
            type: actType,
            message: actMsg,
            status: isError ? 'error' : 'success',
            update: true,
          })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: typeof result === 'string' ? result : JSON.stringify(result),
            is_error: isError,
          })
        }

        messages.push({ role: 'assistant', content: response.content })
        messages.push({ role: 'user', content: toolResults })

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
