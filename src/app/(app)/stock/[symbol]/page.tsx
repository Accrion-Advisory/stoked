'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { calculateHoldings } from '@/lib/xirr'
import { priceKey } from '@/lib/portfolio'
import { formatDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import Link from 'next/link'

const CHART_TABS = ['1W', '1M', '3M', '1Y']

export default function StockPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const router = useRouter()
  const { trades, watchlist, user, addWatchlist, profilesById, prices, requestSymbols } = useApp()
  const [tab, setTab] = useState('3M')
  const [adding, setAdding] = useState(false)

  const sym = (symbol ?? '').toUpperCase()

  // Infer the exchange from any holding/watch of this symbol, default NSE.
  const exch: 'NSE' | 'BSE' =
    trades.find((t) => t.symbol.toUpperCase() === sym)?.exchange ??
    watchlist.find((w) => w.symbol.toUpperCase() === sym)?.exchange ??
    'NSE'

  const price = prices[priceKey(sym, exch)] ?? prices[sym]

  // Load this symbol's quote through the shared, cached price engine.
  useEffect(() => {
    if (sym) requestSymbols([{ symbol: sym, exchange: exch }])
  }, [sym, exch, requestSymbols])

  // Who (among people I can see) holds this stock.
  const holdersData = useMemo(() => {
    const byUser = new Map<string, typeof trades>()
    for (const t of trades) {
      if (t.symbol.toUpperCase() !== sym) continue
      byUser.set(t.user_id, [...(byUser.get(t.user_id) ?? []), t])
    }
    const out: { user: NonNullable<ReturnType<typeof profileFor>>; holding: ReturnType<typeof calculateHoldings>[0] }[] = []
    for (const [uid] of byUser) {
      const profile = profilesById[uid]
      if (!profile) continue
      const holding = calculateHoldings(trades.filter((t) => t.user_id === uid)).find((h) => h.symbol.toUpperCase() === sym)
      if (holding) out.push({ user: profile, holding })
    }
    return out
    function profileFor(id: string) { return profilesById[id] }
  }, [trades, profilesById, sym])

  const watchers = watchlist.filter((w) => w.symbol.toUpperCase() === sym)
  const isWatching = watchlist.some((w) => w.symbol.toUpperCase() === sym && w.user_id === user?.id)

  async function handleAddWatchlist() {
    if (!user || isWatching || adding) return
    setAdding(true)
    try {
      await addWatchlist({ user_id: user.id, symbol: sym, exchange: exch })
    } finally {
      setAdding(false)
    }
  }

  const pct = price?.change_percent ?? 0
  const isPos = pct >= 0

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} style={backBtn}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
          Back
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.01em' }}>{sym}</span>
              <span className="chip" style={{ background: exch === 'NSE' ? 'var(--blue-dim)' : 'var(--gold-dim)', color: exch === 'NSE' ? 'var(--blue)' : 'var(--gold)' }}>{exch}</span>
              {price && <div className="live-dot" />}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{price?.company_name ?? sym}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }} className="num">
              {price ? `₹${price.price.toLocaleString('en-IN')}` : '—'}
            </div>
            {price && (
              <div style={{ fontSize: 14, fontWeight: 600, color: isPos ? 'var(--green)' : 'var(--red)' }}>
                {isPos ? '+' : ''}{price.change.toFixed(2)} ({isPos ? '+' : ''}{pct.toFixed(2)}%)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart placeholder */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {CHART_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: tab === t ? 'var(--green)' : 'var(--bg-elevated)', color: tab === t ? '#0A0B0F' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>
        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, height: 100, border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', padding: '12px 8px 8px', gap: 3, overflow: 'hidden' }}>
          {Array.from({ length: 30 }, (_, i) => {
            const h = 20 + Math.sin(i * 0.4) * 20 + (i * 1.2)
            const clamped = Math.min(Math.max(h, 10), 72)
            return <div key={i} style={{ flex: 1, background: isPos ? 'var(--green)' : 'var(--red)', opacity: 0.3 + (i / 30) * 0.7, borderRadius: 2, height: clamped }} />
          })}
        </div>
      </div>

      {/* Group conviction */}
      <div style={{ padding: '16px 20px 0' }}>
        {holdersData.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
            No one you follow holds {sym} yet
          </div>
        ) : (
          <>
            <div style={sectionLabel}>{holdersData.length} holding this stock</div>
            {holdersData.map(({ user: u, holding }) => {
              const noteTrade = holding.trades.find((t) => t.notes)
              return (
                <Link key={u.id} href={`/portfolio/${u.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar name={u.name} userId={u.id} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{u.name}</span>
                      {price && <PnlBadge value={((price.price - holding.avg_price) / holding.avg_price) * 100} type="percent" />}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                      {holding.quantity} shares · avg ₹{holding.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>First bought {formatDate(holding.first_buy_date)}</div>
                    {noteTrade && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 8, fontStyle: 'italic', borderLeft: '2px solid var(--gold)' }}>
                        &quot;{noteTrade.notes}&quot;
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </>
        )}

        {watchers.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={sectionLabel}>Watching but not in</div>
            {watchers.map((w) => {
              const wu = profilesById[w.user_id]
              return (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar name={wu?.name || 'U'} userId={w.user_id} size="sm" />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{wu?.name}</span>
                  {w.target_price && <span className="chip chip-watching" style={{ marginLeft: 'auto' }}>Target ₹{w.target_price.toLocaleString('en-IN')}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '24px 20px 0', display: 'flex', gap: 10 }}>
        <button onClick={handleAddWatchlist} disabled={adding} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', color: isWatching ? 'var(--gold)' : 'var(--text-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Satoshi, sans-serif', opacity: adding ? 0.6 : 1 }}>
          {isWatching ? '★ Watching' : '☆ Watch'}
        </button>
        <Link href="/trade" style={{ flex: 2, textDecoration: 'none' }}>
          <button className="btn-primary" style={{ height: '100%', fontSize: 15 }}>Log Trade</button>
        </Link>
      </div>
    </div>
  )
}

const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 12, fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }
const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }
