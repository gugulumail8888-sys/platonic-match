import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

    const matchingId = req.nextUrl.searchParams.get('matchingId');
    if (!matchingId) return NextResponse.json({ error: 'matchingIdが必要です' }, { status: 400 });

    // RLSにより自分が関係するmatchingのslotのみ取得される
    const { data: slots, error } = await supabase
      .from('schedule_slots')
      .select('id, matching_id, proposed_at, proposed_by, is_selected, created_at')
      .eq('matching_id', matchingId)
      .order('proposed_at', { ascending: true });

    if (error) {
      console.error('schedule_slots fetch error:', error);
      return NextResponse.json({ error: '候補日程の取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(slots ?? []);
  } catch (error) {
    console.error('Schedule slots route error:', error);
    return NextResponse.json({ error: '候補日程の取得に失敗しました' }, { status: 500 });
  }
}
