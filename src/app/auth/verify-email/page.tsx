import Link from 'next/link'
import { AccrionBadge } from '@/components/brand/AccrionBadge'

export default function VerifyEmailPage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Check your inbox</div>
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 320 }}>
        We sent you a confirmation link. Click it to activate your account, then come back and log in.
      </div>
      <Link href="/auth/login" style={{ color: 'var(--green)', fontWeight: 700, marginTop: 28, fontSize: 15 }}>
        Back to login →
      </Link>

      <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <AccrionBadge />
      </div>
    </div>
  )
}
