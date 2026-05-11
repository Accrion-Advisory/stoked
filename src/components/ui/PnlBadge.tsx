import { formatPercent } from '@/lib/utils'

interface PnlBadgeProps {
  value: number
  type?: 'percent' | 'currency'
  size?: 'sm' | 'md'
}

export default function PnlBadge({ value, type = 'percent', size = 'sm' }: PnlBadgeProps) {
  const isPos = value >= 0
  const color = isPos ? 'var(--green)' : 'var(--red)'
  const bg = isPos ? 'var(--green-dim)' : 'var(--red-dim)'
  const fontSize = size === 'sm' ? 12 : 14

  const display =
    type === 'percent'
      ? formatPercent(value)
      : `${value >= 0 ? '+' : ''}₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color,
        padding: '3px 8px',
        borderRadius: 6,
        fontSize,
        fontWeight: 600,
        fontFeatureSettings: '"tnum"',
      }}
    >
      {display}
    </span>
  )
}
