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

    // 両者がアンケート回答済みかチェックし、両者ともyesならsuccess_couplesに登録
    if (matchingId) {
      const { data: surveys } = await admin
        .from('omiai_surveys')
        .select('user_id, want_to_meet_again')
        .eq('matching_id', matchingId);

      if (surveys && surveys.length === 2) {
        const bothYes = surveys.every((s) => s.want_to_meet_again === 'yes');

        if (bothYes) {
          const { data: matching } = await admin
            .from('matchings')
            .select('applicant_id, partner_id')
            .eq('id', matchingId)
            .maybeSingle();

          if (matching) {
            const userAId = matching.applicant_id as string;
            const userBId = matching.partner_id as string;

            const { data: profiles } = await admin
              .from('profiles')
              .select('id, prefecture, smoking, alcohol, marriage_intention, hobbies, birth_date, children_desire, external_partner, finance_management, marriage_timing, living_arrangement')
              .in('id', [userAId, userBId]);

            const profA = profiles?.find((p) => p.id === userAId);
            const profB = profiles?.find((p) => p.id === userBId);

            const calcAgeDiff = (a: string | null, b: string | null): number | null => {
              if (!a || !b) return null;
              return Math.abs(new Date().getFullYear() - new Date(a).getFullYear()
                - (new Date().getFullYear() - new Date(b).getFullYear()));
            };

            const calcHobbiesSimilarity = (a: string[] | null, b: string[] | null): number => {
              if (!a?.length || !b?.length) return 0;
              const setA = new Set(a);
              const common = b.filter((h) => setA.has(h)).length;
              return Math.round((common / Math.max(a.length, b.length)) * 100);
            };

            await admin.from('success_couples').insert({
              matching_id: matchingId,
              user_a_id: userAId,
              user_b_id: userBId,
              age_difference: calcAgeDiff(profA?.birth_date ?? null, profB?.birth_date ?? null),
              same_prefecture: profA && profB ? profA.prefecture === profB.prefecture : null,
              marriage_timing_match: profA && profB ? profA.marriage_intention === profB.marriage_intention : null,
              children_desire_match: profA && profB && profA.children_desire && profB.children_desire
                ? profA.children_desire === profB.children_desire : null,
              external_partner_match: profA && profB && profA.external_partner && profB.external_partner
                ? profA.external_partner === profB.external_partner : null,
              post_marriage_living_match: profA && profB && profA.living_arrangement && profB.living_arrangement
                ? profA.living_arrangement === profB.living_arrangement : null,
              finance_management_match: profA && profB && profA.finance_management && profB.finance_management
                ? profA.finance_management === profB.finance_management : null,
              smoking_match: profA && profB ? profA.smoking === profB.smoking : null,
              alcohol_match: profA && profB ? profA.alcohol === profB.alcohol : null,
              hobbies_similarity: calcHobbiesSimilarity(profA?.hobbies ?? null, profB?.hobbies ?? null),
            });
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Omiai survey error:', error);
    return NextResponse.json({ error: 'アンケートの送信に失敗しました' }, { status: 500 });
  }
}
