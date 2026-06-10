import { NextRequest, NextResponse } from 'next/server';
import {
  requireAdminUser, buildUsersCsv, csvFilename, searchExportProfiles,
  fullName, formatDate, STATUS_LABELS,
  type SearchExportParams,
} from '@/lib/admin-export';

export const dynamic = 'force-dynamic';

interface SearchRequestBody extends SearchExportParams {
  format?: 'preview' | 'csv';
}

export async function POST(req: NextRequest) {
  const result = await requireAdminUser();
  if ('error' in result) return result.error;
  const { admin } = result;

  const body = await req.json().catch(() => ({})) as SearchRequestBody;

  let searchResult;
  try {
    searchResult = await searchExportProfiles(admin, {
      name: body.name,
      email: body.email,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      dateField: body.dateField,
      target: body.target,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '検索に失敗しました' }, { status: 500 });
  }

  const { profiles, emailMap } = searchResult;

  if (body.format === 'csv') {
    const csv = await buildUsersCsv(admin, profiles);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${csvFilename('search_users')}"`,
      },
    });
  }

  return NextResponse.json({
    count: profiles.length,
    results: profiles.map((p) => ({
      id: p.id,
      name: fullName(p),
      email: emailMap.get(p.id) ?? '',
      status: p.status,
      statusLabel: STATUS_LABELS[p.status] ?? p.status,
      createdAt: formatDate(p.created_at),
    })),
  });
}
