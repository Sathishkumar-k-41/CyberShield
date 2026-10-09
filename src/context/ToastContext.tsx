import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'

type ToastTone = 'success' | 'error' | 'info'
interface Toast {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface ToastApi {
  toast: (t: { title: string; description?: string; tone?: ToastTone }) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback<ToastApi['toast']>(
    ({ title, description, tone = 'info' }) => {
      const id = ++counter.current
      setToasts((t) => [...t.slice(-3), { id, title, description, tone }])
      setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? AlertTriangle : Info
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                role={t.tone === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line-strong bg-elevated px-4 py-3 shadow-pop"
              >
                <Icon
                  aria-hidden
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    t.tone === 'success' && 'text-success',
                    t.tone === 'error' && 'text-danger',
                    t.tone === 'info' && 'text-accent-2',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[13px] leading-5 text-muted">{t.description}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="-mr-1 rounded-md p-1 text-subtle transition-colors hover:bg-fg/5 hover:text-fg"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
