import { motion } from 'framer-motion'
import { ChevronsLeft, ChevronsRight, Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { isCopilotConnected, isThreatIntelConnected } from '../../lib/config'
import { cn } from '../../lib/utils'
import { Logo } from '../ui/primitives'
import { NAV_ITEMS } from './nav'

interface Props {
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate?: () => void
  mobile?: boolean
}

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate, mobile }: Props) {
  const narrow = collapsed && !mobile
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center border-b border-line', narrow ? 'justify-center px-2' : 'px-5')}>
        <NavLink to="/" aria-label="CyberShield AI home" className="rounded-lg" onClick={onNavigate}>
          <Logo compact={narrow} />
        </NavLink>
      </div>

      <div className={cn('pt-4', narrow ? 'px-2' : 'px-3')}>
        <NavLink
          to="/app/scanner"
          onClick={onNavigate}
          title={narrow ? 'New scan' : undefined}
          className={cn(
            'flex h-9 items-center gap-2 rounded-ctl border border-line-strong bg-elevated text-[13px] font-medium text-fg transition-colors hover:border-subtle/50',
            narrow ? 'justify-center' : 'px-3',
          )}
        >
          <Plus aria-hidden className="h-4 w-4 text-accent" />
          {!narrow && 'New scan'}
          {!narrow && <kbd className="ml-auto font-mono text-[10px] text-subtle">N</kbd>}
        </NavLink>
      </div>

      <nav aria-label="Main" className={cn('mt-4 flex-1 overflow-y-auto', narrow ? 'px-2' : 'px-3')}>
        {!narrow && <p className="label-mono mb-2 px-2.5">Workspace</p>}
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/app'}
                onClick={onNavigate}
                title={narrow ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex h-9 items-center gap-3 rounded-lg text-[13.5px] transition-colors',
                    narrow ? 'justify-center' : 'px-2.5',
                    isActive ? 'text-fg' : 'text-muted hover:bg-fg/[0.04] hover:text-fg',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId={mobile ? 'nav-active-m' : 'nav-active'}
                        className="absolute inset-0 rounded-lg bg-fg/[0.06]"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    {isActive && !narrow && <span aria-hidden className="absolute left-0 top-2 h-5 w-[2px] rounded-full bg-accent" />}
                    <Icon aria-hidden className={cn('relative h-[17px] w-[17px] shrink-0', isActive && 'text-accent')} strokeWidth={1.9} />
                    {!narrow && <span className="relative truncate">{label}</span>}
                    {narrow && <span className="sr-only">{label}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!narrow && (
        <div className="mx-3 mb-3 rounded-xl border border-line bg-bg-2 p-3.5">
          <p className="label-mono mb-2.5">Engine status</p>
          <ul className="space-y-2 text-[12.5px]">
            <EngineRow label="Heuristic analysis" state="on" />
            <EngineRow label="Threat intelligence" state={isThreatIntelConnected() ? 'on' : 'off'} />
            <EngineRow label="AI Copilot" state={isCopilotConnected() ? 'on' : 'demo'} />
          </ul>
        </div>
      )}

      {!mobile && (
        <div className={cn('border-t border-line p-2', narrow ? 'flex justify-center' : '')}>
          <button
            onClick={onToggleCollapsed}
            className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[12.5px] text-subtle transition-colors hover:bg-fg/[0.04] hover:text-fg"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronsRight className="mx-auto h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
      )}
    </div>
  )
}

function EngineRow({ label, state }: { label: string; state: 'on' | 'off' | 'demo' }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted" title={state === 'off' ? 'Not connected' : undefined}>{label}</span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase',
          state === 'on' && 'text-success',
          state === 'off' && 'text-subtle',
          state === 'demo' && 'text-accent-2',
        )}
      >
        <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', state === 'on' ? 'bg-success' : state === 'demo' ? 'bg-accent-2' : 'bg-subtle/60')} />
        {state === 'on' ? 'Active' : state === 'demo' ? 'Demo' : 'Off'}
      </span>
    </li>
  )
}
