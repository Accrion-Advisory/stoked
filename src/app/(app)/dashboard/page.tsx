'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { buildMemberPortfolio } from '@/lib/portfolio'
import { MemberPortfolio } from '@/types'
import { formatCurrency, formatPercent, timeAgo } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'

export default function DashboardPage() {
  const {
    user, groups, memberships, connections, profilesById, trades, prices, setCurrentGroupId,
  } = useApp()
  const router = useRouter()

  // Portfolio summary for every person we can see — computed once, reused below.
  const portfolioByUser = useMemo(() => {
    const ids = new Set<string>()
    if (user) ids.add(user.id)
    for (const m of memberships) ids.add(m.user_id)
    for (const c of connections) if (c.other) ids.add(c.other.id)
    const map: Record<string, MemberPortfolio> = {}
    ids.forEach((id) => {
      const p = profilesById[id]
      if (!p) return
      map[id] = buildMemberPortfolio(p, trades.filter((t) => t.user_id === id), prices)
    })
    return map
  }, [user, memberships, connections, profilesById, trades, prices])

  const mine = user ? portfolioByUser[user.id] : undefined

  // Groups at a glance
  const groupGlance = useMemo(() => {
    return groups.map((g) => {
      const mems = memberships.filter((m) => m.group_id === g.id)
      const stats = mems.map((m) => portfolioByUser[m.user_id]).filter(Boolean) as MemberPortfolio[]
      const value = stats.reduce((s, p) => s + p.current_value, 0)
      const avgXirr = stats.length ? stats.reduce((s, p) => s + p.xirr, 0) / stats.length : 0
      return { group: g, memberCount: mems.length, value, avgXirr }
    })
  }, [groups, memberships, portfolioByUser])

  const accepted = connections.filter((c) => c.status === 'accepted')
  const pendingIn = connections.filter((c) => c.direction === 'incoming' && c.status === 'pending').length

  const activity = useMemo(
    () =>
      [...trades]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15),
    [trades]
  )

  function openGroup(id: string) {
    setCurrentGroupId(id)
    router.push('/group')
  }

  if (!user) return null
  const firstName = user.name.split(' ')[0]

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 40px) 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>Welcome back</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Hey, {firstName} 👋</div>
        </div>
        <Link href="/connect" aria-label="Connect">
          <Avatar name={user.name} userId={user.id} size="lg" />
        </Link>
      </div>

      {/* My portfolio hero */}
      <div style={{ padding: '14px 20px 0' }}>
        <Link href="/portfolio" style={{ textDecoration: 'none', display: 'block' }}>
          <div className="surface" style={{ borderRadius: 20, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 100% 0%, rgba(33,208,122,0.14), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Your portfolio</div>
              {mine && mine.trade_count > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em' }} className="num">{formatCurrency(mine.current_value, true)}</div>
                    <PnlBadge value={mine.total_pnl_percent} type="percent" size="md" />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span>Invested {formatCurrency(mine.total_invested, true)}</span>
                    <span>·</span>
                    <span>XIRR <span style={{ color: mine.xirr >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{formatPercent(mine.xirr)}</span></span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Log your first trade to get started</div>
                  <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 14 }}>Add →</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Groups at a glance */}
      <Section title="Groups" action={{ label: 'Manage', href: '/connect' }}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '2px 20px 4px', scrollSnapType: 'x proximity' }}>
          {groupGlance.map(({ group, memberCount, value, avgXirr }) => (
            <button key={group.id} onClick={() => openGroup(group.id)} style={glanceCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--green-dim)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{group.name.charAt(0).toUpperCase()}</div>
                <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</div>
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }} className="num">{formatCurrency(value, true)}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{memberCount} member{memberCount > 1 ? 's' : ''}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: avgXirr >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPercent(avgXirr)}</span>
              </div>
            </button>
          ))}
          <Link href="/connect" style={{ ...glanceCard, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', border: '1px dashed var(--border-strong)', background: 'none', color: 'var(--text-secondary)' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--green)' }}>+</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{groups.length ? 'New group' : 'Create or join'}</span>
          </Link>
        </div>
      </Section>

      {/* Connections at a glance */}
      <Section title="Connections" action={{ label: pendingIn > 0 ? `${pendingIn} request${pendingIn > 1 ? 's' : ''}` : 'Manage', href: '/connect', highlight: pendingIn > 0 }}>
        <div style={{ padding: '0 20px' }}>
          {accepted.length > 0 ? (
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {accepted.map((c) => c.other && (
                <Link key={c.id} href={`/portfolio/${c.other.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 62, flexShrink: 0 }}>
                  <Avatar name={c.other.name} userId={c.other.id} size="lg" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 62, textAlign: 'center' }}>{c.other.name.split(' ')[0]}</span>
                </Link>
              ))}
              <Link href="/connect" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 62, flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--green)' }}>+</div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Add</span>
              </Link>
            </div>
          ) : (
            <Link href="/connect" style={{ textDecoration: 'none' }}>
              <div className="surface" style={{ borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Connect 1-on-1 with people you trust</span>
                <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 14 }}>Add →</span>
              </div>
            </Link>
          )}
        </div>
      </Section>

      {/* Activity across everyone you follow */}
      <Section title="Recent Activity">
        <div style={{ padding: '0 20px' }}>
          {activity.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
              No trades yet. Follow people or join a group to see their moves here.
            </div>
          ) : (
            activity.map((trade) => {
              const tu = profilesById[trade.user_id]
              if (!tu) return null
              const isBuy = trade.type === 'BUY'
              return (
                <Link key={trade.id} href={`/stock/${trade.symbol}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar name={tu.name} userId={tu.id} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 700 }}>{tu.name}</span>{' '}
                      <span className={isBuy ? 'chip chip-buy' : 'chip chip-sell'} style={{ fontSize: 11, padding: '2px 6px' }}>{trade.type}</span>{' '}
                      <span style={{ fontWeight: 700 }}>{trade.quantity} {trade.symbol}</span>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>@ ₹{trade.price.toLocaleString('en-IN')}</span>
                    </div>
                    {trade.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>&quot;{trade.notes}&quot;</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{timeAgo(trade.created_at)}</div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: { label: string; href: string; highlight?: boolean }; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>{title}</div>
        {action && (
          <Link href={action.href} style={{ fontSize: 13, fontWeight: 600, textDecoration: 'none', color: action.highlight ? 'var(--green)' : 'var(--text-secondary)' }}>
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

const glanceCard: React.CSSProperties = {
  width: 168,
  flexShrink: 0,
  scrollSnapAlign: 'start',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'Satoshi, sans-serif',
  borderRadius: 16,
  padding: '14px 16px',
  border: '1px solid var(--border)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012)), var(--bg-surface)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 30px -22px rgba(0,0,0,0.9)',
}
