'use client'
import { useState } from 'react'
import { useApp } from '@/lib/context'
import { priceKey } from '@/lib/portfolio'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'
import StockSearch from '@/components/stock/StockSearch'

export default function WatchlistPage() {
  const { user, watchlist, addWatchlist, removeWatchlist, profilesById, prices } = useApp()
  const [activeTab, setActiveTab] = useState<'mine' | 'group'>('mine')
  const [showAdd, setShowAdd] = useState(false)
  const [newSymbol, setNewSymbol] = useState('')
  const [newExchange, setNewExchange] = useState<'NSE' | 'BSE'>('NSE')
  const [newTarget, setNewTarget] = useState('')
  const [busy, setBusy] = useState(false)

  const myList = watchlist.filter((w) => w.user_id === user?.id)
  const displayList = activeTab === 'mine' ? myList : watchlist

  async function handleAdd() {
    if (!user || !newSymbol || busy) return
    setBusy(true)
    try {
      await addWatchlist({
        user_id: user.id,
        symbol: newSymbol,
        exchange: newExchange,
        target_price: newTarget ? Number(newTarget) : undefined,
      })
      setNewSymbol('')
      setNewTarget('')
      setShowAdd(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 800 }}>Watchlist</span>
          <button onClick={() => setShowAdd((s) => !s)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--bg-elevated)', borderRadius: 12, padding: 4 }}>
          {[{ id: 'mine', label: 'My Watchlist' }, { id: 'group', label: 'Group Watchlist' }].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as 'mine' | 'group')}
              style={{ padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: activeTab === t.id ? 'var(--bg-overlay, #1E2128)' : 'transparent', color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'Satoshi, sans-serif' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add stock panel */}
      {showAdd && (
        <div style={{ margin: '0 20px 16px', background: 'var(--bg-surface)', borderRadius: 16, padding: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Add to Watchlist</div>
          <StockSearch value={newSymbol} exchange={newExchange} onSelect={(s, e) => { setNewSymbol(s); setNewExchange(e) }} />
          <input className="input" type="number" placeholder="Target price (optional)" inputMode="decimal" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} style={{ marginTop: 10 }} />
          <button className="btn-primary" onClick={handleAdd} disabled={busy} style={{ marginTop: 12, opacity: busy ? 0.6 : 1 }}>{busy ? 'Adding…' : 'Add Stock'}</button>
        </div>
      )}

      {/* List */}
      <div style={{ padding: '0 20px' }}>
        {displayList.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👁</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nothing here yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Add stocks you&apos;re watching to track them here</div>
          </div>
        ) : (
          displayList.map((item) => {
            const price = prices[priceKey(item.symbol, item.exchange)] ?? prices[item.symbol.toUpperCase()]
            const pct = price?.change_percent ?? 0
            const isPos = pct >= 0
            const watcher = profilesById[item.user_id]
            const mine = item.user_id === user?.id

            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <Link href={`/stock/${item.symbol}`} style={{ flex: 1, textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{item.symbol}</span>
                    <span className="chip chip-nse" style={{ fontSize: 10 }}>{item.exchange}</span>
                    {activeTab === 'group' && watcher && !mine && <Avatar name={watcher.name} userId={watcher.id} size="sm" />}
                  </div>
                  {item.target_price && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Target: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>₹{item.target_price.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {activeTab === 'group' && watcher && !mine && (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{watcher.name} is watching</div>
                  )}
                </Link>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }} className="num">{price ? `₹${price.price.toLocaleString('en-IN')}` : '—'}</div>
                  {price && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: isPos ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
                      {isPos ? '+' : ''}{pct.toFixed(2)}%
                    </div>
                  )}
                </div>
                {mine && (
                  <button onClick={() => removeWatchlist(item.id)} aria-label="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
