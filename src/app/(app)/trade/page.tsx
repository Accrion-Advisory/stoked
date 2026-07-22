'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import StockSearch from '@/components/stock/StockSearch'

export default function TradePage() {
  const router = useRouter()
  const { user, addTrade } = useApp()

  const [type, setType] = useState<'BUY' | 'SELL'>('BUY')
  const [symbol, setSymbol] = useState('')
  const [exchange, setExchange] = useState<'NSE' | 'BSE'>('NSE')
  const [stockName, setStockName] = useState('')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [charges, setCharges] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalValue = qty && price ? Number(qty) * Number(price) : 0

  async function handleSave() {
    if (!user) return
    if (!symbol) return setError('Please select a stock')
    if (!qty || Number(qty) <= 0) return setError('Enter a valid quantity')
    if (!price || Number(price) <= 0) return setError('Enter a valid price')

    setError('')
    setSaving(true)
    try {
      await addTrade({
        user_id: user.id,
        symbol,
        exchange,
        type,
        quantity: Number(qty),
        price: Number(price),
        date,
        charges: charges ? Number(charges) : 0,
        notes: notes || undefined,
      })
      setSaved(true)
      setTimeout(() => router.push('/portfolio'), 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save trade')
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: type === 'BUY' ? 'var(--green-dim)' : 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
          {type === 'BUY' ? '✓' : '✓'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: type === 'BUY' ? 'var(--green)' : 'var(--red)' }}>
          Trade Saved!
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
          {type} {qty} {symbol} @ ₹{Number(price).toLocaleString('en-IN')}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
            Cancel
          </button>
          <span style={{ fontSize: 17, fontWeight: 800 }}>Add Trade</span>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* BUY / SELL toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--bg-elevated)', borderRadius: 12, padding: 4 }}>
          {(['BUY', 'SELL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
                background: type === t ? (t === 'BUY' ? 'var(--green)' : 'var(--red)') : 'transparent',
                color: type === t ? '#0A0B0F' : 'var(--text-secondary)',
                transition: 'all 0.15s',
                fontFamily: 'Satoshi, sans-serif',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Stock search */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Stock</div>
          <StockSearch
            value={symbol}
            exchange={exchange}
            onSelect={(sym, exch, name) => { setSymbol(sym); setExchange(exch); setStockName(name) }}
          />
          {stockName && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, paddingLeft: 4 }}>{stockName}</div>
          )}
        </div>

        {/* Qty + Price row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quantity</div>
            <input
              className="input"
              type="number"
              placeholder="0"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{ textAlign: 'right', fontSize: 18, fontWeight: 700 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Price (₹)</div>
            <input
              className="input"
              type="number"
              placeholder="0.00"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ textAlign: 'right', fontSize: 18, fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Date of Trade</div>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Charges optional */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Brokerage / Charges (optional)</div>
          <input
            className="input"
            type="number"
            placeholder="₹20"
            inputMode="decimal"
            value={charges}
            onChange={(e) => setCharges(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes (optional)</div>
          <textarea
            className="input"
            placeholder="Why are you buying this? e.g. Strong Q3 results…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ resize: 'none', lineHeight: 1.5 }}
          />
        </div>

        {/* Live total */}
        {totalValue > 0 && (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Total {type === 'BUY' ? 'Deployed' : 'Received'}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: type === 'BUY' ? 'var(--green)' : 'var(--red)' }} className="num">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ background: type === 'BUY' ? 'var(--green)' : 'var(--red)', marginBottom: 8, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : `Save ${type} Trade`}
        </button>
      </div>
    </div>
  )
}
