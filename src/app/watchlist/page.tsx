'use client'
import { useState } from 'react'
import { useApp } from '@/lib/context'
import { DEV_USERS } from '@/lib/dev-data'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'
import StockSearch from '@/components/stock/StockSearch'

const MOCK_PRICES: Record<string, { price: number; pct: number }> = {
  TITAN:    { price: 3512.20, pct: 1.22 },
  ZOMATO:   { price: 182.10,  pct: -2.31 },
  PAYTM:    { price: 398.45,  pct: 1.12 },
  SIEMENS:  { price: 6105.30, pct: 0.87 },
  RELIANCE: { price: 2852.45, pct: 0.87 },
  HDFCBANK: { price: 1628.40, pct: 0.94 },
}

export default function WatchlistPage() {
  const { user, watchlist, addWatchlist } = useApp()
  const [activeTab, setActiveTab] = useState<'mine' | 'group'>('mine')
  const [showAdd, setShowAdd] = useState(false)
  const [newSymbol, setNewSymbol] = useState('')
  const [newExchange, setNewExchange] = useState<'NSE' | 'BSE'>('NSE')
  const [newTarget, setNewTarget] = useState('')

  const myList = watchlist.filter((w) => w.user_id === user?.id)
  const groupList = watchlist

  const displayList = activeTab === 'mine' ? myList : groupList

  function handleAdd() {
    if (!user || !newSymbol) return
    addWatchlist({ user_id: user.id, group_id: 'dev-group-1', symbol: newSymbol, exchange: newExchange, target_price: newTarget ? Number(newTarget) : undefined, user })
    setNewSymbol('')
    setNewTarget('')
    setShowAdd(false)
  }

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 800 }}>Watchlist</span>
          <button
            onClick={() => setShowAdd((s) => !s)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>

        {/* Tabs */}
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
          <button className="btn-primary" onClick={handleAdd} style={{ marginTop: 12 }}>Add Stock</button>
        </div>
      )}

      {/* List */}
      <div style={{ padding: '0 20px' }}>
        {displayList.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👁</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nothing here yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Add stocks you're watching to track them here</div>
          </div>
        ) : (
          displayList.map((item) => {
            const priceData = MOCK_PRICES[item.symbol] || { price: 1000, pct: 0.5 }
            const isPos = priceData.pct >= 0
            const watcher = DEV_USERS.find((u) => u.id === item.user_id)

            return (
              <Link key={item.id} href={`/stock/${item.symbol}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{item.symbol}</span>
                    <span className="chip chip-nse" style={{ fontSize: 10 }}>NSE</span>
                    {activeTab === 'group' && watcher && (
                      <Avatar name={watcher.name} userId={watcher.id} size="sm" />
                    )}
                  </div>
                  {item.target_price && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Target: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>₹{item.target_price.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {activeTab === 'group' && watcher && (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{watcher.name} is watching</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }} className="num">₹{priceData.price.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isPos ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
                    {isPos ? '+' : ''}{priceData.pct.toFixed(2)}%
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
