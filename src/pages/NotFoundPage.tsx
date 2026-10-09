import { ButtonLink } from '../components/ui/Button'
import { Logo } from '../components/ui/primitives'
import { useDocumentTitle } from '../lib/hooks'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 text-center">
      <div>
        <div className="flex justify-center"><Logo compact /></div>
        <p className="label-mono mt-8">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">This page doesn’t exist.</h1>
        <p className="mt-2 text-muted">The link may be outdated or mistyped.</p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink to="/" variant="secondary">Home</ButtonLink>
          <ButtonLink to="/app">Open app</ButtonLink>
        </div>
      </div>
    </main>
  )
}
