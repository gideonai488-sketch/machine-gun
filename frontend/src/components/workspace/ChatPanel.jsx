import { useState, useRef, useEffect } from 'react'
import {
  Send,
  User,
  Sparkles,
  Loader2,
  FileCode,
  Package,
  CheckCircle2,
  XCircle,
  Wrench,
  Eye,
  Search,
  Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProject } from '@/stores/project-store'
import { socket } from '@/lib/socket'
import { cn } from '@/lib/utils'

const ACTIVITY_ICONS = {
  file_write: FileCode,
  file_read: Eye,
  command: Wrench,
  install: Package,
  build: Rocket,
  search: Search,
  error: XCircle,
}

function ActivityBubble({ message }) {
  const isRunning = message.status === 'running'
  const isError = message.status === 'error'
  const isSuccess = message.status === 'success'
  const Icon = ACTIVITY_ICONS[message.type] || Wrench

  return (
    <div className="flex items-center gap-2 py-0.5 px-1">
      <div className={cn(
        'w-5 h-5 rounded-md flex items-center justify-center shrink-0',
        isError ? 'bg-destructive/10' : isSuccess ? 'bg-success/10' : 'bg-primary/10'
      )}>
        {isRunning ? (
          <Loader2 className="w-2.5 h-2.5 text-primary animate-spin" />
        ) : isError ? (
          <XCircle className="w-2.5 h-2.5 text-destructive" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-2.5 h-2.5 text-success" />
        ) : (
          <Icon className="w-2.5 h-2.5 text-muted-foreground" />
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {message.message}
        {isSuccess && <span className="text-success ml-1">✓</span>}
        {isError && <span className="text-destructive ml-1">✗</span>}
      </span>
    </div>
  )
}

function MessageBubble({ message }) {
  if (message.role === 'activity') {
    return <ActivityBubble message={message} />
  }

  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-2 sm:gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-primary' : 'bg-card border border-border/60'
      )}>
        {isUser ? (
          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
        ) : (
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
        )}
      </div>
      <div className={cn(
        'rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 max-w-[85%] text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap',
        isUser
          ? 'bg-primary text-white rounded-tr-sm'
          : 'bg-card border border-border/50 rounded-tl-sm'
      )}>
        {message.content || (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPanel() {
  const {
    project,
    chatMessages,
    addChatMessage,
    appendLastAssistantMessage,
    addActivityMessage,
    updateActivityMessage,
  } = useProject()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    function handleChatStream(data) {
      if (data.type === 'start') {
        setIsStreaming(true)
        addChatMessage({ role: 'assistant', content: '' })
      } else if (data.type === 'delta') {
        appendLastAssistantMessage(data.content)
      } else if (data.type === 'done') {
        setIsStreaming(false)
      }
    }

    function handleActivity(data) {
      if (data.update) {
        updateActivityMessage(data)
      } else {
        addActivityMessage(data)
      }
    }

    socket.on('chat:stream', handleChatStream)
    socket.on('activity', handleActivity)
    return () => {
      socket.off('chat:stream', handleChatStream)
      socket.off('activity', handleActivity)
    }
  }, [addChatMessage, appendLastAssistantMessage, addActivityMessage, updateActivityMessage])

  function handleSubmit(e) {
    e.preventDefault()
    const message = input.trim()
    if (!message || !project?.id || isStreaming) return
    setInput('')
    addChatMessage({ role: 'user', content: message })
    socket.emit('chat:send', { projectId: project.id, message })
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function autoResize(e) {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 overscroll-contain">
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-[240px] sm:max-w-xs">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">DevFlow AI</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                I'll build your app and you'll see it live. Just tell me what to change.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {chatMessages.map((msg, i) => (
              <MessageBubble key={msg.id || i} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/50 bg-surface p-2 sm:p-3">
        <form onSubmit={handleSubmit}>
          <div className="bg-background border border-border/50 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/30 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(e) }}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? 'Wait for response...' : 'Ask DevFlow to build something...'}
              rows={1}
              disabled={isStreaming}
              className="w-full bg-transparent resize-none px-3 sm:px-3.5 pt-2.5 sm:pt-3 pb-1 text-[13px] sm:text-sm placeholder:text-muted-foreground/40 focus:outline-none leading-relaxed disabled:opacity-50"
            />
            <div className="flex items-center justify-end px-2 pb-1.5 sm:pb-2">
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isStreaming}
                className="h-8 w-8 sm:h-7 sm:w-7 rounded-lg"
              >
                {isStreaming ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
