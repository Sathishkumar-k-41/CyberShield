/**
 * CyberShield local analysis engine.
 *
 * This is a transparent, rule-based heuristic engine that runs entirely in the
 * browser. It inspects the *structure* of URLs and the *language* of messages.
 * It does NOT fetch web pages and does NOT know about real-world threat reports
 * unless a threat-intelligence backend is configured (VITE_THREAT_INTEL_API_URL).
 * Every finding states how certain it is so the UI never overstates coverage.
 */
import { config, isThreatIntelConnected } from './config'
import type {
  Finding,
  ReportSection,
  ScanReport,
  ScanType,
  ThreatCategory,
} from './types'
import { levelFromScore, sleep, uid } from './utils'

/* ------------------------------------------------------------------ */
/* URL helpers                                                         */
/* ------------------------------------------------------------------ */

const TWO_LEVEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.in', 'net.in', 'org.in',
  'gov.in', 'ac.in', 'co.jp', 'co.nz', 'com.br', 'com.sg', 'com.my', 'co.za', 'com.mx', 'com.tr',
])

export function registrableDomain(host: string): string {
  const parts = host.toLowerCase().replace(/\.$/, '').split('.')
  if (parts.length <= 2) return parts.join('.')
  const lastTwo = parts.slice(-2).join('.')
  if (TWO_LEVEL_SUFFIXES.has(lastTwo)) return parts.slice(-3).join('.')
  return lastTwo
}

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/

/** Returns an error message, or null when the input is a usable http(s) URL. */
export function validateUrl(input: string): string | null {
  const value = input.trim()
  if (!value) return 'Enter a URL to analyze.'
  if (/\s/.test(value)) return 'URLs cannot contain spaces.'
  const parsed = parseUrl(value)
  if (!parsed) return 'This doesn’t look like a valid URL. Example: https://example.com/login'
  if (!['http:', 'https:'].includes(parsed.protocol))
    return 'Only http:// and https:// links can be analyzed.'
  const host = parsed.hostname
  if (!IPV4.test(host) && !host.includes('.') && !host.startsWith('['))
    return 'The domain needs a top-level extension, such as .com or .in.'
  return null
}

export function parseUrl(value: string): URL | null {
  const v = value.trim()
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `http://${v}`)
  } catch {
    return null
  }
}

const URL_IN_TEXT =
  /\b((?:https?:\/\/|www\.)[^\s<>"')\]]+|(?:[a-z0-9-]+\.)+(?:com|net|org|in|io|co|xyz|top|info|biz|me|ly|gl|link|click|online|site|shop|app|live|ru|cn|tk|ml|ga|cf|gq|zip|mov|icu|buzz|sbs|cfd)(?:\/[^\s<>"')\]]*)?)/gi

export function extractUrls(text: string): string[] {
  const found = text.match(URL_IN_TEXT) ?? []
  const cleaned = found
    .map((u) => u.replace(/[.,;:!?]+$/, ''))
    .filter((u) => parseUrl(u) && !/^\d+\.\d+$/.test(u))
  return Array.from(new Set(cleaned)).slice(0, 10)
}

/* ------------------------------------------------------------------ */
/* Reference data (structural, not threat intel)                       */
/* ------------------------------------------------------------------ */

const BRANDS: Record<string, string[]> = {
  paypal: ['paypal.com'],
  apple: ['apple.com', 'icloud.com'],
  microsoft: ['microsoft.com', 'live.com', 'office.com', 'outlook.com'],
  google: ['google.com', 'gmail.com', 'youtube.com'],
  amazon: ['amazon.com', 'amazon.in', 'amazon.co.uk'],
  netflix: ['netflix.com'],
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  whatsapp: ['whatsapp.com'],
  linkedin: ['linkedin.com'],
  coinbase: ['coinbase.com'],
  binance: ['binance.com'],
  dhl: ['dhl.com'],
  fedex: ['fedex.com'],
  usps: ['usps.com'],
  sbi: ['sbi.co.in', 'onlinesbi.sbi'],
  hdfc: ['hdfcbank.com'],
  icici: ['icicibank.com'],
  paytm: ['paytm.com'],
  phonepe: ['phonepe.com'],
  chase: ['chase.com'],
}

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at',
  'tiny.cc', 'buff.ly', 'rebrand.ly', 's.id', 'v.gd',
])

