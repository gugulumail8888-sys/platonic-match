'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, Calendar, RefreshCw, XCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const POLICIES = [
  {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-950/30 border-red-900/50',
    title: '当日キャンセル',
    timing: 'お見合い当日のキャンセル',
    penalty: 'キャンセルした本人のみ違約金が発生（相手側は無料）',
    detail: 'お見合い当日にキャンセルされた場合、キャンセルした本人のみ違約金が発生します。相手側（キャンセルされた方）には費用は一切かかりません。違約金はStripe決済にてお支払いいただきます。',
  },
  {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-950/30 border-amber-900/50',
    title: '前日キャンセル',
    timing: 'お見合い前日までのキャンセル連絡',
    penalty: 'キャンセルした本人のみ当日違約金の半額（相手側は無料）',
    detail: '前日までにキャンセルのご連絡をいただいた場合、キャンセルした本人のみ当日キャンセル違約金の半額が発生します。相手側には費用は一切かかりません。必ずサイト内またはお問い合わせからご連絡ください。',
  },
  {
    icon: RefreshCw,
    color: 'text-blue-400',
    bg: 'bg-blue-950/30 border-blue-900/50',
    title: '延期（即日程調整）',
    timing: 'キャンセルではなく日程変更を希望する場合',
    penalty: '違約金なし',
    detail: 'キャンセルではなく延期をご希望の場合、すぐに新しい日程を調整していただければ違約金は発生しません。延期は原則1回までとさせていただきます。',
  },
  {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-950/50 border-red-800',
    title: 'ドタキャン（無断キャンセル）',
    timing: '連絡なしのキャンセル・直前キャンセル',
    penalty: 'キャンセルした本人のみ違約金＋アカウント停止の可能性',
    detail: '事前連絡なしのキャンセルは「ドタキャン」として扱われます。キャンセルした本人のみ違約金が発生し、理由によってはアカウントを停止いたします。相手側（キャンセルされた方）には費用は一切かかりません。やむを得ない事情がある場合は必ずご連絡ください。',
  },
];

export default function CancelPolicyPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-900 border border-red-800 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">キャンセルポリシー</h1>
          <p className="text-xs text-zinc-400">ZOOMお見合いのキャンセル・変更に関するルール</p>
        </div>
      </div>

      {/* 重要バナー */}
      <div className="flex items-start gap-3 bg-amber-950/50 border border-amber-800 rounded-2xl p-4 mb-8">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 font-medium text-sm mb-1">必ずご確認ください</p>
          <p className="text-amber-400/80 text-xs leading-relaxed">
            日程が確定した時点でキャンセルポリシーが適用されます。
            やむを得ない場合は必ず事前にご連絡ください。
          </p>
        </div>
      </div>

      {/* 違約金の対象者 */}
      <div className="flex items-start gap-3 bg-teal-950/40 border border-teal-800/60 rounded-2xl p-4 mb-6">
        <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-teal-300 font-medium text-sm mb-1">違約金はキャンセルした側のみ</p>
          <p className="text-teal-400/80 text-xs leading-relaxed">
            違約金はキャンセルした本人にのみ発生します。キャンセルされた相手側には費用は一切かかりません。
          </p>
        </div>
      </div>

      {/* ポリシー一覧 */}
      <div className="space-y-4 mb-8">
        {POLICIES.map((policy, i) => {
          const Icon = policy.icon;
          const isOpen = expanded === i;
          return (
            <div key={i} className={`border rounded-2xl overflow-hidden ${policy.bg}`}>
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${policy.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm leading-snug mb-0.5">{policy.title}</p>
                  <p className="text-zinc-400 text-xs mb-1">{policy.timing}</p>
                  <span className={`text-xs font-medium ${policy.color}`}>{policy.penalty}</span>
                </div>
                <div className="flex-shrink-0 ml-1">
                  {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-0">
                  <div className="border-t border-zinc-700/50 pt-4">
                    <p className="text-zinc-300 text-sm leading-relaxed">{policy.detail}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 通知スケジュール */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-400" />
          お見合い前の通知スケジュール
        </h2>
        <div className="space-y-3">
          {[
            { timing: '日程確定時', content: 'キャンセルポリシーのご案内・ZOOMリンク送付', color: 'bg-teal-500' },
            { timing: '前日', content: '準備完了確認リマインダー・当日の流れご案内', color: 'bg-blue-500' },
            { timing: '当日2時間前', content: 'ZOOMお見合いリマインダー・注意事項の再確認', color: 'bg-purple-500' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0 mt-1.5`} />
              <div>
                <p className="text-zinc-300 text-sm font-medium">{item.timing}</p>
                <p className="text-zinc-500 text-xs">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ドタキャン報告ボタン */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <h2 className="text-white font-bold mb-2 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400" />
          キャンセル・ドタキャンの報告
        </h2>
        <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
          お見合いがキャンセルされた場合や、相手からドタキャンされた場合はこちらからご報告ください。
          運営が確認し、適切に対応いたします。
        </p>
        <button
          onClick={() => router.push('/cancel-report')}
          className="w-full py-3 bg-red-950 border border-red-800 text-red-400 rounded-xl text-sm font-medium hover:bg-red-900 transition-all"
        >
          ドタキャン・キャンセルを報告する
        </button>
      </div>

      {/* お問い合わせ */}
      <p className="text-center text-xs text-zinc-600">
        ご不明な点は
        <button onClick={() => router.push('/contact')} className="text-teal-500 hover:underline mx-1">
          お問い合わせページ
        </button>
        からご連絡ください
      </p>
    </div>
  );
}
