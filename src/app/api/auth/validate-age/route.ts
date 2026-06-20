import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function POST(req: NextRequest) {
  const { birth_date } = await req.json() as { birth_date?: string };

  if (!birth_date || Number.isNaN(new Date(birth_date).getTime())) {
    return NextResponse.json({ error: '生年月日が不正です' }, { status: 400 });
  }

  if (calcAge(birth_date) < 18) {
    return NextResponse.json({ error: '18歳未満の方はご利用いただけません' }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}
