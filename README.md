# CyberShield AI — Intelligent Digital Risk Protection

A premium, production-ready frontend for analyzing suspicious links, messages, screenshots and QR codes.

Built with **React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion · Recharts · Lucide**.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build → dist/
npm run preview      # serve the production build
npm run build:single # optional: one self-contained HTML file → dist-single/
```

Routing uses `HashRouter`, so `dist/` can be deployed to any static host (Netlify, Vercel, S3, GitHub Pages) without rewrite rules.

## What's real and what's demo

The UI never claims a capability that isn't connected.

| Area | Status without a backend | How to connect |
|---|---|---|
| **Threat Scanner – URL & message analysis** | ✅ Real. A transparent, rule-based engine (`src/lib/analyzer.ts`) runs in the browser: lookalike/typosquat brands, raw IPs, punycode, `@` tricks, shorteners, risky TLDs, open redirects, executable downloads, HTTP, urgency / credential / payment / prize / threat language. | — |
| **QR code scanner** | ✅ Real. Decoded on-device with `jsQR`, then analyzed. | — |
| **Screenshot scanner** | ✅ Detects QR codes in screenshots. Text extraction (OCR) needs a backend, so the user can paste the visible text. | Add OCR server-side |
| **Threat intelligence during scans** | Marked **Unknown – not connected** in every report. | `VITE_THREAT_INTEL_API_URL` |
| **Threat Intelligence page** | Clearly labeled **demonstration data** using reserved domains (`.example`, `.test`, `.invalid`) and documentation IPs. | `VITE_THREAT_FEED_API_URL` |
| **AI Security Copilot** | **Demo mode** badge. Analyzes pasted content with the local engine and gives pre-written guidance; every reply is tagged "not AI-generated". | `VITE_COPILOT_API_URL` |
| **Overview / Reports** | Your real scans. Before your first scan, demo records are shown with a "Demo data" badge. | — |
| **Sign in** | No auth service: opens a local workspace and says so. | Wire to your auth provider |

Copy `.env.example` to `.env.local` to configure endpoints. Only put **public backend URLs** there — keep LLM and threat-intel API keys on your server.

### Backend contracts

```
POST VITE_COPILOT_API_URL       { messages: [{ role, content }] }  → { reply }
POST VITE_THREAT_INTEL_API_URL  { indicators: string[] }           → { results: [{ indicator, verdict, source?, detail? }] }
GET  VITE_THREAT_FEED_API_URL                                      → { indicators: [...], updatedAt }
```

## Risk model

Each finding has a status — **Confirmed** (verifiable fact), **Suspicious** (heuristic pattern), **Unknown** (not checked), or **No issue found** — plus evidence, confidence and an explanation. Weights combine with diminishing returns into a 0–100 score:

| Score | Level |
|---|---|
| 0–24 | Low Risk — never presented as "safe" |
| 25–54 | Medium Risk |
| 55–79 | High Risk |
| 80–100 | Critical Risk |

## Project structure

```
src/
  components/
    landing/   HeroPreview
    layout/    AppLayout, Sidebar, Topbar, CommandPalette, nav
    report/    ReportView, RiskGauge, ScansTable, Charts
    scanner/   Dropzone, AnalysisProgress
    ui/        Button, primitives (Card, Tabs, Switch, badges, Field, Skeleton…)
  context/     AppContext (settings, theme, scan history), ToastContext
  data/        demo.ts — demonstration-only records
  lib/         analyzer, copilot, qr, insights, config, hooks, utils, types
  pages/       LandingPage, SignInPage, NotFoundPage, app/* (8 app pages)
```

## Design system

Tokens live in `src/index.css` as RGB channels (so Tailwind opacity modifiers work) with full dark and light themes, mapped in `tailwind.config.js`. Typography is Geist / Geist Mono, spacing follows an 8px rhythm, cards use 16px radius, controls 10px.

## Accessibility

Semantic landmarks, skip links, WAI-ARIA tabs with arrow-key navigation, labeled inputs with `aria-invalid` / `aria-describedby` errors, live regions for analysis progress and toasts, visible focus rings, keyboard shortcuts (`⌘/Ctrl K` or `/` search, `N` new scan), and `prefers-reduced-motion` support.

## Privacy

Scan history, settings and Copilot conversations are stored in `localStorage` only. Message text is **not** stored unless the user opts in, history saving can be turned off, and links are never opened.
