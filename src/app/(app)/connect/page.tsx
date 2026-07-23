'use client'
import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import Avatar from '@/components/ui/Avatar'
import GroupCreateJoin from '@/components/group/GroupCreateJoin'
import { AccrionBadge } from '@/components/brand/AccrionBadge'
import PageHeader from '@/components/layout/PageHeader'
import { usePullToRefresh, PullIndicator } from '@/components/ui/PullToRefresh'
import { logout } from '@/app/auth/actions'

type Tab = 'groups' | 'connections' | 'add'

export default function ConnectPage() {
  const {
    user, groups, memberships, connections, profilesById,
    setCurrentGroupId, connectByUsername, acceptConnection, removeConnection, refresh,
  } = useApp()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('groups')

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), new Promise((r) => setTimeout(r, 700))])
  }, [refresh])
  const { pull, refreshing, dragging } = usePullToRefresh(handleRefresh)

  // Add-connection form state
  const [handle, setHandle] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const memberCount = useMemo(() => {
    const m: Record<string, number> = {}
    for (const mem of memberships) m[mem.group_id] = (m[mem.group_id] ?? 0) + 1
    return m
  }, [memberships])

  const incoming = connections.filter((c) => c.direction === 'incoming' && c.status === 'pending')
  const accepted = connections.filter((c) => c.status === 'accepted')
  const outgoing = connections.filter((c) => c.direction === 'outgoing' && c.status === 'pending')

  function openGroup(id: string) {
    setCurrentGroupId(id)
    router.push('/group')
  }

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

  const TABS: { id: Tab; label: string }[] = [
    { id: 'groups', label: 'Groups' },
    { id: 'connections', label: 'Connections' },
    { id: 'add', label: 'Add' },
  ]

  return (
    <div className="mb-nav">
      <PageHeader
        title="Connect"
        right={(
          <form action={logout}>
            <button type="submit" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Satoshi, sans-serif', padding: '7px 14px', borderRadius: 999 }}>
              Log out
            </button>
          </form>
        )}
        below={(
          <div style={{ display: 'flex' }}>
            {TABS.map((t) => {
              const active = tab === t.id
              const badge = t.id === 'add' && incoming.length > 0 ? incoming.length : 0
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ flex: 1, padding: '9px 0 4px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: active ? '2px solid var(--green)' : '2px solid transparent', fontFamily: 'Satoshi, sans-serif', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {t.label}
                  {badge > 0 && <span style={{ background: 'var(--green)', color: '#04120A', fontSize: 11, fontWeight: 800, borderRadius: 999, minWidth: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{badge}</span>}
                </button>
              )
            })}
          </div>
        )}
      />

      <PullIndicator pull={pull} refreshing={refreshing} dragging={dragging} />

      {/* ---- GROUPS ---- */}
      {tab === 'groups' && (
        <div style={{ padding: '18px 20px 0' }}>
          {groups.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={sectionLabel}>Your groups</div>
              {groups.map((g) => (
                <button key={g.id} onClick={() => openGroup(g.id)} style={groupRow}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--green-dim)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, flexShrink: 0 }}>
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{g.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{memberCount[g.id] ?? 1} member{(memberCount[g.id] ?? 1) > 1 ? 's' : ''}</div>
                  </div>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6" /></svg>
                </button>
              ))}
            </div>
          )}

          <div style={sectionLabel}>{groups.length > 0 ? 'Create or join another' : 'Create or join a group'}</div>
          <GroupCreateJoin onDone={() => router.push('/group')} />
        </div>
      )}

      {/* ---- CONNECTIONS (direct) ---- */}
      {tab === 'connections' && (
        <div style={{ padding: '18px 20px 0' }}>
          {accepted.length === 0 ? (
            <Empty icon="🤝" title="No direct connections yet" sub="Add someone by their handle in the Add tab. When they accept, you'll both see each other's portfolios." />
          ) : (
            accepted.map((c) => (
              <Link key={c.id} href={c.other ? `/portfolio/${c.other.id}` : '#'} style={rowStyle}>
                <Avatar name={c.other?.name || 'U'} userId={c.other?.id || 'x'} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.other?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{c.other?.username}</div>
                </div>
                <button onClick={(e) => { e.preventDefault(); removeConnection(c.id) }} style={pill('var(--text-tertiary)')}>Remove</button>
              </Link>
            ))
          )}
        </div>
      )}

      {/* ---- ADD ---- */}
      {tab === 'add' && (
        <div style={{ padding: '18px 20px 0' }}>
          {/* My handle */}
          {user && (
            <div className="surface" style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={cardLabel}>Your handle — share it to connect</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <code style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--green)', border: '1px solid var(--border)' }}>@{user.username}</code>
                <button className="btn-secondary" style={{ width: 'auto', padding: '12px 16px' }} onClick={() => { navigator.clipboard?.writeText(`@${user.username}`); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Connect by handle */}
          <div className="surface" style={{ borderRadius: 16, padding: 16 }}>
            <div style={cardLabel}>Add a connection</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="input" placeholder="their @handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
              <button className="btn-primary" style={{ width: 'auto', padding: '0 20px' }} onClick={handleConnect} disabled={busy}>{busy ? '…' : 'Send'}</button>
            </div>
            {msg && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: msg.ok ? 'var(--green)' : 'var(--red)' }}>{msg.text}</div>}
          </div>

          {/* Incoming */}
          {incoming.length > 0 && (
            <Section title={`Requests · ${incoming.length}`}>
              {incoming.map((c) => (
                <div key={c.id} style={rowStyle}>
                  <Avatar name={c.other?.name || 'U'} userId={c.other?.id || 'x'} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{c.other?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{c.other?.username}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={pill('var(--green)')} onClick={() => acceptConnection(c.id)}>Accept</button>
                    <button style={pill('var(--text-tertiary)')} onClick={() => removeConnection(c.id)}>Decline</button>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Outgoing */}
          {outgoing.length > 0 && (
            <Section title={`Pending · ${outgoing.length}`}>
              {outgoing.map((c) => (
                <div key={c.id} style={rowStyle}>
                  <Avatar name={c.other?.name || 'U'} userId={c.other?.id || 'x'} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{c.other?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Awaiting response</div>
                  </div>
                  <button style={pill('var(--text-tertiary)')} onClick={() => removeConnection(c.id)}>Cancel</button>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <Link href="/about" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', color: 'var(--green)', fontSize: 14, fontWeight: 700 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          About STOKED
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6" /></svg>
        </Link>
        <AccrionBadge href="/about" />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={sectionLabel}>{title}</div>
      {children}
    </div>
  )
}

function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ padding: '48px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 34, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>{sub}</div>
    </div>
  )
}

const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }
const cardLabel: React.CSSProperties = { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }
const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }
const groupRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontFamily: 'Satoshi, sans-serif' }
const pill = (color: string): React.CSSProperties => ({ background: 'none', border: `1px solid ${color}`, color, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Satoshi, sans-serif' })
