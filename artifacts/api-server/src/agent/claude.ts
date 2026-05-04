import Anthropic from '@anthropic-ai/sdk'
import type { Server } from 'socket.io'
import { AGENT_TOOLS } from './tools.js'
import * as sandboxManager from '../sandbox/manager.js'
import { addChatMessage, getChatHistory, getProject, updateProject } from '../store/projects.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are Machine Gun AI — a world-class software engineer. You don't talk, you build.

## CORE BEHAVIOR: SHUT UP AND BUILD
- When the user asks for something, DO NOT explain what you're about to do.
- DO NOT share your plan. DO NOT narrate your steps. DO NOT ask clarifying questions unless absolutely critical.
- Just start building. Immediately. Use your tools. Write code. Install packages. Get it done.
- Think deeply INTERNALLY about what the user really wants. Read between the lines.
- ONLY speak to the user AFTER you're done building — give a short, confident summary of what you built.

## COMMUNICATION RULES
- BEFORE building: Say NOTHING. Just start using tools.
- DURING building: Say NOTHING. The activity feed shows progress automatically.
- AFTER building: One short message. Example: "Done — added dark mode with a toggle in the header. Check the preview."
- Keep it under 2 sentences. No bullet points. No technical details.
- Only mention problems if you genuinely cannot fix them after 3 retries.

## HOW YOU THINK (internally, never shown to user)
1. Read the user's message. Think about what they ACTUALLY want.
2. If the project exists, call list_files and read_file on key files to understand current state.
3. Never blindly overwrite. Always read first, then write the full improved version.
4. Plan internally. Figure out all files that need changing.
5. Execute everything in sequence. Install deps, write files, restart server.
6. If a command fails, diagnose silently, fix it, retry (up to 3 times).
7. Make sure the dev server is running so the preview updates.
8. Only THEN send a brief message to the user.

## YOUR ENVIRONMENT
- Full Linux cloud computer. Project at /home/user/project.
- User sees ONLY chat + live preview. No terminal, no file system, no raw output ever.
- Hot reload is active — code changes appear in preview automatically.

## CODE QUALITY
- Production-quality only. Zero placeholders. Zero "// TODO".
- Every function has real, complete, working logic with error handling.
- Follow existing code style, naming conventions, and patterns.
- Write COMPLETE file contents, never partial diffs.
- Install dependencies before importing them.

