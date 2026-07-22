'use client'
import { useState } from 'react'
import { useApp } from '@/lib/context'

// Shared create-a-group / join-by-code control. Used on the empty-state screen
// and inside the Group tab.
export default function GroupCreateJoin({ compact = false }: { compact?: boolean }) {
  const { createGroup, joinGroup } = useApp()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState<'create' | 'join' | null>(null)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) return setError('Give your group a name')
    setError('')
    setBusy('create')
    try {
      await createGroup(name.trim())
      setName('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create group')
    } finally {
      setBusy(null)
    }
  }

  async function handleJoin() {
    const c = code.trim()
    if (!c) return setError('Paste an invite code')
    setError('')
    setBusy('join')
    try {
      await joinGroup(c)
      setCode('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid invite code')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 16 }}>
      <div style={card}>
        <div style={label}>Create a new circle</div>
        <input className="input" placeholder="e.g. Whitefield Gang" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary" onClick={handleCreate} disabled={busy === 'create'} style={{ marginTop: 10, opacity: busy === 'create' ? 0.6 : 1 }}>
          {busy === 'create' ? 'Creating…' : 'Create Group'}
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>OR</div>

      <div style={card}>
        <div style={label}>Join with an invite code</div>
        <input className="input" placeholder="Paste invite code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn-secondary" onClick={handleJoin} disabled={busy === 'join'} style={{ marginTop: 10, opacity: busy === 'join' ? 0.6 : 1 }}>
          {busy === 'join' ? 'Joining…' : 'Join Group'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 10, padding: '12px 14px', fontSize: 14, fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  )
}

const card: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }
const label: React.CSSProperties = { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }
