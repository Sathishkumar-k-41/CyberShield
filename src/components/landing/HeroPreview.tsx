import { motion } from 'framer-motion'
import { Check, Link2, ShieldAlert } from 'lucide-react'
import { ANALYSIS_STAGES } from '../../lib/analyzer'
import { RiskGauge } from '../report/RiskGauge'
import { RiskBadge, StatusBadge } from '../ui/primitives'

const signals = [
  { status: 'suspicious' as const, title: 'References “PayPal” on an unrelated domain', evidence: 'account-verify.paypa1.example' },
  { status: 'suspicious' as const, title: 'Requests a one-time code', evidence: '“share the code”' },
  { status: 'confirmed' as const, title: 'Connection is not encrypted (HTTP)', evidence: 'http://' },
  { status: 'unknown' as const, title: 'Domain registration age', evidence: 'Not inspected' },
]

/** A static, illustrative product preview. Content is an example, not a live scan. */
export function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-w-0"
      aria-label="Example threat analysis report"
      role="img"
    >
      <div aria-hidden className="absolute -inset-px rounded-[20px] bg-gradient-to-b from-fg/[0.12] to-transparent" />
      <div aria-hidden className="relative overflow-hidden rounded-[20px] border border-line bg-card shadow-pop">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-line bg-bg-2/60 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
          </div>
          <div className="mx-auto flex min-w-0 items-center gap-2 rounded-md border border-line bg-bg px-3 py-1 font-mono text-[11px] text-subtle">
            <Link2 className="h-3 w-3 shrink-0" />
            <span className="truncate">cybershield.ai/app/reports/example</span>
          </div>
          <span className="hidden rounded-full border border-dashed border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-subtle sm:inline">
            Example
          </span>
        </div>

        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* Score */}
          <div className="bg-card p-5 sm:p-6">
            <p className="label-mono">Threat Analysis Report</p>
            <p className="mt-2 truncate font-mono text-[12.5px] text-muted">account-verify.paypa1.example/login</p>
            <div className="mt-5 flex justify-center">
              <RiskGauge score={82} level="critical" size={184} />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <RiskBadge level="critical" />
              <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">Credential harvesting</span>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-card p-5 sm:p-6">
            <p className="label-mono">Analysis</p>
            <ol className="mt-4 space-y-3">
              {ANALYSIS_STAGES.map((s) => (
                <li key={s} className="flex items-center gap-3 text-[13px]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-success/15 text-success">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-muted">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-fg/[0.07]">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: '8%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          {/* Signals */}
          <div className="bg-card p-5 sm:col-span-2 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="label-mono">Security signals</p>
              <p className="font-mono text-[10.5px] text-subtle">4 of 11 checks shown</p>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {signals.map((s) => (
                <li key={s.title} className="flex items-center gap-3 py-2.5">
                  <span className="w-[92px] shrink-0"><StatusBadge status={s.status} /></span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{s.title}</span>
                  <span className="hidden max-w-[40%] truncate font-mono text-[11px] text-subtle md:block">{s.evidence}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-3 bg-card p-5 sm:col-span-2 sm:px-6">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-medium text-fg">Recommended action</p>
              <p className="mt-0.5 text-[13px] text-muted">
                Don’t open the link. Sign in through the official app, and never share one-time codes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
