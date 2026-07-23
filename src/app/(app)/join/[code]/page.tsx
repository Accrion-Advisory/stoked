'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { groupPreview } from '@/lib/queries'
import { LogoLoader } from '@/components/brand/StokedLogo'

export default function JoinGroupPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const { joinGroup, groups, isDevMode } = useApp()
  const [preview, setPreview] = useState<{ id: string; name: string; member_count: number } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid'>('loading')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (isDevMode) { setStatus('ready'); setPreview({ id: 'dev', name: 'Demo Group', member_count: 3 }); return }
    let cancelled = false
    groupPreview(code)
      .then((p) => {
        if (cancelled) return
        if (p) { setPreview(p); setStatus('ready') } else setStatus('invalid')
      })
      .catch(() => !cancelled && setStatus('invalid'))
    return () => { cancelled = true }
  }, [code, isDevMode])

  const alreadyIn = preview && groups.some((g) => g.id === preview.id)

  async function handleJoin() {
    setJoining(true)
    try {
      await joinGroup(code)
      router.push('/dashboard')
    } catch {
      setJoining(false)
      setStatus('invalid')
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
      {status === 'loading' && <LogoLoader />}

      {status === 'invalid' && (
        <>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Invalid invite</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>This link is expired or incorrect.</div>
          <button className="btn-secondary" style={{ maxWidth: 220 }} onClick={() => router.push('/dashboard')}>Go home</button>
        </>
      )}

      {status === 'ready' && preview && (
        <>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>You&apos;ve been invited to join</div>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>{preview.name}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>{preview.member_count} members</div>
          {alreadyIn ? (
            <button className="btn-primary" style={{ maxWidth: 260 }} onClick={() => router.push('/dashboard')}>You&apos;re already in — open</button>
          ) : (
            <button className="btn-primary" style={{ maxWidth: 260, opacity: joining ? 0.6 : 1 }} onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining…' : 'Join Group'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
