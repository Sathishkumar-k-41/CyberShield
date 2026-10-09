import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, FileText, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { cn, relativeTime, scanTypeLabel, truncateMiddle } from '../../lib/utils'
import { RiskBadge } from '../ui/primitives'
import { NAV_ITEMS } from './nav'

interface Result {
  id: string
  group: 'Pages' | 'Scans'
  label: string
  hint: string
  to: string
  icon: React.ReactNode
  extra?: React.ReactNode
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { displayScans, usingDemo } = useApp()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement
      setQ('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      returnFocus.current?.focus?.()
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase()
    const pages: Result[] = NAV_ITEMS.filter(
      (n) => !term || n.label.toLowerCase().includes(term) || n.description.toLowerCase().includes(term),
    ).map((n) => ({
      id: n.to, group: 'Pages', label: n.label, hint: n.description, to: n.to,
      icon: <n.icon aria-hidden className="h-4 w-4" />,
    }))
    const scans: Result[] = displayScans
      .filter((s) => !term || s.target.toLowerCase().includes(term) || s.category.toLowerCase().includes(term))
      .slice(0, term ? 8 : 4)
      .map((s) => ({
        id: s.id, group: 'Scans', label: truncateMiddle(s.target, 56),
        hint: `${scanTypeLabel[s.type]} · ${relativeTime(s.createdAt)}${s.demo ? ' · demo' : ''}`,
        to: `/app/reports/${s.id}`,
        icon: <FileText aria-hidden className="h-4 w-4" />,
        extra: <RiskBadge level={s.level} size="sm" />,
      }))
    return [...pages, ...scans]
  }, [q, displayScans])

  useEffect(() => setActive(0), [q])

  const go = (r: Result) => {
    onClose()
    navigate(r.to)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(results.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      go(results[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Tab') {
      e.preventDefault() // keep focus inside the dialog
    }
  }

  useEffect(() => {
    document.getElementById(`cmd-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-elevated shadow-pop"
            onKeyDown={onKey}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search aria-hidden className="h-4 w-4 text-subtle" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search pages and scans…"
                className="h-12 flex-1 bg-transparent text-[15px] text-fg placeholder:text-subtle focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                aria-activedescendant={results[active] ? `cmd-opt-${active}` : undefined}
                aria-label="Search pages and scans"
              />
              <kbd className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-[10px] text-subtle">ESC</kbd>
            </div>
            <ul id="cmd-list" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-10 text-center text-sm text-muted">No results for “{q}”.</li>}
              {results.map((r, i) => (
                <li key={r.id} role="presentation">
                  {(i === 0 || results[i - 1].group !== r.group) && (
                    <p className="label-mono px-3 pb-1.5 pt-3">
                      {r.group}
                      {r.group === 'Scans' && usingDemo && ' · demo data'}
                    </p>
                  )}
                  <div
                    id={`cmd-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5',
                      i === active ? 'bg-fg/[0.06] text-fg' : 'text-muted',
                    )}
                  >
                    <span className="text-subtle">{r.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-fg">{r.label}</span>
                      <span className="block truncate text-xs text-subtle">{r.hint}</span>
                    </span>
                    {r.extra}
                    {i === active && <CornerDownLeft aria-hidden className="h-3.5 w-3.5 text-subtle" />}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
