import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProject } from '@/stores/project-store'
import { socket } from '@/lib/socket'
import { cn } from '@/lib/utils'

export default function ChatPanel() {
  const { project, chatMessages, addChatMessage, updateLastAssistantMessage } = useProject()
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    function handleChatStream(data) {
      if (data.type === 'start') {
        setIsStreaming(true)
        addChatMessage({ role: 'assistant', content: '' })
      } else if (data.type === 'delta') {
        updateLastAssistantMessage((prev) => prev + data.content)
      } else if (data.type === 'done') {
        setIsStreaming(false)
      }
    }

    socket.on('chat:stream', handleChatStream)
    return () => socket.off('chat:stream', handleChatStream)
  }, [addChatMessage, updateLastAssistantMessage])

  async function handleSend(e) {
    e.preventDefault()
    const message = input.trim()
    if (!message || !project?.id || isStreaming) return

    setInput('')
    addChatMessage({ role: 'user', content: message })

    socket.emit('chat:send', {
      projectId: project.id,
      message,
    })
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Claude is ready</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Describe what you want to build or ask for changes. Claude will write the code and run it in the cloud.
              </p>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-xl px-3.5 py-2.5 max-w-[85%] text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border'
                )}
              >
                {msg.content || (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Thinking...
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Claude to build something..."
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
