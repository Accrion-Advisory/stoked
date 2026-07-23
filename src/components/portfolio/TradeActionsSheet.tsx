'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { Holding } from '@/types'
import { formatDate } from '@/lib/utils'

// Bottom sheet listing a holding's individual trades, each editable/deletable,
// plus an "add another trade" shortcut. Opened by long-press / ⋯ on a holding.
export default function TradeActionsSheet({ holding, onClose }: { holding: Holding; onClose: () => void }) {
  const router = useRouter()
  const { removeTrade } = useApp()
  const [busy, setBusy] = useState(false)
  const trades = [...holding.trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  function edit(id: string) {
    onClose()
    router.push(`/trade?edit=${id}`)
  }
  async function del(id: string) {
    if (busy) return
    setBusy(true)
    try { await removeTrade(id) } finally { onClose() }
  }
  function addAnother() {
    onClose()
    router.push(`/trade?symbol=${encodeURIComponent(holding.symbol)}&exchange=${holding.exchange}`)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300 }} />
      <div className="sheet-enter" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: '100%', maxWidth: 430, background: 'var(--bg-elevated)', borderTopLeftRadius: 22, borderTopRightRadius: 22, zIndex: 301, border: '1px solid var(--border-strong)', borderBottom: 'none', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', maxHeight: '80dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '10px auto 6px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              {holding.symbol}
              <span className="chip" style={{ fontSize: 10, background: holding.exchange === 'NSE' ? 'var(--blue-dim)' : 'var(--gold-dim)', color: holding.exchange === 'NSE' ? 'var(--blue)' : 'var(--gold)' }}>{holding.exchange}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{holding.quantity} shares · avg ₹{holding.avg_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div style={{ padding: '4px 20px 0' }}>
          {trades.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <span className={`chip ${t.type === 'BUY' ? 'chip-buy' : 'chip-sell'}`}>{t.type}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t.quantity} @ ₹{t.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(t.date)}{t.charges ? ` · ₹${t.charges} chg` : ''}</div>
              </div>
              <button onClick={() => edit(t.id)} aria-label="Edit" style={iconBtn('var(--blue)')}>
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
              </button>
              <button onClick={() => del(t.id)} disabled={busy} aria-label="Delete" style={iconBtn('var(--red)')}>
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 20px 0' }}>
          <button className="btn-secondary" onClick={addAnother}>+ Add another trade</button>
        </div>
      </div>
    </>
  )
}

const iconBtn = (color: string): React.CSSProperties => ({ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-overlay, #23262F)', border: '1px solid var(--border)', color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 })
