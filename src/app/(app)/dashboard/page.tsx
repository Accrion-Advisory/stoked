'use client'
import { useApp } from '@/lib/context'
import { buildMemberPortfolio } from '@/lib/portfolio'
import { formatCurrency, formatPercent, timeAgo } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import EmptyGroup from '@/components/group/EmptyGroup'
import Link from 'next/link'
import { useMemo } from 'react'

export default function DashboardPage() {
  const { user, currentGroup, currentGroupId, memberships, profilesById, trades, prices } = useApp()

  const groupMembers = useMemo(
    () => memberships.filter((m) => m.group_id === currentGroupId),
    [memberships, currentGroupId]
  )
  const memberIds = useMemo(() => new Set(groupMembers.map((m) => m.user_id)), [groupMembers])

  const memberStats = useMemo(() => {
    return groupMembers
      .map((m) => {
        const profile = m.user ?? profilesById[m.user_id]
        if (!profile) return null
        const userTrades = trades.filter((t) => t.user_id === m.user_id)
        return { membership: m, ...buildMemberPortfolio(profile, userTrades, prices) }
      })
      .filter(Boolean) as (ReturnType<typeof buildMemberPortfolio> & { membership: (typeof groupMembers)[0] })[]
  }, [groupMembers, profilesById, trades, prices])

  const groupValue = memberStats.reduce((s, m) => s + m.current_value, 0)
  const groupInvested = memberStats.reduce((s, m) => s + m.total_invested, 0)
  const avgXirr = memberStats.length
    ? memberStats.reduce((s, m) => s + m.xirr, 0) / memberStats.length
    : 0

  const recentTrades = useMemo(
    () =>
      [...trades]
        .filter((t) => memberIds.has(t.user_id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 12),
    [trades, memberIds]
  )

  if (!user) return null
  if (!currentGroup) return <EmptyGroup />

  return (
    <div className="mb-nav">
      {/* Sticky header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 44px) 20px 16px', background: 'rgba(10, 11, 15, 0.72)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{currentGroup.name}</span>
              <div className="live-dot" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{groupMembers.length} members</div>
          </div>
          <Link href="/connections" aria-label="Connections">
            <Avatar name={user.name} userId={user.id} size="md" />
          </Link>
        </div>

        {/* Group stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={statCard}>
            <div style={statLabel}>Group Value</div>
            <div style={statBig} className="num">{formatCurrency(groupValue, true)}</div>
            <div style={statSub}>of {formatCurrency(groupInvested, true)} invested</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Members Avg XIRR</div>
            <div style={{ ...statBig, color: avgXirr >= 0 ? 'var(--green)' : 'var(--red)' }} className="num">
              {formatPercent(avgXirr)}
            </div>
            <div style={statSub}>annualized return</div>
          </div>
        </div>
      </div>

      {/* Members strip */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={sectionLabel}>Members</div>
        {memberStats.map((ms) => (
          <Link key={ms.user.id} href={`/portfolio/${ms.user.id}`} style={rowLink}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={ms.user.name} userId={ms.user.id} size="md" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {ms.user.name}{' '}
                  {ms.user.id === user.id && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(you)</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {ms.trade_count} trades · {formatCurrency(ms.total_invested, true)} invested
                </div>
              </div>
            </div>
            <PnlBadge value={ms.total_pnl_percent} type="percent" />
          </Link>
        ))}
      </div>

      {/* Activity feed */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={sectionLabel}>Recent Activity</div>
        {recentTrades.length === 0 && (
          <div style={{ padding: '24px 0', color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center' }}>
            No trades logged yet.
          </div>
        )}
        {recentTrades.map((trade) => {
          const tradeUser = profilesById[trade.user_id]
          if (!tradeUser) return null
          const isBuy = trade.type === 'BUY'
          return (
            <Link key={trade.id} href={`/stock/${trade.symbol}`} style={{ ...rowLink, alignItems: 'flex-start' }}>
              <Avatar name={tradeUser.name} userId={tradeUser.id} size="sm" />
              <div style={{ flex: 1, marginLeft: 12 }}>
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
                    &quot;{trade.notes}&quot;
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{timeAgo(trade.created_at)}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const statCard: React.CSSProperties = { background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012)), var(--bg-surface)', borderRadius: 14, padding: '13px 15px', border: '1px solid var(--border)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 30px -22px rgba(0,0,0,0.9)' }
const statLabel: React.CSSProperties = { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }
const statBig: React.CSSProperties = { fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }
const statSub: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }
const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }
const rowLink: React.CSSProperties = { textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }
