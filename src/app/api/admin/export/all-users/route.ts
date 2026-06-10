import { NextResponse } from 'next/server';
import {
  requireAdminUser, buildUsersCsv, csvFilename, EXPORT_PROFILE_COLUMNS,
} from '@/lib/admin-export';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await requireAdminUser();
  if ('error' in result) return result.error;
  const { admin } = result;

  const { data: profiles, error } = await admin
    .from('profiles')
    .select(EXPORT_PROFILE_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = await buildUsersCsv(admin, profiles ?? []);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${csvFilename('all_users')}"`,
    },
  });
}
