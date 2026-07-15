import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const AVATAR_COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706']

function colorFromId(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
}

function toScheduleStatus(dbStatus: string, zoomSent: boolean): 'scheduling' | 'confirmed' | 'zoom_sent' {
  if (zoomSent || dbStatus === 'zoom_completed') return 'zoom_sent'
  if (dbStatus === 'completed') return 'confirmed'
  return 'scheduling'
}

export async function GET() {
  const supabase = await createClient()

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  // 管理者チェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const admin = createAdminClient()

  // ① matchings取得（pending除外）
  const { data: matchings, error } = await admin
    .from('matchings')
    .select('id, applicant_id, partner_id, status, zoom_sent, scheduled_at, amount, payment_intent_id, refunded, partner_amount, partner_payment_intent_id, partner_refunded')
    .in('status', ['scheduling', 'completed', 'zoom_completed'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('schedules fetch error:', error)
    return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 })
  }

  if (!matchings || matchings.length === 0) {
    return NextResponse.json([])
  }

  // ② profiles.id (= auth.uid()) のリスト収集
  const profileIds = [...new Set([
    ...matchings.map((m) => m.applicant_id),
    ...matchings.map((m) => m.partner_id),
  ])]

  // ③ profilesを個別取得
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, nickname')
    .in('id', profileIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // ③-2 auth.usersからemail取得
  const emailResults = await Promise.all(
    profileIds.map((id) => admin.auth.admin.getUserById(id))
  )
  const emailMap = new Map(
    profileIds.map((id, i) => [id, emailResults[i].data.user?.email ?? ''])
  )

  // ④ マッピング
  const result = matchings.map((m) => {
    const applicant = profileMap.get(m.applicant_id)
    const partner   = profileMap.get(m.partner_id)
    const applicantNickname = applicant?.nickname ?? '不明'
    const partnerNickname   = partner?.nickname   ?? '不明'

    return {
      id: m.id,
      applicant: {
        nickname:    applicantNickname,
        avatarColor: colorFromId(m.applicant_id),
        initials:    applicantNickname.charAt(0),
        email:       emailMap.get(m.applicant_id) ?? '',
      },
      target: {
        nickname:    partnerNickname,
        avatarColor: colorFromId(m.partner_id),
        initials:    partnerNickname.charAt(0),
        email:       emailMap.get(m.partner_id) ?? '',
      },
      scheduledAt:     m.scheduled_at
        ? new Date(m.scheduled_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        : null,
      status:          toScheduleStatus(m.status, m.zoom_sent ?? false),
      zoomSent:        m.zoom_sent ?? false,
      refunded:        m.refunded  ?? false,
      paymentIntentId: m.payment_intent_id ?? null,
      amount:          m.amount ?? null,
      partnerRefunded:        m.partner_refunded ?? false,
      partnerPaymentIntentId: m.partner_payment_intent_id ?? null,
      partnerAmount:          m.partner_amount ?? null,
      applicantUserId: m.applicant_id,
      partnerUserId:   m.partner_id,
    }
  })

  return NextResponse.json(result)
}
