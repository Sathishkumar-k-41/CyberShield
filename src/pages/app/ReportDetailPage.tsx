import { ArrowLeft, Download, FileQuestion, Printer, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ReportView } from '../../components/report/ReportView'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, CardHeader, EmptyState } from '../../components/ui/primitives'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { downloadFile } from '../../lib/utils'

export function ReportDetailPage() {
  const { id = '' } = useParams()
  const { getScan, removeScan } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const report = getScan(id)

  if (!report) {
    return (
      <Card>
        <EmptyState
          icon={<FileQuestion className="h-5 w-5" />}
          title="Report not found"
          description="It may have been deleted, or history saving was turned off when it was created."
          action={<ButtonLink to="/app/history" variant="secondary" size="sm">Go to Scan History</ButtonLink>}
        />
      </Card>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
        <Link to="/app/history" className="mr-auto inline-flex items-center gap-1.5 rounded-lg py-1 text-[13px] text-muted hover:text-fg">
          <ArrowLeft aria-hidden className="h-4 w-4" /> Scan History
        </Link>
        <Button
          variant="ghost"
          size="sm"
          icon={<Download className="h-3.5 w-3.5" />}
          onClick={() => {
            downloadFile(`cybershield-${report.id}.json`, JSON.stringify(report, null, 2), 'application/json')
            toast({ title: 'Report downloaded', tone: 'success' })
          }}
        >
          JSON
        </Button>
        <Button variant="ghost" size="sm" icon={<Printer className="h-3.5 w-3.5" />} onClick={() => window.print()}>Print / PDF</Button>
        {!report.demo && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => {
              removeScan(report.id)
              toast({ title: 'Report deleted', tone: 'success' })
              navigate('/app/history')
            }}
          >
            Delete
          </Button>
        )}
      </div>

      <ReportView report={report} variant="full" />

      {(report.indicators.urls.length > 0 || report.indicators.domains.length > 0) && (
        <Card as="section" className="mt-4">
          <CardHeader title="Extracted Indicators" description="Links and domains found in the submitted content" />
          <dl className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <dt className="label-mono">URLs ({report.indicators.urls.length})</dt>
              <dd className="mt-2 space-y-1.5">
                {report.indicators.urls.map((u) => <p key={u} className="break-all font-mono text-[12.5px] text-fg">{u}</p>)}
              </dd>
            </div>
            <div>
              <dt className="label-mono">Domains ({report.indicators.domains.length})</dt>
              <dd className="mt-2 space-y-1.5">
                {report.indicators.domains.map((d) => <p key={d} className="break-all font-mono text-[12.5px] text-fg">{d}</p>)}
              </dd>
            </div>
          </dl>
        </Card>
      )}
    </>
  )
}
