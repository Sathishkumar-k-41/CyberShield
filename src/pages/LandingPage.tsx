import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, Bot, Building2, Check, CircleHelp, Eye, FileBarChart2, Fingerprint, Link2, Lock, Menu,
  MessageSquareText, QrCode, ScanSearch, ShieldCheck, Sparkles, Users, X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeroPreview } from '../components/landing/HeroPreview'
import { ButtonLink } from '../components/ui/Button'
import { Logo, StatusBadge } from '../components/ui/primitives'
import { useDocumentTitle } from '../lib/hooks'
import { cn } from '../lib/utils'

const NAV = [
  { href: '#platform', label: 'Platform' },
  { href: '#features', label: 'Features' },
  { href: '#threat-intelligence', label: 'Threat Intelligence' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#about', label: 'About' },
]

function scrollToHash(e: React.MouseEvent<HTMLAnchorElement>, href: string, after?: () => void) {
  // HashRouter owns the URL hash, so in-page anchors scroll manually.
  e.preventDefault()
  after?.()
  const el = document.querySelector(href)
  if (el) {
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    ;(el as HTMLElement).focus({ preventScroll: true })
  }
}

function LandingNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-200',
        scrolled || open ? 'border-line bg-bg/80 backdrop-blur-xl' : 'border-transparent bg-transparent',
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
        <Link to="/" className="rounded-lg" aria-label="CyberShield AI home">
          <Logo />
        </Link>
        <ul className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a
                href={n.href}
                onClick={(e) => scrollToHash(e, n.href)}
                className="rounded-lg px-3 py-2 text-[13.5px] text-muted transition-colors hover:text-fg"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto hidden items-center gap-2 lg:ml-0 lg:flex">
          <ButtonLink to="/signin" variant="ghost" size="sm">Sign in</ButtonLink>
          <ButtonLink to="/app" size="sm">Get Started</ButtonLink>
        </div>
        <button
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-fg/5 hover:text-fg lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-line lg:hidden"
          >
            <ul className="space-y-1 px-5 py-4">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    onClick={(e) => scrollToHash(e, n.href, () => setOpen(false))}
                    className="block rounded-lg px-3 py-3 text-[15px] text-muted hover:bg-fg/5 hover:text-fg"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2 border-t border-line px-5 py-4">
              <ButtonLink to="/signin" variant="secondary">Sign in</ButtonLink>
              <ButtonLink to="/app">Get Started</ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function SectionIntro({ eyebrow, title, body, center }: { eyebrow: string; title: string; body: string; center?: boolean }) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <p className="label-mono text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-fg sm:text-[38px]">{title}</h2>
      <p className="mt-4 text-[16px] leading-7 text-muted">{body}</p>
    </div>
  )
}

const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
}

