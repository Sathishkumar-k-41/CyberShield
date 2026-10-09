/**
 * DEMONSTRATION DATA ONLY.
 * Every domain below uses reserved, non-resolvable names (.example, .test,
 * .invalid — RFC 2606) or documentation IP ranges (RFC 5737). None of these
 * records describe real-world threats.
 */
import type { RiskLevel, ScanReport, ScanType, ThreatCategory } from '../lib/types'

const DAY = 86_400_000
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3_600_000).toISOString()

const seed: Array<[ScanType, string, number, RiskLevel, ThreatCategory, number, number]> = [
  ['url', 'https://account-verify.paypa1.example/login', 86, 'critical', 'Credential harvesting', 0, 2],
  ['message', '“Your parcel is on hold. Pay the ₹25 customs fee…”', 64, 'high', 'Payment / financial scam', 0, 7],
  ['qr', 'http://198.51.100.24/menu', 41, 'medium', 'Suspicious link', 1, 3],
  ['url', 'https://docs.example.com/shared/q3-plan', 6, 'low', 'No strong indicators', 1, 9],
  ['message', '“Congratulations! You have won a free recharge…”', 58, 'high', 'Prize / lottery scam', 2, 4],
  ['screenshot', 'chat-screenshot.png (text extracted)', 33, 'medium', 'Phishing', 3, 1],
  ['url', 'https://bit.ly.example/3xYz', 28, 'medium', 'Suspicious link', 4, 5],
  ['url', 'https://www.example.org/pricing', 4, 'low', 'No strong indicators', 5, 2],
  ['message', '“Dear customer, your KYC expires today. Update now…”', 72, 'high', 'Phishing', 6, 6],
  ['url', 'http://secure-bank-update.test/verify', 81, 'critical', 'Credential harvesting', 8, 2],
  ['qr', 'https://pay.example.net/parking', 12, 'low', 'No strong indicators', 10, 4],
  ['url', 'https://login-amaz0n.invalid/account', 77, 'high', 'Impersonation', 12, 8],
]

export const demoScans: ScanReport[] = seed.map(([type, target, score, level, category, d, h], i) => ({
  id: `demo_${i + 1}`,
  type,
  target,
  createdAt: ago(d, h),
  score,
  level,
  category,
  status: 'partial',
  engines: { heuristics: true, threatIntel: 'not-connected' },
  demo: true,
  indicators: { urls: [], domains: [] },
  recommendations: [
    'This is a demonstration record. Run a real scan from the Threat Scanner to see a full report.',
  ],
  sections: [
    {
      key: 'url',
      title: 'Demonstration record',
      summary: 'Sample data used to illustrate the interface.',
      findings: [
        {
          id: `demo_f_${i}`,
          title: 'Illustrative sample',
          status: 'unknown',
          evidence: target,
          confidence: 'n/a',
          explanation:
            'This record was not produced by an analysis. It exists only to show how history and reports look before you run your own scans.',
          weight: 0,
        },
      ],
    },
  ],
}))

export interface IntelIndicator {
  id: string
  indicator: string
  type: 'Domain' | 'URL' | 'IP address'
  classification: 'Malicious' | 'Suspicious' | 'Under review'
  category: 'Phishing' | 'Malware delivery' | 'Payment scam' | 'Impersonation' | 'Spam'
  source: string
  lastChecked: string
}

const SOURCE = 'Demo dataset'

export const demoIndicators: IntelIndicator[] = [
  ['secure-login.paypa1.example', 'Domain', 'Malicious', 'Phishing', 0, 3],
  ['http://198.51.100.24/menu', 'URL', 'Suspicious', 'Malware delivery', 0, 9],
  ['203.0.113.77', 'IP address', 'Malicious', 'Malware delivery', 1, 2],
  ['kyc-update-portal.test', 'Domain', 'Malicious', 'Phishing', 1, 6],
  ['parcel-fee-payment.example', 'Domain', 'Suspicious', 'Payment scam', 2, 1],
  ['https://login-amaz0n.invalid/account', 'URL', 'Malicious', 'Impersonation', 2, 8],
  ['free-recharge-winner.test', 'Domain', 'Under review', 'Spam', 3, 4],
  ['192.0.2.150', 'IP address', 'Suspicious', 'Phishing', 4, 0],
  ['wallet-unlock.example.net', 'Domain', 'Malicious', 'Payment scam', 5, 5],
  ['https://support-microsofft.example/ticket', 'URL', 'Suspicious', 'Impersonation', 6, 2],
  ['bonus-claim.invalid', 'Domain', 'Under review', 'Spam', 7, 7],
  ['https://track-dhl-delivery.test/pay', 'URL', 'Malicious', 'Payment scam', 9, 3],
].map(([indicator, type, classification, category, d, h], i) => ({
  id: `ioc_${i + 1}`,
  indicator: indicator as string,
  type: type as IntelIndicator['type'],
  classification: classification as IntelIndicator['classification'],
  category: category as IntelIndicator['category'],
  source: SOURCE,
  lastChecked: ago(d as number, h as number),
}))
