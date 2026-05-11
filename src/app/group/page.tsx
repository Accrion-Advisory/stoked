'use client'
import { useState } from 'react'
import { useApp } from '@/lib/context'
import { DEV_USERS } from '@/lib/dev-data'
import { calculateHoldings } from '@/lib/xirr'
import { formatCurrency } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import PnlBadge from '@/components/ui/PnlBadge'
import Link from 'next/link'

const XIRR_MAP: Record<string, number> = {
  'dev-user-1': 28.45,
  'dev-user-2': 23.17,
  'dev-user-3': 5.60,
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function GroupPage() {
  const { user, group, trades, memberships } = useApp()
  const [tab, setTab] = useState<'leaderboard' | 'members' | 'invite'>('leaderboard')

  const memberStats = DEV_USERS.map((u) => {
    const userTrades = trades.filter((t) => t.user_id === u.id)
    const holdings = calculateHoldings(userTrades)
    const totalInvested = holdings.reduce((s, h) => s + h.total_invested, 0)
    const mult = u.id === 'dev-user-1' ? 1.28 : u.id === 'dev-user-2' ? 1.23 : 1.05
    const currentValue = totalInvested * mult
    const pnlPct = ((currentValue - totalInvested) / totalInvested) * 100
    const xirr = XIRR_MAP[u.id] ?? 10
    return { user: u, totalInvested, currentValue, pnlPct, xirr, holdings }
  }).sort((a, b) => b.xirr - a.xirr)

  const groupXirr = 18.62
  const groupValue = memberStats.reduce((s, m) => s + m.currentValue, 0)

  const inviteLink = `https://stoked.app/join/${group?.invite_code}`

  return (
    <div className="mb-nav">
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{group?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {memberStats.length} members · {formatCurrency(groupValue, true)} tracked
            </div>
          </div>
          <div style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '6px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
            XIRR +{groupXirr}%
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
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

          {/* Top 3 podium */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            {[memberStats[1], memberStats[0], memberStats[2]].filter(Boolean).map((ms, i) => {
              const rank = i === 1 ? 1 : i === 0 ? 2 : 3
              const heights = [100, 130, 84]
              const isFirst = rank === 1
              return (
                <Link key={ms.user.id} href={`/portfolio/${ms.user.id}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{MEDALS[rank - 1]}</div>
                  <Avatar name={ms.user.name} userId={ms.user.id} size={isFirst ? 'lg' : 'md'} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6, textAlign: 'center' }}>
                    {ms.user.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: isFirst ? 18 : 15, fontWeight: 800, color: 'var(--green)', marginTop: 2 }}>
                    +{ms.xirr.toFixed(2)}%
                  </div>
                  <div
                    style={{ width: '100%', background: isFirst ? 'var(--gold-dim)' : 'var(--bg-elevated)', border: `1px solid ${isFirst ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '8px 8px 0 0', height: heights[i], marginTop: 8 }}
                  />
                </Link>
              )
            })}
          </div>

          {/* Rest of leaderboard */}
          {memberStats.slice(3).map((ms, i) => (
            <Link key={ms.user.id} href={`/portfolio/${ms.user.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 28, textAlign: 'center', fontSize: 15, fontWeight: 700, color: 'var(--text-tertiary)' }}>{i + 4}</div>
              <Avatar name={ms.user.name} userId={ms.user.id} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{ms.user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatCurrency(ms.currentValue, true)}</div>
              </div>
              <PnlBadge value={ms.xirr} type="percent" />
            </Link>
          ))}

          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Group Avg XIRR: <span style={{ color: 'var(--green)', fontWeight: 700 }}>+{groupXirr}%</span></div>
          </div>
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
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {ms.holdings.length} stocks · {formatCurrency(ms.currentValue, true)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>+{ms.xirr.toFixed(2)}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>XIRR</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Invite */}
      {tab === 'invite' && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Share this link</div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: 12, border: '1px solid var(--border)' }}>
              {inviteLink}
            </div>
            <button
              className="btn-primary"
              onClick={() => { navigator.clipboard?.writeText(inviteLink) }}
            >
              Copy Invite Link
            </button>
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Join me on STOKED', text: `Join our investing circle "${group?.name}" on STOKED`, url: inviteLink })
              }
            }}
            className="btn-secondary"
          >
            Share via WhatsApp / Other
          </button>

          <div style={{ marginTop: 20, padding: '16px', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Members joined</div>
            {memberStats.map((ms) => (
              <div key={ms.user.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={ms.user.name} userId={ms.user.id} size="sm" />
                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{ms.user.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>✓ Active</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
