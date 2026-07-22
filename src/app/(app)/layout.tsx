import BottomNav from '@/components/layout/BottomNav'
import AppChrome from '@/components/layout/AppChrome'
import { AppProvider } from '@/lib/context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
        <AppChrome>{children}</AppChrome>
        <BottomNav />
      </div>
    </AppProvider>
  )
}
