'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/lib/context'
import { calculateHoldings } from '@/lib/xirr'
import StockSearch from '@/components/stock/StockSearch'
import PageHeader from '@/components/layout/PageHeader'

export default function TradePage() {
  return (
    <Suspense fallback={null}>
      <TradeInner />
    </Suspense>
  )
}

function TradeInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, trades, addTrade, updateTrade } = useApp()

  const editId = params.get('edit')
  const editing = editId ? trades.find((t) => t.id === editId && t.user_id === user?.id) : undefined

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
  const [prefilled, setPrefilled] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const myHoldings = useMemo(
    () => calculateHoldings(trades.filter((t) => t.user_id === user?.id)),
    [trades, user?.id]
  )

  // Prefill from an edited trade, or from ?symbol=. Waits for trades to load
  // before applying edit data.
  useEffect(() => {
    if (prefilled) return
    if (editId) {
      if (editing) {
        setType(editing.type)
        setSymbol(editing.symbol)
        setExchange(editing.exchange)
        setQty(String(editing.quantity))
        setPrice(String(editing.price))
        setDate(editing.date)
        setCharges(editing.charges ? String(editing.charges) : '')
        setNotes(editing.notes || '')
        setPrefilled(true)
      }
    } else {
      const s = params.get('symbol')
      const ex = params.get('exchange')
      if (s) { setSymbol(s.toUpperCase()); if (ex === 'BSE' || ex === 'NSE') setExchange(ex) }
      setPrefilled(true)
    }
  }, [editId, editing, params, prefilled])

  const held = myHoldings.find((h) => h.symbol === symbol && h.exchange === exchange)
  // Shares available to sell — add back the edited SELL's own quantity (already
  // deducted from the holding) so you can revise it.
  const available =
    (held?.quantity ?? 0) +
    (editing && editing.type === 'SELL' && editing.symbol === symbol && editing.exchange === exchange
      ? editing.quantity
      : 0)

  const totalValue = qty && price ? Number(qty) * Number(price) : 0

  function switchType(t: 'BUY' | 'SELL') {
    if (t === type) return
    setType(t)
    setError('')
    // The stock sets differ (SELL only allows holdings), so reset the pick.
    if (!editing) { setSymbol(''); setStockName(''); setQty('') }
  }

  function pickHolding(sym: string, exch: 'NSE' | 'BSE') {
    setSymbol(sym); setExchange(exch); setStockName(''); setPickerOpen(false); setError('')
  }

  async function handleSave() {
    if (!user) return
    if (!symbol) return setError('Please select a stock')
    if (!qty || Number(qty) <= 0) return setError('Enter a valid quantity')
    if (!price || Number(price) <= 0) return setError('Enter a valid price')
    if (type === 'SELL' && Number(qty) > available) {
      return setError(`You only have ${available} share${available === 1 ? '' : 's'} of ${symbol}`)
    }

    setError('')
    setSaving(true)
    const payload = {
      symbol, exchange, type,
      quantity: Number(qty),
      price: Number(price),
      date,
      charges: charges ? Number(charges) : 0,
      notes: notes || undefined,
    }
    try {
      if (editing) await updateTrade(editing.id, payload)
      else await addTrade({ user_id: user.id, ...payload })
      setSaved(true)
      setTimeout(() => router.push('/portfolio'), 900)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save trade')
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: type === 'BUY' ? 'var(--green-dim)' : 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: type === 'BUY' ? 'var(--green)' : 'var(--red)' }}>{editing ? 'Trade Updated!' : 'Trade Saved!'}</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>{type} {qty} {symbol} @ ₹{Number(price).toLocaleString('en-IN')}</div>
      </div>
    )
  }

  const canSell = type === 'BUY' || myHoldings.length > 0 || !!editing

  return (
    <div className="mb-nav">
      <PageHeader onBack={() => router.back()} title={editing ? 'Edit Trade' : 'Add Trade'} />

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* BUY / SELL toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--bg-elevated)', borderRadius: 12, padding: 4 }}>
          {(['BUY', 'SELL'] as const).map((t) => (
            <button key={t} onClick={() => switchType(t)}
              style={{ padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, background: type === t ? (t === 'BUY' ? 'var(--green)' : 'var(--red)') : 'transparent', color: type === t ? '#0A0B0F' : 'var(--text-secondary)', transition: 'all 0.15s', fontFamily: 'Satoshi, sans-serif' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Stock: full search for BUY, holdings-only picker for SELL */}
        <div>
          <div style={label}>Stock</div>
          {type === 'BUY' ? (
            <>
              <StockSearch value={symbol} exchange={exchange} onSelect={(sym, exch, name) => { setSymbol(sym); setExchange(exch); setStockName(name) }} />
              {stockName && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, paddingLeft: 4 }}>{stockName}</div>}
            </>
          ) : myHoldings.length === 0 && !editing ? (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>
              You have no holdings to sell.
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setPickerOpen((o) => !o)} className="input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ color: symbol ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: symbol ? 700 : 400 }}>
                  {symbol ? `${symbol} · ${exchange}` : 'Select a holding to sell'}
                </span>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6,9 12,15 18,9" /></svg>
              </button>
              {pickerOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, maxHeight: 260, overflowY: 'auto', background: 'var(--bg-overlay, #23262F)', border: '1px solid var(--border-strong)', borderRadius: 12, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                  {myHoldings.map((h) => (
                    <button key={`${h.symbol}.${h.exchange}`} onClick={() => pickHolding(h.symbol, h.exchange)}
                      style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{h.symbol} <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{h.exchange}</span></span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{h.quantity} shares</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Qty + Price row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={label}>Quantity</div>
            <input className="input" type="number" placeholder="0" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} style={{ textAlign: 'right', fontSize: 18, fontWeight: 700 }} />
            {type === 'SELL' && symbol && (
              <div style={{ fontSize: 12, marginTop: 6, paddingLeft: 2, color: Number(qty) > available ? 'var(--red)' : 'var(--text-secondary)' }}>
                Available: {available} share{available === 1 ? '' : 's'}
              </div>
            )}
          </div>
          <div>
            <div style={label}>Price (₹)</div>
            <input className="input" type="number" placeholder="0.00" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} style={{ textAlign: 'right', fontSize: 18, fontWeight: 700 }} />
          </div>
        </div>

        {/* Date */}
        <div>
          <div style={label}>Date of Trade</div>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ colorScheme: 'dark' }} />
        </div>

        {/* Charges */}
        <div>
          <div style={label}>Brokerage / Charges (optional)</div>
          <input className="input" type="number" placeholder="₹20" inputMode="decimal" value={charges} onChange={(e) => setCharges(e.target.value)} />
        </div>

        {/* Notes */}
        <div>
          <div style={label}>Notes (optional)</div>
          <textarea className="input" placeholder="Why this trade? e.g. Strong Q3 results…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ resize: 'none', lineHeight: 1.5 }} />
        </div>

        {/* Live total */}
        {totalValue > 0 && (
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Total {type === 'BUY' ? 'Deployed' : 'Received'}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: type === 'BUY' ? 'var(--green)' : 'var(--red)' }} className="num">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        )}

        {error && <div style={{ background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>{error}</div>}

        <button className="btn-primary" onClick={handleSave} disabled={saving || !canSell}
          style={{ background: type === 'BUY' ? undefined : 'linear-gradient(180deg, #FF6B86 0%, #E84A67 100%)', marginBottom: 8, opacity: saving || !canSell ? 0.6 : 1 }}>
          {saving ? 'Saving…' : editing ? 'Save Changes' : `Save ${type} Trade`}
        </button>
      </div>
    </div>
  )
}

const label: React.CSSProperties = { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }
