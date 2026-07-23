/* STOKED brand mark (the green "S") — static, animated loader, and watermark. */

const SRC = '/brand/stoked-mark-trimmed.png'

export function StokedMark({ size = 28, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={SRC} alt="STOKED" width={size} height={size} className={className} style={{ display: 'block', ...style }} />
}

/** Animated brand loader — the logo breathing with a green glow. */
export function LogoLoader({ size = 46, label }: { size?: number; label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <StokedMark size={size} className="logo-pulse" />
      {label && <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>}
    </div>
  )
}

/** Subtle fixed watermark shown on every in-app page. */
export function BrandWatermark() {
  return <StokedMark size={20} className="brand-watermark" />
}
