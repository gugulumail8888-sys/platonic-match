import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    if (!(file instanceof File) || (side !== 'front' && side !== 'back')) {
      return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
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

    const { error: updateError } = await admin
      .from('profiles')
      .update({ [column]: path })
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
