import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const side = formData.get('side');
    const resubmit = formData.get('resubmit') === 'true';

    if (!(file instanceof File) || (side !== 'front' && side !== 'back')) {
      return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '対応していないファイル形式です(JPEG・PNG・HEIC・WebP・PDFのいずれかを指定してください)' }, { status: 400 });
    }

    const ext = MIME_TO_EXT[file.type] ?? 'bin';
    const path = `${user.id}/${side}_${Date.now()}.${ext}`;

    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error('document upload error:', uploadError);
      return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
    }

    const column = side === 'front' ? 'id_document_url' : 'id_document_back_url';

    const updatePayload: Record<string, unknown> = { [column]: path };
    if (resubmit) {
      updatePayload.resubmitted_at = new Date().toISOString();
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (updateError) {
      console.error('document profile update error:', updateError);
      return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ path });
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json({ error: 'アップロード処理に失敗しました' }, { status: 500 });
  }
}
