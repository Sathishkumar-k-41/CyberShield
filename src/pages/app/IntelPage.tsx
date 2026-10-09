import { ArrowUpDown, Database, Radar, RefreshCw, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card, DemoBadge, EmptyState, PageHeader, Skeleton } from '../../components/ui/primitives'
import { useToast } from '../../context/ToastContext'
import { demoIndicators, type IntelIndicator } from '../../data/demo'
import { config, isThreatFeedConnected } from '../../lib/config'
import { cn, formatDate, relativeTime } from '../../lib/utils'

const CLASS_STYLE: Record<IntelIndicator['classification'], string> = {
  Malicious: 'text-danger bg-danger/10 ring-danger/25',
  Suspicious: 'text-warning bg-warning/10 ring-warning/25',
  'Under review': 'text-muted bg-fg/[0.05] ring-line-strong',
}

type Sort = 'recent' | 'oldest' | 'az'

export function IntelPage() {
  const connected = isThreatFeedConnected()
  const { toast } = useToast()
  const [items, setItems] = useState<IntelIndicator[]>(connected ? [] : demoIndicators)
  const [updatedAt, setUpdatedAt] = useState<string>(() => new Date().toISOString())
  const [loading, setLoading] = useState(connected)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [cls, setCls] = useState('all')
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState<Sort>('recent')

  const load = useCallback(async () => {
    if (!connected) {
      setUpdatedAt(new Date().toISOString())
      toast({ title: 'Demo dataset reloaded', description: 'Connect a threat feed to load live indicators.', tone: 'info' })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(config.threatFeedApiUrl)
      if (!res.ok) throw new Error(`The feed responded with HTTP ${res.status}.`)
      const data = (await res.json()) as { indicators: IntelIndicator[]; updatedAt?: string }
      setItems(data.indicators ?? [])
      setUpdatedAt(data.updatedAt ?? new Date().toISOString())
    } catch (e) {
      setError((e as Error).message || 'The threat feed could not be reached.')
    } finally {
      setLoading(false)
    }
  }, [connected, toast])

  useEffect(() => {
    if (connected) void load()
  }, [connected]) // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))).sort(), [items])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = items.filter(
      (i) =>
        (type === 'all' || i.type === type) &&
        (cls === 'all' || i.classification === cls) &&
        (cat === 'all' || i.category === cat) &&
        (!term || i.indicator.toLowerCase().includes(term) || i.category.toLowerCase().includes(term) || i.source.toLowerCase().includes(term)),
    )
    return list.sort((a, b) =>
      sort === 'az' ? a.indicator.localeCompare(b.indicator)
        : sort === 'oldest' ? a.lastChecked.localeCompare(b.lastChecked)
          : b.lastChecked.localeCompare(a.lastChecked),
    )
  }, [items, q, type, cls, cat, sort])

  const counts = {
    Malicious: items.filter((i) => i.classification === 'Malicious').length,
    Suspicious: items.filter((i) => i.classification === 'Suspicious').length,
    'Under review': items.filter((i) => i.classification === 'Under review').length,
  }
  const hasFilters = q || type !== 'all' || cls !== 'all' || cat !== 'all'

  return (
    <>
      <PageHeader
        title="Threat Intelligence"
        description="Known malicious indicators, suspicious domains and their sources."
        badge={!connected ? <DemoBadge label="Demonstration data" /> : undefined}
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />} onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {!connected && (
        <div className="mb-6 flex gap-3 rounded-card border border-dashed border-accent-2/30 bg-accent-2/[0.04] p-5">
          <Database aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
          <div className="text-[13.5px] leading-6 text-muted">
            <p className="font-medium text-fg">No threat feed is connected.</p>
            <p>
              The indicators below are fictional examples using reserved test domains and documentation IP ranges—they don’t describe real threats.
              Set <code className="rounded bg-fg/[0.06] px-1 py-0.5 font-mono text-[12px] text-fg">VITE_THREAT_FEED_API_URL</code> to load a live feed.
            </p>
          </div>
        </div>
      )}

      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4">
        {[
          ['Malicious', counts.Malicious, 'text-danger'],
          ['Suspicious', counts.Suspicious, 'text-warning'],
          ['Under review', counts['Under review'], 'text-muted'],
          ['Last updated', null, ''],
        ].map(([k, v, c]) => (
          <div key={k as string} className="bg-card px-5 py-4">
            <dt className="flex items-center gap-2 text-[12.5px] text-muted">
              {c && <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full bg-current', c as string)} />}
              {k}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
              {v === null ? <time dateTime={updatedAt} className="text-[15px] font-medium" title={formatDate(updatedAt, { year: 'numeric' })}>{relativeTime(updatedAt)}</time> : (v as number)}
            </dd>
          </div>
        ))}
      </dl>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:px-6 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <label htmlFor="intel-q" className="sr-only">Search indicators</label>
            <input id="intel-q" className="input h-10 pl-9 font-mono text-[13px]" placeholder="Search domain, URL, IP or source…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:flex">
            <Select id="f-type" label="Type" value={type} onChange={setType} options={['Domain', 'URL', 'IP address']} all="All types" />
            <Select id="f-cls" label="Classification" value={cls} onChange={setCls} options={['Malicious', 'Suspicious', 'Under review']} all="All classes" />
            <Select id="f-cat" label="Category" value={cat} onChange={setCat} options={categories} all="All categories" />
            <div className="relative">
              <label htmlFor="f-sort" className="sr-only">Sort</label>
              <ArrowUpDown aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
              <select id="f-sort" className="input h-10 pl-8 xl:w-36" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest</option>
                <option value="az">A–Z</option>
              </select>
            </div>
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">{loading ? 'Loading indicators' : `${filtered.length} indicators shown`}</p>

        {loading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={<Radar className="h-5 w-5" />} title="Couldn’t load the threat feed" description={error} action={<Button size="sm" onClick={load}>Try again</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Radar className="h-5 w-5" />}
            title={hasFilters ? 'No indicators match' : 'No indicators yet'}
            description={hasFilters ? 'Not being listed here doesn’t mean an indicator is safe. Try scanning it instead.' : 'The connected feed returned no indicators.'}
            action={
              <div className="flex gap-2">
                {hasFilters && <Button variant="secondary" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => { setQ(''); setType('all'); setCls('all'); setCat('all') }}>Clear filters</Button>}
                {q && <Link to={`/app/scanner?url=${encodeURIComponent(q)}`} className="inline-flex h-8 items-center rounded-ctl bg-accent px-3 text-[13px] font-medium text-white">Scan “{q.slice(0, 24)}”</Link>}
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <caption className="sr-only">Threat indicators{!connected && ' (demonstration data)'}</caption>
              <thead>
                <tr className="border-b border-line">
                  {['Indicator', 'Type', 'Classification', 'Category', 'Source', 'Last checked'].map((h) => (
                    <th key={h} scope="col" className="label-mono whitespace-nowrap px-6 py-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((i) => (
                  <tr key={i.id} className="transition-colors hover:bg-fg/[0.025]">
                    <td className="max-w-[320px] truncate px-6 py-3.5 font-mono text-[12.5px] text-fg" title={i.indicator}>{i.indicator}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-muted">{i.type}</td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', CLASS_STYLE[i.classification])}>{i.classification}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-muted">{i.category}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-muted">{i.source}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 tabular-nums text-muted"><time dateTime={i.lastChecked}>{formatDate(i.lastChecked)}</time></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-line px-6 py-3 text-xs text-subtle">
          {filtered.length} of {items.length} indicators · Source: {connected ? 'connected feed' : 'demo dataset'}
        </div>
      </Card>
    </>
  )
}

function Select({ id, label, value, onChange, options, all }: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; all: string }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} className="input h-10 xl:w-40" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">{all}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
