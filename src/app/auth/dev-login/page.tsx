'use client'
import { useRouter } from 'next/navigation'
import { DEV_USERS } from '@/lib/dev-data'
import { getInitials, getAvatarColor } from '@/lib/dev-data'
import { AccrionBadge } from '@/components/brand/AccrionBadge'

export default function DevLoginPage() {
  const router = useRouter()

  function login(userId: string) {
    localStorage.setItem('stoked_dev_user', userId)
    router.push('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px',
      }}
    >
      {/* Header */}
      <div style={{ paddingTop: 80, paddingBottom: 48, textAlign: 'center' }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>ST</span>
          <span style={{ color: 'var(--green)' }}>O</span>
          <span style={{ color: 'var(--text-primary)' }}>KED</span>
        </div>
        <div style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em' }}>
          DEV MODE
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 20, lineHeight: 1.5 }}>
          Select a test profile to explore the app
        </div>
      </div>

      {/* Profile cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DEV_USERS.map((user, i) => {
          const color = getAvatarColor(user.id)
          const initials = getInitials(user.name)
          const labels = ['Group Creator', 'Core Member', 'Active Trader']
          const portfolioSizes = ['₹8.75L portfolio', '₹6.2L portfolio', '₹5.1L portfolio']

          return (
            <button
              key={user.id}
              onClick={() => login(user.id)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s, background 0.2s',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: color + '22',
                  border: `2px solid ${color}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  color,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>
                  {labels[i]} · {portfolioSizes[i]}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{user.email}</div>
              </div>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6, textAlign: 'center' }}>
          🔧 Developer mode · Mock data · No real trades
          <br />
          Set <code style={{ color: 'var(--blue)' }}>NEXT_PUBLIC_DEV_MODE=false</code> for live email login
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0 24px' }}>
        <AccrionBadge />
      </div>
    </div>
  )
}
