import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const AVATAR_COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706']

function colorFromId(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: matchings, error } = await admin
    .from('matchings')
    .select('id, applicant_id, partner_id, created_at, amount, payment_intent_id, refunded, partner_amount, partner_payment_intent_id, partner_refunded, cancel_reason, cancel_detail, cancel_reported_by, second_cancel_reason, second_cancel_detail, second_cancel_reported_by')
    .eq('status', 'cancelled')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('cancellations fetch error:', error)
    return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 })
  }

  if (!matchings || matchings.length === 0) {
    return NextResponse.json([])
  }

  const profileIds = [...new Set([
    ...matchings.map((m) => m.applicant_id),
    ...matchings.map((m) => m.partner_id),
  ])]

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, nickname')
    .in('id', profileIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const emailResults = await Promise.all(
    profileIds.map((id) => admin.auth.admin.getUserById(id))
  )
  const emailMap = new Map(
    profileIds.map((id, i) => [id, emailResults[i].data.user?.email ?? ''])
  )

  const result = matchings.map((m) => {
    const applicant = profileMap.get(m.applicant_id)
    const partner   = profileMap.get(m.partner_id)
    const applicantNickname = applicant?.nickname ?? '不明'
    const partnerNickname   = partner?.nickname   ?? '不明'

    const reportedBy = m.cancel_reported_by === m.applicant_id
      ? 'applicant'
      : m.cancel_reported_by === m.partner_id
        ? 'partner'
        : null

    const secondReport = m.second_cancel_reported_by ? {
      reportedBy: m.second_cancel_reported_by === m.applicant_id
        ? 'applicant'
        : m.second_cancel_reported_by === m.partner_id
          ? 'partner'
          : null,
      reason: m.second_cancel_reason ?? null,
      detail: m.second_cancel_detail ?? null,
    } : null

    return {
      id: m.id,
      createdAt: m.created_at,
      secondReport,
      applicant: {
        id:          m.applicant_id,
        nickname:    applicantNickname,
        avatarColor: colorFromId(m.applicant_id),
        initials:    applicantNickname.charAt(0),
        email:       emailMap.get(m.applicant_id) ?? '',
        amount:          m.amount,
        paymentIntentId: m.payment_intent_id ?? null,
        refunded:        m.refunded ?? false,
      },
      partner: {
        id:          m.partner_id,
        nickname:    partnerNickname,
        avatarColor: colorFromId(m.partner_id),
        initials:    partnerNickname.charAt(0),
        email:       emailMap.get(m.partner_id) ?? '',
        amount:          m.partner_amount,
        paymentIntentId: m.partner_payment_intent_id ?? null,
        refunded:        m.partner_refunded ?? false,
      },
      cancelReason: m.cancel_reason ?? null,
      cancelDetail: m.cancel_detail ?? null,
      reportedBy,
    }
  })

  return NextResponse.json(result)
}
