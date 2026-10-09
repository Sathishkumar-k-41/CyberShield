import { ArrowLeft, Info } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Field, Logo } from '../components/ui/primitives'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../lib/hooks'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function SignInPage() {
  useDocumentTitle('Sign in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const { updateSettings, settings } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Enter your email address.'
    else if (!EMAIL.test(email.trim())) next.email = 'Enter a valid email address, like name@company.com.'
    if (!password) next.password = 'Enter your password.'
    else if (password.length < 8) next.password = 'Passwords are at least 8 characters.'
    setErrors(next)
    if (Object.keys(next).length) {
      document.getElementById(next.email ? 'email' : 'password')?.focus()
      return
    }
    // No authentication service is connected in this build: open the local workspace.
    updateSettings({ profile: { ...settings.profile, email: email.trim() } })
    toast({
      title: 'Opened your local workspace',
      description: 'Account sign-in isn’t connected yet, so your data stays in this browser.',
      tone: 'info',
    })
    navigate('/app')
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-5 py-12">
      <div aria-hidden className="hairline-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_40%,black,transparent)]" />
      <Link to="/" className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] text-muted hover:text-fg sm:left-8 sm:top-6">
        <ArrowLeft aria-hidden className="h-4 w-4" /> Back
      </Link>
      <main className="relative w-full max-w-[400px]">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card p-7 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">Sign in to CyberShield</h1>
          <p className="mt-1.5 text-sm text-muted">Welcome back. Enter your details to continue.</p>

          <div className="mt-5 flex gap-2.5 rounded-xl border border-accent-2/25 bg-accent-2/[0.06] p-3 text-[12.5px] leading-5 text-muted">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
            Authentication isn’t connected in this build. Signing in opens a local workspace; your password is not sent or stored.
          </div>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email" error={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                placeholder="name@company.com"
              />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password}>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
            </Field>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
        </div>
        <p className="mt-6 text-center text-[13px] text-muted">
          New to CyberShield?{' '}
          <Link to="/app" className="font-medium text-fg underline-offset-4 hover:underline">Start without an account</Link>
        </p>
      </main>
    </div>
  )
}
