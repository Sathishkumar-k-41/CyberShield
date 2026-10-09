import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ClipboardPaste, Image as ImageIcon, Link2, Loader2, MessageSquareText, QrCode, RotateCcw, ScanSearch, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ReportView } from '../../components/report/ReportView'
import { AnalysisProgress } from '../../components/scanner/AnalysisProgress'
import { Dropzone } from '../../components/scanner/Dropzone'
import { Button } from '../../components/ui/Button'
import { Field, PageHeader, Tabs } from '../../components/ui/primitives'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { ANALYSIS_STAGES, extractUrls, runAnalysis, validateUrl, type AnalysisInput, type StageState } from '../../lib/analyzer'
import { isThreatIntelConnected } from '../../lib/config'
import { decodeQrFromFile } from '../../lib/qr'
import type { ScanReport, ScanType } from '../../lib/types'
import { cn, truncateMiddle } from '../../lib/utils'

const TABS = [
  { value: 'url' as const, label: 'URL', icon: <Link2 aria-hidden className="h-3.5 w-3.5" /> },
  { value: 'message' as const, label: 'Message', icon: <MessageSquareText aria-hidden className="h-3.5 w-3.5" /> },
  { value: 'screenshot' as const, label: 'Screenshot', icon: <ImageIcon aria-hidden className="h-3.5 w-3.5" /> },
  { value: 'qr' as const, label: 'QR Code', icon: <QrCode aria-hidden className="h-3.5 w-3.5" /> },
]

type Phase = { kind: 'input' } | { kind: 'analyzing'; target: string } | { kind: 'result'; report: ScanReport } | { kind: 'error'; message: string; input: AnalysisInput }

const MESSAGE_MAX = 5000

