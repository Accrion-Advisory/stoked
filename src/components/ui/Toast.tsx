'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { StokedMark } from '@/components/brand/StokedLogo'

// Renders the transient in-app toast fired when a Realtime signal arrives.
export default function Toast() {
  const { toast, dismissToast } = useApp()
  const router = useRouter()
  if (!toast) return null

  return (
    <div
      className="toast-in"
      onClick={() => { if (toast.url) router.push(toast.url); dismissToast() }}
      style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 10px)', left: '50%', width: 'calc(100% - 28px)', maxWidth: 402, zIndex: 400, cursor: 'pointer' }}
    >
      <div className="surface" style={{ borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 18px 44px -12px rgba(0,0,0,0.85)' }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <StokedMark size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{toast.title}</div>
          {toast.body && (
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toast.body}</div>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); dismissToast() }} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </div>
  )
}
