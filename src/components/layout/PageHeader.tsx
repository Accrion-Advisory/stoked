'use client'
import { StokedMark } from '@/components/brand/StokedLogo'

interface PageHeaderProps {
  /** Simple string title, or a custom node. */
  title?: React.ReactNode
  subtitle?: React.ReactNode
  /** Right-aligned action(s). */
  right?: React.ReactNode
  /** Content rendered below the title row inside the sticky header (e.g. tabs). */
  below?: React.ReactNode
  /** When set, shows a back button in place of the logo. */
  onBack?: () => void
  /** Fully custom middle content (overrides title/subtitle). */
  children?: React.ReactNode
}

/**
 * The single, consistent app header: sticks to the top, frosted, safe-area
 * aware, with the STOKED mark inline to the left of the title (or a back button
 * on drill-down pages). Used on every in-app page so they all match.
 */
export default function PageHeader({ title, subtitle, right, below, onBack, children }: PageHeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        background: 'rgba(10, 11, 15, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 18px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 34 }}>
        {onBack ? (
          <button onClick={onBack} aria-label="Back" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0, padding: 0 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
        ) : (
          <StokedMark size={30} style={{ flexShrink: 0 }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {children ?? (
            <>
              {typeof title === 'string' ? (
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
              ) : (
                title
              )}
              {subtitle && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
            </>
          )}
        </div>

        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>

      {below && <div style={{ marginTop: 12 }}>{below}</div>}
    </header>
  )
}
