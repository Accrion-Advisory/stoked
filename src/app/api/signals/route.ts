import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWebPush } from '@/lib/webpush'
import { formatCurrency } from '@/lib/utils'

// web-push relies on Node crypto — force the Node.js runtime (not edge).
export const runtime = 'nodejs'

// POST /api/signals — create a standardized group signal and push it to members.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const group_id = String(body.group_id ?? '')
  const symbol = String(body.symbol ?? '').toUpperCase().trim()
  const exchange = body.exchange === 'BSE' ? 'BSE' : 'NSE'
  const action = body.action === 'SELL' ? 'SELL' : body.action === 'BUY' ? 'BUY' : null
  const price = Number(body.price)
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 140) : ''

  if (!group_id || !symbol || !action || !(price > 0)) {
    return NextResponse.json({ error: 'Invalid signal' }, { status: 400 })
  }

  // Insert as the author — RLS enforces author = self AND group membership.
  const { data: signal, error } = await supabase
    .from('signals')
    .insert({ group_id, author_id: user.id, symbol, exchange, action, price, note: note || null })
    .select('*, author:profiles(*)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 403 })

  // Fan out Web Push (best-effort; never fails the request).
  try {
    const admin = createAdminClient()
    const { data: members } = await admin.from('memberships').select('user_id').eq('group_id', group_id)
    const memberIds = (members ?? []).map((m) => m.user_id).filter((id) => id !== user.id)

    if (memberIds.length) {
      const { data: mutes } = await admin
        .from('signal_mutes')
        .select('user_id')
        .eq('group_id', group_id)
        .in('user_id', memberIds)
      const muted = new Set((mutes ?? []).map((m) => m.user_id))
      const targets = memberIds.filter((id) => !muted.has(id))

      if (targets.length) {
        const { data: subs } = await admin.from('push_subscriptions').select('*').in('user_id', targets)
        const { data: group } = await admin.from('groups').select('name').eq('id', group_id).single()
        const webpush = getWebPush()
        const authorName = signal.author?.name ?? 'Someone'
        const payload = JSON.stringify({
          title: `${action} ${symbol} · ${group?.name ?? 'Group'}`,
          body: `${authorName}: ${action} at ${formatCurrency(price)}${note ? ` — ${note}` : ''}`,
          url: `/group?g=${group_id}&tab=signals`,
          tag: `signal-${signal.id}`,
        })

        await Promise.allSettled(
          (subs ?? []).map(async (s) => {
            try {
              await webpush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                payload
              )
            } catch (e: unknown) {
              const code = (e as { statusCode?: number })?.statusCode
              if (code === 404 || code === 410) {
                await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
              }
            }
          })
        )
      }
    }
  } catch (e) {
    console.error('signal push fan-out failed', e)
  }

  return NextResponse.json({ signal })
}
