'use client'
import Link from 'next/link'

// Dashboard empty state when the user isn't in any group yet. Group creation and
// direct connections both live on the Connect tab, so we point there.
export default function EmptyGroup() {
  return (
    <div className="mb-nav" style={{ minHeight: '70dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>📈</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Start your circle</div>
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 300, marginBottom: 28 }}>
        Create a private investing group and invite friends, join one with a code, or connect
        with people 1-on-1.
      </div>
      <Link href="/connect" style={{ width: '100%', maxWidth: 280, textDecoration: 'none' }}>
        <button className="btn-primary">Go to Connect</button>
      </Link>
    </div>
  )
}
