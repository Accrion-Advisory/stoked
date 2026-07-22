'use client'
import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { buildMemberPortfolio } from '@/lib/portfolio'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import Link from 'next/link'

export default function MemberPortfolioPage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const { trades, user: currentUser, profilesById, prices } = useApp()

  const member = profilesById[userId]
  const memberTrades = useMemo(() => trades.filter((t) => t.user_id === userId), [trades, userId])
  const p = useMemo(
    () => (member ? buildMemberPortfolio(member, memberTrades, prices) : null),
    [member, memberTrades, prices]
  )

  if (!member) {
    return (
      <div className="mb-nav" style={{ padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Portfolio not visible</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 280, margin: '0 auto 20px' }}>
          You can only see this portfolio if you share a group or are connected.
        </div>
        <Link href="/connect" style={{ color: 'var(--green)', fontWeight: 700 }}>Manage connections →</Link>
      </div>
    )
  }

  const { holdings, total_invested, current_value, total_pnl, total_pnl_percent, xirr } = p!
  const isMe = userId === currentUser?.id
  const recentTrades = [...memberTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} style={backBtn}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div style={statCard}>
            <div style={statLabel}>Current Value</div>
            <div style={statBig} className="num">{formatCurrency(current_value, true)}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>XIRR</div>
            <div style={{ ...statBig, color: xirr >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPercent(xirr)}</div>
          </div>
        </div>
        <div style={{ ...statCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={statLabel}>Total Gain</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: total_pnl >= 0 ? 'var(--green)' : 'var(--red)' }} className="num">
              {total_pnl >= 0 ? '+' : ''}{formatCurrency(total_pnl, true)}
            </div>
          </div>
          <PnlBadge value={total_pnl_percent} type="percent" size="md" />
        </div>
      </div>

      {/* Holdings */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={sectionLabel}>Holdings</div>
        {holdings.map((h) => {
          const latestNote = h.trades.slice().reverse().find((t) => t.notes)
          const pnl = h.pnl ?? 0
          return (
            <Link key={`${h.symbol}.${h.exchange}`} href={`/stock/${h.symbol}`} style={{ textDecoration: 'none', padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: latestNote ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={logoBox}>{h.symbol.slice(0, 3)}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{h.symbol}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {h.quantity} qty · avg ₹{h.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Since {formatDate(h.first_buy_date)}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <PnlBadge value={h.pnl_percent ?? 0} type="percent" />
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              {latestNote && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 8, borderLeft: '2px solid var(--gold)', fontStyle: 'italic' }}>
                  &quot;{latestNote.notes}&quot;
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Trade history */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={sectionLabel}>Trade History</div>
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

const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 16, fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }
const statCard: React.CSSProperties = { background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012)), var(--bg-surface)', borderRadius: 14, padding: '13px 15px', border: '1px solid var(--border)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 30px -22px rgba(0,0,0,0.9)' }
const statLabel: React.CSSProperties = { fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }
const statBig: React.CSSProperties = { fontSize: 20, fontWeight: 800 }
const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }
const logoBox: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)' }
