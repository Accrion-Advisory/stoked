'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Holding } from '@/types'
import PnlBadge from '@/components/ui/PnlBadge'

const OPEN = 84

function inr(n: number, dp = 2) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

/**
 * A portfolio holding row that supports:
 *  - tap        → open the stock page
 *  - long-press → open the actions sheet (edit / delete individual trades)
 *  - swipe-left → reveal a Delete button (removes the whole holding)
 *  - ⋯ button / right-click → actions sheet (desktop-friendly fallback)
 */
export default function HoldingRow({
  holding,
  onOpenActions,
  onDelete,
}: {
  holding: Holding
  onOpenActions: () => void
  onDelete: () => void
}) {
  const router = useRouter()
  const [dx, setDx] = useState(0)
  const dxRef = useRef(0)
  const openRef = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const moved = useRef(false)
  const longFired = useRef(false)
  const suppress = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setX = (x: number) => { dxRef.current = x; setDx(x) }
  const clearTimer = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    startX.current = t.clientX; startY.current = t.clientY
    moved.current = false; longFired.current = false
    clearTimer()
    timer.current = setTimeout(() => {
      if (!moved.current) { longFired.current = true; suppress.current = true; navigator.vibrate?.(10); onOpenActions() }
    }, 500)
  }
  function onTouchMove(e: React.TouchEvent) {
    const t = e.touches[0]
    const ddx = t.clientX - startX.current
    const ddy = t.clientY - startY.current
    if (!moved.current && (Math.abs(ddx) > 8 || Math.abs(ddy) > 8)) { moved.current = true; clearTimer() }
    if (Math.abs(ddx) > Math.abs(ddy)) {
      const base = openRef.current ? -OPEN : 0
      setX(Math.max(-OPEN, Math.min(0, base + ddx)))
    }
  }
  function onTouchEnd() {
    clearTimer()
    if (longFired.current) { setX(openRef.current ? -OPEN : 0); return }
    if (moved.current) {
      const open = dxRef.current <= -OPEN / 2
      openRef.current = open; setX(open ? -OPEN : 0); suppress.current = true
      return
    }
    if (openRef.current) { openRef.current = false; setX(0); suppress.current = true }
  }
  function onClick() {
    if (suppress.current) { suppress.current = false; return }
    if (openRef.current) { openRef.current = false; setX(0); return }
    router.push(`/stock/${holding.symbol}`)
  }

  const ltp = holding.current_price
  const pnl = holding.pnl ?? 0

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
      {/* Delete zone behind */}
      <button
        onClick={onDelete}
        aria-label="Delete holding"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: OPEN, background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontFamily: 'Satoshi, sans-serif', fontSize: 12, fontWeight: 700 }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        Delete
      </button>

      {/* Foreground content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onClick}
        onContextMenu={(e) => { e.preventDefault(); onOpenActions() }}
        style={{ position: 'relative', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', gap: 10, transform: `translateX(${dx}px)`, transition: dx === 0 || dx === -OPEN ? 'transform 0.2s' : 'none', cursor: 'pointer' }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            {holding.symbol}
            <span className="chip" style={{ fontSize: 10, background: holding.exchange === 'NSE' ? 'var(--blue-dim)' : 'var(--gold-dim)', color: holding.exchange === 'NSE' ? 'var(--blue)' : 'var(--gold)' }}>{holding.exchange}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{holding.quantity} shares · avg ₹{inr(holding.avg_price)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>LTP {ltp != null ? `₹${inr(ltp)}` : '—'}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ textAlign: 'right' }}>
            <PnlBadge value={holding.pnl_percent ?? 0} type="percent" size="sm" />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{pnl >= 0 ? '+' : ''}₹{inr(Math.abs(pnl), 0)}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenActions() }}
            aria-label="Options"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px 2px', flexShrink: 0 }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
