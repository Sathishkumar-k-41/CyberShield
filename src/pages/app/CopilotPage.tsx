import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Bot, FileText, FlaskConical, MessageSquarePlus, MessagesSquare, RotateCcw, Trash2, User } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { isCopilotConnected } from '../../lib/config'
import { getCopilotReply, SUGGESTED_PROMPTS, type ChatMessage, type Conversation } from '../../lib/copilot'
import { cn, readStorage, relativeTime, uid, writeStorage } from '../../lib/utils'

const newConversation = (): Conversation => ({ id: uid('chat'), title: 'New conversation', updatedAt: new Date().toISOString(), messages: [] })

export function CopilotPage() {
  const connected = isCopilotConnected()
  const { scans, addScan } = useApp()
  const { toast } = useToast()
  const [convos, setConvos] = useState<Conversation[]>(() => {
    const stored = readStorage<Conversation[]>('cs.chats', [])
    return stored.length ? stored : [newConversation()]
  })
  const [activeId, setActiveId] = useState(() => convos[0].id)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const active = convos.find((c) => c.id === activeId) ?? convos[0]

  useEffect(() => writeStorage('cs.chats', convos.filter((c) => c.messages.length > 0)), [convos])
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [active.messages.length, pending])

  // Auto-grow the composer.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [draft])

  const update = (id: string, fn: (c: Conversation) => Conversation) => setConvos((cs) => cs.map((c) => (c.id === id ? fn(c) : c)))

  const send = async (text: string, retryFrom?: ChatMessage[]) => {
    const content = text.trim()
    if (!content || pending) return
    const convId = active.id
    const userMsg: ChatMessage = { id: uid('m'), role: 'user', content, createdAt: new Date().toISOString() }
    const base = retryFrom ?? [...active.messages, userMsg]
    update(convId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? content.replace(/\s+/g, ' ').slice(0, 48) : c.title,
      messages: base,
      updatedAt: new Date().toISOString(),
    }))
    setDraft('')
    setPending(true)
    try {
      const reply = await getCopilotReply(base, { latestScan: scans[0], onScan: addScan })
      update(convId, (c) => ({ ...c, messages: [...base, { id: uid('m'), role: 'assistant', createdAt: new Date().toISOString(), ...reply }], updatedAt: new Date().toISOString() }))
    } catch (e) {
      update(convId, (c) => ({
        ...c,
        messages: [...base, { id: uid('m'), role: 'assistant', createdAt: new Date().toISOString(), content: (e as Error).name === 'AbortError' ? 'The Copilot service took too long to respond.' : (e as Error).message || 'Something went wrong.', error: true }],
      }))
    } finally {
      setPending(false)
      inputRef.current?.focus()
    }
  }

  const retry = () => {
    const msgs = active.messages.filter((m) => !m.error)
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user')
    if (lastUser) void send(lastUser.content, msgs)
  }

  const applyPrompt = (p: string) => {
    if (p === SUGGESTED_PROMPTS[0]) {
      setDraft(`${p}\n\n`)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(9999, 9999)
      })
      toast({ title: 'Paste the message below', description: 'Add the full text or link, then press Enter.', tone: 'info' })
    } else void send(p)
  }

  const startNew = () => {
    if (active.messages.length === 0) return inputRef.current?.focus()
    const c = newConversation()
    setConvos((cs) => [c, ...cs])
    setActiveId(c.id)
  }

  const remove = (id: string) => {
    setConvos((cs) => {
      const next = cs.filter((c) => c.id !== id)
      const list = next.length ? next : [newConversation()]
      if (id === activeId) setActiveId(list[0].id)
      return list
    })
    toast({ title: 'Conversation deleted', tone: 'success' })
  }

  const history = useMemo(() => convos.filter((c) => c.messages.length).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [convos])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Conversation history */}
      <aside aria-label="Conversation history" className="order-2 lg:order-1">
        <div className="card overflow-hidden lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-[13px] font-medium">History</p>
            <Button variant="ghost" size="sm" icon={<MessageSquarePlus className="h-3.5 w-3.5" />} onClick={startNew}>New</Button>
          </div>
          {history.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-subtle">Conversations you start will appear here.</p>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto p-1.5">
              {history.map((c) => (
                <li key={c.id} className="group relative">
                  <button
                    onClick={() => setActiveId(c.id)}
                    aria-current={c.id === active.id ? 'true' : undefined}
                    className={cn('w-full rounded-lg px-3 py-2.5 pr-9 text-left transition-colors', c.id === active.id ? 'bg-fg/[0.06]' : 'hover:bg-fg/[0.03]')}
                  >
                    <span className="block truncate text-[13px] text-fg">{c.title}</span>
                    <span className="block text-[11px] text-subtle">{relativeTime(c.updatedAt)} · {c.messages.length} messages</span>
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-subtle opacity-0 transition hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label={`Delete conversation: ${c.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat */}
      <section aria-label="Chat" className="order-1 flex min-h-[calc(100vh-12rem)] flex-col lg:order-2">
        <header className="mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[28px]">Your AI Security Copilot</h1>
            {!connected && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-accent-2/40 bg-accent-2/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-accent-2">
                <FlaskConical aria-hidden className="h-3 w-3" /> Demo mode
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[15px] text-muted">Understand suspicious messages, links, and digital threats in plain language.</p>
          {!connected && (
            <p className="mt-3 text-[12.5px] leading-5 text-subtle">
              No AI model is connected. Replies come from the local heuristic analyzer and pre-written guidance. Set <code className="font-mono text-muted">VITE_COPILOT_API_URL</code> to connect your backend.
            </p>
          )}
        </header>

        <div className="card flex flex-1 flex-col overflow-hidden">
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation">
            {active.messages.length === 0 ? (
              <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center py-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line-strong bg-elevated">
                  <Bot aria-hidden className="h-5 w-5 text-accent" />
                </span>
                <p className="mt-5 text-[17px] font-medium">How can I help you stay safe?</p>
                <p className="mt-1.5 text-sm text-muted">Paste a message or link, or pick a question to start.</p>
                <ul className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <li key={p}>
                      <button
                        onClick={() => applyPrompt(p)}
                        className="h-full w-full rounded-xl border border-line bg-bg-2 px-4 py-3.5 text-left text-[13.5px] text-fg transition-colors hover:border-line-strong hover:bg-elevated"
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ol className="mx-auto max-w-3xl space-y-6">
                <AnimatePresence initial={false}>
                  {active.messages.map((m) => (
                    <motion.li key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      <Message m={m} onRetry={retry} />
                    </motion.li>
                  ))}
                  {pending && (
                    <motion.li key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3">
                      <Avatar role="assistant" />
                      <div className="flex items-center gap-1 rounded-2xl px-1 py-3" aria-label={connected ? 'Copilot is responding' : 'Analyzing'}>
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-subtle" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
                        ))}
                      </div>
                    </motion.li>
                  )}
                </AnimatePresence>
              </ol>
            )}
          </div>

          <form
            className="border-t border-line p-3 sm:p-4"
            onSubmit={(e) => {
              e.preventDefault()
              void send(draft)
            }}
          >
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-line-strong bg-bg-2 p-2 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <label htmlFor="copilot-input" className="sr-only">Message the Copilot</label>
              <textarea
                id="copilot-input"
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={6000}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    void send(draft)
                  }
                }}
                placeholder="Ask a question or paste a suspicious message…"
                className="max-h-[220px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-6 text-fg placeholder:text-subtle focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim() || pending}
                aria-label="Send message"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white transition hover:bg-accent/90 disabled:bg-fg/10 disabled:text-subtle"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-3xl px-1 text-[11.5px] text-subtle">
              Enter to send · Shift + Enter for a new line · Don’t paste passwords or one-time codes.
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}

function Avatar({ role }: { role: ChatMessage['role'] }) {
  return (
    <span aria-hidden className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg border', role === 'assistant' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line-strong bg-elevated text-muted')}>
      {role === 'assistant' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
    </span>
  )
}

function Message({ m, onRetry }: { m: ChatMessage; onRetry: () => void }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-elevated px-4 py-2.5 text-[14px] leading-6 text-fg">
          <span className="sr-only">You: </span>
          {m.content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <Avatar role="assistant" />
      <div className="min-w-0 flex-1">
        <span className="sr-only">Copilot: </span>
        {m.error ? (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger/[0.05] px-4 py-3 text-[13.5px] text-muted">
            <p className="text-danger">{m.content}</p>
            <Button variant="secondary" size="sm" className="mt-3" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={onRetry}>Retry</Button>
          </div>
        ) : (
          <div className="space-y-2 text-[14px] leading-[1.7] text-fg/95">{renderRich(m.content)}</div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {m.scanId && (
            <Link to={`/app/reports/${m.scanId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-2 px-2.5 py-1 text-[12px] text-muted hover:border-line-strong hover:text-fg">
              <FileText aria-hidden className="h-3.5 w-3.5" /> Open full report
            </Link>
          )}
          {m.source === 'demo' && (
            <span className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-wide text-subtle">
              <MessagesSquare aria-hidden className="h-3 w-3" /> Demo response · not AI-generated
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/** Tiny renderer for **bold**, _italic_ and "- " bullet lists. Content is rendered as text, never HTML. */
function renderRich(text: string): ReactNode {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part, i) =>
      part.startsWith('**') ? <strong key={i} className="font-semibold text-fg">{part.slice(2, -2)}</strong>
        : part.startsWith('_') && part.endsWith('_') && part.length > 2 ? <em key={i} className="text-muted">{part.slice(1, -1)}</em>
          : <Fragment key={i}>{part}</Fragment>,
    )
  const blocks: ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="space-y-1.5 pl-1">
          {list.map((li, i) => (
            <li key={i} className="flex gap-2.5"><span aria-hidden className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-subtle" /><span>{inline(li)}</span></li>
          ))}
        </ul>,
      )
      list = []
    }
  }
  text.split('\n').forEach((line) => {
    if (/^\s*[-•]\s+/.test(line)) list.push(line.replace(/^\s*[-•]\s+/, ''))
    else {
      flush()
      if (line.trim()) blocks.push(<p key={`p${blocks.length}`}>{inline(line)}</p>)
    }
  })
  flush()
  return blocks
}
