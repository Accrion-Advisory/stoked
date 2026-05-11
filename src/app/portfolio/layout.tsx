import BottomNav from '@/components/layout/BottomNav'
import { AppProvider } from '@/lib/context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
        {children}
        <BottomNav />
      </div>
    </AppProvider>
  )
}