export function LandingPage() {
  useDocumentTitle('Intelligent Digital Risk Protection')
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg">
      <a href="#hero" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-white" onClick={(e) => scrollToHash(e, '#hero')}>
        Skip to content
      </a>
      <LandingNav />

      <main>
        {/* HERO */}
        <section id="hero" tabIndex={-1} className="relative focus:outline-none">
          <div aria-hidden className="hairline-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-220px] h-[440px] w-[900px] -translate-x-1/2 rounded-full bg-accent/[0.10] blur-[120px]" />

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pb-28 lg:pt-24">
            <motion.div className="min-w-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-bg-2/80 px-3 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                AI-Powered Digital Risk Protection
              </p>
              <h1 className="mt-6 text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] text-fg sm:text-[60px] lg:text-[66px]">
                Stay Ahead of
                <br />
                <span className="text-accent">Digital Threats.</span>
              </h1>
              <p className="mt-6 max-w-[30rem] text-[17px] leading-[1.65] text-muted">
                Detect suspicious links, analyze potential scams, and understand digital risks with AI-powered security intelligence.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/app/scanner" size="lg" icon={<ScanSearch className="h-4 w-4" />}>
                  Analyze a Threat
                </ButtonLink>
                <a
                  href="#platform"
                  onClick={(e) => scrollToHash(e, '#platform')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-ctl border border-line-strong px-5 text-[15px] font-medium text-fg transition-colors hover:bg-fg/[0.04]"
                >
                  Explore Platform
                  <ArrowRight aria-hidden className="h-4 w-4 text-muted" />
                </a>
              </div>
              <ul className="mt-10 flex flex-col gap-3 text-[13.5px] text-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
                {['Privacy-first analysis', 'Explainable risk assessment', 'Actionable security insights'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check aria-hidden className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>
            <HeroPreview />
          </div>
        </section>

        {/* INPUT STRIP */}
        <section aria-label="What you can analyze" className="border-y border-line bg-bg-2/50">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 divide-line px-5 sm:px-8 md:grid-cols-4 md:divide-x">
            {[
              { icon: Link2, t: 'Links', d: 'Lookalike domains, redirects, risky downloads' },
              { icon: MessageSquareText, t: 'Messages', d: 'SMS, email and chat scam language' },
              { icon: Eye, t: 'Screenshots', d: 'Embedded QR codes and extracted text' },
              { icon: QrCode, t: 'QR codes', d: 'Decoded locally, then analyzed' },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-3 py-6 md:px-6 first:md:pl-0">
                <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="text-sm font-medium text-fg">{t}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-subtle">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* PLATFORM */}
        <section id="platform" tabIndex={-1} className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 focus:outline-none sm:px-8 sm:py-32">
          <motion.div {...reveal}>
            <SectionIntro
              eyebrow="Platform"
              title="From “is this real?” to a clear answer in seconds."
              body="Paste a link or message, upload a screenshot or QR code. CyberShield extracts the indicators, explains every signal it finds, and tells you what to do next."
            />
          </motion.div>
          <motion.ol {...reveal} className="mt-14 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3">
            {[
              { n: '01', t: 'Submit', d: 'Links, messages, screenshots or QR codes. Images are processed in your browser.' },
              { n: '02', t: 'Analyze', d: 'Indicators are extracted and checked against structural and linguistic risk patterns, plus threat intelligence when connected.' },
              { n: '03', t: 'Act', d: 'Get a 0–100 risk score, evidence for every finding, and specific next steps.' },
            ].map((s) => (
              <li key={s.n} className="bg-card p-7 sm:p-8">
                <span className="font-mono text-xs text-subtle">{s.n}</span>
                <p className="mt-6 text-lg font-medium tracking-tight text-fg">{s.t}</p>
                <p className="mt-2 text-[14.5px] leading-6 text-muted">{s.d}</p>
              </li>
            ))}
          </motion.ol>
        </section>

        {/* FEATURES */}
        <section id="features" tabIndex={-1} className="scroll-mt-20 border-t border-line focus:outline-none">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
            <motion.div {...reveal}>
              <SectionIntro
                eyebrow="Features"
                title="Built for clarity, not alarm."
                body="Security tools often bury people in jargon or false certainty. CyberShield is designed to explain—so you can make the call with confidence."
              />
            </motion.div>
            <motion.div {...reveal} className="mt-14 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: ScanSearch, t: 'Multi-format scanner', d: 'One place to check URLs, messages, screenshots and QR codes.' },
                { icon: Fingerprint, t: 'Lookalike detection', d: 'Spots brand names on unrelated domains, homoglyph swaps and typosquats.' },
                { icon: CircleHelp, t: 'Explainable findings', d: 'Each signal shows its evidence, confidence and why it matters.' },
                { icon: Bot, t: 'AI Security Copilot', d: 'Ask follow-up questions and get plain-language guidance.' },
                { icon: FileBarChart2, t: 'Reports & exports', d: 'Track risk over time and export scan history as CSV or JSON.' },
                { icon: Lock, t: 'Private by default', d: 'History stays in your browser. Message text isn’t stored unless you opt in.' },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="group bg-card p-7 transition-colors hover:bg-elevated">
                  <Icon aria-hidden className="h-5 w-5 text-muted transition-colors group-hover:text-accent" strokeWidth={1.75} />
                  <h3 className="mt-5 text-[15px] font-medium text-fg">{t}</h3>
                  <p className="mt-1.5 text-[14px] leading-6 text-muted">{d}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* THREAT INTELLIGENCE */}
        <section id="threat-intelligence" tabIndex={-1} className="scroll-mt-20 border-t border-line bg-bg-2/40 focus:outline-none">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:items-center">
            <motion.div {...reveal}>
              <SectionIntro
                eyebrow="Threat Intelligence"
                title="Honest about what we know—and what we don’t."
                body="Every finding is labeled by certainty. A link that isn’t on any blocklist isn’t declared safe; it’s reported as unverified. Connect reputation feeds to add confirmed intelligence to each report."
              />
            </motion.div>
            <motion.div {...reveal} className="card overflow-hidden">
              {[
                { s: 'confirmed' as const, t: 'Confirmed', d: 'A verifiable fact about the input, such as an unencrypted HTTP connection or a raw IP address.' },
                { s: 'suspicious' as const, t: 'Suspicious', d: 'A pattern commonly seen in scams—an urgent deadline, a lookalike domain. Strong signal, not proof.' },
                { s: 'unknown' as const, t: 'Unknown', d: 'Something that could not be checked, like domain age without a connected service. Never treated as safe.' },
              ].map((x, i) => (
                <div key={x.t} className={cn('flex gap-4 p-6', i > 0 && 'border-t border-line')}>
                  <span className="w-24 shrink-0 pt-0.5"><StatusBadge status={x.s} /></span>
                  <div>
                    <p className="text-[15px] font-medium text-fg">{x.t}</p>
                    <p className="mt-1 text-[14px] leading-6 text-muted">{x.d}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SOLUTIONS */}
        <section id="solutions" tabIndex={-1} className="scroll-mt-20 border-t border-line focus:outline-none">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
            <motion.div {...reveal}>
              <SectionIntro
                eyebrow="Solutions"
                title="For anyone who has to decide whether to click."
                body="From a single suspicious text to a team triaging reported messages, CyberShield fits the way you already work."
              />
            </motion.div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {[
                { icon: ShieldCheck, t: 'Individuals & families', d: 'Check delivery texts, prize messages and payment requests before acting.', points: ['Plain-language verdicts', 'Step-by-step next actions'] },
                { icon: Users, t: 'Support & operations teams', d: 'Triage messages customers and staff forward to you, with a consistent rationale.', points: ['Shareable reports', 'Exportable history'] },
                { icon: Building2, t: 'Security teams', d: 'A lightweight first-pass for reported phishing, ready to connect to your intel stack.', points: ['Bring-your-own intel API', 'Evidence on every finding'] },
              ].map(({ icon: Icon, t, d, points }, i) => (
                <motion.article key={t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="card flex flex-col p-7">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-elevated">
                    <Icon aria-hidden className="h-[18px] w-[18px] text-fg" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-6 text-[16px] font-medium text-fg">{t}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-muted">{d}</p>
                  <ul className="mt-6 space-y-2 border-t border-line pt-5">
                    {points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-[13.5px] text-muted">
                        <Check aria-hidden className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} /> {p}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" tabIndex={-1} className="scroll-mt-20 border-t border-line bg-bg-2/40 focus:outline-none">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_1fr]">
            <motion.div {...reveal}>
              <SectionIntro
                eyebrow="About"
                title="Security you can understand."
                body="CyberShield AI exists to close the gap between a suspicious message and a confident decision. We believe good security tools show their work, respect your privacy, and never claim more certainty than the evidence supports."
              />
            </motion.div>
            <motion.dl {...reveal} className="grid content-start gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
              {[
                ['Explain, don’t alarm', 'Findings come with evidence and context, not just red badges.'],
                ['Privacy first', 'Images are decoded on-device. You control what is stored.'],
                ['No false certainty', '“No match found” is never presented as “safe”.'],
                ['Open integration', 'Plug in your own AI and threat-intelligence services.'],
              ].map(([t, d]) => (
                <div key={t} className="bg-card p-6">
                  <dt className="text-[14.5px] font-medium text-fg">{t}</dt>
                  <dd className="mt-1.5 text-[13.5px] leading-6 text-muted">{d}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
            <Sparkles aria-hidden className="mx-auto h-5 w-5 text-accent" />
            <h2 className="mx-auto mt-5 max-w-xl text-[30px] font-semibold tracking-[-0.025em] text-fg sm:text-[38px]">
              Got a message you’re not sure about?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[16px] text-muted">Run your first scan now. No account required.</p>
            <div className="mt-8 flex justify-center">
              <ButtonLink to="/app/scanner" size="lg" icon={<ScanSearch className="h-4 w-4" />}>Analyze a Threat</ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <Logo />
            <p className="mt-3 text-[13px] text-subtle">Intelligent Digital Risk Protection</p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={(e) => scrollToHash(e, n.href)} className="hover:text-fg">{n.label}</a>
              </li>
            ))}
            <li><Link to="/app" className="hover:text-fg">Open app</Link></li>
          </ul>
        </div>
        <p className="mx-auto max-w-6xl px-5 pb-10 text-[12px] text-subtle sm:px-8">
          © {new Date().getFullYear()} CyberShield AI. Automated risk assessments can produce false positives and false negatives.
        </p>
      </footer>
    </div>
  )
}