export function ScannerPage() {
  const [params, setParams] = useSearchParams()
  const initialTab = (TABS.find((t) => t.value === params.get('tab'))?.value ?? 'url') as ScanType
  const [tab, setTab] = useState<ScanType>(initialTab)
  const [phase, setPhase] = useState<Phase>({ kind: 'input' })
  const [stages, setStages] = useState<StageState[]>(ANALYSIS_STAGES.map(() => 'pending'))
  const { addScan, settings } = useApp()
  const { toast } = useToast()
  const topRef = useRef<HTMLDivElement>(null)

  const location = useLocation()
  const selfNav = useRef(false)

  const changeTab = (t: ScanType) => {
    setTab(t)
    selfNav.current = true
    setParams(t === 'url' ? {} : { tab: t }, { replace: true })
  }

  // Any external navigation to the scanner (sidebar, "New scan", links) starts a fresh scan.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) return void (firstRender.current = false)
    if (selfNav.current) return void (selfNav.current = false)
    setPhase({ kind: 'input' })
    setTab((TABS.find((t) => t.value === params.get('tab'))?.value ?? 'url') as ScanType)
  }, [location]) // eslint-disable-line react-hooks/exhaustive-deps

  const analyze = useCallback(
    async (input: AnalysisInput) => {
      setStages(ANALYSIS_STAGES.map(() => 'pending'))
      setPhase({ kind: 'analyzing', target: input.target })
      topRef.current?.scrollIntoView({ block: 'start' })
      try {
        const report = await runAnalysis(input, (i, s) => setStages((prev) => prev.map((p, idx) => (idx === i ? s : p))))
        addScan(report)
        setPhase({ kind: 'result', report })
        if (settings.security.warnOnHighRisk && (report.level === 'high' || report.level === 'critical')) {
          toast({ title: `${report.level === 'critical' ? 'Critical' : 'High'} risk detected`, description: 'Do not open the link or reply until you have verified the sender.', tone: 'error' })
        } else {
          toast({ title: 'Analysis complete', description: `Risk score ${report.score}/100.`, tone: 'success' })
        }
      } catch (err) {
        setPhase({ kind: 'error', message: (err as Error).message || 'Something went wrong during analysis.', input })
      }
    },
    [addScan, settings.security.warnOnHighRisk, toast],
  )

  const reset = () => {
    setPhase({ kind: 'input' })
    requestAnimationFrame(() => document.getElementById(`scanner-tab-${tab}`)?.focus())
  }

  return (
    <div ref={topRef} className="scroll-mt-24">
      <PageHeader title="Threat Scanner" description="Analyze suspicious digital content and understand potential risks." />

      <AnimatePresence mode="wait">
        {phase.kind === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="card p-5 sm:p-7">
                <Tabs items={TABS} value={tab} onChange={changeTab} idBase="scanner" className="flex w-full sm:inline-flex sm:w-auto" />
                <div className="mt-7">
                  {TABS.map((t) => (
                    <div key={t.value} role="tabpanel" id={`scanner-panel-${t.value}`} aria-labelledby={`scanner-tab-${t.value}`} hidden={tab !== t.value}>
                      {tab === 'url' && t.value === 'url' && <UrlPanel onAnalyze={analyze} initial={params.get('url') ?? ''} />}
                      {tab === 'message' && t.value === 'message' && <MessagePanel onAnalyze={analyze} initial={params.get('text') ?? ''} />}
                      {tab === 'screenshot' && t.value === 'screenshot' && <ScreenshotPanel onAnalyze={analyze} />}
                      {tab === 'qr' && t.value === 'qr' && <QrPanel onAnalyze={analyze} />}
                    </div>
                  ))}
                </div>
              </div>
              <CoveragePanel />
            </div>
          </motion.div>
        )}

        {phase.kind === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mx-auto max-w-2xl">
            <AnalysisProgress stages={stages} target={phase.target} />
          </motion.div>
        )}

        {phase.kind === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <ReportView report={phase.report} variant="summary" onScanAnother={reset} />
          </motion.div>
        )}

        {phase.kind === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-xl">
            <div role="alert" className="card p-8 text-center">
              <XCircle aria-hidden className="mx-auto h-8 w-8 text-danger" />
              <p className="mt-4 font-medium">The analysis couldn’t be completed</p>
              <p className="mt-1 text-sm text-muted">{phase.message}</p>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="secondary" onClick={reset}>Back</Button>
                <Button icon={<RotateCcw className="h-4 w-4" />} onClick={() => analyze(phase.input)}>Try again</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function CoveragePanel() {
  const intel = isThreatIntelConnected()
  return (
    <aside className="card h-fit p-6" aria-label="What this scan checks">
      <p className="label-mono">What gets checked</p>
      <ul className="mt-4 space-y-4 text-[13px]">
        <Coverage on title="URL structure" d="Lookalike domains, raw IPs, punycode, shorteners, redirects, risky downloads." />
        <Coverage on title="Message language" d="Urgency, credential and payment requests, prizes, threats." />
        <Coverage on title="QR codes in images" d="Decoded on your device. Images are never uploaded." />
        <Coverage on={intel} title="Threat intelligence" d={intel ? 'Reputation lookups via your connected service.' : 'Not connected. Set VITE_THREAT_INTEL_API_URL to enable reputation lookups.'} />
        <Coverage on={false} title="Live page inspection" d="Page content, certificates and domain age need a backend service." />
      </ul>
      <p className="mt-6 border-t border-line pt-4 text-[12px] leading-5 text-subtle">
        Scans never open or visit the links you submit.
      </p>
    </aside>
  )
}

function Coverage({ on, title, d }: { on: boolean; title: string; d: string }) {
  return (
    <li className="flex gap-3">
      {on ? <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <span aria-hidden className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border border-dashed border-subtle" />}
      <div>
        <p className={cn('font-medium', on ? 'text-fg' : 'text-muted')}>
          {title}
          <span className="sr-only">{on ? ' (active)' : ' (not available)'}</span>
        </p>
        <p className="mt-0.5 leading-5 text-subtle">{d}</p>
      </div>
    </li>
  )
}

const URL_EXAMPLES = [
  'http://secure-paypal.account-verify.example/login',
  'https://bit.ly/3xample',
  'https://www.wikipedia.org/',
]

function UrlPanel({ onAnalyze, initial }: { onAnalyze: (i: AnalysisInput) => void; initial: string }) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateUrl(value)
    setError(err)
    setTouched(true)
    if (err) return document.getElementById('scan-url')?.focus()
    onAnalyze({ type: 'url', target: value.trim(), url: value.trim() })
  }

  return (
    <form onSubmit={submit} noValidate>
      <Field label="Suspicious link" htmlFor="scan-url" hint="Paste the full link. It won’t be opened." error={touched ? error : null}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              id="scan-url"
              className="input h-12 pl-10 font-mono text-[13.5px]"
              placeholder="https://example.com/account/verify"
              value={value}
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setValue(e.target.value)
                if (touched) setError(validateUrl(e.target.value))
              }}
              onBlur={() => value && (setTouched(true), setError(validateUrl(value)))}
              aria-invalid={touched && Boolean(error)}
              aria-describedby={touched && error ? 'scan-url-error' : 'scan-url-hint'}
            />
          </div>
          <Button type="submit" size="lg" icon={<ScanSearch className="h-4 w-4" />}>Analyze</Button>
        </div>
      </Field>
      <div className="mt-6">
        <p className="label-mono mb-2">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {URL_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setValue(ex)
                setError(null)
                document.getElementById('scan-url')?.focus()
              }}
              className="max-w-full truncate rounded-lg border border-line bg-bg-2 px-2.5 py-1.5 font-mono text-[11.5px] text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}

