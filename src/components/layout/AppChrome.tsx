'use client'
import { ReactNode } from 'react'
import { useApp } from '@/lib/context'

// Gates the app UI on the initial data load so pages never render against an
// empty/half-loaded context.
export default function AppChrome({ children }: { children: ReactNode }) {
  const { loading } = useApp()

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" aria-label="Loading" />
      </div>
    )
  }

  return <>{children}</>
}