## NEVER DO THIS
- Never explain your plan before building
- Never narrate steps or say "First I'll..." or "Now I'm going to..."
- Never show raw errors, terminal output, file paths, or stack traces to the user
- Never write placeholder code
- Never ask "would you like me to..." — just do it`

const MAX_CONVERSATION_MESSAGES = 40
const projectLocks = new Map<string, boolean>()

async function acquireLock(projectId: string): Promise<void> {
  while (projectLocks.get(projectId)) {
    await new Promise((r) => setTimeout(r, 100))
  }
  projectLocks.set(projectId, true)
}

function releaseLock(projectId: string): void {
  projectLocks.delete(projectId)
}

function humanizeActivity(toolName: string, toolInput: Record<string, any>): { message: string; type: string } {
  switch (toolName) {
    case 'write_file': {
      const name = toolInput['path']?.split('/').pop() ?? toolInput['path']
      return { message: `Creating ${name}`, type: 'file_write' }
    }
    case 'read_file': {
      const name = toolInput['path']?.split('/').pop() ?? toolInput['path']
      return { message: `Reading ${name}`, type: 'file_read' }
    }
    case 'run_command': {
      const cmd: string = toolInput['command'] ?? ''
      if (cmd.includes('npm install') || cmd.includes('npm i ') || cmd.includes('yarn add') || cmd.includes('flutter pub'))
        return { message: 'Installing packages', type: 'install' }
      if (cmd.includes('npm run build') || cmd.includes('flutter build'))
        return { message: 'Building project', type: 'build' }
      if (cmd.includes('npm run dev') || cmd.includes('npm start') || cmd.includes('flutter run'))
        return { message: 'Starting dev server', type: 'command' }
      if (cmd.includes('npm create') || cmd.includes('npx create'))
        return { message: 'Scaffolding project', type: 'command' }
      if (cmd.includes('mkdir')) return { message: 'Setting up project structure', type: 'command' }
      return { message: 'Running a command', type: 'command' }
    }
    case 'list_files': return { message: 'Scanning project files', type: 'file_read' }
    case 'search_code': return { message: 'Searching codebase', type: 'file_read' }
    default: return { message: 'Working...', type: 'command' }
  }
}

async function executeTool(projectId: string, toolName: string, toolInput: Record<string, any>): Promise<string> {
  switch (toolName) {
    case 'read_file': {
      try { return await sandboxManager.readFile(projectId, toolInput['path'] as string) }
      catch (err: any) { return `Error: ${err.message}` }
    }
    case 'write_file': {
      try {
        await sandboxManager.writeFile(projectId, toolInput['path'] as string, toolInput['content'] as string)
        return `Successfully wrote ${toolInput['path']} (${(toolInput['content'] as string).split('\n').length} lines)`
      } catch (err: any) { return `Error: ${err.message}` }
    }
    case 'run_command': {
      try {
        const result = await sandboxManager.runCommand(projectId, toolInput['command'] as string, 120000)
        const parts: string[] = []
        if (result.stdout) parts.push(`stdout:\n${result.stdout}`)
        if (result.stderr) parts.push(`stderr:\n${result.stderr}`)
        return `Exit code: ${result.exitCode}\n${parts.join('\n')}`
      } catch (err: any) { return `Error running command: ${err.message}` }
    }
    case 'list_files': {
      try {
        const files = await sandboxManager.listFiles(
          projectId,
          toolInput['path'] ? `/home/user/project/${toolInput['path']}` : '/home/user/project'
        )
        return JSON.stringify(files, null, 2)
      } catch (err: any) { return `Error listing files: ${err.message}` }
    }
    case 'search_code': {
      try {
        const result = await sandboxManager.runCommand(
          projectId,
          `grep -rn "${toolInput['query']}" /home/user/project --include="*.{js,jsx,ts,tsx,dart,py,json,yaml,html,css}" | head -50`,
          15000
        )
        return result.stdout || 'No matches found'
      } catch (err: any) { return `Error searching: ${err.message}` }
    }
    default: return `Unknown tool: ${toolName}`
  }
}

function trimConversation(messages: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  if (messages.length <= MAX_CONVERSATION_MESSAGES) return messages
  const first = messages[0]
  const recent = messages.slice(-MAX_CONVERSATION_MESSAGES + 2)
  return [
    first,
    { role: 'assistant', content: '[Earlier conversation trimmed. The project has been built based on previous messages. Read the codebase to understand current state.]' },
    ...recent,
  ]
}

export async function handleChat(projectId: string, userMessage: string, io: Server, socketRoom: string): Promise<string> {
  await acquireLock(projectId)

  try {
    const emit = (event: string, data: any) => io.to(socketRoom).emit(event, data)

    const project = await getProject(projectId)
    const contextPrefix = project
      ? `Project framework: ${project.framework}${project.previewUrl ? `\nPreview URL: ${project.previewUrl}` : ''}\nProject name: ${project.name}`
      : ''

    const enrichedMessage = contextPrefix ? `[Context: ${contextPrefix}]\n\nUser message: ${userMessage}` : userMessage

    addChatMessage(projectId, { role: 'user', content: userMessage })

    const history = getChatHistory(projectId)
    let messages: Anthropic.MessageParam[] = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }))

    if (messages.length > 0) {
      messages[messages.length - 1] = { role: 'user', content: enrichedMessage }
    }

    messages = trimConversation(messages)

    emit('chat:stream', { type: 'start' })

    let fullResponse = ''
    let continueLoop = true
    let loopCount = 0
    const maxLoops = 25

    while (continueLoop && loopCount < maxLoops) {
      loopCount++

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 16384,
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS as any,
        messages,
      })

      continueLoop = false

      const textBlocks = response.content.filter((b) => b.type === 'text') as Anthropic.TextBlock[]
      const toolBlocks = response.content.filter((b) => b.type === 'tool_use') as Anthropic.ToolUseBlock[]

      for (const block of textBlocks) {
        fullResponse += block.text
        emit('chat:stream', { type: 'delta', content: block.text })
      }

      if (toolBlocks.length > 0) {
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of toolBlocks) {
          const activityId = `${block.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          const { message: actMsg, type: actType } = humanizeActivity(block.name, block.input as Record<string, any>)

          emit('activity', { id: activityId, type: actType, message: actMsg, status: 'running' })

          const result = await executeTool(projectId, block.name, block.input as Record<string, any>)

          const isError = result.startsWith('Error') ||
            (result.includes('Exit code:') && !result.includes('Exit code: 0'))

          emit('activity', { id: activityId, type: actType, message: actMsg, status: isError ? 'error' : 'success', update: true })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
            is_error: isError,
          })
        }

        messages.push({ role: 'assistant', content: response.content })
        messages.push({ role: 'user', content: toolResults })
        continueLoop = true
      }

      if (response.stop_reason === 'end_turn' && toolBlocks.length === 0) break
    }

    emit('chat:stream', { type: 'done' })

    if (fullResponse) {
      addChatMessage(projectId, { role: 'assistant', content: fullResponse })
    }

    const files = await sandboxManager.listFiles(projectId).catch(() => [])
    emit('files:updated', { files })

    return fullResponse
  } finally {
    releaseLock(projectId)
  }
}