const MESSAGE_EXAMPLE =
  'Dear customer, your account will be suspended within 24 hours due to incomplete KYC. Verify your account immediately at http://kyc-update.secure-bank.example/login and share the OTP to confirm.'

function MessagePanel({ onAnalyze, initial }: { onAnalyze: (i: AnalysisInput) => void; initial: string }) {
  const [text, setText] = useState(initial.slice(0, MESSAGE_MAX))
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const links = extractUrls(text)

  const paste = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (!clip.trim()) return toast({ title: 'Clipboard is empty', tone: 'info' })
      setText(clip.slice(0, MESSAGE_MAX))
      setError(null)
      toast({ title: 'Pasted from clipboard', tone: 'success' })
    } catch {
      toast({ title: 'Clipboard access blocked', description: 'Press Ctrl/⌘ + V in the text box instead.', tone: 'error' })
      document.getElementById('scan-message')?.focus()
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (t.length < 10) {
      setError(t ? 'Add a bit more of the message (at least 10 characters) for a meaningful analysis.' : 'Paste the message you want to analyze.')
      return document.getElementById('scan-message')?.focus()
    }
    setError(null)
    onAnalyze({ type: 'message', target: `“${truncateMiddle(t.replace(/\s+/g, ' '), 60)}”`, text: t })
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor="scan-message" className="text-[13px] font-medium">Message content</label>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setText(MESSAGE_EXAMPLE); setError(null) }}>Use example</Button>
          <Button variant="ghost" size="sm" icon={<ClipboardPaste className="h-3.5 w-3.5" />} onClick={paste}>Paste message</Button>
        </div>
      </div>
      <textarea
        id="scan-message"
        className="input min-h-[200px] resize-y leading-6"
        placeholder="Paste an SMS, email, WhatsApp or social media message…"
        value={text}
        maxLength={MESSAGE_MAX}
        onChange={(e) => {
          setText(e.target.value)
          if (error && e.target.value.trim().length >= 10) setError(null)
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={`scan-message-meta${error ? ' scan-message-error' : ''}`}
      />
      <div id="scan-message-meta" className="mt-2 flex items-center justify-between text-[12.5px] text-subtle">
        <span>{links.length ? `${links.length} link${links.length > 1 ? 's' : ''} detected — will be analyzed too` : 'Links in the message are analyzed automatically.'}</span>
        <span className={cn('tabular-nums', text.length > MESSAGE_MAX * 0.9 && 'text-warning')}>
          {text.length.toLocaleString()} / {MESSAGE_MAX.toLocaleString()}
        </span>
      </div>
      {error && <p id="scan-message-error" role="alert" className="mt-2 text-[13px] text-danger">{error}</p>}
      <div className="mt-6 flex justify-end">
        <Button type="submit" size="lg" icon={<ScanSearch className="h-4 w-4" />}>Analyze Message</Button>
      </div>
    </form>
  )
}

function useImageFile() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  const set = (f: File | null) => {
    setFile(f)
    setUrl(f ? URL.createObjectURL(f) : null)
  }
  return { file, url, set }
}

type QrState = { kind: 'idle' } | { kind: 'decoding' } | { kind: 'found'; data: string } | { kind: 'none' } | { kind: 'error'; message: string }

function QrStatus({ state }: { state: QrState }) {
  if (state.kind === 'idle') return null
  const base = 'flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px]'
  return (
    <div role="status" aria-live="polite" className="mt-4">
      {state.kind === 'decoding' && (
        <div className={cn(base, 'border-line bg-bg-2 text-muted')}>
          <Loader2 aria-hidden className="mt-0.5 h-4 w-4 animate-spin" /> Looking for a QR code…
        </div>
      )}
      {state.kind === 'found' && (
        <div className={cn(base, 'border-success/25 bg-success/[0.06]')}>
          <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <div className="min-w-0">
            <p className="font-medium text-fg">QR code decoded</p>
            <p className="mt-1 break-all font-mono text-[12.5px] text-muted">{state.data}</p>
          </div>
        </div>
      )}
      {state.kind === 'none' && (
        <div className={cn(base, 'border-line bg-bg-2 text-muted')}>
          <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> No QR code was found in this image.
        </div>
      )}
      {state.kind === 'error' && (
        <div className={cn(base, 'border-danger/25 bg-danger/[0.05] text-danger')}>
          <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> {state.message}
        </div>
      )}
    </div>
  )
}