const RISKY_TLDS = new Set([
  'zip', 'mov', 'xyz', 'top', 'click', 'tk', 'ml', 'ga', 'cf', 'gq', 'work', 'rest', 'cam', 'icu',
  'buzz', 'lol', 'quest', 'sbs', 'cfd', 'country', 'support',
])

const SENSITIVE_WORDS = [
  'login', 'signin', 'sign-in', 'verify', 'verification', 'account', 'update', 'secure', 'wallet',
  'password', 'banking', 'kyc', 'otp', 'reset', 'unlock', 'confirm', 'billing', 'refund',
]

const RISKY_EXTENSIONS = /\.(apk|exe|scr|msi|bat|cmd|jar|vbs|ps1|dmg|iso)(\?|#|$)/i

function deHomoglyph(s: string) {
  return s
    .toLowerCase()
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w')
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
  return dp[a.length][b.length]
}

/* ------------------------------------------------------------------ */
/* URL analysis                                                        */
/* ------------------------------------------------------------------ */

interface Flags {
  impersonation?: string
  credentials?: boolean
  payment?: boolean
  prize?: boolean
  urgency?: boolean
  threat?: boolean
  shortener?: boolean
  download?: boolean
  hasUrl?: boolean
}

function f(
  title: string,
  status: Finding['status'],
  evidence: string,
  confidence: Finding['confidence'],
  explanation: string,
  weight = 0,
): Finding {
  return { id: uid('f'), title, status, evidence, confidence, explanation, weight }
}

export function analyzeUrl(raw: string, flags: Flags): { url: Finding[]; website: Finding[] } {
  const url: Finding[] = []
  const website: Finding[] = []
  const parsed = parseUrl(raw)
  if (!parsed) {
    url.push(f('URL could not be parsed', 'unknown', raw, 'n/a', 'The link is malformed, so its structure could not be checked.'))
    return { url, website }
  }
  flags.hasUrl = true
  const host = parsed.hostname.toLowerCase()
  const domain = registrableDomain(host)
  const tld = host.split('.').pop() ?? ''
  const subdomains = host.split('.').length - domain.split('.').length
  const full = parsed.href

  if (parsed.username || /^[^/]*@/.test(full.replace(/^https?:\/\//, ''))) {
    url.push(f('Credentials-style “@” in link', 'confirmed', full, 'high',
      'Text before “@” in a link is ignored by browsers. Attackers use it to make a link appear to point to a trusted site.', 25))
  }

  if (IPV4.test(host)) {
    url.push(f('Link points to a raw IP address', 'confirmed', host, 'high',
      'Legitimate services almost always use a domain name. Raw IP links are common in phishing and malware delivery.', 25))
  }

  if (host.includes('xn--')) {
    url.push(f('Internationalized (punycode) domain', 'suspicious', host, 'medium',
      'Punycode domains can render with characters that look identical to Latin letters, a technique used for lookalike domains.', 20))
  }

  // Brand impersonation / typosquatting
  const labels = host.split(/[.-]/).filter(Boolean)
  for (const [brand, official] of Object.entries(BRANDS)) {
    const isOfficial = official.some((d) => host === d || host.endsWith(`.${d}`))
    if (isOfficial) {
      website.push(f(`Domain belongs to ${brandLabel(brand)}’s known domains`, 'confirmed', domain, 'medium',
        'The registered domain matches a known official domain. This lowers—but does not remove—risk, since legitimate services can be abused.'))
      break
    }
    const exact = labels.some((l) => l === brand || deHomoglyph(l) === brand)
    const near = brand.length >= 5 && labels.some((l) => l.length >= 4 && levenshtein(deHomoglyph(l), brand) === 1)
    if (exact || near) {
      flags.impersonation = brand
      url.push(f(
        exact ? `References “${brandLabel(brand)}” on an unrelated domain` : `Lookalike of “${brandLabel(brand)}”`,
        'suspicious', host, exact ? 'high' : 'medium',
        `The link uses the name “${brandLabel(brand)}” but the registered domain is ${domain}, which is not one of ${brandLabel(brand)}’s known domains (${official.join(', ')}).`,
        exact ? 35 : 30,
      ))
      break
    }
  }

  if (SHORTENERS.has(domain) || SHORTENERS.has(host)) {
    flags.shortener = true
    url.push(f('Link shortener hides the destination', 'confirmed', host, 'high',
      'Shortened links conceal where they lead. The final destination could not be checked from the browser.', 12))
  }

  if (RISKY_TLDS.has(tld)) {
    url.push(f(`High-abuse top-level domain (.${tld})`, 'suspicious', `.${tld}`, 'low',
      'This extension is disproportionately used in abusive registrations. Many legitimate sites use it too, so this is a weak signal on its own.', 12))
  }

  if (subdomains >= 3) {
    url.push(f('Unusually deep subdomain chain', 'suspicious', host, 'medium',
      'Long chains of subdomains can push the real domain out of view on mobile screens.', 10))
  }

  if ((domain.match(/-/g) ?? []).length >= 2) {
    url.push(f('Multiple hyphens in domain', 'suspicious', domain, 'low',
      'Hyphen-heavy domains (e.g. secure-account-update) are a common phishing pattern.', 8))
  }

  const lowered = full.toLowerCase()
  const hits = SENSITIVE_WORDS.filter((w) => lowered.includes(w))
  if (hits.length && !website.some((x) => x.status === 'confirmed')) {
    url.push(f('Account or payment keywords in link', 'suspicious', hits.slice(0, 4).join(', '), 'medium',
      'Words like “verify” or “login” on a domain that is not the service’s official site often indicate a credential-harvesting page.', 10))
  }

  if (RISKY_EXTENSIONS.test(parsed.pathname)) {
    flags.download = true
    const ext = parsed.pathname.split('.').pop()
    url.push(f(`Direct download of a .${ext} file`, 'confirmed', parsed.pathname, 'high',
      'The link downloads an installable or executable file. Malicious apps (especially .apk) are a frequent payload in scam messages.', 25))
  }

  if (/[?&](url|redirect|next|goto|target|dest)=https?/i.test(parsed.search)) {
    url.push(f('Open redirect parameter', 'suspicious', parsed.search.slice(0, 80), 'medium',
      'The link passes another URL as a parameter, which can bounce visitors through a trusted domain to a malicious one.', 10))
  }

  if (parsed.port && !['80', '443'].includes(parsed.port)) {
    url.push(f('Non-standard port', 'confirmed', `:${parsed.port}`, 'medium',
      'Consumer websites rarely use custom ports. This is common for temporary or self-hosted malicious pages.', 8))
  }

  if (full.length > 120) {
    url.push(f('Very long URL', 'suspicious', `${full.length} characters`, 'low',
      'Excessive length can be used to hide the real domain or smuggle tracking and redirect data.', 5))
  }

  if (!url.some((x) => x.weight > 0)) {
    url.push(f('No structural red flags in the URL', 'clear', domain, 'medium',
      'None of the URL structure checks matched. This does not mean the destination is safe.'))
  }

  // Website indicators — only what can honestly be stated without fetching the page.
  if (parsed.protocol === 'http:') {
    website.push(f('Connection is not encrypted (HTTP)', 'confirmed', 'http://', 'high',
      'Anything entered on this page could be read in transit. Never enter passwords or payment details on an HTTP page.', 10))
  } else {
    website.push(f('Uses HTTPS', 'clear', 'https://', 'high',
      'The connection would be encrypted. HTTPS does not indicate that a site is legitimate—most phishing sites use it.'))
  }
  website.push(f('Page content, certificate and domain age not inspected', 'unknown', 'Not fetched', 'n/a',
    'The browser cannot safely fetch third-party pages. Connect a backend analysis service to inspect page content, redirects, certificate details and registration age.'))

  return { url, website }
}

/* ------------------------------------------------------------------ */
/* Message analysis                                                    */
/* ------------------------------------------------------------------ */

const MESSAGE_RULES: Array<{
  key: keyof Flags | 'greeting' | 'caps'
  title: string
  pattern: RegExp
  weight: number
  confidence: Finding['confidence']
  explanation: string
}> = [
  {
    key: 'credentials', title: 'Requests codes, passwords or login details', weight: 25, confidence: 'high',
    pattern: /\b(otp|one[- ]time (?:password|code)|verification code|password|passcode|\bpin\b|cvv|login details|share (?:the|your) code|confirm your (?:identity|account|details)|verify your (?:account|identity))\b/gi,
    explanation: 'Legitimate organizations do not ask you to share one-time codes, PINs or passwords by message.',
  },
  {
    key: 'urgency', title: 'Creates urgency or pressure', weight: 15, confidence: 'medium',
    pattern: /\b(urgent(?:ly)?|immediately|act now|right away|within \d+ ?(?:hours?|hrs|minutes?|mins)|last chance|expires? (?:today|soon)|final (?:notice|warning)|(?:will be|has been) (?:suspended|blocked|deactivated|locked|closed))\b/gi,
    explanation: 'Artificial deadlines are designed to make you act before you think or verify.',
  },
  {
    key: 'payment', title: 'Asks for payment or financial details', weight: 15, confidence: 'medium',
    pattern: /\b(gift ?cards?|wire transfer|bitcoin|crypto(?:currency)?|usdt|upi(?: id| pin)?|processing fee|delivery fee|customs fee|bank (?:details|account number)|refund|kyc|pay (?:now|immediately))\b/gi,
    explanation: 'Unexpected payment requests—especially via gift cards, crypto or small “fees”—are a hallmark of scams.',
  },
  {
    key: 'prize', title: 'Promises a prize, reward or windfall', weight: 15, confidence: 'medium',
    pattern: /\b(you(?:'ve| have)? won|winner|lottery|jackpot|prize|claim your (?:reward|gift|prize)|cash ?back|congratulations|selected for|free (?:gift|iphone|recharge))\b/gi,
    explanation: 'Unsolicited winnings are used to lure people into paying fees or sharing personal data.',
  },
  {
    key: 'threat', title: 'Threatens penalties or legal action', weight: 15, confidence: 'medium',
    pattern: /\b(legal action|police|arrest(?:ed)?|warrant|penalty|fine of|court|lawsuit|cyber ?crime department|tax (?:fraud|evasion))\b/gi,
    explanation: 'Threats of arrest or fines are a pressure tactic; real authorities do not settle matters by text message.',
  },
  {
    key: 'greeting', title: 'Generic greeting', weight: 6, confidence: 'low',
    pattern: /\b(dear (?:customer|user|client|member|account holder|sir\/madam)|valued customer)\b/gi,
    explanation: 'Mass scam messages often avoid using your name. A weak signal on its own.',
  },
]

function analyzeMessage(text: string, flags: Flags): Finding[] {
  const out: Finding[] = []
  for (const rule of MESSAGE_RULES) {
    const matches = Array.from(new Set((text.match(rule.pattern) ?? []).map((m) => m.toLowerCase())))
    if (matches.length) {
      if (rule.key in flags || ['credentials', 'urgency', 'payment', 'prize', 'threat'].includes(rule.key))
        (flags as Record<string, unknown>)[rule.key] = true
      out.push(f(rule.title, 'suspicious', matches.slice(0, 4).map((m) => `“${m}”`).join(', '), rule.confidence, rule.explanation, rule.weight))
    }
  }
  const brandMention = Object.keys(BRANDS).find((b) => new RegExp(`\\b${b}\\b`, 'i').test(text))
  if (brandMention) {
    out.push(f(`Mentions a well-known brand (${brandLabel(brandMention)})`, 'suspicious', brandMention, 'low',
      'Scammers frequently pose as banks, delivery services and tech companies. Verify through the official app or website rather than links in the message.', 5))
  }
  const letters = text.replace(/[^a-z]/gi, '')
  const caps = text.replace(/[^A-Z]/g, '')
  if (letters.length > 40 && caps.length / letters.length > 0.45) {
    out.push(f('Heavy use of capital letters', 'suspicious', `${Math.round((caps.length / letters.length) * 100)}% uppercase`, 'low',
      'Shouting and excessive punctuation are common in unsolicited promotional and scam messages.', 4))
  }
  if (!out.length) {
    out.push(f('No common scam language detected', 'clear', `${text.length} characters reviewed`, 'medium',
      'None of the language checks matched. Scams can still be well written—stay cautious with unexpected requests.'))
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Threat intelligence (backend only)                                  */
/* ------------------------------------------------------------------ */

interface IntelLookup {
  indicator: string
  verdict: 'malicious' | 'suspicious' | 'no-match'
  source?: string
  detail?: string
}

async function queryThreatIntel(indicators: string[]): Promise<
  { state: 'connected'; findings: Finding[] } | { state: 'not-connected' | 'error'; findings: Finding[] }
> {
  if (!indicators.length) {
    return { state: isThreatIntelConnected() ? 'connected' : 'not-connected', findings: [
      f('No indicators to look up', 'clear', 'No URLs or domains found', 'n/a', 'Threat intelligence lookups require a URL or domain.'),
    ] }
  }
  if (!isThreatIntelConnected()) {
    return {
      state: 'not-connected',
      findings: [
        f('Threat intelligence not connected', 'unknown', indicators.slice(0, 3).join(', '), 'n/a',
          'No reputation service is configured, so these indicators were not checked against known-threat databases. Not being listed would not mean an indicator is safe.'),
      ],
    }
  }
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(config.threatIntelApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indicators }),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { results?: IntelLookup[] }
    const findings = (data.results ?? []).map((r) =>
      r.verdict === 'malicious'
        ? f('Listed as malicious', 'confirmed', r.indicator, 'high', r.detail ?? `Reported by ${r.source ?? 'threat intelligence provider'}.`, 45)
        : r.verdict === 'suspicious'
          ? f('Flagged as suspicious', 'suspicious', r.indicator, 'medium', r.detail ?? `Flagged by ${r.source ?? 'provider'}.`, 20)
          : f('No match in connected sources', 'clear', r.indicator, 'medium', 'Not listed by the connected sources. New malicious sites often are not listed yet.'),
    )
    return { state: 'connected', findings }
  } catch (err) {
    return {
      state: 'error',
      findings: [f('Threat intelligence lookup failed', 'unknown', String((err as Error).message ?? err), 'n/a',
        'The reputation service could not be reached, so this part of the analysis is incomplete.')],
    }
  }
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

export const ANALYSIS_STAGES = [
  'Extracting indicators',
  'Analyzing message and URL',
  'Checking threat intelligence',
  'Calculating risk',
  'Preparing security report',
] as const

export type StageState = 'pending' | 'active' | 'done' | 'skipped'

export interface AnalysisInput {
  type: ScanType
  /** Human-readable target shown in history. */
  target: string
  url?: string
  text?: string
}

const BRAND_LABEL: Record<string, string> = {
  paypal: 'PayPal', whatsapp: 'WhatsApp', linkedin: 'LinkedIn', phonepe: 'PhonePe', dhl: 'DHL', usps: 'USPS',
  sbi: 'SBI', hdfc: 'HDFC Bank', icici: 'ICICI Bank', fedex: 'FedEx',
}
export const brandLabel = (b: string) => BRAND_LABEL[b] ?? b.charAt(0).toUpperCase() + b.slice(1)

function categorize(flags: Flags, score: number): ThreatCategory {
  if (score < 25) return 'No strong indicators'
  if (flags.credentials && (flags.hasUrl || flags.impersonation)) return 'Credential harvesting'
  if (flags.impersonation) return 'Impersonation'
  if (flags.prize) return 'Prize / lottery scam'
  if (flags.payment) return 'Payment / financial scam'
  if (flags.urgency || flags.threat || flags.credentials) return 'Phishing'
  return 'Suspicious link'
}

function recommend(flags: Flags, score: number): string[] {
  const r: string[] = []
  if (score >= 55) r.push('Do not open the link or reply to the sender.')
  if (flags.credentials) r.push('Never share one-time codes, PINs or passwords—no legitimate organization asks for them by message.')
  if (flags.impersonation) r.push(`Contact ${brandLabel(flags.impersonation)} directly through its official app or a website you type in yourself.`)
  if (flags.payment) r.push('Do not send money, gift cards or crypto. Confirm any payment request through an independent channel.')
  if (flags.download) r.push('Do not install the downloaded file. Only install apps from official app stores.')
  if (flags.shortener) r.push('Avoid shortened links from unknown senders; the real destination is hidden.')
  if (score >= 25) r.push('Report the message to your provider’s spam/phishing reporting option, then delete it.')
  if (score >= 55) r.push('If you already clicked or entered details, change the affected password and contact your bank if financial data was shared.')
  if (score < 25) {
    r.push('No strong warning signs were found, but this is not a guarantee of safety.')
    r.push('If the message was unexpected, verify it with the sender through a channel you already trust.')
  }
  return Array.from(new Set(r))
}

export async function runAnalysis(
  input: AnalysisInput,
  onStage: (index: number, state: StageState) => void,
): Promise<ScanReport> {
  // Each stage performs real work; a short minimum duration keeps the progress readable.
  const stage = async <T,>(i: number, work: () => Promise<T> | T, minMs = 320): Promise<T> => {
    onStage(i, 'active')
    const [result] = await Promise.all([Promise.resolve(work()), sleep(minMs)])
    onStage(i, 'done')
    return result
  }

  const flags: Flags = {}

  const indicators = await stage(0, () => {
    const urls = new Set<string>()
    if (input.url) urls.add(input.url.trim())
    if (input.text) extractUrls(input.text).forEach((u) => urls.add(u))
    const list = Array.from(urls)
    const domains = Array.from(new Set(list.map((u) => parseUrl(u)?.hostname).filter(Boolean) as string[]))
    return { urls: list, domains }
  })

  const { messageFindings, urlFindings, websiteFindings } = await stage(1, () => {
    const messageFindings = input.text ? analyzeMessage(input.text, flags) : []
    const urlFindings: Finding[] = []
    const websiteFindings: Finding[] = []
    for (const u of indicators.urls.slice(0, 5)) {
      const r = analyzeUrl(u, flags)
      const tag = indicators.urls.length > 1 ? ` — ${parseUrl(u)?.hostname}` : ''
      urlFindings.push(...r.url.map((x) => ({ ...x, title: x.title + tag })))
      websiteFindings.push(...r.website.map((x) => ({ ...x, title: x.title + tag })))
    }
    return { messageFindings, urlFindings, websiteFindings }
  }, 420)

  let intel: Awaited<ReturnType<typeof queryThreatIntel>>
  if (isThreatIntelConnected() && indicators.urls.length) {
    intel = await stage(2, () => queryThreatIntel([...indicators.urls, ...indicators.domains]), 300)
  } else {
    onStage(2, 'skipped')
    intel = await queryThreatIntel(indicators.urls)
  }

  const all = [...messageFindings, ...urlFindings, ...websiteFindings, ...intel.findings]
  const { score, level } = await stage(3, () => {
    const total = all.reduce((sum, x) => sum + x.weight, 0)
    // Diminishing returns: many weak signals approach, but never exceed, 100.
    const score = Math.min(100, Math.round(100 * (1 - Math.exp(-total / 55))))
    return { score, level: levelFromScore(score) }
  }, 260)

  return stage(4, () => {
    const sections: ReportSection[] = []
    sections.push({
      key: 'message',
      title: 'Message Analysis',
      summary: input.text
        ? `${messageFindings.filter((x) => x.status === 'suspicious').length} language signal(s) found.`
        : 'No message text was provided for this scan.',
      findings: input.text ? messageFindings : [f('No message content', 'unknown', '—', 'n/a', 'Only a link was analyzed. Paste the full message for language analysis.')],
    })
    sections.push({
      key: 'url',
      title: 'URL Intelligence',
      summary: indicators.urls.length
        ? `${indicators.urls.length} link(s) inspected for structural red flags.`
        : 'No links were found in the content.',
      findings: urlFindings.length ? urlFindings : [f('No links found', 'clear', '—', 'medium', 'The content does not contain a recognizable link.')],
    })
    sections.push({
      key: 'website',
      title: 'Website Indicators',
      summary: 'Transport security only. Page content was not fetched.',
      findings: websiteFindings.length ? websiteFindings : [f('No website to inspect', 'unknown', '—', 'n/a', 'There was no link to evaluate.')],
    })
    sections.push({
      key: 'intel',
      title: 'Threat Intelligence',
      summary:
        intel.state === 'connected' ? 'Checked against connected reputation sources.'
          : intel.state === 'error' ? 'Lookup failed — results incomplete.'
            : 'No reputation service connected.',
      findings: intel.findings,
    })
    const recommendations = recommend(flags, score)
    sections.push({ key: 'recommendations', title: 'Security Recommendations', summary: 'What to do next.', findings: [] })

    return {
      id: uid('scan'),
      type: input.type,
      target: input.target,
      createdAt: new Date().toISOString(),
      score,
      level,
      category: categorize(flags, score),
      status: intel.state === 'connected' ? 'completed' : 'partial',
      engines: { heuristics: true, threatIntel: intel.state },
      sections,
      recommendations,
      indicators,
    } satisfies ScanReport
  }, 240)
}

/** Makes indicators non-clickable when pasted elsewhere (hxxp://example[.]com). */
export function defang(text: string) {
  return text
    .replace(/\bhttp(s?):\/\//gi, 'hxxp$1://')
    .replace(/\b([a-z0-9-]+)\.([a-z]{2,})(?=[/:\s)\]—]|$)/gi, '$1[.]$2')
}

export function reportToText(r: ScanReport, opts: { defang?: boolean } = {}): string {
  const lines = [
    'CyberShield AI — Threat Analysis Report',
    `Target: ${r.target}`,
    `Scanned: ${new Date(r.createdAt).toLocaleString()}`,
    `Risk score: ${r.score}/100 (${r.level.toUpperCase()})`,
    `Category: ${r.category}`,
    `Coverage: heuristics ✓ · threat intelligence: ${r.engines.threatIntel}`,
    '',
  ]
  for (const s of r.sections) {
    if (s.key === 'recommendations') continue
    lines.push(`## ${s.title}`)
    for (const x of s.findings)
      lines.push(`- [${x.status}] ${x.title} — evidence: ${x.evidence} (confidence: ${x.confidence})`)
    lines.push('')
  }
  lines.push('## Recommendations', ...r.recommendations.map((x) => `- ${x}`), '')
  lines.push('Automated risk assessments can produce false positives and false negatives. Verify important information through official sources.')
  const text = lines.join('\n')
  return opts.defang ? defang(text) : text
}
