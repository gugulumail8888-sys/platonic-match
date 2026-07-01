import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userIdが必要です' }, { status: 400 });
    }

    const admin = await createAdminClient();

    // DBから書類パスを取得
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id_document_url, id_document_back_url')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.id_document_url) {
      return NextResponse.json({ error: '書類が見つかりません' }, { status: 404 });
    }

    // 署名付きURLを生成（1時間有効）
    const paths = [profile.id_document_url];
    if (profile.id_document_back_url) paths.push(profile.id_document_back_url);

    const { data: signedData, error: signedError } = await admin.storage
      .from('documents')
      .createSignedUrls(paths, 3600);

    if (signedError || !signedData) {
      return NextResponse.json({ error: '署名付きURL生成に失敗しました' }, { status: 500 });
    }

    // 画像をbase64化
    const toBase64 = async (url: string) => {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') ?? 'image/jpeg';
      return {
        data: Buffer.from(buf).toString('base64'),
        mediaType: contentType as 'image/jpeg' | 'image/png' | 'image/webp',
      };
    };

    const imageContent: Anthropic.ImageBlockParam[] = [];
    for (const signed of signedData) {
      if (signed.signedUrl) {
        const img = await toBase64(signed.signedUrl);
        imageContent.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.data },
        });
      }
    }

    if (imageContent.length === 0) {
      return NextResponse.json({ error: '画像の取得に失敗しました' }, { status: 500 });
    }

    // Claude Haiku 4.5で年齢判定
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: `これは本人確認書類の画像です。画像に記載されている生年月日から、この人物が18歳以上かどうか判定してください。
判定結果のみを以下のJSON形式で返してください（他のテキストは不要）：
{"result": "ok", "reason": "判定できた理由"}
または
{"result": "ng", "reason": "判定できなかった理由または18歳未満の理由"}
18歳以上であれば result は ok、18歳未満または生年月日が読み取れない場合は ng としてください。`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    let parsed: { result: 'ok' | 'ng'; reason: string };
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return NextResponse.json({ error: 'AI応答のパースに失敗', raw: text }, { status: 500 });
    }

    // AI判定OKの場合はステータスをapprovedに更新
    if (parsed.result === 'ok') {
      await admin.from('profiles').update({
        status: 'approved',
        ai_verified_at: new Date().toISOString(),
      }).eq('id', userId);
    }

    return NextResponse.json({ result: parsed.result, reason: parsed.reason });
  } catch (e) {
    console.error('verify-age error:', e);
    return NextResponse.json({ error: '内部エラー' }, { status: 500 });
  }
}
