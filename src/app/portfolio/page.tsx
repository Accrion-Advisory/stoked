'use client'
import { useApp } from '@/lib/context'
import { calculateHoldings, calculatePortfolioXIRR } from '@/lib/xirr'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import Link from 'next/link'

export default function PortfolioPage() {
  const { user, trades } = useApp()
  if (!user) return null

  const myTrades = trades.filter((t) => t.user_id === user.id)
  const holdings = calculateHoldings(myTrades)
  const totalInvested = holdings.reduce((s, h) => s + h.total_invested, 0)
  // Mock current value multiplier for dev
  const valueMult = user.id === 'dev-user-1' ? 1.28 : user.id === 'dev-user-2' ? 1.23 : 1.05
  const currentValue = totalInvested * valueMult
  const totalPnl = currentValue - totalInvested
  const totalPnlPct = ((currentValue - totalInvested) / totalInvested) * 100
  const xirr = user.id === 'dev-user-1' ? 28.45 : user.id === 'dev-user-2' ? 23.17 : 5.6

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 20px', background: 'var(--bg-base)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Avatar name={user.name} userId={user.id} size="lg" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>My Portfolio</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ background: 'var(--blue-dim)', color: 'var(--blue)', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              XIRR {formatPercent(xirr)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Current Value</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }} className="num">
              {formatCurrency(currentValue, true)}
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Total Invested</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }} className="num">
              {formatCurrency(totalInvested, true)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, background: 'var(--bg-surface)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Overall Gain</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }} className="num">
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl, true)}
            </div>
          </div>
          <PnlBadge value={totalPnlPct} type="percent" size="md" />
        </div>
      </div>

      {/* Holdings */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Holdings · {holdings.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Prices ~15min delayed</div>
        </div>

        {holdings.map((h) => {
          // Mock per-stock P&L for dev display
          const mockPct = h.symbol === 'ZOMATO' ? -4.2 : h.symbol === 'PAYTM' ? -12.1 : h.symbol === 'RELIANCE' ? 9.9 : h.symbol === 'TCS' ? 5.5 : h.symbol === 'TITAN' ? 1.2 : 7.4
          const cv = h.total_invested * (1 + mockPct / 100)
          const pnl = cv - h.total_invested

          return (
            <Link
              key={h.symbol}
              href={`/stock/${h.symbol}`}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)' }}>
                  {h.symbol.slice(0, 3)}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{h.symbol}
                    <span className="chip chip-nse" style={{ marginLeft: 6, fontSize: 10 }}>NSE</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {h.quantity} shares · avg ₹{h.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <PnlBadge value={mockPct} type="percent" size="sm" />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Allocation donut placeholder */}
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Allocation
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {holdings.map((h) => {
            const pct = Math.round((h.total_invested / totalInvested) * 100)
            return (
              <div key={h.symbol} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{h.symbol}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
