'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import Avatar from '@/components/ui/Avatar'
import { logout } from '@/app/auth/actions'

function ConnectionsInner() {
  const { user, connections, connectByUsername, acceptConnection, removeConnection } = useApp()
  const params = useSearchParams()
  const [handle, setHandle] = useState('')
  const [origin, setOrigin] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => setOrigin(window.location.origin), [])
  useEffect(() => {
    const add = params.get('add')
    if (add) setHandle(add)
  }, [params])

  const incoming = connections.filter((c) => c.direction === 'incoming' && c.status === 'pending')
  const outgoing = connections.filter((c) => c.direction === 'outgoing' && c.status === 'pending')
  const accepted = connections.filter((c) => c.status === 'accepted')

  const myShareLink = user && origin ? `${origin}/connections?add=${user.username}` : ''

  async function handleConnect() {
    if (!handle.trim() || busy) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await connectByUsername(handle.trim())
      setMsg({ ok: res.ok, text: res.message })
      if (res.ok) setHandle('')
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-nav" style={{ padding: '52px 20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 800 }}>Connections</span>
        <form action={logout}>
          <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Satoshi, sans-serif' }}>Log out</button>
        </form>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Connect 1-on-1 — when they accept, you both see each other&apos;s portfolios.
      </div>

      {/* Share my handle */}
      {user && (
        <div style={card}>
          <div style={label}>Your handle</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <code style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--green)', border: '1px solid var(--border)' }}>@{user.username}</code>
            <button className="btn-secondary" style={{ width: 'auto', padding: '12px 16px' }} onClick={() => { navigator.clipboard?.writeText(myShareLink); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      )}

      {/* Connect by handle */}
      <div style={{ ...card, marginTop: 16 }}>
        <div style={label}>Connect with someone</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" placeholder="their @handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <button className="btn-primary" style={{ width: 'auto', padding: '0 20px' }} onClick={handleConnect} disabled={busy}>
            {busy ? '…' : 'Connect'}
          </button>
        </div>
        {msg && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: msg.ok ? 'var(--green)' : 'var(--red)' }}>{msg.text}</div>}
      </div>

      {/* Incoming */}
      {incoming.length > 0 && (
        <Section title={`Requests (${incoming.length})`}>
          {incoming.map((c) => (
            <Row key={c.id} name={c.other?.name} sub={`@${c.other?.username}`} userId={c.other?.id}>
              <button style={pill('var(--green)')} onClick={() => acceptConnection(c.id)}>Accept</button>
              <button style={pill('var(--text-tertiary)')} onClick={() => removeConnection(c.id)}>Decline</button>
            </Row>
          ))}
        </Section>
      )}

      {/* Accepted */}
      {accepted.length > 0 && (
        <Section title={`Connected (${accepted.length})`}>
          {accepted.map((c) => (
            <Row key={c.id} name={c.other?.name} sub={`@${c.other?.username}`} userId={c.other?.id} href={c.other ? `/portfolio/${c.other.id}` : undefined}>
              <button style={pill('var(--text-tertiary)')} onClick={(e) => { e.preventDefault(); removeConnection(c.id) }}>Remove</button>
            </Row>
          ))}
        </Section>
      )}

      {/* Outgoing */}
      {outgoing.length > 0 && (
        <Section title={`Pending (${outgoing.length})`}>
          {outgoing.map((c) => (
            <Row key={c.id} name={c.other?.name} sub="Awaiting response" userId={c.other?.id}>
              <button style={pill('var(--text-tertiary)')} onClick={() => removeConnection(c.id)}>Cancel</button>
            </Row>
          ))}
        </Section>
      )}
    </div>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <ConnectionsInner />
    </Suspense>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ name, sub, userId, href, children }: { name?: string; sub?: string; userId?: string; href?: string; children: React.ReactNode }) {
  const inner = (
    <>
      <Avatar name={name || 'U'} userId={userId || 'x'} size="md" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{children}</div>
    </>
  )
  const style: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }
  return href ? <Link href={href} style={style}>{inner}</Link> : <div style={style}>{inner}</div>
}

const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }
const label: React.CSSProperties = { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }
const pill = (color: string): React.CSSProperties => ({ background: 'none', border: `1px solid ${color}`, color, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Satoshi, sans-serif' })
