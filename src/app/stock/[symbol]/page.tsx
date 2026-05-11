'use client'
import { useApp } from '@/lib/context'
import { DEV_USERS } from '@/lib/dev-data'
import { calculateHoldings } from '@/lib/xirr'
import { formatDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

const MOCK_PRICES: Record<string, { price: number; change: number; pct: number; name: string }> = {
  RELIANCE: { price: 2852.45, change: 24.60, pct: 0.87, name: 'Reliance Industries Ltd' },
  HDFCBANK: { price: 1628.40, change: 15.20, pct: 0.94, name: 'HDFC Bank Ltd' },
  TCS: { price: 3890.10, change: -18.50, pct: -0.47, name: 'Tata Consultancy Services' },
  INFY: { price: 1758.30, change: 12.80, pct: 0.73, name: 'Infosys Ltd' },
  ZOMATO: { price: 182.10, change: -4.20, pct: -2.25, name: 'Zomato Ltd' },
  TITAN: { price: 3512.20, change: 22.30, pct: 0.64, name: 'Titan Company Ltd' },
  PAYTM: { price: 398.45, change: 1.10, pct: 0.28, name: 'One97 Communications Ltd' },
}

const CHART_TABS = ['1W', '1M', '3M', '1Y']

export default function StockPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const router = useRouter()
  const { trades, watchlist, user, addWatchlist } = useApp()
  const [tab, setTab] = useState('3M')

  const sym = symbol?.toUpperCase()
  const stockData = MOCK_PRICES[sym] || { price: 1500, change: 10, pct: 0.67, name: sym }

  // Who holds this stock in the group
  const holdersData = DEV_USERS.map((u) => {
    const userTrades = trades.filter((t) => t.user_id === u.id)
    const holdings = calculateHoldings(userTrades)
    const holding = holdings.find((h) => h.symbol === sym)
    if (!holding) return null
    const mockPct = sym === 'ZOMATO' ? -4.2 : sym === 'PAYTM' ? -12.1 : sym === 'RELIANCE' ? 9.9 : sym === 'TCS' ? 5.5 : 7.4
    return { user: u, holding, pnlPct: mockPct }
  }).filter(Boolean) as { user: typeof DEV_USERS[0]; holding: ReturnType<typeof calculateHoldings>[0]; pnlPct: number }[]

  // Who's watching
  const watchers = watchlist.filter((w) => w.symbol === sym)

  const isWatching = watchlist.some((w) => w.symbol === sym && w.user_id === user?.id)

  function handleAddWatchlist() {
    if (!user || isWatching) return
    addWatchlist({ user_id: user.id, group_id: 'dev-group-1', symbol: sym, exchange: 'NSE', user })
  }

  const isPos = stockData.pct >= 0

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 12, fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
          Back
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.01em' }}>{sym}</span>
              <span className="chip chip-nse">NSE</span>
              <div className="live-dot" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stockData.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }} className="num">
              ₹{stockData.price.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isPos ? 'var(--green)' : 'var(--red)' }}>
              {isPos ? '+' : ''}{stockData.change.toFixed(2)} ({isPos ? '+' : ''}{stockData.pct.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Sparkline placeholder */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {CHART_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: tab === t ? 'var(--green)' : 'var(--bg-elevated)', color: tab === t ? '#0A0B0F' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
        {/* Mini chart visual */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, height: 100, border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', padding: '12px 8px 8px', gap: 3, overflow: 'hidden' }}>
          {Array.from({ length: 30 }, (_, i) => {
            const h = 20 + Math.sin(i * 0.4) * 20 + Math.random() * 20 + (i * 1.2)
            const clamped = Math.min(Math.max(h, 10), 72)
            return (
              <div key={i} style={{ flex: 1, background: isPos ? 'var(--green)' : 'var(--red)', opacity: 0.3 + (i / 30) * 0.7, borderRadius: 2, height: clamped }} />
            )
          })}
        </div>
      </div>

      {/* Tabs: Who Holds / Overview */}
      <div style={{ display: 'flex', padding: '16px 20px 0', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {['Who Holds', 'Overview', 'News'].map((t, i) => (
          <div key={t} style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 13, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: i === 0 ? '2px solid var(--green)' : '2px solid transparent', cursor: 'pointer' }}>
            {t}
          </div>
        ))}
      </div>

      {/* Group conviction section */}
      <div style={{ padding: '16px 20px 0' }}>
        {holdersData.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
            No one in your group holds {sym} yet
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              {holdersData.length} member{holdersData.length > 1 ? 's' : ''} holding this stock
            </div>
            {holdersData.map(({ user: u, holding, pnlPct }) => (
              <Link key={u.id} href={`/portfolio/${u.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={u.name} userId={u.id} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{u.name}</span>
                    <PnlBadge value={pnlPct} type="percent" />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    {holding.quantity} shares · avg ₹{holding.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    First bought {formatDate(holding.first_buy_date)}
                  </div>
                  {holding.trades.find((t) => t.notes) && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 8, fontStyle: 'italic', borderLeft: '2px solid var(--gold)' }}>
                      "{holding.trades.find((t) => t.notes)?.notes}"
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </>
        )}

        {/* Watchers */}
        {watchers.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Watching but not in
            </div>
            {watchers.map((w) => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={w.user?.name || 'U'} userId={w.user_id} size="sm" />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{w.user?.name}</span>
                {w.target_price && (
                  <span className="chip chip-watching" style={{ marginLeft: 'auto' }}>Target ₹{w.target_price.toLocaleString('en-IN')}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div style={{ padding: '24px 20px 0', display: 'flex', gap: 10 }}>
        <button
          onClick={handleAddWatchlist}
          style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', color: isWatching ? 'var(--gold)' : 'var(--text-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Satoshi, sans-serif' }}
        >
          {isWatching ? '★ Watching' : '☆ Watch'}
        </button>
        <Link href="/trade" style={{ flex: 2, textDecoration: 'none' }}>
          <button className="btn-primary" style={{ height: '100%', fontSize: 15 }}>
            Log Trade
          </button>
        </Link>
      </div>
    </div>
  )
}
