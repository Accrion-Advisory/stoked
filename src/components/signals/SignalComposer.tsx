'use client'
import { useState } from 'react'
import StockSearch from '@/components/stock/StockSearch'
import { SignalInput } from '@/types'

// Standardized signal form (bottom sheet): stock + BUY/SELL + price + short note.
export default function SignalComposer({
  groupId,
  onClose,
  onPost,
}: {
  groupId: string
  onClose: () => void
  onPost: (input: SignalInput) => Promise<void>
}) {
  const [symbol, setSymbol] = useState('')
  const [exchange, setExchange] = useState<'NSE' | 'BSE'>('NSE')
  const [stockName, setStockName] = useState('')
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!symbol) return setError('Pick a stock')
    if (!price || Number(price) <= 0) return setError('Enter a price')
    setError('')
    setBusy(true)
    try {
      await onPost({ group_id: groupId, symbol, exchange, action, price: Number(price), note: note.trim() || undefined })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send signal')
      setBusy(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300 }} />
      <div className="sheet-enter" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: '100%', maxWidth: 430, background: 'var(--bg-elevated)', borderTopLeftRadius: 22, borderTopRightRadius: 22, zIndex: 301, border: '1px solid var(--border-strong)', borderBottom: 'none', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', maxHeight: '88dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '10px auto 8px' }} />
        <div style={{ padding: '4px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>New signal</div>

          {/* BUY / SELL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--bg-overlay, #23262F)', borderRadius: 12, padding: 4 }}>
            {(['BUY', 'SELL'] as const).map((a) => (
              <button key={a} onClick={() => setAction(a)}
                style={{ padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, background: action === a ? (a === 'BUY' ? 'var(--green)' : 'var(--red)') : 'transparent', color: action === a ? '#0A0B0F' : 'var(--text-secondary)', fontFamily: 'Satoshi, sans-serif' }}>
                {a}
              </button>
            ))}
          </div>

          {/* Stock */}
          <div>
            <div style={label}>Stock</div>
            <StockSearch value={symbol} exchange={exchange} onSelect={(s, e, n) => { setSymbol(s); setExchange(e); setStockName(n) }} />
            {stockName && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, paddingLeft: 4 }}>{stockName}</div>}
          </div>

          {/* Price */}
          <div>
            <div style={label}>{action === 'BUY' ? 'Buy at' : 'Sell at'} (₹)</div>
            <input className="input" type="number" inputMode="decimal" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} style={{ textAlign: 'right', fontSize: 18, fontWeight: 700 }} />
          </div>

          {/* Note */}
          <div>
            <div style={{ ...label, display: 'flex', justifyContent: 'space-between' }}>
              <span>Comment (optional)</span>
              <span style={{ color: note.length > 130 ? 'var(--red)' : 'var(--text-tertiary)' }}>{note.length}/140</span>
            </div>
            <textarea className="input" rows={2} maxLength={140} placeholder="e.g. Breakout above resistance" value={note} onChange={(e) => setNote(e.target.value)} style={{ resize: 'none', lineHeight: 1.5 }} />
          </div>

          {error && <div style={{ background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 10, padding: '12px 14px', fontSize: 14, fontWeight: 600 }}>{error}</div>}

          <button className="btn-primary" onClick={submit} disabled={busy}
            style={{ background: action === 'BUY' ? undefined : 'linear-gradient(180deg, #FF6B86 0%, #E84A67 100%)', marginBottom: 8, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Sending…' : `Send ${action} signal`}
          </button>
        </div>
      </div>
    </>
  )
}

const label: React.CSSProperties = { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }
