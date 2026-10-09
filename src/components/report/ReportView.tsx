import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, ArrowRight, ChevronDown, Copy, FileText, Globe, Info, Link2, ListChecks, MessageSquareText,
  Radar, RotateCcw,
} from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { reportToText } from '../../lib/analyzer'
import type { Finding, ReportSection, ScanReport, SectionKey } from '../../lib/types'
import { cn, formatDate, riskMeta, scanTypeLabel } from '../../lib/utils'
import { Button, ButtonLink } from '../ui/Button'
import { DemoBadge, RiskBadge, StatusBadge } from '../ui/primitives'
import { RiskGauge } from './RiskGauge'

const SECTION_ICON: Record<SectionKey, typeof Link2> = {
  message: MessageSquareText,
  url: Link2,
  website: Globe,
  intel: Radar,
  recommendations: ListChecks,
}

const LETTER: Record<SectionKey, string> = { message: 'A', url: 'B', website: 'C', intel: 'D', recommendations: 'E' }

export const DISCLAIMER =
  'Automated risk assessments can produce false positives and false negatives. Verify important information through official sources.'

export async function copyReport(r: ScanReport, defang = false) {
  const text = reportToText(r, { defang })
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    if (!ok) throw new Error('Clipboard unavailable')
  }
}

interface Props {
  report: ScanReport
  variant?: 'summary' | 'full'
  onScanAnother?: () => void
}

export function ReportView({ report: r, variant = 'full', onScanAnother }: Props) {
  const { toast } = useToast()
  const { settings } = useApp()
  const counts = countStatuses(r.sections)

  return (
    <div className="space-y-4">
      {/* Header */}
      <section aria-labelledby="report-title" className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-6 py-4">
          <FileText aria-hidden className="h-4 w-4 text-muted" />
          <h2 id="report-title" className="text-[15px] font-semibold">Threat Analysis Report</h2>
          {r.demo && <DemoBadge label="Demonstration record" />}
          <span className="ml-auto font-mono text-[11px] text-subtle">{r.id}</span>
        </div>

        <div className="grid gap-px bg-line md:grid-cols-[minmax(240px,300px)_1fr]">
          <div className="flex flex-col items-center justify-center bg-card px-6 py-8">
            <RiskGauge score={r.score} level={r.level} size={200} />
            <div className="mt-5"><RiskBadge level={r.level} /></div>
          </div>
          <div className="bg-card p-6">
            <p className="label-mono">Target</p>
            <p className="mt-1.5 break-all font-mono text-[13px] text-fg">{r.target}</p>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Meta label="Threat category" value={r.category} />
              <Meta label="Classification" value={<span className={riskMeta[r.level].text}>{riskMeta[r.level].label}</span>} />
              <Meta label="Scan type" value={scanTypeLabel[r.type]} />
              <Meta label="Scanned" value={formatDate(r.createdAt, { year: 'numeric' })} />
              <Meta
                label="Analysis status"
                value={
                  r.status === 'completed' ? (
                    <span className="text-success">Complete</span>
                  ) : (
                    <span className="text-warning" title="Some sources were not available for this scan">Partial coverage</span>
                  )
                }
              />
              <Meta
                label="Signals"
                value={
                  <span className="tabular-nums">
                    {counts.confirmed + counts.suspicious} flagged · {counts.unknown} unknown
                  </span>
                }
              />
            </dl>

            {r.status === 'partial' && !r.demo && (
              <p className="mt-6 flex gap-2 rounded-lg border border-line bg-bg-2 px-3 py-2.5 text-[12.5px] leading-5 text-muted">
                <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-2" />
                Heuristic analysis only. Threat intelligence was {r.engines.threatIntel === 'error' ? 'unreachable' : 'not connected'}, so known-threat databases were not checked.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Sections */}
      <div className="space-y-3">
        {r.sections
          .filter((s) => s.key !== 'recommendations')
          .map((s, i) => (
            <SectionCard key={s.key + i} section={s} defaultOpen={variant === 'full' || isMostSevere(s, r.sections)} />
          ))}
        <RecommendationsCard items={r.recommendations} level={r.level} />
      </div>

      {/* Disclaimer + actions */}
      <div className="flex flex-col gap-4 rounded-card border border-line bg-bg-2 p-5 sm:flex-row sm:items-center">
        <p className="flex flex-1 gap-2.5 text-[13px] leading-5 text-muted">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          {DISCLAIMER}
        </p>
        <div className="flex flex-wrap gap-2">
          {variant === 'summary' && (
            <ButtonLink to={`/app/reports/${r.id}`} variant="secondary" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
              View Full Report
            </ButtonLink>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={async () => {
              try {
                await copyReport(r, settings.security.defangCopiedLinks)
                toast({ title: 'Report copied', description: 'Plain-text report is on your clipboard.', tone: 'success' })
              } catch {
                toast({ title: 'Couldn’t copy report', description: 'Clipboard access was blocked by the browser.', tone: 'error' })
              }
            }}
          >
            Copy Report
          </Button>
          {onScanAnother ? (
            <Button size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={onScanAnother}>Scan Another Item</Button>
          ) : (
            <ButtonLink to="/app/scanner" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />}>Scan Another Item</ButtonLink>
          )}
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="label-mono">{label}</dt>
      <dd className="mt-1 text-[13.5px] text-fg">{value}</dd>
    </div>
  )
}

function countStatuses(sections: ReportSection[]) {
  const c = { confirmed: 0, suspicious: 0, unknown: 0, clear: 0 }
  sections.forEach((s) =>
    s.findings.forEach((f) => {
      if (f.status === 'confirmed' && f.weight === 0) return // informational facts
      c[f.status]++
    }),
  )
  return c
}

function sectionWeight(s: ReportSection) {
  return s.findings.reduce((a, f) => a + f.weight, 0)
}
function isMostSevere(s: ReportSection, all: ReportSection[]) {
  const max = Math.max(...all.map(sectionWeight))
  return max > 0 && sectionWeight(s) === max
}

function SectionCard({ section, defaultOpen }: { section: ReportSection; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = SECTION_ICON[section.key] ?? Info
  const flagged = section.findings.filter((f) => f.weight > 0).length
  const unknown = section.findings.filter((f) => f.status === 'unknown').length
  const panelId = `sec-${section.key}`

  return (
    <section className="card overflow-hidden">
      <h3>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-fg/[0.02] sm:px-6"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-elevated">
            <Icon aria-hidden className="h-4 w-4 text-muted" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[14.5px] font-medium text-fg">
              <span className="font-mono text-[11px] text-subtle">{LETTER[section.key]}</span>
              {section.title}
            </span>
            <span className="mt-0.5 block truncate text-[12.5px] text-muted">{section.summary}</span>
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            {flagged > 0 && <span className="rounded-full bg-warning/10 px-2 py-0.5 font-mono text-[10.5px] text-warning">{flagged} flagged</span>}
            {unknown > 0 && <span className="rounded-full border border-dashed border-line-strong px-2 py-0.5 font-mono text-[10.5px] text-muted">{unknown} unknown</span>}
          </span>
          <ChevronDown aria-hidden className={cn('h-4 w-4 text-subtle transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <ul className="divide-y divide-line border-t border-line">
              {section.findings.map((f) => <FindingRow key={f.id} f={f} />)}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function FindingRow({ f }: { f: Finding }) {
  return (
    <li className="grid gap-x-6 gap-y-3 px-5 py-4 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={f.status} />
          <p className="text-[14px] font-medium text-fg">{f.title}</p>
        </div>
        <p className="mt-2 text-[13px] leading-[1.6] text-muted">{f.explanation}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] content-start gap-x-4 gap-y-1.5 text-[12.5px]">
        <dt className="label-mono pt-0.5">Evidence</dt>
        <dd className="break-all font-mono text-[12px] text-fg/90">{f.evidence}</dd>
        <dt className="label-mono pt-0.5">Confidence</dt>
        <dd className="text-muted">
          <ConfidenceMeter c={f.confidence} />
        </dd>
      </dl>
    </li>
  )
}

function ConfidenceMeter({ c }: { c: Finding['confidence'] }) {
  if (c === 'n/a') return <span className="text-subtle">Not applicable</span>
  const n = c === 'high' ? 3 : c === 'medium' ? 2 : 1
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn('h-2.5 w-1.5 rounded-sm', i <= n ? 'bg-fg/70' : 'bg-fg/15')} />
        ))}
      </span>
      <span className="capitalize">{c}</span>
    </span>
  )
}

function RecommendationsCard({ items, level }: { items: string[]; level: ScanReport['level'] }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-4 border-b border-line px-5 py-4 sm:px-6">
        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', riskMeta[level].bg)}>
          <ListChecks aria-hidden className={cn('h-4 w-4', riskMeta[level].text)} />
        </span>
        <div>
          <h3 className="flex items-center gap-2 text-[14.5px] font-medium">
            <span className="font-mono text-[11px] text-subtle">E</span> Security Recommendations
          </h3>
          <p className="mt-0.5 text-[12.5px] text-muted">Based on the signals above.</p>
        </div>
      </div>
      <ol className="space-y-0 px-5 py-2 sm:px-6">
        {items.map((t, i) => (
          <li key={t} className="flex gap-3 py-2.5 text-[14px] leading-6 text-fg">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-fg/[0.06] font-mono text-[11px] text-muted">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
    </section>
  )
}
