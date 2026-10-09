/**
 * Copilot service. Uses your backend when VITE_COPILOT_API_URL is set.
 * Otherwise runs in clearly-labeled demo mode: it can analyze pasted content
 * with the local heuristic engine and return pre-written guidance, but it is
 * NOT a language model and does not pretend to be one.
 */
import { extractUrls, runAnalysis } from './analyzer'
import { config, isCopilotConnected } from './config'
import type { ScanReport } from './types'
import { riskMeta } from './utils'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  /** 'ai' = from connected model, 'demo' = pre-written / heuristic. */
  source?: 'ai' | 'demo'
  scanId?: string
  error?: boolean
}

export interface Conversation {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

export const SUGGESTED_PROMPTS = [
  'Is this message suspicious?',
  'Explain this risk report.',
  'What should I do if I clicked a phishing link?',
  'How can I secure my account?',
]

interface ReplyContext {
  latestScan?: ScanReport
  onScan: (r: ScanReport) => void
}

export async function getCopilotReply(history: ChatMessage[], ctx: ReplyContext): Promise<Omit<ChatMessage, 'id' | 'createdAt' | 'role'>> {
  if (isCopilotConnected()) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 30_000)
    try {
      const res = await fetch(config.copilotApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })) }),
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error(`The Copilot service responded with HTTP ${res.status}.`)
      const data = (await res.json()) as { reply?: string }
      if (!data.reply) throw new Error('The Copilot service returned an empty reply.')
      return { content: data.reply, source: 'ai' }
    } finally {
      clearTimeout(timer)
    }
  }
  return demoReply(history[history.length - 1]?.content ?? '', ctx)
}

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w))

