'use client'
import { useMemo } from 'react'
import { useApp } from '@/lib/context'
import { buildMemberPortfolio } from '@/lib/portfolio'
import { formatCurrency, formatPercent } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import Link from 'next/link'

export default function PortfolioPage() {
  const { user, trades, prices } = useApp()

  const myTrades = useMemo(() => trades.filter((t) => t.user_id === user?.id), [trades, user?.id])
  const p = useMemo(
    () => (user ? buildMemberPortfolio(user, myTrades, prices) : null),
    [user, myTrades, prices]
  )

  if (!user || !p) return null
  const { holdings, total_invested, current_value, total_pnl, total_pnl_percent, xirr } = p

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 20px', background: 'var(--bg-base)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Avatar name={user.name} userId={user.id} size="lg" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>@{user.username}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ background: 'var(--blue-dim)', color: 'var(--blue)', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              XIRR {formatPercent(xirr)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={statCard}>
            <div style={statLabel}>Current Value</div>
            <div style={statBig} className="num">{formatCurrency(current_value, true)}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Total Invested</div>
            <div style={statBig} className="num">{formatCurrency(total_invested, true)}</div>
          </div>
        </div>

        <div style={{ marginTop: 10, ...statCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={statLabel}>Overall Gain</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: total_pnl >= 0 ? 'var(--green)' : 'var(--red)' }} className="num">
              {total_pnl >= 0 ? '+' : ''}{formatCurrency(total_pnl, true)}
            </div>
          </div>
          <PnlBadge value={total_pnl_percent} type="percent" size="md" />
        </div>
      </div>

      {/* Holdings */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={sectionLabel}>Holdings · {holdings.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Prices ~15min delayed</div>
        </div>

        {holdings.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No holdings yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Log your first trade to build your portfolio.</div>
            <Link href="/trade"><button className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}>Log a Trade</button></Link>
          </div>
        )}

        {holdings.map((h) => {
          const pct = h.pnl_percent ?? 0
          const pnl = h.pnl ?? 0
          return (
            <Link key={`${h.symbol}.${h.exchange}`} href={`/stock/${h.symbol}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={logoBox}>{h.symbol.slice(0, 3)}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                    {h.symbol}
                    <span className="chip chip-nse" style={{ marginLeft: 6, fontSize: 10 }}>{h.exchange}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {h.quantity} shares · avg ₹{h.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <PnlBadge value={pct} type="percent" size="sm" />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Allocation */}
      {holdings.length > 0 && (
        <div style={{ padding: '20px' }}>
          <div style={sectionLabel}>Allocation</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {holdings.map((h) => {
              const pct = total_invested > 0 ? Math.round((h.total_invested / total_invested) * 100) : 0
              return (
                <div key={`${h.symbol}.${h.exchange}`} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{h.symbol}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const statCard: React.CSSProperties = { background: 'var(--bg-surface)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }
const statLabel: React.CSSProperties = { fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }
const statBig: React.CSSProperties = { fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }
const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }
const logoBox: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)' }
