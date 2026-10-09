import type { RiskLevel, ScanReport, ThreatCategory } from './types'
import { riskOrder } from './utils'

export const CATEGORY_INFO: Record<ThreatCategory, { explanation: string; action: string }> = {
  'Credential harvesting': {
    explanation: 'Tries to collect passwords, codes or login details, usually via a fake sign-in page.',
    action: 'Don’t enter details. Sign in only through the official app or a typed-in address.',
  },
  Phishing: {
    explanation: 'Uses pressure or deception to get you to click, reply or share information.',
    action: 'Verify with the sender through a channel you already trust before acting.',
  },
  'Payment / financial scam': {
    explanation: 'Requests money, fees, gift cards or bank details under a false pretext.',
    action: 'Don’t pay. Confirm any request with the organization directly.',
  },
  Impersonation: {
    explanation: 'Poses as a known brand or institution using a lookalike name or domain.',
    action: 'Go to the brand’s official website or app yourself rather than following the link.',
  },
  'Prize / lottery scam': {
    explanation: 'Promises an unexpected reward to extract fees or personal information.',
    action: 'Ignore and delete. Real prizes don’t require payment or codes to claim.',
  },
  'Suspicious link': {
    explanation: 'The link has structural traits often seen in malicious URLs.',
    action: 'Avoid opening it. If needed, look up the destination independently.',
  },
  'No strong indicators': {
    explanation: 'No strong warning signs were found. This is not a guarantee of safety.',
    action: 'Stay cautious with unexpected requests.',
  },
}

export function computeMetrics(scans: ScanReport[]) {
  const now = Date.now()
  const weekAgo = now - 7 * 86_400_000
  const total = scans.length
  const thisWeek = scans.filter((s) => new Date(s.createdAt).getTime() >= weekAgo).length
  const threats = scans.filter((s) => s.score >= 25).length
  const highRisk = scans.filter((s) => s.level === 'high' || s.level === 'critical').length
  const critical = scans.filter((s) => s.level === 'critical').length
  const avgRisk = total ? scans.reduce((a, s) => a + s.score, 0) / total : 0
  const securityScore = total ? Math.round(100 - avgRisk) : null
  return { total, thisWeek, threats, highRisk, critical, securityScore }
}

const localKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

export function activityByDay(scans: ScanReport[], days = 14) {
  const out: Array<{ key: string; label: string; scans: number; threats: number }> = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push({
      key: localKey(d),
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      scans: 0,
      threats: 0,
    })
  }
  const idx = new Map(out.map((o, i) => [o.key, i]))
  for (const s of scans) {
    const i = idx.get(localKey(new Date(s.createdAt)))
    if (i === undefined) continue
    out[i].scans++
    if (s.score >= 25) out[i].threats++
  }
  return out
}

export function riskDistribution(scans: ScanReport[]) {
  return riskOrder.map((level: RiskLevel) => ({ level, count: scans.filter((s) => s.level === level).length }))
}

export function categoryBreakdown(scans: ScanReport[]) {
  const m = new Map<ThreatCategory, number>()
  scans.forEach((s) => m.set(s.category, (m.get(s.category) ?? 0) + 1))
  return Array.from(m, ([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count)
}
