'use client'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/lib/context'
import { buildMemberPortfolio } from '@/lib/portfolio'
import { formatCurrency, formatPercent } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import EmptyGroup from '@/components/group/EmptyGroup'
import InviteSheet from '@/components/group/InviteSheet'
import PageHeader from '@/components/layout/PageHeader'
import SignalsPanel from '@/components/signals/SignalsPanel'
import { usePullToRefresh, PullIndicator } from '@/components/ui/PullToRefresh'
import Link from 'next/link'

const MEDALS = ['🥇', '🥈', '🥉']

export default function GroupPage() {
  return (
    <Suspense fallback={null}>
      <GroupInner />
    </Suspense>
  )
}

function GroupInner() {
  const {
    user, currentGroup, currentGroupId, setCurrentGroupId,
    memberships, profilesById, trades, prices, leaveGroup, setGroupVisibility, refresh,
  } = useApp()
  const router = useRouter()
  const params = useSearchParams()
  const [tab, setTab] = useState<'leaderboard' | 'signals' | 'members'>('leaderboard')
  const [inviteOpen, setInviteOpen] = useState(false)

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), new Promise((r) => setTimeout(r, 700))])
  }, [refresh])
  const { pull, refreshing, dragging } = usePullToRefresh(handleRefresh)

  // Deep-link support: /group?g=<id>&tab=signals (from push notifications).
  useEffect(() => {
    const g = params.get('g')
    if (g) setCurrentGroupId(g)
    if (params.get('tab') === 'signals') setTab('signals')
  }, [params, setCurrentGroupId])

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

  return (
    <div className="mb-nav">
      <PageHeader
        onBack={() => router.push('/connect')}
        title={currentGroup.name}
        subtitle={`${groupMembers.length} members · ${formatCurrency(groupValue, true)} tracked`}
        right={(
          <div style={{ background: groupXirr >= 0 ? 'var(--green-dim)' : 'var(--red-dim)', color: groupXirr >= 0 ? 'var(--green)' : 'var(--red)', padding: '6px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            XIRR {formatPercent(groupXirr)}
          </div>
        )}
        below={(
          <div style={{ display: 'flex' }}>
            {[{ id: 'leaderboard', label: 'Ranks' }, { id: 'signals', label: 'Signals' }, { id: 'members', label: 'Members' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                style={{ flex: 1, padding: '9px 0 4px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: tab === t.id ? '2px solid var(--green)' : '2px solid transparent', fontFamily: 'Satoshi, sans-serif' }}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      />

      <PullIndicator pull={pull} refreshing={refreshing} dragging={dragging} />

      {/* Signals */}
      {tab === 'signals' && <SignalsPanel groupId={currentGroup.id} />}

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
          <button onClick={() => setInviteOpen(true)} className="btn-primary" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
            Invite members
          </button>
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

      {inviteOpen && <InviteSheet group={currentGroup} onClose={() => setInviteOpen(false)} />}
    </div>
  )
}
