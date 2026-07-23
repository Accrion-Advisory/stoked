'use client'
import { useEffect, useRef, useState } from 'react'
import { StokedMark } from '@/components/brand/StokedLogo'

const THRESHOLD = 66
const MAX = 100

/**
 * Pull-down-to-refresh for window-scrolled pages. Reveals the animated STOKED
 * mark as you pull; releasing past the threshold runs `onRefresh` while the
 * logo pulses. The content wrapper only gets a transform while active so it
 * never becomes a containing block for fixed-position children.
 */
export default function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [dragging, setDragging] = useState(false)

  const startY = useRef(0)
  const active = useRef(false)
  const pullRef = useRef(0)
  const refreshingRef = useRef(false)

  const setPullValue = (v: number) => { pullRef.current = v; setPull(v) }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current) return
      if (window.scrollY <= 0) { startY.current = e.touches[0].clientY; active.current = true; setDragging(true) }
      else active.current = false
    }
    const onMove = (e: TouchEvent) => {
      if (!active.current || refreshingRef.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0 && window.scrollY <= 0) {
        e.preventDefault() // suppress native overscroll while pulling
        setPullValue(Math.min(MAX, dy * 0.5))
      } else if (dy <= 0 && pullRef.current === 0) {
        active.current = false; setDragging(false)
      }
    }
    const onEnd = async () => {
      if (!active.current) return
      active.current = false; setDragging(false)
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true; setRefreshing(true); setPullValue(THRESHOLD)
        try { await onRefresh() } finally {
          refreshingRef.current = false; setRefreshing(false); setPullValue(0)
        }
      } else setPullValue(0)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [onRefresh])

  const offset = refreshing ? THRESHOLD : pull
  const progress = Math.min(1, pull / THRESHOLD)

  return (
    <div ref={ref}>
      {/* Pull indicator */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: offset, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
        {refreshing ? (
          <StokedMark size={30} className="logo-pulse" />
        ) : (
          <StokedMark size={26} style={{ opacity: progress, transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 200}deg)` }} />
        )}
      </div>
      <div style={{ transform: offset ? `translateY(${offset}px)` : undefined, transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(0.32,0.72,0,1)' }}>
        {children}
      </div>
    </div>
  )
}
