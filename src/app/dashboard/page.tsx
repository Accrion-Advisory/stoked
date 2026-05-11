'use client'
import { useApp } from '@/lib/context'
import { DEV_USERS } from '@/lib/dev-data'
import { calculateHoldings } from '@/lib/xirr'
import { formatCurrency, timeAgo, formatCurrency as fc } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, group, trades, memberships } = useApp()
  const router = useRouter()

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <Link href="/auth/dev-login" style={{ color: 'var(--green)', fontSize: 16, fontWeight: 600 }}>
          Select a profile →
        </Link>
      </div>
    )
  }

  // Compute per-member stats
  const memberStats = DEV_USERS.map((u) => {
    const userTrades = trades.filter((t) => t.user_id === u.id)
    const holdings = calculateHoldings(userTrades)
    const totalInvested = holdings.reduce((s, h) => s + h.total_invested, 0)
    // Estimate current value as 1.15x invested (mock without live prices)
    const currentValue = totalInvested * (u.id === 'dev-user-3' ? 1.05 : u.id === 'dev-user-1' ? 1.28 : 1.23)
    const pnlPercent = ((currentValue - totalInvested) / totalInvested) * 100
    return { user: u, totalInvested, currentValue, pnlPercent, tradeCount: userTrades.length }
  })

  const groupValue = memberStats.reduce((s, m) => s + m.currentValue, 0)
  const groupInvested = memberStats.reduce((s, m) => s + m.totalInvested, 0)
  const groupPnl = ((groupValue - groupInvested) / groupInvested) * 100
  const avgXirr = 18.6

  // Recent activity feed
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <div style={{ paddingTop: 0 }} className="mb-nav">
      {/* Sticky header */}
      <div
        style={{
          padding: '52px 20px 16px',
          background: 'var(--bg-base)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{group?.name}</span>
              <div className="live-dot" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{memberStats.length} members</div>
          </div>
          <Avatar name={user.name} userId={user.id} size="md" />
        </div>

        {/* Group stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Group Value</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }} className="num">
              {formatCurrency(groupValue, true)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              of {formatCurrency(groupInvested, true)} invested
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Members Avg XIRR</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.02em' }} className="num">
              +{avgXirr}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>annualized return</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 20px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
        {['Feed', 'Leaderboard', 'Holdings'].map((tab, i) => (
          <div key={tab} style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 13, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: i === 0 ? '2px solid var(--green)' : '2px solid transparent', cursor: 'pointer' }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Members strip */}
      <div style={{ padding: '16px 20px 0' }}>
        {memberStats.map((ms) => (
          <Link
            key={ms.user.id}
            href={`/portfolio/${ms.user.id}`}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={ms.user.name} userId={ms.user.id} size="md" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {ms.user.name} {ms.user.id === user.id && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(you)</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {ms.tradeCount} trades · {formatCurrency(ms.totalInvested, true)} invested
                </div>
              </div>
            </div>
            <PnlBadge value={ms.pnlPercent} type="percent" />
          </Link>
        ))}
      </div>

      {/* Activity feed */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Recent Activity
        </div>
        {recentTrades.map((trade) => {
          const tradeUser = DEV_USERS.find((u) => u.id === trade.user_id)
          if (!tradeUser) return null
          const isBuy = trade.type === 'BUY'
          return (
            <Link
              key={trade.id}
              href={`/stock/${trade.symbol}`}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}
            >
              <Avatar name={tradeUser.name} userId={tradeUser.id} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700 }}>{tradeUser.name}</span>{' '}
                  <span className={isBuy ? 'chip chip-buy' : 'chip chip-sell'} style={{ fontSize: 11, padding: '2px 6px' }}>
                    {trade.type}
                  </span>{' '}
                  <span style={{ fontWeight: 700 }}>{trade.quantity} {trade.symbol}</span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>@ ₹{trade.price.toLocaleString('en-IN')}</span>
                </div>
                {trade.notes && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                    "{trade.notes}"
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {timeAgo(trade.created_at)}
                </div>
              </div>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
