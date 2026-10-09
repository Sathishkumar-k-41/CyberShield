import { motion } from 'framer-motion'
import { FlaskConical, Shield } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import type { FindingStatus, RiskLevel } from '../../lib/types'
import { cn, riskMeta } from '../../lib/utils'

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative grid h-8 w-8 place-items-center rounded-[9px] border border-line-strong bg-elevated">
        <Shield aria-hidden className="h-4 w-4 text-accent" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-fg">
          CyberShield<span className="ml-1 font-medium text-muted">AI</span>
        </span>
      )}
    </span>
  )
}

export function Card({ className, children, as: As = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' }) {
  return <As className={cn('card', className)}>{children}</As>
}

export function CardHeader({ title, description, action, id }: { title: string; description?: string; action?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, description, actions, badge }: { title: string; description?: string; actions?: ReactNode; badge?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg sm:text-[28px]">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function RiskBadge({ level, className, size = 'md' }: { level: RiskLevel; className?: string; size?: 'sm' | 'md' }) {
  const m = riskMeta[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        m.text, m.bg, m.ring, className,
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  )
}

const statusMeta: Record<FindingStatus, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed', cls: 'text-fg bg-fg/[0.07] ring-fg/15' },
  suspicious: { label: 'Suspicious', cls: 'text-warning bg-warning/10 ring-warning/25' },
  unknown: { label: 'Unknown', cls: 'text-muted bg-transparent ring-0 border border-dashed border-line-strong' },
  clear: { label: 'No issue found', cls: 'text-success bg-success/10 ring-success/20' },
}

export function StatusBadge({ status }: { status: FindingStatus }) {
  const m = statusMeta[status]
  return (
    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wide ring-1 ring-inset', m.cls)}>
      {m.label}
    </span>
  )
}

export function DemoBadge({ label = 'Demo data', title }: { label?: string; title?: string }) {
  return (
    <span
      title={title ?? 'Sample data for illustration. It does not describe real threats.'}
      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-accent-2/40 bg-accent-2/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-accent-2"
    >
      <FlaskConical aria-hidden className="h-3 w-3" />
      {label}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('relative overflow-hidden rounded-md bg-fg/[0.06]', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/[0.06] to-transparent" />
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-line-strong bg-elevated text-muted">{icon}</div>
      <p className="text-[15px] font-medium text-fg">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-fg">{label}</label>
        {description && <p id={`${id}-d`} className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full border transition-colors duration-200',
          checked ? 'border-accent bg-accent' : 'border-line-strong bg-fg/10',
        )}
      >
        <span
          aria-hidden
          className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform duration-200', checked ? 'translate-x-[18px]' : 'translate-x-[2px]')}
        />
      </button>
    </div>
  )
}

export interface TabItem<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

/** Accessible tabs following the WAI-ARIA tabs pattern (arrow keys move focus). */
export function Tabs<T extends string>({
  items, value, onChange, idBase, className, layoutId = 'tab-pill',
}: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; idBase: string; className?: string; layoutId?: string }) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    onChange(items[next].value)
    document.getElementById(`${idBase}-tab-${items[next].value}`)?.focus()
  }
  return (
    <div role="tablist" className={cn('inline-flex rounded-xl border border-line bg-bg-2 p-1', className)}>
      {items.map((it, i) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            id={`${idBase}-tab-${it.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${idBase}-panel-${it.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(it.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors sm:px-4',
              active ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg border border-line-strong bg-elevated shadow-card"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {it.icon && <span className="hidden sm:inline-flex">{it.icon}</span>}
              {it.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function Field({ label, htmlFor, hint, error, children }: { label: string; htmlFor: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-fg">{label}</label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-[13px] text-danger">{error}</p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-[13px] text-subtle">{hint}</p>
      ) : null}
    </div>
  )
}
