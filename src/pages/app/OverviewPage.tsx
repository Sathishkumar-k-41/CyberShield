import { motion } from 'framer-motion'
import { Activity, ArrowRight, Gauge, ScanSearch, ShieldAlert, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ActivityChart } from '../../components/report/Charts'
import { ScansTable } from '../../components/report/ScansTable'
import { ButtonLink } from '../../components/ui/Button'
import { Card, CardHeader, DemoBadge, EmptyState, PageHeader, RiskBadge } from '../../components/ui/primitives'
import { useApp } from '../../context/AppContext'
import { activityByDay, CATEGORY_INFO, computeMetrics } from '../../lib/insights'
import { cn, relativeTime, truncateMiddle } from '../../lib/utils'

export function OverviewPage() {
  const { displayScans, usingDemo, settings } = useApp()
  const m = useMemo(() => computeMetrics(displayScans), [displayScans])
  const activity = useMemo(() => activityByDay(displayScans, 14), [displayScans])
  const alerts = useMemo(() => displayScans.filter((s) => s.level === 'high' || s.level === 'critical').slice(0, 3), [displayScans])
  const firstName = settings.profile.name.split(' ')[0]

  return (
    <>
      <PageHeader
        title="Security Overview"
        description="Monitor threats and understand your digital risk."
        badge={usingDemo ? <DemoBadge /> : undefined}
        actions={<ButtonLink to="/app/scanner" icon={<ScanSearch className="h-4 w-4" />}>New scan</ButtonLink>}
      />

      {usingDemo && (
        <div className="mb-6 flex flex-col gap-3 rounded-card border border-dashed border-accent-2/30 bg-accent-2/[0.04] px-5 py-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-[13.5px] text-muted">
            <span className="font-medium text-fg">Welcome{firstName && firstName !== 'Guest' ? `, ${firstName}` : ''}.</span>{' '}
            You’re looking at illustrative demo data. It’s replaced by your own results as soon as you run a scan.
          </p>
          <Link to="/app/scanner" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-2 hover:underline">
            Run your first scan <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Summary cards */}
      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Activity} label="Total Scans" value={m.total} note={`${m.thisWeek} in the last 7 days`} i={0} />
        <Stat icon={TriangleAlert} label="Threats Detected" value={m.threats} note="Scans rated medium risk or above" i={1} />
        <Stat icon={ShieldAlert} label="High-Risk Findings" value={m.highRisk} note={m.critical ? `${m.critical} critical` : 'None critical'} tone={m.highRisk ? 'danger' : undefined} i={2} />
        <Stat
          icon={Gauge}
          label="Security Score"
          value={m.securityScore ?? '—'}
          suffix={m.securityScore !== null ? '/100' : undefined}
          note="Inverse of average risk across scans"
          i={3}
        />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card as="section">
          <CardHeader
            title="Threat Activity"
            description={usingDemo ? 'Illustrative scan activity, last 14 days' : 'Your scans over the last 14 days'}
            action={
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-sm bg-warning/85" />Threats</span>
                <span className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-sm bg-accent/55" />Low risk</span>
              </div>
            }
          />
          <div className="px-3 pb-4 pt-5 sm:px-5">
            <ActivityChart data={activity} />
          </div>
        </Card>

        <Card as="section">
          <CardHeader title="Recent Alerts" description="High and critical findings" action={usingDemo ? <DemoBadge /> : undefined} />
          {alerts.length === 0 ? (
            <EmptyState icon={<ShieldAlert className="h-5 w-5" />} title="No high-risk alerts" description="High and critical results from your scans will appear here." />
          ) : (
            <ul className="divide-y divide-line">
              {alerts.map((a) => (
                <li key={a.id}>
                  <Link to={`/app/reports/${a.id}`} className="block px-5 py-4 transition-colors hover:bg-fg/[0.025] sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13.5px] font-medium text-fg">{a.category}</p>
                      <RiskBadge level={a.level} size="sm" />
                    </div>
                    <p className="mt-1 truncate font-mono text-[11.5px] text-subtle">{truncateMiddle(a.target, 48)} · {relativeTime(a.createdAt)}</p>
                    <p className="mt-2 text-[13px] leading-5 text-muted">{CATEGORY_INFO[a.category].explanation}</p>
                    <p className="mt-2 text-[13px] leading-5 text-fg">
                      <span className="label-mono mr-1.5">Action</span>
                      {CATEGORY_INFO[a.category].action}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card as="section" className="mt-6 overflow-hidden">
        <CardHeader
          title="Recent Scans"
          description="Latest analyses"
          action={<Link to="/app/history" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg">View all <ArrowRight aria-hidden className="h-3.5 w-3.5" /></Link>}
        />
        <ScansTable scans={displayScans.slice(0, 6)} caption="Recent scans" />
      </Card>
    </>
  )
}

function Stat({
  icon: Icon, label, value, note, suffix, tone, i,
}: { icon: typeof Activity; label: string; value: number | string; note: string; suffix?: string; tone?: 'danger'; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: i * 0.04 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <Icon aria-hidden className={cn('h-4 w-4', tone === 'danger' ? 'text-danger' : 'text-subtle')} strokeWidth={1.9} />
      </div>
      <p className="mt-4 text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-fg">
        {value}
        {suffix && <span className="ml-1 text-base font-normal text-subtle">{suffix}</span>}
      </p>
      <p className="mt-2.5 text-[12.5px] text-subtle">{note}</p>
    </motion.div>
  )
}
