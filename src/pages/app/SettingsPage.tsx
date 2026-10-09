import { Bell, Globe, Lock, Monitor, Moon, Palette, ShieldCheck, Sun, Trash2, User } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { Field, PageHeader, Switch } from '../../components/ui/primitives'
import { useApp, type Settings, type ThemePref } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { cn } from '../../lib/utils'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'appearance', label: 'Theme', icon: Palette },
  { id: 'language', label: 'Language', icon: Globe },
]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function SettingsPage() {
  const { settings, updateSettings, setTheme, clearScans, scans } = useApp()
  const { toast } = useToast()
  const [profile, setProfile] = useState(settings.profile)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [confirmWipe, setConfirmWipe] = useState(false)
  const dirty = JSON.stringify(profile) !== JSON.stringify(settings.profile)

  useEffect(() => {
    if (!confirmWipe) return
    const t = setTimeout(() => setConfirmWipe(false), 5000)
    return () => clearTimeout(t)
  }, [confirmWipe])

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!profile.name.trim()) next.name = 'Enter a display name.'
    else if (profile.name.trim().length > 60) next.name = 'Keep the name under 60 characters.'
    if (profile.email && !EMAIL.test(profile.email.trim())) next.email = 'Enter a valid email address or leave it blank.'
    setErrors(next)
    if (Object.keys(next).length) return document.getElementById(next.name ? 'p-name' : 'p-email')?.focus()
    updateSettings({ profile: { name: profile.name.trim(), email: profile.email.trim(), organization: profile.organization.trim() } })
    toast({ title: 'Profile saved', tone: 'success' })
  }

  const toggle = <K extends 'security' | 'notifications' | 'privacy'>(group: K, key: keyof Settings[K], label: string) => (v: boolean) => {
    updateSettings({ [group]: { ...settings[group], [key]: v } } as Partial<Settings>)
    toast({ title: `${label} ${v ? 'on' : 'off'}`, tone: 'success' })
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, preferences and data. Settings are stored in this browser." />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-muted transition-colors hover:bg-fg/[0.04] hover:text-fg"
                >
                  <Icon aria-hidden className="h-4 w-4" /> {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          <Section id="profile" title="Profile" description="How you appear in this workspace.">
            <form onSubmit={saveProfile} noValidate className="grid gap-5 py-5 sm:grid-cols-2">
              <Field label="Display name" htmlFor="p-name" error={errors.name}>
                <input id="p-name" className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'p-name-error' : undefined} autoComplete="name" />
              </Field>
              <Field label="Email" htmlFor="p-email" error={errors.email} hint="Optional. Used only to label your workspace.">
                <input id="p-email" type="email" className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'p-email-error' : 'p-email-hint'} autoComplete="email" placeholder="name@company.com" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Organization" htmlFor="p-org" hint="Optional.">
                  <input id="p-org" className="input" value={profile.organization} onChange={(e) => setProfile({ ...profile, organization: e.target.value })} autoComplete="organization" />
                </Field>
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button variant="ghost" disabled={!dirty} onClick={() => { setProfile(settings.profile); setErrors({}) }}>Cancel</Button>
                <Button type="submit" disabled={!dirty}>Save changes</Button>
              </div>
            </form>
          </Section>

          <Section id="security" title="Security preferences">
            <Switch label="Analyze QR codes automatically" description="Start analysis as soon as a QR code is decoded." checked={settings.security.autoAnalyzeQr} onChange={toggle('security', 'autoAnalyzeQr', 'Automatic QR analysis')} />
            <Switch label="Warn on high-risk results" description="Show a prominent alert when a scan is rated high or critical." checked={settings.security.warnOnHighRisk} onChange={toggle('security', 'warnOnHighRisk', 'High-risk warnings')} />
            <Switch label="Defang links in copied reports" description="Rewrites links as hxxp://example[.]com so they can’t be clicked by accident." checked={settings.security.defangCopiedLinks} onChange={toggle('security', 'defangCopiedLinks', 'Link defanging')} />
          </Section>

          <Section id="notifications" title="Notification preferences">
            <Switch label="High-risk alerts" description="Show high and critical findings in the notifications menu." checked={settings.notifications.highRiskAlerts} onChange={toggle('notifications', 'highRiskAlerts', 'High-risk alerts')} />
            <Switch label="Weekly summary email" description="Requires a connected email service. Your preference is saved for when one is configured." checked={settings.notifications.weeklySummary} onChange={toggle('notifications', 'weeklySummary', 'Weekly summary')} />
            <Switch label="Product updates" description="Occasional news about new features. Saved for when email is configured." checked={settings.notifications.productUpdates} onChange={toggle('notifications', 'productUpdates', 'Product updates')} />
          </Section>

          <Section id="privacy" title="Privacy" description="Scans run in your browser. Nothing is sent anywhere unless you connect a backend service.">
            <Switch label="Save scan history" description="Keep results in this browser so you can revisit them. When off, new scans are kept only until you close the tab." checked={settings.privacy.saveHistory} onChange={toggle('privacy', 'saveHistory', 'History saving')} />
            <Switch label="Store message text in history" description="When off, message scans are saved without the original text." checked={settings.privacy.storeMessageText} onChange={toggle('privacy', 'storeMessageText', 'Message text storage')} />
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Delete scan history</p>
                <p className="mt-0.5 text-[13px] text-muted">{scans.length} saved scan{scans.length === 1 ? '' : 's'} in this browser.</p>
              </div>
              <Button
                variant={confirmWipe ? 'danger' : 'secondary'}
                size="sm"
                disabled={!scans.length}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  if (!confirmWipe) return setConfirmWipe(true)
                  clearScans()
                  setConfirmWipe(false)
                  toast({ title: 'Scan history deleted', tone: 'success' })
                }}
              >
                {confirmWipe ? 'Click again to confirm' : 'Delete history'}
              </Button>
            </div>
          </Section>

          <Section id="appearance" title="Theme">
            <fieldset className="py-5">
              <legend className="sr-only">Color theme</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  ['dark', 'Dark', Moon],
                  ['light', 'Light', Sun],
                  ['system', 'System', Monitor],
                ] as const).map(([value, label, Icon]) => (
                  <label
                    key={value}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
                      settings.theme === value ? 'border-accent bg-accent/[0.06]' : 'border-line-strong hover:border-subtle/50',
                    )}
                  >
                    <input type="radio" name="theme" value={value} checked={settings.theme === value} onChange={() => setTheme(value as ThemePref)} className="sr-only" />
                    <Icon aria-hidden className={cn('h-4 w-4', settings.theme === value ? 'text-accent' : 'text-muted')} />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Section>

          <Section id="language" title="Language">
            <div className="py-5">
              <Field label="Interface language" htmlFor="lang" hint="Additional languages are in progress and will appear here when available.">
                <select
                  id="lang"
                  className="input sm:max-w-xs"
                  value={settings.language}
                  onChange={(e) => {
                    updateSettings({ language: e.target.value })
                    toast({ title: 'Language updated', tone: 'success' })
                  }}
                  aria-describedby="lang-hint"
                >
                  <option value="en">English</option>
                  <option value="hi" disabled>हिन्दी (Hindi) — coming soon</option>
                  <option value="ta" disabled>தமிழ் (Tamil) — coming soon</option>
                  <option value="es" disabled>Español — coming soon</option>
                </select>
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </>
  )
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="card scroll-mt-24 px-5 sm:px-6">
      <div className="border-b border-line py-4">
        <h2 id={`${id}-h`} className="text-[15px] font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      <div className="divide-y divide-line">{children}</div>
    </section>
  )
}
