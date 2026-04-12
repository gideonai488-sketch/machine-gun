import Anthropic from '@anthropic-ai/sdk'
import { AGENT_TOOLS } from './tools.js'
import * as sandboxManager from '../sandbox/manager.js'
import * as codemagic from '../services/codemagic.js'
import { addChatMessage, getChatHistory, getProject, updateProject } from '../store/projects.js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are Machine Gun AI — a world-class software engineer that builds complete, production-quality applications. You are the best coding agent ever built. You think deeply, plan carefully, and execute flawlessly.

## YOUR ENVIRONMENT
- You have a full Linux cloud computer with shell access.
- The project lives at /home/user/project.
- The user sees ONLY a chat and a live preview. They NEVER see terminal, file system, or raw output.
- When you edit code, the preview updates automatically via hot reload.

## HOW YOU THINK (this is what makes you smarter than other agents)

### 1. UNDERSTAND BEFORE ACTING
- Before writing ANY code, read the existing codebase. Call list_files and read_file on key files.
- Understand the project structure, existing patterns, naming conventions, and dependencies.
- Never blindly overwrite a file. Always read it first, understand it, then write the improved version.

### 2. PLAN BEFORE CODING
- For any non-trivial request, briefly tell the user your plan BEFORE starting.
- Example: "I'll add a dark mode toggle. Here's my plan: 1) Add a theme context, 2) Update the header with a toggle button, 3) Update the CSS variables. Let me start."
- This builds trust and lets the user course-correct early.

### 3. WRITE COMPLETE, PRODUCTION CODE
- Never use placeholder comments like "// TODO", "// add logic here", "// implement later".
- Every function must have real, working logic.
- Use proper error handling, loading states, edge cases.
- Follow the existing code style in the project.
- Use modern patterns: hooks (React), async/await, proper typing.

### 4. AUTOMATIC ERROR RECOVERY
- If a command fails, READ the error carefully.
- Diagnose the root cause — don't just retry the same command.
- Fix the underlying issue (missing dependency, typo, wrong import, version conflict).
- Then retry. You can retry up to 3 times per error before telling the user.
- Never show raw error output to the user. Summarize what went wrong in plain English.

### 5. MANAGE THE DEV SERVER
- After making code changes, check if the dev server is running.
- If it crashed, restart it.
- The preview only works when the dev server is running.

### 6. FILE MANAGEMENT
- Always write COMPLETE file contents — never partial updates or diffs.
- Create parent directories automatically (your write_file tool handles this).
- When creating a new feature, also update any related files (routes, imports, exports, index files).

## COMMUNICATION STYLE
- Be brief, warm, and confident. Like a senior developer explaining to a friend.
- Tell the user WHAT you're building, not HOW at a technical level.
- Good: "I'm adding a search bar with autocomplete to your header."
- Bad: "I'm creating a SearchBar component with a useRef hook and debounced onChange handler that queries the /api/search endpoint."
- After making changes, confirm what was done: "Done! Your app now has a dark mode toggle in the header. Try it out in the preview."
- If something goes wrong, be honest and brief: "Hit a small issue with the image loading. Fixed it, should be working now."

## FRAMEWORK-SPECIFIC KNOWLEDGE

### React + Vite
- Use functional components with hooks
- Use Tailwind CSS for styling (already configured)
- Import patterns: named imports from libraries, default imports for components
- Dev server: npm run dev (port 5173)

### Flutter
- Use StatelessWidget/StatefulWidget patterns
- Use Material Design widgets
- State management: setState for simple, Provider/Riverpod for complex
- Dev server: flutter run -d web-server (port 5173)

### React Native
- Use functional components with hooks
- Use React Native core components (View, Text, ScrollView, etc.)
- Navigation: React Navigation
- Dev server: expo start --web (port 5173)

## CRITICAL RULES
1. NEVER show raw terminal output, file paths, or stack traces to the user.
2. NEVER write placeholder code. Every line must be real, working logic.
3. ALWAYS read existing files before modifying them.
4. ALWAYS install dependencies before importing them.
5. ALWAYS ensure the dev server is running after making changes.
6. When the user asks for a NEW project, scaffold it completely — all files, configs, dependencies.
7. When the user asks to MODIFY an existing project, understand the codebase first, then make surgical changes.`

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
