import { motion } from 'framer-motion'
import { Check, Loader2, Minus } from 'lucide-react'
import { ANALYSIS_STAGES, type StageState } from '../../lib/analyzer'
import { cn } from '../../lib/utils'

export function AnalysisProgress({ stages, target }: { stages: StageState[]; target: string }) {
  const done = stages.filter((s) => s === 'done' || s === 'skipped').length
  const activeIndex = stages.findIndex((s) => s === 'active')
  const pct = Math.round((done / stages.length) * 100)

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">Analyzing</p>
            <p className="mt-0.5 truncate font-mono text-[12px] text-subtle">{target}</p>
          </div>
          <span className="font-mono text-sm tabular-nums text-muted">{pct}%</span>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-fg/[0.07]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Analysis progress">
          <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${Math.max(4, pct)}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>
      <ol className="px-6 py-5">
        {ANALYSIS_STAGES.map((label, i) => {
          const s = stages[i]
          return (
            <li key={label} className="relative flex items-center gap-3.5 py-2.5">
              {i < ANALYSIS_STAGES.length - 1 && (
                <span aria-hidden className={cn('absolute left-[11px] top-[34px] h-[calc(100%-22px)] w-px', s === 'done' ? 'bg-success/30' : 'bg-line')} />
              )}
              <span
                className={cn(
                  'relative grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px]',
                  s === 'done' && 'border-success/30 bg-success/15 text-success',
                  s === 'active' && 'border-accent/40 bg-accent/10 text-accent',
                  s === 'pending' && 'border-line-strong text-subtle',
                  s === 'skipped' && 'border-dashed border-line-strong text-subtle',
                )}
              >
                {s === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s === 'active' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : s === 'skipped' ? <Minus className="h-3 w-3" /> : i + 1}
              </span>
              <span className={cn('text-sm', s === 'active' ? 'font-medium text-fg' : s === 'done' ? 'text-muted' : 'text-subtle')}>{label}</span>
              {s === 'skipped' && <span className="ml-auto font-mono text-[10.5px] uppercase tracking-wide text-subtle">Not connected — skipped</span>}
            </li>
          )
        })}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">
        {activeIndex >= 0 ? `${ANALYSIS_STAGES[activeIndex]}…` : done === stages.length ? 'Analysis complete.' : ''}
      </p>
    </div>
  )
}
