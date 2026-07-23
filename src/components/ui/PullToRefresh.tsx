'use client'
import { useEffect, useRef, useState } from 'react'
import { StokedMark } from '@/components/brand/StokedLogo'

const THRESHOLD = 66
const MAX = 100
const INDICATOR = 54

/**
 * Pull-down-to-refresh for window-scrolled pages, split into a gesture hook and
 * a placeable indicator so the animated logo can render exactly where we want
 * (e.g. above the holdings table) rather than at the very top of the page.
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [dragging, setDragging] = useState(false)

  const startY = useRef(0)
  const active = useRef(false)
  const pullRef = useRef(0)
  const refreshingRef = useRef(false)

  const set = (v: number) => { pullRef.current = v; setPull(v) }

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current) return
      if (window.scrollY <= 0) { startY.current = e.touches[0].clientY; active.current = true; setDragging(true) }
      else active.current = false
    }
    const onMove = (e: TouchEvent) => {
      if (!active.current || refreshingRef.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0 && window.scrollY <= 0) {
        e.preventDefault()
        set(Math.min(MAX, dy * 0.5))
      } else if (dy <= 0 && pullRef.current === 0) {
        active.current = false; setDragging(false)
      }
    }
    const onEnd = async () => {
      if (!active.current) return
      active.current = false; setDragging(false)
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true; setRefreshing(true); set(0)
        try { await onRefresh() } finally { refreshingRef.current = false; setRefreshing(false); set(0) }
      } else set(0)
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [onRefresh])

  return { pull, refreshing, dragging }
}

export function PullIndicator({ pull, refreshing, dragging }: { pull: number; refreshing: boolean; dragging: boolean }) {
  const height = refreshing ? INDICATOR : Math.min(pull, INDICATOR)
  const progress = Math.min(1, pull / THRESHOLD)
  return (
    <div style={{ height, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: dragging ? 'none' : 'height 0.28s cubic-bezier(0.32,0.72,0,1)' }}>
      {refreshing ? (
        <StokedMark size={30} className="logo-pulse" />
      ) : pull > 2 ? (
        <StokedMark size={28} style={{ opacity: progress, transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 200}deg)` }} />
      ) : null}
    </div>
  )
}
