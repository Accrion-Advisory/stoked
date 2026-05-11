'use client'
import { useState, useEffect, useRef } from 'react'
import { POPULAR_STOCKS } from '@/lib/prices'

interface StockSearchProps {
  value: string
  exchange: 'NSE' | 'BSE'
  onSelect: (symbol: string, exchange: 'NSE' | 'BSE', name: string) => void
}

export default function StockSearch({ value, exchange, onSelect }: StockSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<typeof POPULAR_STOCKS[number][]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query || query.length < 1) {
      setResults(POPULAR_STOCKS.slice(0, 8) as unknown as typeof POPULAR_STOCKS[number][])
      return
    }
    const q = query.toUpperCase()
    const filtered = POPULAR_STOCKS.filter(
      (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
    ).slice(0, 8)
    setResults(filtered as unknown as typeof POPULAR_STOCKS[number][])
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
        placeholder="Search stock (e.g. Reliance, TCS)"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        autoComplete="off"
        style={{ fontSize: 15 }}
      />
      {open && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--bg-overlay, #1E2128)',
            border: '1px solid var(--border-strong)',
            borderRadius: 12,
            overflow: 'hidden',
            zIndex: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {results.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => {
                onSelect(stock.symbol, stock.exchange as 'NSE' | 'BSE', stock.name)
                setQuery(stock.symbol)
                setOpen(false)
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {stock.symbol}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {stock.name}
                </div>
              </div>
              <span className="chip chip-nse">{stock.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
