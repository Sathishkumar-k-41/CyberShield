import { History, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ScansTable } from '../../components/report/ScansTable'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, DemoBadge, EmptyState, PageHeader } from '../../components/ui/primitives'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import type { RiskLevel, ScanType } from '../../lib/types'
import { riskMeta, riskOrder, scanTypeLabel } from '../../lib/utils'

export function HistoryPage() {
  const { displayScans, usingDemo, removeScan, clearScans, settings } = useApp()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [risk, setRisk] = useState<RiskLevel | 'all'>('all')
  const [type, setType] = useState<ScanType | 'all'>('all')
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    if (!confirmClear) return
    const t = setTimeout(() => setConfirmClear(false), 5000)
    return () => clearTimeout(t)
  }, [confirmClear])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return displayScans.filter(
      (s) =>
        (risk === 'all' || s.level === risk) &&
        (type === 'all' || s.type === type) &&
        (!term || s.target.toLowerCase().includes(term) || s.category.toLowerCase().includes(term)),
    )
  }, [displayScans, q, risk, type])

  const hasFilters = q || risk !== 'all' || type !== 'all'

  return (
    <>
      <PageHeader
        title="Scan History"
        description={settings.privacy.saveHistory ? 'Every scan you’ve run in this browser.' : 'History saving is turned off in Settings — new scans aren’t kept.'}
        badge={usingDemo ? <DemoBadge /> : undefined}
        actions={
          !usingDemo && (
            <Button
              variant={confirmClear ? 'danger' : 'secondary'}
              size="sm"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => {
                if (!confirmClear) return setConfirmClear(true)
                clearScans()
                setConfirmClear(false)
                toast({ title: 'History cleared', tone: 'success' })
              }}
            >
              {confirmClear ? 'Click again to confirm' : 'Clear history'}
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:px-6">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <label htmlFor="hist-q" className="sr-only">Search scans</label>
            <input id="hist-q" className="input h-10 pl-9" placeholder="Search by target or category…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <label className="sr-only" htmlFor="hist-risk">Filter by risk level</label>
            <select id="hist-risk" className="input h-10 sm:w-40" value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel | 'all')}>
              <option value="all">All risk levels</option>
              {riskOrder.map((r) => <option key={r} value={r}>{riskMeta[r].label}</option>)}
            </select>
            <label className="sr-only" htmlFor="hist-type">Filter by scan type</label>
            <select id="hist-type" className="input h-10 sm:w-36" value={type} onChange={(e) => setType(e.target.value as ScanType | 'all')}>
              <option value="all">All types</option>
              {(Object.keys(scanTypeLabel) as ScanType[]).map((t) => <option key={t} value={t}>{scanTypeLabel[t]}</option>)}
            </select>
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{filtered.length} scans shown</p>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title={hasFilters ? 'No scans match your filters' : 'No scans yet'}
            description={hasFilters ? 'Try a different search term or clear the filters.' : 'Results from the Threat Scanner will be listed here.'}
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => { setQ(''); setRisk('all'); setType('all') }}>Clear filters</Button>
              ) : (
                <ButtonLink to="/app/scanner" size="sm">Start a scan</ButtonLink>
              )
            }
          />
        ) : (
          <ScansTable
            scans={filtered}
            caption="Scan history"
            onDelete={(s) => {
              removeScan(s.id)
              toast({ title: 'Scan deleted', tone: 'success' })
            }}
          />
        )}
        <div className="border-t border-line px-6 py-3 text-xs text-subtle">
          {filtered.length} of {displayScans.length} scans{usingDemo && ' · demo records cannot be deleted'}
        </div>
      </Card>
    </>
  )
}
