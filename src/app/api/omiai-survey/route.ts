import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const IMPRESSION_VALUES = ['good', 'normal', 'bad'] as const;
const MEET_AGAIN_VALUES = ['yes', 'no', 'considering'] as const;

function isRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

    const body = await req.json() as {
      matchingId?: string;
      omiaiSatisfaction?: number;
      partnerImpression?: string;
      wantToMeetAgain?: string;
      serviceSatisfaction?: number;
      comment?: string;
    };

    const { matchingId, omiaiSatisfaction, partnerImpression, wantToMeetAgain, serviceSatisfaction, comment } = body;

    if (!isRating(omiaiSatisfaction) || !isRating(serviceSatisfaction)) {
      return NextResponse.json({ error: '満足度は1〜5の整数で指定してください' }, { status: 400 });
    }
    if (!isOneOf(partnerImpression, IMPRESSION_VALUES)) {
      return NextResponse.json({ error: '相手への印象の値が不正です' }, { status: 400 });
    }
    if (!isOneOf(wantToMeetAgain, MEET_AGAIN_VALUES)) {
      return NextResponse.json({ error: '再度のお見合い希望の値が不正です' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('omiai_surveys').insert({
      matching_id: matchingId ?? null,
      user_id: user.id,
      omiai_satisfaction: omiaiSatisfaction,
      partner_impression: partnerImpression,
      want_to_meet_again: wantToMeetAgain,
      service_satisfaction: serviceSatisfaction,
      comment: comment || null,
    });

    if (error) {
      console.error('Omiai survey insert error:', error);
      return NextResponse.json({ error: 'アンケートの保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Omiai survey error:', error);
    return NextResponse.json({ error: 'アンケートの送信に失敗しました' }, { status: 500 });
  }
}
