'use client'
import { useEffect, useState } from 'react'
import { Group } from '@/types'

// Bottom sheet with a group's secure invite link + code + share.
export default function InviteSheet({ group, onClose }: { group: Group; onClose: () => void }) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)

  useEffect(() => setOrigin(window.location.origin), [])
  const inviteLink = origin ? `${origin}/join/${group.invite_code}` : ''

  function copy(text: string, which: 'link' | 'code') {
    navigator.clipboard?.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300 }} />
      <div className="sheet-enter" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: '100%', maxWidth: 430, background: 'var(--bg-elevated)', borderTopLeftRadius: 22, borderTopRightRadius: 22, zIndex: 301, border: '1px solid var(--border-strong)', borderBottom: 'none', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', maxHeight: '86dvh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '10px auto 8px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 14px' }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Invite to {group.name}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="surface" style={{ borderRadius: 16, padding: 18 }}>
            <div style={label}>Secure invite link</div>
            <div style={{ background: 'var(--bg-base)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: 12, border: '1px solid var(--border)' }}>{inviteLink || 'Generating…'}</div>
            <button className="btn-primary" onClick={() => copy(inviteLink, 'link')} disabled={!inviteLink}>{copied === 'link' ? 'Copied!' : 'Copy invite link'}</button>
          </div>

          <div className="surface" style={{ borderRadius: 16, padding: 18 }}>
            <div style={label}>Or share the code</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <code style={{ flex: 1, background: 'var(--bg-base)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--gold)', wordBreak: 'break-all', border: '1px solid var(--border)' }}>{group.invite_code}</code>
              <button className="btn-secondary" style={{ width: 'auto', padding: '12px 16px' }} onClick={() => copy(group.invite_code, 'code')}>{copied === 'code' ? '✓' : 'Copy'}</button>
            </div>
          </div>

          <button className="btn-secondary" onClick={() => { if (navigator.share && inviteLink) navigator.share({ title: 'Join me on STOKED', text: `Join our investing circle "${group.name}" on STOKED`, url: inviteLink }) }}>
            Share via WhatsApp / Other
          </button>
        </div>
      </div>
    </>
  )
}

const label: React.CSSProperties = { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }
