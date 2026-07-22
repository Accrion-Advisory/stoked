import Link from 'next/link'

/**
 * "A product of Accrion Advisory" attribution lockup. The monogram's A is deep
 * navy, so on STOKED's dark surfaces we seat the mark on a frosted light chip
 * (matching Accrion's own presentation) and render "Accrion Advisory" as the
 * brand gradient.
 */
export function AccrionBadge({
  size = 'sm',
  href,
  className,
}: {
  size?: 'sm' | 'md'
  href?: string
  className?: string
}) {
  const chip = size === 'md' ? 28 : 22
  const content = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className="accrion-chip" style={{ width: chip, height: chip }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/accrion/logo-mark.png" alt="Accrion Advisory" style={{ width: chip * 0.72, height: 'auto' }} />
      </span>
      <span style={{ fontSize: size === 'md' ? 13 : 12, color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.01em' }}>
        A product of{' '}
        <span className="accrion-gradient-text" style={{ fontWeight: 700 }}>Accrion Advisory</span>
      </span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} aria-label="Accrion Advisory" className={className} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        {content}
      </Link>
    )
  }
  return <span className={className}>{content}</span>
}
