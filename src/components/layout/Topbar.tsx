import { AnimatePresence, motion } from 'framer-motion'
import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, Globe } from 'lucide-react'
import { forwardRef, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useDismiss } from '../../lib/hooks'
import { cn, relativeTime, riskMeta, truncateMiddle } from '../../lib/utils'
import { DemoBadge } from '../ui/primitives'

interface Props {
  title: string
  onOpenMenu: () => void
  onOpenSearch: () => void
}

export function Topbar({ title, onOpenMenu, onOpenSearch }: Props) {
  const { resolvedTheme, setTheme, settings } = useApp()
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        onClick={onOpenMenu}
        className="-ml-1 grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-fg/[0.05] hover:text-fg lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <p className="truncate text-[15px] font-medium text-fg" aria-hidden>
        {title}
      </p>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onOpenSearch}
          className="hidden h-9 w-64 items-center gap-2 rounded-ctl border border-line bg-bg-2 px-3 text-[13px] text-subtle transition-colors hover:border-line-strong hover:text-muted md:flex"
          aria-label="Search pages and scans"
        >
          <Search aria-hidden className="h-3.5 w-3.5" />
          Search…
          <kbd className="ml-auto rounded border border-line-strong px-1.5 font-mono text-[10px]">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <IconButton label="Search" onClick={onOpenSearch} className="md:hidden">
          <Search className="h-[18px] w-[18px]" />
        </IconButton>

        <IconButton
          label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={resolvedTheme}
              initial={{ opacity: 0, rotate: -30 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 30 }}
              transition={{ duration: 0.15 }}
              className="grid place-items-center"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </motion.span>
          </AnimatePresence>
        </IconButton>

        <Notifications />
        <ProfileMenu name={settings.profile.name} email={settings.profile.email} />
      </div>
    </header>
  )
}

const IconButton = forwardRef<HTMLButtonElement, { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>>(function IconButton(
  { label, onClick, children, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn('relative grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-fg/[0.05] hover:text-fg', className)}
      {...rest}
    >
      {children}
    </button>
  )
})

function Popover({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          className={cn('absolute right-0 top-11 z-50 origin-top-right overflow-hidden rounded-xl border border-line-strong bg-elevated shadow-pop', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Notifications() {
  const { displayScans, usingDemo, readAlerts, markAlertsRead, settings } = useApp()
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useDismiss(open, () => setOpen(false), [btn, panel])

  const alerts = useMemo(
    () => (settings.notifications.highRiskAlerts ? displayScans.filter((s) => s.level === 'high' || s.level === 'critical').slice(0, 6) : []),
    [displayScans, settings.notifications.highRiskAlerts],
  )
  const unread = alerts.filter((a) => !readAlerts.includes(a.id)).length

  return (
    <div className="relative">
      <IconButton
        ref={btn}
        label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-bg" />}
      </IconButton>
      <Popover open={open} className="w-[min(92vw,360px)]">
        <div ref={panel} role="dialog" aria-label="Notifications">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Alerts</p>
              {usingDemo && alerts.length > 0 && <DemoBadge />}
            </div>
            <button
              className="text-xs text-muted hover:text-fg disabled:opacity-40"
              disabled={!unread}
              onClick={() => markAlertsRead(alerts.map((a) => a.id))}
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {alerts.length === 0 && (
              <li className="px-4 py-8 text-center text-[13px] text-muted">
                {settings.notifications.highRiskAlerts ? 'No high-risk findings yet.' : 'High-risk alerts are turned off in Settings.'}
              </li>
            )}
            {alerts.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => {
                    markAlertsRead([a.id])
                    setOpen(false)
                    navigate(`/app/reports/${a.id}`)
                  }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-fg/[0.04]"
                >
                  <span aria-hidden className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', riskMeta[a.level].dot)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-fg">
                      {riskMeta[a.level].label} · {a.category}
                    </span>
                    <span className="block truncate text-xs text-muted">{truncateMiddle(a.target, 44)}</span>
                    <span className="mt-0.5 block text-[11px] text-subtle">{relativeTime(a.createdAt)}</span>
                  </span>
                  {!readAlerts.includes(a.id) && <span className="sr-only">Unread</span>}
                  {!readAlerts.includes(a.id) && <span aria-hidden className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Popover>
    </div>
  )
}

function ProfileMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  useDismiss(open, () => setOpen(false), [btn, panel])
  const initials = name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'G'

  const item = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted transition-colors hover:bg-fg/[0.05] hover:text-fg'
  return (
    <div className="relative">
      <button
        ref={btn}
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="ml-1 grid h-8 w-8 place-items-center rounded-full border border-line-strong bg-gradient-to-b from-accent/30 to-accent/10 text-[11px] font-semibold text-fg"
      >
        {initials}
      </button>
      <Popover open={open} className="w-60">
        <div ref={panel} role="menu" aria-label="Account">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted">{email || 'Local workspace · not signed in'}</p>
          </div>
          <div className="p-1.5">
            <button role="menuitem" className={item} onClick={() => { setOpen(false); navigate('/app/settings') }}>
              <Settings aria-hidden className="h-4 w-4" /> Settings
            </button>
            <button role="menuitem" className={item} onClick={() => { setOpen(false); navigate('/') }}>
              <Globe aria-hidden className="h-4 w-4" /> Back to website
            </button>
            <button
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false)
                toast({ title: 'Signed out of the local workspace', description: 'Your scan history stays in this browser.', tone: 'info' })
                navigate('/')
              }}
            >
              <LogOut aria-hidden className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </Popover>
    </div>
  )
}
