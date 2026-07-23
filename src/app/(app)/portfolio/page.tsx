'use client'
import { useMemo, useState } from 'react'
import { useApp } from '@/lib/context'
import { buildMemberPortfolio } from '@/lib/portfolio'
import { formatCurrency, formatPercent } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import HoldingRow from '@/components/portfolio/HoldingRow'
import TradeActionsSheet from '@/components/portfolio/TradeActionsSheet'
import PullToRefresh from '@/components/ui/PullToRefresh'
import Link from 'next/link'
import { Holding } from '@/types'

export default function PortfolioPage() {
  const { user, trades, prices, removeTrades, refreshPrices } = useApp()
  const [sheet, setSheet] = useState<Holding | null>(null)

  async function handleRefresh() {
    // Keep the animation visible for a beat so the refresh feels substantial.
    await Promise.all([refreshPrices(), new Promise((r) => setTimeout(r, 700))])
  }

  const myTrades = useMemo(() => trades.filter((t) => t.user_id === user?.id), [trades, user?.id])
  const p = useMemo(
    () => (user ? buildMemberPortfolio(user, myTrades, prices) : null),
    [user, myTrades, prices]
  )

  if (!user || !p) return null
  const { holdings, total_invested, current_value, total_pnl, total_pnl_percent, xirr } = p

  function deleteHolding(h: Holding) {
    if (window.confirm(`Delete all ${h.trades.length} ${h.symbol} trade(s)? This can't be undone.`)) {
      removeTrades(h.trades.map((t) => t.id))
    }
  }

  return (
    <div className="mb-nav" style={{ position: 'relative' }}>
     <PullToRefresh onRefresh={handleRefresh}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 44px) 20px 20px' }}>
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
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="live-dot" /> Auto-updating
          </div>
        </div>

        {holdings.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No holdings yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Log your first trade to build your portfolio.</div>
            <Link href="/trade"><button className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}>Log a Trade</button></Link>
          </div>
        )}

        {holdings.map((h) => (
          <HoldingRow
            key={`${h.symbol}.${h.exchange}`}
            holding={h}
            onOpenActions={() => setSheet(h)}
            onDelete={() => deleteHolding(h)}
          />
        ))}

        {holdings.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', padding: '14px 0 0' }}>
            Long-press or swipe a holding to edit / delete
          </div>
        )}
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
     </PullToRefresh>

      {sheet && <TradeActionsSheet holding={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}

const statCard: React.CSSProperties = { background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012)), var(--bg-surface)', borderRadius: 14, padding: '14px', border: '1px solid var(--border)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 30px -22px rgba(0,0,0,0.9)' }
const statLabel: React.CSSProperties = { fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }
const statBig: React.CSSProperties = { fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }
const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }
