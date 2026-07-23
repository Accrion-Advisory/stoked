'use client'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/context'
import Avatar from '@/components/ui/Avatar'
import SignalComposer from '@/components/signals/SignalComposer'
import { timeAgo } from '@/lib/utils'
import { enablePush, getSubscriptionState, type PushState } from '@/lib/push'
import Link from 'next/link'

export default function SignalsPanel({ groupId }: { groupId: string }) {
  const { user, signals, profilesById, postSignal, removeSignal, mutedGroups, setSignalMute } = useApp()
  const [composing, setComposing] = useState(false)
  const [pushState, setPushState] = useState<PushState>('default')
  const [enabling, setEnabling] = useState(false)

  const groupSignals = useMemo(
    () => signals.filter((s) => s.group_id === groupId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [signals, groupId]
  )
  const muted = mutedGroups.includes(groupId)

  useEffect(() => { getSubscriptionState().then(setPushState) }, [])

  async function handleEnable() {
    setEnabling(true)
    await enablePush()
    setPushState(await getSubscriptionState())
    setEnabling(false)
  }

  const iosNeedsInstall = pushState === 'unsupported' && typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <div style={{ padding: '16px 20px 0' }}>
      {/* Push opt-in / status */}
      {(pushState === 'default' || pushState === 'unsubscribed') && (
        <button onClick={handleEnable} disabled={enabling} className="surface" style={{ width: '100%', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', marginBottom: 16, opacity: enabling ? 0.6 : 1 }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{enabling ? 'Enabling…' : 'Turn on buy/sell alerts'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Get notified the moment someone posts a signal.</div>
          </div>
          <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 13 }}>Enable →</span>
        </button>
      )}
      {pushState === 'denied' && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Notifications are blocked in your browser settings. Signals still appear here live while the app is open.
        </div>
      )}
      {iosNeedsInstall && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
          On iPhone, tap <strong>Share → Add to Home Screen</strong> to receive push alerts. Signals still appear here live while the app is open.
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => setComposing(true)}>+ New signal</button>
        <button onClick={() => setSignalMute(groupId, !muted)} aria-label={muted ? 'Unmute' : 'Mute'}
          style={{ width: 52, borderRadius: 14, border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
          {muted ? '🔕' : '🔔'}
        </button>
      </div>
      {muted && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: -10, marginBottom: 14 }}>Push muted for this group — you&apos;ll still see signals here.</div>}

      {/* Feed */}
      {groupSignals.length === 0 ? (
        <div style={{ padding: '40px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No signals yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 280, margin: '0 auto' }}>Spot an opportunity? Post a standardized BUY/SELL alert for the group.</div>
        </div>
      ) : (
        groupSignals.map((s) => {
          const author = s.author ?? profilesById[s.author_id]
          const isBuy = s.action === 'BUY'
          const mine = s.author_id === user?.id
          return (
            <div key={s.id} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <Avatar name={author?.name || 'U'} userId={s.author_id} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="chip" style={{ background: isBuy ? 'var(--green-dim)' : 'var(--red-dim)', color: isBuy ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{s.action}</span>
                  <Link href={`/stock/${s.symbol}`} style={{ fontSize: 15, fontWeight: 800 }}>{s.symbol}</Link>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>@ ₹{Number(s.price).toLocaleString('en-IN')}</span>
                </div>
                {s.note && <div style={{ fontSize: 13.5, color: 'var(--text-primary)', marginTop: 5, lineHeight: 1.45 }}>{s.note}</div>}
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 5 }}>
                  {author?.name || 'Someone'} · {timeAgo(s.created_at)}
                  {mine && (
                    <button onClick={() => removeSignal(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', marginLeft: 10, fontSize: 11.5, textDecoration: 'underline', padding: 0 }}>delete</button>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}

      {composing && <SignalComposer groupId={groupId} onClose={() => setComposing(false)} onPost={postSignal} />}
    </div>
  )
}
