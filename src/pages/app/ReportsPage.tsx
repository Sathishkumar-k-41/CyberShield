import { Download, FileBarChart2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CategoryChart, RiskDistributionChart } from '../../components/report/Charts'
import { ScansTable } from '../../components/report/ScansTable'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, DemoBadge, EmptyState, PageHeader, Tabs } from '../../components/ui/primitives'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { categoryBreakdown, computeMetrics, riskDistribution } from '../../lib/insights'
import type { ScanReport } from '../../lib/types'
import { downloadFile } from '../../lib/utils'

type Range = '7' | '30' | '90' | 'all' | 'custom'

const RANGE_TABS = [
  { value: '7' as const, label: '7 days' },
  { value: '30' as const, label: '30 days' },
  { value: '90' as const, label: '90 days' },
  { value: 'all' as const, label: 'All' },
  { value: 'custom' as const, label: 'Custom' },
]

function toCsv(rows: ScanReport[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const head = ['id', 'target', 'type', 'risk_level', 'risk_score', 'category', 'status', 'scanned_at', 'demo']
  return [head.join(','), ...rows.map((r) => [r.id, r.target, r.type, r.level, r.score, r.category, r.status, r.createdAt, r.demo ? 'yes' : 'no'].map(esc).join(','))].join('\n')
}

export function ReportsPage() {
  const { displayScans, usingDemo } = useApp()
  const { toast } = useToast()
  const [range, setRange] = useState<Range>('30')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [q, setQ] = useState('')

  const dateError = range === 'custom' && from && to && from > to ? 'The start date must be before the end date.' : null

  const filtered = useMemo(() => {
    const now = Date.now()
    const term = q.trim().toLowerCase()
    return displayScans.filter((s) => {
      const t = new Date(s.createdAt).getTime()
      if (range !== 'all' && range !== 'custom' && t < now - Number(range) * 86_400_000) return false
      if (range === 'custom' && !dateError) {
        if (from && t < new Date(`${from}T00:00:00`).getTime()) return false
        if (to && t > new Date(`${to}T23:59:59.999`).getTime()) return false
      }
      return !term || s.target.toLowerCase().includes(term) || s.category.toLowerCase().includes(term)
    })
  }, [displayScans, range, from, to, q, dateError])

  const metrics = computeMetrics(filtered)
  const dist = riskDistribution(filtered)
  const cats = categoryBreakdown(filtered)

  const exportAs = (fmt: 'csv' | 'json') => {
    if (!filtered.length) return toast({ title: 'Nothing to export', description: 'No scans match the current filters.', tone: 'info' })
    const stamp = new Date().toISOString().slice(0, 10)
    if (fmt === 'csv') downloadFile(`cybershield-report-${stamp}.csv`, toCsv(filtered), 'text/csv;charset=utf-8')
    else downloadFile(`cybershield-report-${stamp}.json`, JSON.stringify({ generatedAt: new Date().toISOString(), demoData: usingDemo, scans: filtered }, null, 2), 'application/json')
    toast({ title: `Exported ${filtered.length} scan${filtered.length > 1 ? 's' : ''}`, description: `Saved as ${fmt.toUpperCase()}.`, tone: 'success' })
  }

  return (
    <>
      <PageHeader
        title="Security Reports"
        description="Risk distribution, threat categories and exportable scan records."
        badge={usingDemo ? <DemoBadge /> : undefined}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportAs('csv')}>Export CSV</Button>
            <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportAs('json')}>Export JSON</Button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs items={RANGE_TABS} value={range} onChange={setRange} idBase="range" layoutId="range-pill" className="flex w-full overflow-x-auto lg:w-auto" />
        {range === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="from" className="sr-only">From date</label>
            <input id="from" type="date" className="input h-10 w-auto" value={from} onChange={(e) => setFrom(e.target.value)} aria-invalid={Boolean(dateError)} />
            <span className="text-sm text-subtle">to</span>
            <label htmlFor="to" className="sr-only">To date</label>
            <input id="to" type="date" className="input h-10 w-auto" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={Boolean(dateError)} />
            {dateError && <p role="alert" className="w-full text-[13px] text-danger">{dateError}</p>}
          </div>
        )}
        <div className="relative lg:ml-auto lg:w-72">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <label htmlFor="rep-q" className="sr-only">Search reports</label>
          <input id="rep-q" className="input h-10 pl-9" placeholder="Search reports…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4">
        {[
          ['Scans in range', metrics.total],
          ['Threats (≥ medium)', metrics.threats],
          ['High & critical', metrics.highRisk],
          ['Average risk', metrics.total ? `${100 - (metrics.securityScore ?? 100)}/100` : '—'],
        ].map(([k, v]) => (
          <div key={k} className="bg-card px-5 py-4">
            <dt className="text-[12.5px] text-muted">{k}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card as="section">
          <CardHeader title="Risk Distribution" description="Scans by risk level" />
          <div className="px-3 pb-4 pt-5 sm:px-5">
            {filtered.length ? <RiskDistributionChart data={dist} /> : <p className="py-20 text-center text-sm text-muted">No data for this range.</p>}
          </div>
        </Card>
        <Card as="section">
          <CardHeader title="Threat Categories" description="Most common classifications" />
          <div className="px-3 pb-4 pt-5 sm:px-5">
            {cats.length ? <CategoryChart data={cats} /> : <p className="py-20 text-center text-sm text-muted">No data for this range.</p>}
          </div>
        </Card>
      </div>

      <Card as="section" className="mt-6 overflow-hidden">
        <CardHeader title="Report Records" description="Select a record to open its full report." />
        {filtered.length ? (
          <ScansTable scans={filtered} caption="Report records" />
        ) : (
          <EmptyState icon={<FileBarChart2 className="h-5 w-5" />} title="No reports in this range" description="Widen the date range or clear the search." />
        )}
      </Card>
    </>
  )
}
