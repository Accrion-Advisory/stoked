'use client'
import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { AccrionBadge } from '@/components/brand/AccrionBadge'

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  )
}

function SignupInner() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'
  const [state, action, pending] = useActionState(signup, undefined)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-primary)' }}>ST</span>
          <span style={{ color: 'var(--green)' }}>O</span>
          <span style={{ color: 'var(--text-primary)' }}>KED</span>
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Create your account</div>
      </div>

      <form action={action} style={{ width: '100%', maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="next" value={next} />

        <div>
          <label style={labelStyle}>Name</label>
          <input className="input" type="text" name="name" placeholder="Vikas Sharma" autoComplete="name" required />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input className="input" type="email" name="email" placeholder="you@email.com" autoComplete="email" required />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input className="input" type="password" name="password" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
        </div>

        {state?.error && <div style={errorStyle}>{state.error}</div>}

        <button className="btn-primary" type="submit" disabled={pending} style={{ marginTop: 4, opacity: pending ? 0.6 : 1 }}>
          {pending ? 'Creating account…' : 'Sign Up'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href={`/auth/login${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`} style={{ color: 'var(--green)', fontWeight: 700 }}>
            Log in
          </Link>
        </div>
      </form>

      <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <AccrionBadge />
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8,
  fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
}
const errorStyle: React.CSSProperties = {
  background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 10,
  padding: '12px 14px', fontSize: 14, fontWeight: 600,
}
