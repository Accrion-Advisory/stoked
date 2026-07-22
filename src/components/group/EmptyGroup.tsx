'use client'
import Link from 'next/link'
import GroupCreateJoin from '@/components/group/GroupCreateJoin'

// Shown on the dashboard/group tab when the user isn't in any group yet.
export default function EmptyGroup() {
  return (
    <div className="mb-nav" style={{ padding: '72px 20px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Start your circle</div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
          Create a private investing group and invite friends, or join one with a code.
        </div>
      </div>

      <GroupCreateJoin />

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
        Prefer 1-on-1?{' '}
        <Link href="/connections" style={{ color: 'var(--green)', fontWeight: 700 }}>
          Connect with a friend →
        </Link>
      </div>
    </div>
  )
}
