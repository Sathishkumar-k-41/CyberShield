import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { demoScans } from '../data/demo'
import type { ScanReport } from '../lib/types'
import { readStorage, writeStorage } from '../lib/utils'

export type ThemePref = 'dark' | 'light' | 'system'

export interface Settings {
  profile: { name: string; email: string; organization: string }
  security: { autoAnalyzeQr: boolean; warnOnHighRisk: boolean; defangCopiedLinks: boolean }
  notifications: { highRiskAlerts: boolean; weeklySummary: boolean; productUpdates: boolean }
  privacy: { saveHistory: boolean; storeMessageText: boolean }
  theme: ThemePref
  language: string
}

const DEFAULT_SETTINGS: Settings = {
  profile: { name: 'Guest analyst', email: '', organization: '' },
  security: { autoAnalyzeQr: false, warnOnHighRisk: true, defangCopiedLinks: true },
  notifications: { highRiskAlerts: true, weeklySummary: false, productUpdates: false },
  privacy: { saveHistory: true, storeMessageText: false },
  theme: 'dark',
  language: 'en',
}

interface AppState {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  resolvedTheme: 'dark' | 'light'
  setTheme: (t: ThemePref) => void
  /** Real scans run in this browser. */
  scans: ScanReport[]
  /** Real scans if any exist, otherwise demo records (each marked demo: true). */
  displayScans: ScanReport[]
  usingDemo: boolean
  addScan: (r: ScanReport) => void
  removeScan: (id: string) => void
  clearScans: () => void
  getScan: (id: string) => ScanReport | undefined
  readAlerts: string[]
  markAlertsRead: (ids: string[]) => void
}

const AppContext = createContext<AppState | null>(null)

function resolve(pref: ThemePref): 'dark' | 'light' {
  if (pref !== 'system') return pref
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = readStorage<Partial<Settings>>('cs.settings', {})
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      profile: { ...DEFAULT_SETTINGS.profile, ...stored.profile },
      security: { ...DEFAULT_SETTINGS.security, ...stored.security },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...stored.privacy },
      theme: (() => {
        try {
          return (localStorage.getItem('cs.theme') as ThemePref) || stored.theme || 'dark'
        } catch {
          return 'dark'
        }
      })(),
    }
  })
  const [scans, setScans] = useState<ScanReport[]>(() => readStorage<ScanReport[]>('cs.scans', []))
  // Report opened in this session even if history saving is off.
  const [sessionScans, setSessionScans] = useState<ScanReport[]>([])
  const [readAlerts, setReadAlerts] = useState<string[]>(() => readStorage<string[]>('cs.readAlerts', []))
  const [resolvedTheme, setResolved] = useState<'dark' | 'light'>(() => resolve(settings.theme))

  useEffect(() => writeStorage('cs.settings', settings), [settings])
  useEffect(() => {
    if (settings.privacy.saveHistory) writeStorage('cs.scans', scans)
  }, [scans, settings.privacy.saveHistory])
  useEffect(() => writeStorage('cs.readAlerts', readAlerts), [readAlerts])

  useEffect(() => {
    const apply = () => {
      const r = resolve(settings.theme)
      setResolved(r)
      document.documentElement.setAttribute('data-theme', r)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', r === 'dark' ? '#080B12' : '#F7F8FA')
    }
    apply()
    try {
      localStorage.setItem('cs.theme', settings.theme)
    } catch {
      /* ignore */
    }
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings.theme])

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])
  const setTheme = useCallback((theme: ThemePref) => setSettings((s) => ({ ...s, theme })), [])

  const addScan = useCallback(
    (r: ScanReport) => {
      const stored = settings.privacy.storeMessageText || r.type !== 'message' ? r : { ...r, target: 'Message (text not stored)' }
      if (settings.privacy.saveHistory) setScans((s) => [stored, ...s].slice(0, 200))
      else setSessionScans((s) => [r, ...s])
    },
    [settings.privacy],
  )
  const removeScan = useCallback((id: string) => setScans((s) => s.filter((x) => x.id !== id)), [])
  const clearScans = useCallback(() => {
    setScans([])
    try {
      localStorage.removeItem('cs.scans')
    } catch {
      /* ignore */
    }
  }, [])

  const usingDemo = scans.length === 0
  const displayScans = usingDemo ? demoScans : scans

  const getScan = useCallback(
    (id: string) => scans.find((s) => s.id === id) ?? sessionScans.find((s) => s.id === id) ?? demoScans.find((s) => s.id === id),
    [scans, sessionScans],
  )

  const markAlertsRead = useCallback((ids: string[]) => setReadAlerts((r) => Array.from(new Set([...r, ...ids]))), [])

  const value = useMemo<AppState>(
    () => ({
      settings, updateSettings, resolvedTheme, setTheme, scans, displayScans, usingDemo,
      addScan, removeScan, clearScans, getScan, readAlerts, markAlertsRead,
    }),
    [settings, updateSettings, resolvedTheme, setTheme, scans, displayScans, usingDemo, addScan, removeScan, clearScans, getScan, readAlerts, markAlertsRead],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
