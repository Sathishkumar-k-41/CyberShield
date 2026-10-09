import { MotionConfig } from 'framer-motion'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { lazy } from 'react'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SignInPage } from './pages/SignInPage'

// App pages are code-split so the landing page loads quickly.
const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))
const OverviewPage = page(() => import('./pages/app/OverviewPage'), 'OverviewPage')
const ScannerPage = page(() => import('./pages/app/ScannerPage'), 'ScannerPage')
const CopilotPage = page(() => import('./pages/app/CopilotPage'), 'CopilotPage')
const IntelPage = page(() => import('./pages/app/IntelPage'), 'IntelPage')
const HistoryPage = page(() => import('./pages/app/HistoryPage'), 'HistoryPage')
const ReportsPage = page(() => import('./pages/app/ReportsPage'), 'ReportsPage')
const ReportDetailPage = page(() => import('./pages/app/ReportDetailPage'), 'ReportDetailPage')
const SettingsPage = page(() => import('./pages/app/SettingsPage'), 'SettingsPage')

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <ToastProvider>
          {/* HashRouter keeps deep links working on any static host without rewrite rules. */}
          <HashRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="scanner" element={<ScannerPage />} />
                <Route path="copilot" element={<CopilotPage />} />
                <Route path="intel" element={<IntelPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="reports/:id" element={<ReportDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </HashRouter>
        </ToastProvider>
      </AppProvider>
    </MotionConfig>
  )
}
