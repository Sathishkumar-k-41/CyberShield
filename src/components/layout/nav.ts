import { Bot, FileBarChart2, History, LayoutGrid, Radar, ScanSearch, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  description: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Overview', icon: LayoutGrid, description: 'Security overview and recent activity' },
  { to: '/app/scanner', label: 'Threat Scanner', icon: ScanSearch, description: 'Analyze a URL, message, screenshot or QR code' },
  { to: '/app/copilot', label: 'AI Security Copilot', icon: Bot, description: 'Ask security questions in plain language' },
  { to: '/app/intel', label: 'Threat Intelligence', icon: Radar, description: 'Known malicious and suspicious indicators' },
  { to: '/app/history', label: 'Scan History', icon: History, description: 'Every scan you have run' },
  { to: '/app/reports', label: 'Security Reports', icon: FileBarChart2, description: 'Risk distribution, categories and exports' },
  { to: '/app/settings', label: 'Settings', icon: Settings, description: 'Profile, privacy, notifications and theme' },
]

export function titleForPath(pathname: string) {
  if (pathname.startsWith('/app/reports/')) return 'Threat Analysis Report'
  return NAV_ITEMS.find((n) => n.to === pathname)?.label ?? 'Overview'
}