async function demoReply(raw: string, ctx: ReplyContext): Promise<Omit<ChatMessage, 'id' | 'createdAt' | 'role'>> {
  const text = raw.trim()
  const t = text.toLowerCase()
  const urls = extractUrls(text)
  const promptOnly = SUGGESTED_PROMPTS.some((p) => p.toLowerCase() === t)
  const looksLikeContent = !promptOnly && (urls.length > 0 || text.length > 90)

  if (looksLikeContent) {
    const body = text.replace(/^is this (message|link) suspicious\??\s*/i, '')
    const onlyUrl = urls.length === 1 && body.trim() === urls[0]
    const report = await runAnalysis(
      onlyUrl
        ? { type: 'url', target: body.trim(), url: body.trim() }
        : { type: 'message', target: `“${body.length > 60 ? `${body.slice(0, 60)}…` : body}”`, text: body },
      () => {},
    )
    ctx.onScan(report)
    const flagged = report.sections.flatMap((s) => s.findings).filter((f) => f.weight > 0).sort((a, b) => b.weight - a.weight)
    const lines = [
      `I ran this through the local heuristic analyzer. **Risk score: ${report.score}/100 — ${riskMeta[report.level].label}** (${report.category}).`,
      '',
    ]
    if (flagged.length) {
      lines.push('What stood out:')
      flagged.slice(0, 4).forEach((f) => lines.push(`- **${f.title}** — ${f.explanation}`))
    } else {
      lines.push('I didn’t find common scam patterns. That’s not a guarantee of safety—well-crafted scams can look ordinary.')
    }
    lines.push('', 'What to do:')
    report.recommendations.slice(0, 3).forEach((r) => lines.push(`- ${r}`))
    if (report.engines.threatIntel !== 'connected') lines.push('', '_Threat intelligence isn’t connected, so known-threat databases weren’t checked._')
    return { content: lines.join('\n'), source: 'demo', scanId: report.id }
  }

  if (has(t, 'suspicious', 'is this a scam', 'is this real', 'legit')) {
    return {
      source: 'demo',
      content:
        'Paste the full message or link here and I’ll analyze it. Include the sender’s text exactly as you received it—links, numbers and all. I won’t open any links.',
    }
  }

  if (has(t, 'explain', 'report', 'score')) {
    const r = ctx.latestScan
    if (!r || r.demo) {
      return {
        source: 'demo',
        content: [
          'Each report scores risk from **0 to 100**:',
          '- **0–24 Low** — no strong indicators (not a guarantee of safety)',
          '- **25–54 Medium** — some warning signs; verify before acting',
          '- **55–79 High** — several strong scam signals',
          '- **80–100 Critical** — multiple severe signals; don’t engage',
          '',
          'Findings are labeled **Confirmed** (a verifiable fact), **Suspicious** (a common scam pattern), or **Unknown** (couldn’t be checked). Run a scan and ask again, and I’ll walk you through your specific result.',
        ].join('\n'),
      }
    }
    const top = r.sections.flatMap((s) => s.findings).filter((f) => f.weight > 0).sort((a, b) => b.weight - a.weight).slice(0, 3)
    return {
      source: 'demo',
      scanId: r.id,
      content: [
        `Your most recent scan scored **${r.score}/100 (${riskMeta[r.level].label})** and was classified as **${r.category}**.`,
        '',
        top.length ? 'The biggest contributors were:' : 'No individual signal contributed much to the score.',
        ...top.map((f) => `- **${f.title}** (${f.status}, ${f.confidence} confidence) — ${f.explanation}`),
        '',
        r.status === 'partial'
          ? 'This was a heuristic-only analysis: reputation databases weren’t checked, and anything marked Unknown should be treated as unverified rather than safe.'
          : 'Threat intelligence sources were also checked.',
      ].join('\n'),
    }
  }

  if (has(t, 'clicked', 'opened the link', 'entered my', 'gave my', 'shared my otp', 'shared the otp')) {
    return {
      source: 'demo',
      content: [
        'Act quickly, in this order:',
        '- **Disconnect** the device from Wi-Fi/mobile data if you downloaded or installed anything.',
        '- **Change your password** for the affected account from a trusted device, and anywhere you reuse it.',
        '- **Call your bank** using the number on your card if you shared card, UPI or banking details. Ask them to block transactions.',
        '- **Turn on two-factor authentication** and sign out of all other sessions.',
        '- **Uninstall** any app you installed from the link, and run your device’s security scan.',
        '- **Report it** to your national cybercrime portal (in India: cybercrime.gov.in or helpline 1930) and keep screenshots as evidence.',
        '',
        'If you only opened the page and didn’t enter anything, the risk is usually lower—but still clear your browser data and watch your accounts for a few days.',
      ].join('\n'),
    }
  }

  if (has(t, 'secure', 'protect', 'password', '2fa', 'two-factor', 'hacked', 'account')) {
    return {
      source: 'demo',
      content: [
        'A strong baseline for any important account:',
        '- Use a **unique, long password** for each account—a password manager makes this practical.',
        '- Turn on **two-factor authentication**, preferably an authenticator app or passkey rather than SMS.',
        '- Review **recovery email and phone** so they’re current and yours.',
        '- Check **active sessions and connected apps**, and remove anything you don’t recognize.',
        '- Never share **one-time codes**—no real support team will ask for them.',
        '- Keep your phone and apps **updated**.',
      ].join('\n'),
    }
  }

  if (has(t, 'qr')) {
    return {
      source: 'demo',
      content: 'QR codes can hide malicious links—especially stickers placed over legitimate ones on parking meters or posters. Before paying, check the domain shown after scanning. You can also upload a photo in the **Threat Scanner → QR Code** tab; it’s decoded on your device.',
    }
  }

  if (has(t, 'upi', 'payment', 'refund', 'money')) {
    return {
      source: 'demo',
      content: 'A key rule for UPI and wallet apps: **you never need to enter your PIN or scan a QR code to receive money.** Requests to “approve” a payment to get a refund are a common scam. Verify refunds directly in the merchant’s official app.',
    }
  }

  return {
    source: 'demo',
    content:
      'I’m running in **demo mode**, so I can’t hold an open-ended conversation. I can:\n- Analyze a message or link you paste here\n- Explain how risk reports work, or your latest scan\n- Guide you after clicking a phishing link\n- Share account-security basics\n\nConnect an AI backend (VITE_COPILOT_API_URL) for full conversational answers.',
  }
}
