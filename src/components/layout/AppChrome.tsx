'use client'
import { ReactNode, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { LogoLoader } from '@/components/brand/StokedLogo'
import Toast from '@/components/ui/Toast'
import { registerServiceWorker } from '@/lib/push'

// Gates the app UI on the initial data load so pages never render against an
// empty/half-loaded context. Also registers the push service worker and mounts
// the in-app toast.
export default function AppChrome({ children }: { children: ReactNode }) {
  const { loading } = useApp()

  useEffect(() => { registerServiceWorker() }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LogoLoader label="Loading…" />
      </div>
    )
  }

  return (
    <>
      <Toast />
      {children}
    </>
  )
}
