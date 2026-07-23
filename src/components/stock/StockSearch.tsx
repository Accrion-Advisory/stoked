'use client'
import { useEffect, useRef, useState } from 'react'
import { POPULAR_STOCKS } from '@/lib/prices'
import { searchSecurities, type Security } from '@/lib/queries'

interface StockSearchProps {
  value: string
  exchange?: 'NSE' | 'BSE'
  onSelect: (symbol: string, exchange: 'NSE' | 'BSE', name: string) => void
}

const POPULAR: Security[] = POPULAR_STOCKS.map((s) => ({ symbol: s.symbol, exchange: s.exchange as 'NSE' | 'BSE', name: s.name }))

// Single reusable stock picker over the full NSE + BSE universe. Used by the
// add-trade and add-to-watchlist flows.
export default function StockSearch({ value, onSelect }: StockSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Security[]>(POPULAR.slice(0, 8))
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Debounced search against the securities master; fall back to the popular
  // list when empty (or if the backend is unavailable, e.g. dev mode).
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults(POPULAR.slice(0, 8))
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      const rows = await searchSecurities(q, 20)
      if (rows.length) {
        setResults(rows)
      } else {
        const up = q.toUpperCase()
        setResults(POPULAR.filter((s) => s.symbol.includes(up) || s.name.toUpperCase().includes(up)).slice(0, 8))
      }
      setLoading(false)
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="input"
        placeholder="Search any NSE / BSE stock"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        autoComplete="off"
        style={{ fontSize: 15 }}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            maxHeight: 320,
            overflowY: 'auto',
            background: 'var(--bg-overlay, #1E2128)',
            border: '1px solid var(--border-strong)',
            borderRadius: 12,
            zIndex: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {loading && results.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Searching…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No matches</div>
          ) : (
            results.map((stock) => (
              <button
                key={`${stock.symbol}.${stock.exchange}`}
                onClick={() => {
                  onSelect(stock.symbol, stock.exchange, stock.name)
                  setQuery(stock.symbol)
                  setOpen(false)
                }}
                style={{
                  width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12, background: 'transparent', border: 'none',
                  cursor: 'pointer', borderBottom: '1px solid var(--border)', textAlign: 'left',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{stock.symbol}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</div>
                </div>
                <span className="chip" style={{ flexShrink: 0, background: stock.exchange === 'NSE' ? 'var(--blue-dim)' : 'var(--gold-dim)', color: stock.exchange === 'NSE' ? 'var(--blue)' : 'var(--gold)' }}>{stock.exchange}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
