'use client'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { DEV_USERS } from '@/lib/dev-data'
import { calculateHoldings } from '@/lib/xirr'
import { formatCurrency, formatDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import Link from 'next/link'

const XIRR_MAP: Record<string, number> = {
  'dev-user-1': 28.45,
  'dev-user-2': 23.17,
  'dev-user-3': 5.60,
}

const STOCK_PNL: Record<string, number> = {
  RELIANCE: 9.9, HDFCBANK: 7.4, INFY: 8.1, TCS: 5.5,
  ZOMATO: -4.2, TITAN: 1.2, PAYTM: -12.1,
}

export default function MemberPortfolioPage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const { trades, user: currentUser } = useApp()

  const member = DEV_USERS.find((u) => u.id === userId)
  if (!member) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Member not found</div>

  const memberTrades = trades.filter((t) => t.user_id === userId)
  const holdings = calculateHoldings(memberTrades)
  const totalInvested = holdings.reduce((s, h) => s + h.total_invested, 0)
  const mult = userId === 'dev-user-1' ? 1.28 : userId === 'dev-user-2' ? 1.23 : 1.05
  const currentValue = totalInvested * mult
  const totalPnl = currentValue - totalInvested
  const totalPnlPct = ((currentValue - totalInvested) / totalInvested) * 100
  const xirr = XIRR_MAP[userId] ?? 10
  const isMe = userId === currentUser?.id

  const recentTrades = [...memberTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 16, fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
          Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <Avatar name={member.name} userId={member.id} size="lg" />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>
              {member.name} {isMe && <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>(you)</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{holdings.length} holdings · {memberTrades.length} trades</div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Current Value</div>
            <div style={{ fontSize: 20, fontWeight: 800 }} className="num">{formatCurrency(currentValue, true)}</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>XIRR</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>+{xirr}%</div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Total Gain</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }} className="num">
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl, true)}
            </div>
          </div>
          <PnlBadge value={totalPnlPct} type="percent" size="md" />
        </div>
      </div>

      {/* Holdings */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Holdings
        </div>
        {holdings.map((h) => {
          const pct = STOCK_PNL[h.symbol] ?? 4.2
          const cv = h.total_invested * (1 + pct / 100)
          const latestNote = h.trades.slice().reverse().find((t) => t.notes)

          return (
            <Link key={h.symbol} href={`/stock/${h.symbol}`} style={{ textDecoration: 'none', padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: latestNote ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)' }}>
                    {h.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{h.symbol}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {h.quantity} qty · avg ₹{h.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      Since {formatDate(h.first_buy_date)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <PnlBadge value={pct} type="percent" />
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {pct >= 0 ? '+' : ''}₹{Math.abs(cv - h.total_invested).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              {latestNote && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 8, borderLeft: '2px solid var(--gold)', fontStyle: 'italic' }}>
                  "{latestNote.notes}"
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Trade history */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Trade History
        </div>
        {recentTrades.map((trade) => (
          <div key={trade.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`chip ${trade.type === 'BUY' ? 'chip-buy' : 'chip-sell'}`}>{trade.type}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{trade.symbol}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(trade.date)}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>₹{trade.price.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{trade.quantity} qty</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
