'use client'
import { getInitials, getAvatarColor } from '@/lib/dev-data'

interface AvatarProps {
  name: string
  userId: string
  size?: 'sm' | 'md' | 'lg'
  imageUrl?: string
}

const sizes = { sm: 28, md: 36, lg: 48 }
const fontSizes = { sm: 11, md: 13, lg: 16 }

export default function Avatar({ name, userId, size = 'md', imageUrl }: AvatarProps) {
  const px = sizes[size]
  const fs = fontSizes[size]
  const color = getAvatarColor(userId)
  const initials = getInitials(name)

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        style={{ width: px, height: px, borderRadius: '50%', objectFit: 'cover' }}
      />
    )
  }

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: color + '22',
        border: `1.5px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fs,
        fontWeight: 700,
        color,
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  )
}