function useQrDecode(url: string | null) {
  const [state, setState] = useState<QrState>({ kind: 'idle' })
  useEffect(() => {
    if (!url) return setState({ kind: 'idle' })
    let cancelled = false
    setState({ kind: 'decoding' })
    decodeQrFromFile(url)
      .then((data) => !cancelled && setState(data ? { kind: 'found', data } : { kind: 'none' }))
      .catch((e: Error) => !cancelled && setState({ kind: 'error', message: e.message }))
    return () => {
      cancelled = true
    }
  }, [url])
  return state
}

function ScreenshotPanel({ onAnalyze }: { onAnalyze: (i: AnalysisInput) => void }) {
  const img = useImageFile()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const qr = useQrDecode(img.url)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!img.file) {
      setError('Upload a screenshot first.')
      return
    }
    const qrUrl = qr.kind === 'found' && !validateUrl(qr.data) ? qr.data : undefined
    if (!text.trim() && !qrUrl) {
      setError('No QR code was found, so add the text you see in the screenshot to analyze it.')
      return document.getElementById('shot-text')?.focus()
    }
    setError(null)
    onAnalyze({ type: 'screenshot', target: `${img.file.name}${text.trim() ? ' (text provided)' : ' (QR decoded)'}`, url: qrUrl, text: text.trim() || undefined })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Dropzone
        label="Drag and drop a screenshot"
        hint="PNG, JPG, WebP or GIF up to 10 MB · processed on your device"
        file={img.file}
        previewUrl={img.url}
        onFile={(f) => { img.set(f); setUploadError(null); setError(null) }}
        onRemove={() => { img.set(null); setText('') }}
        error={uploadError}
        onError={setUploadError}
      />
      {img.file && <QrStatus state={qr} />}
      {img.file && (
        <Field
          label="Text in the screenshot"
          htmlFor="shot-text"
          hint="Automatic text extraction (OCR) requires a connected analysis service. Type or paste the message text you see to include it."
          error={error}
        >
          <textarea
            id="shot-text"
            className="input min-h-[120px] resize-y leading-6"
            placeholder="e.g. “Your parcel is held. Pay the customs fee at…”"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null) }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'shot-text-error' : 'shot-text-hint'}
          />
        </Field>
      )}
      {!img.file && error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="lg" icon={<ScanSearch className="h-4 w-4" />} disabled={qr.kind === 'decoding'}>
          Analyze Screenshot
        </Button>
      </div>
    </form>
  )
}

function QrPanel({ onAnalyze }: { onAnalyze: (i: AnalysisInput) => void }) {
  const img = useImageFile()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const qr = useQrDecode(img.url)
  const { settings } = useApp()
  const autoRan = useRef<string | null>(null)

  const decoded = qr.kind === 'found' ? qr.data : null
  const urlError = decoded ? validateUrl(decoded) : null

  const run = useCallback(() => {
    if (decoded && !urlError) onAnalyze({ type: 'qr', target: decoded, url: decoded })
  }, [decoded, urlError, onAnalyze])

  useEffect(() => {
    if (settings.security.autoAnalyzeQr && decoded && !urlError && autoRan.current !== decoded) {
      autoRan.current = decoded
      run()
    }
  }, [settings.security.autoAnalyzeQr, decoded, urlError, run])

  return (
    <div className="space-y-6">
      <Dropzone
        label="Upload a photo or screenshot of a QR code"
        hint="Decoded on your device — the image is never uploaded"
        file={img.file}
        previewUrl={img.url}
        onFile={(f) => { img.set(f); setUploadError(null) }}
        onRemove={() => img.set(null)}
        error={uploadError}
        onError={setUploadError}
      />
      {img.file && <QrStatus state={qr} />}
      {decoded && urlError && (
        <p role="alert" className="rounded-xl border border-warning/25 bg-warning/[0.06] px-4 py-3 text-[13px] text-muted">
          This QR code contains text rather than a web link, so there is no URL to analyze. If it looks like a message, paste it in the Message tab.
        </p>
      )}
      {decoded && !urlError && (
        <div className="rounded-xl border border-line bg-bg-2 p-4">
          <p className="label-mono">Extracted URL</p>
          <p className="mt-1.5 break-all font-mono text-[13px] text-fg">{decoded}</p>
        </div>
      )}
      <div className="flex justify-end">
        <Button size="lg" icon={<ScanSearch className="h-4 w-4" />} disabled={!decoded || Boolean(urlError)} onClick={run}>
          Analyze Extracted URL
        </Button>
      </div>
    </div>
  )
}
