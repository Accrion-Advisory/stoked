'use client'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/context'
import { buildMemberPortfolio } from '@/lib/portfolio'
import { formatCurrency, formatPercent } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import EmptyGroup from '@/components/group/EmptyGroup'
import GroupCreateJoin from '@/components/group/GroupCreateJoin'
import Link from 'next/link'

const MEDALS = ['🥇', '🥈', '🥉']

export default function GroupPage() {
  const {
    user, groups, currentGroup, currentGroupId, setCurrentGroupId,
    memberships, profilesById, trades, prices, leaveGroup, setGroupVisibility,
  } = useApp()
  const [tab, setTab] = useState<'leaderboard' | 'members' | 'invite'>('leaderboard')
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)
  const [addMode, setAddMode] = useState(false)

  useEffect(() => setOrigin(window.location.origin), [])

  const groupMembers = useMemo(
    () => memberships.filter((m) => m.group_id === currentGroupId),
    [memberships, currentGroupId]
  )
  const myMembership = groupMembers.find((m) => m.user_id === user?.id)

  const memberStats = useMemo(() => {
    return groupMembers
      .map((m) => {
        const profile = m.user ?? profilesById[m.user_id]
        if (!profile) return null
        const userTrades = trades.filter((t) => t.user_id === m.user_id)
        return buildMemberPortfolio(profile, userTrades, prices)
      })
      .filter(Boolean)
      .sort((a, b) => b!.xirr - a!.xirr) as ReturnType<typeof buildMemberPortfolio>[]
  }, [groupMembers, profilesById, trades, prices])

  const groupValue = memberStats.reduce((s, m) => s + m.current_value, 0)
  const groupXirr = memberStats.length ? memberStats.reduce((s, m) => s + m.xirr, 0) / memberStats.length : 0

  if (!currentGroup) return <EmptyGroup />

  const inviteLink = origin ? `${origin}/join/${currentGroup.invite_code}` : ''

  function copy(text: string) {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{currentGroup.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {groupMembers.length} members · {formatCurrency(groupValue, true)} tracked
            </div>
          </div>
          <div style={{ background: groupXirr >= 0 ? 'var(--green-dim)' : 'var(--red-dim)', color: groupXirr >= 0 ? 'var(--green)' : 'var(--red)', padding: '6px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            XIRR {formatPercent(groupXirr)}
          </div>
        </div>

        {/* Group switcher */}
        {groups.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
            {groups.map((g) => (
              <button key={g.id} onClick={() => setCurrentGroupId(g.id)}
                style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Satoshi, sans-serif', background: g.id === currentGroupId ? 'var(--green)' : 'var(--bg-elevated)', color: g.id === currentGroupId ? '#0A0B0F' : 'var(--text-secondary)' }}>
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {[{ id: 'leaderboard', label: 'Leaderboard' }, { id: 'members', label: 'Members' }, { id: 'invite', label: 'Invite' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: tab === t.id ? '2px solid var(--green)' : '2px solid transparent', fontFamily: 'Satoshi, sans-serif' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16, textAlign: 'center' }}>
            Ranked by annualized XIRR · All time
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            {[memberStats[1], memberStats[0], memberStats[2]].filter(Boolean).map((ms, i) => {
              const rank = i === 1 ? 1 : i === 0 ? 2 : 3
              const heights = [100, 130, 84]
              const isFirst = rank === 1
              return (
                <Link key={ms.user.id} href={`/portfolio/${ms.user.id}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{MEDALS[rank - 1]}</div>
                  <Avatar name={ms.user.name} userId={ms.user.id} size={isFirst ? 'lg' : 'md'} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6, textAlign: 'center' }}>{ms.user.name.split(' ')[0]}</div>
                  <div style={{ fontSize: isFirst ? 18 : 15, fontWeight: 800, color: ms.xirr >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>{formatPercent(ms.xirr)}</div>
                  <div style={{ width: '100%', background: isFirst ? 'var(--gold-dim)' : 'var(--bg-elevated)', border: `1px solid ${isFirst ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '8px 8px 0 0', height: heights[i], marginTop: 8 }} />
                </Link>
              )
            })}
          </div>

          {memberStats.slice(3).map((ms, i) => (
            <Link key={ms.user.id} href={`/portfolio/${ms.user.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 28, textAlign: 'center', fontSize: 15, fontWeight: 700, color: 'var(--text-tertiary)' }}>{i + 4}</div>
              <Avatar name={ms.user.name} userId={ms.user.id} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{ms.user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatCurrency(ms.current_value, true)}</div>
              </div>
              <PnlBadge value={ms.xirr} type="percent" />
            </Link>
          ))}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div style={{ padding: '16px 20px 0' }}>
          {memberStats.map((ms) => (
            <Link key={ms.user.id} href={`/portfolio/${ms.user.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <Avatar name={ms.user.name} userId={ms.user.id} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{ms.user.name}</span>
                  {ms.user.id === user?.id && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(you)</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ms.holdings.length} stocks · {formatCurrency(ms.current_value, true)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: ms.xirr >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPercent(ms.xirr)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>XIRR</div>
              </div>
            </Link>
          ))}

          {/* My controls */}
          <div style={{ marginTop: 20, background: 'var(--bg-surface)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Show my portfolio to this group</span>
              <input type="checkbox" checked={myMembership?.is_visible ?? true} onChange={(e) => currentGroupId && setGroupVisibility(currentGroupId, e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--green)' }} />
            </label>
          </div>
          <button onClick={() => currentGroupId && leaveGroup(currentGroupId)} style={{ width: '100%', marginTop: 12, background: 'none', border: '1px solid var(--red-dim)', color: 'var(--red)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Satoshi, sans-serif' }}>
            Leave group
          </button>
        </div>
      )}

      {/* Invite */}
      {tab === 'invite' && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Secure invite link</div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: 12, border: '1px solid var(--border)' }}>
              {inviteLink || 'Generating…'}
            </div>
            <button className="btn-primary" onClick={() => copy(inviteLink)} disabled={!inviteLink}>{copied ? 'Copied!' : 'Copy Invite Link'}</button>
          </div>

          <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Or share the code</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <code style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--gold)', wordBreak: 'break-all', border: '1px solid var(--border)' }}>{currentGroup.invite_code}</code>
              <button className="btn-secondary" style={{ width: 'auto', padding: '12px 16px' }} onClick={() => copy(currentGroup.invite_code)}>Copy</button>
            </div>
          </div>

          <button
            onClick={() => { if (navigator.share && inviteLink) navigator.share({ title: 'Join me on STOKED', text: `Join our investing circle "${currentGroup.name}" on STOKED`, url: inviteLink }) }}
            className="btn-secondary"
          >
            Share via WhatsApp / Other
          </button>

          {/* Create / join another */}
          <div style={{ marginTop: 24 }}>
            <button onClick={() => setAddMode((v) => !v)} style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Satoshi, sans-serif' }}>
              {addMode ? '− Hide' : '+ Create or join another group'}
            </button>
            {addMode && <div style={{ marginTop: 16 }}><GroupCreateJoin compact /></div>}
          </div>
        </div>
      )}
    </div>
  )
}
