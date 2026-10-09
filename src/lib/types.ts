export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type ScanType = 'url' | 'message' | 'screenshot' | 'qr'

/**
 * How certain a finding is.
 * - confirmed:  a verifiable fact about the input (e.g. "the URL uses HTTP").
 * - suspicious: a heuristic signal commonly associated with scams; not proof.
 * - unknown:    information we could not determine (e.g. no intel feed connected).
 * - clear:      a check ran and found nothing notable (never implies "safe").
 */
export type FindingStatus = 'confirmed' | 'suspicious' | 'unknown' | 'clear'

export type Confidence = 'high' | 'medium' | 'low' | 'n/a'

export interface Finding {
  id: string
  title: string
  status: FindingStatus
  evidence: string
  confidence: Confidence
  explanation: string
  /** Contribution to the overall risk score (0 for informational findings). */
  weight: number
}

export type SectionKey = 'message' | 'url' | 'website' | 'intel' | 'recommendations'

export interface ReportSection {
  key: SectionKey
  title: string
  summary: string
  findings: Finding[]
}

export type ThreatCategory =
  | 'Phishing'
  | 'Credential harvesting'
  | 'Payment / financial scam'
  | 'Impersonation'
  | 'Prize / lottery scam'
  | 'Suspicious link'
  | 'No strong indicators'

export interface ScanReport {
  id: string
  type: ScanType
  target: string
  createdAt: string
  score: number
  level: RiskLevel
  category: ThreatCategory
  status: 'completed' | 'partial'
  /** Which engines actually ran, so the UI never overstates coverage. */
  engines: { heuristics: true; threatIntel: 'connected' | 'not-connected' | 'error' }
  sections: ReportSection[]
  recommendations: string[]
  indicators: { urls: string[]; domains: string[] }
  demo?: boolean
}
