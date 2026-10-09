import { ChevronRight, Image as ImageIcon, Link2, MessageSquareText, QrCode, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ScanReport, ScanType } from '../../lib/types'
import { formatDate, scanTypeLabel, truncateMiddle } from '../../lib/utils'
import { RiskBadge } from '../ui/primitives'

const TYPE_ICON: Record<ScanType, typeof Link2> = { url: Link2, message: MessageSquareText, screenshot: ImageIcon, qr: QrCode }

interface Props {
  scans: ScanReport[]
  caption: string
  onDelete?: (s: ScanReport) => void
}

export function ScansTable({ scans, caption, onDelete }: Props) {
  const navigate = useNavigate()
  const open = (s: ScanReport) => navigate(`/app/reports/${s.id}`)

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {['Target', 'Scan type', 'Risk level', 'Date', 'Status'].map((h) => (
                <th key={h} scope="col" className="label-mono whitespace-nowrap px-6 py-3 font-normal first:pl-6">{h}</th>
              ))}
              <th scope="col" className="w-12 px-4"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {scans.map((s) => {
              const Icon = TYPE_ICON[s.type]
              return (
                <tr key={s.id} className="group cursor-pointer transition-colors hover:bg-fg/[0.025]" onClick={() => open(s)}>
                  <td className="max-w-[340px] px-6 py-3.5">
                    <a
                      href={`#/app/reports/${s.id}`}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); open(s) }}
                      className="block truncate font-mono text-[12.5px] text-fg hover:underline focus-visible:underline"
                      title={s.target}
                    >
                      {truncateMiddle(s.target, 52)}
                    </a>
                    <span className="mt-0.5 block text-xs text-subtle">{s.category}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-muted">
                    <span className="inline-flex items-center gap-2"><Icon aria-hidden className="h-3.5 w-3.5" />{scanTypeLabel[s.type]}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5"><RiskBadge level={s.level} size="sm" /> <span className="ml-1 font-mono text-[11px] text-subtle">{s.score}</span></td>
                  <td className="whitespace-nowrap px-6 py-3.5 tabular-nums text-muted">{formatDate(s.createdAt)}</td>
                  <td className="whitespace-nowrap px-6 py-3.5">
                    <StatusPill s={s} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {onDelete && !s.demo ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(s) }}
                        className="rounded-md p-1.5 text-subtle opacity-0 transition hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                        aria-label={`Delete scan of ${s.target}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <ChevronRight aria-hidden className="ml-auto h-4 w-4 text-subtle opacity-0 transition group-hover:opacity-100" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <ul className="divide-y divide-line md:hidden" aria-label={caption}>
        {scans.map((s) => {
          const Icon = TYPE_ICON[s.type]
          return (
            <li key={s.id} className="flex items-center gap-2 pr-2">
              <button onClick={() => open(s)} className="flex min-w-0 flex-1 items-start gap-3 px-5 py-4 text-left">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-elevated">
                  <Icon aria-hidden className="h-3.5 w-3.5 text-muted" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[12.5px] text-fg">{s.target}</span>
                  <span className="mt-1 block text-xs text-subtle">{scanTypeLabel[s.type]} · {formatDate(s.createdAt)}</span>
                  <span className="mt-2 flex items-center gap-2"><RiskBadge level={s.level} size="sm" /><StatusPill s={s} /></span>
                </span>
              </button>
              {onDelete && !s.demo && (
                <button onClick={() => onDelete(s)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-subtle hover:text-danger" aria-label={`Delete scan of ${s.target}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

function StatusPill({ s }: { s: ScanReport }) {
  if (s.demo) return <span className="font-mono text-[11px] uppercase tracking-wide text-accent-2">Demo</span>
  return s.status === 'completed' ? (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />Complete</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted" title="Heuristics only — threat intelligence not connected">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full border border-subtle" />Heuristics only
    </span>
  )
}
