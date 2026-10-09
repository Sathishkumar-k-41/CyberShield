import type { RiskLevel, ScanType } from './types'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function uid(prefix = 'id') {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}

export const riskMeta: Record<
  RiskLevel,
  { label: string; text: string; bg: string; ring: string; dot: string; hex: string }
> = {
  low: { label: 'Low Risk', text: 'text-success', bg: 'bg-success/10', ring: 'ring-success/25', dot: 'bg-success', hex: 'rgb(var(--success))' },
  medium: { label: 'Medium Risk', text: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/25', dot: 'bg-warning', hex: 'rgb(var(--warning))' },
  high: { label: 'High Risk', text: 'text-danger', bg: 'bg-danger/10', ring: 'ring-danger/25', dot: 'bg-danger', hex: 'rgb(var(--danger))' },
  critical: { label: 'Critical Risk', text: 'text-critical', bg: 'bg-critical/15', ring: 'ring-critical/40', dot: 'bg-critical', hex: 'rgb(var(--critical))' },
}

export const riskOrder: RiskLevel[] = ['low', 'medium', 'high', 'critical']

export function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'critical'
  if (score >= 55) return 'high'
  if (score >= 25) return 'medium'
  return 'low'
}

export const scanTypeLabel: Record<ScanType, string> = {
  url: 'URL',
  message: 'Message',
  screenshot: 'Screenshot',
  qr: 'QR code',
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  })
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso, { hour: undefined, minute: undefined })
}

export function truncateMiddle(s: string, max = 48) {
  if (s.length <= max) return s
  const half = Math.floor((max - 1) / 2)
  return `${s.slice(0, half)}…${s.slice(-half)}`
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode, quota) — degrade silently */
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
