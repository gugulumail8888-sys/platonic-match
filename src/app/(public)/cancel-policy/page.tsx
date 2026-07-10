'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, CheckCircle, ChevronDown, ChevronUp, XCircle, RefreshCw, Calendar, CreditCard } from 'lucide-react';

const POLICIES = [
  {
    icon: CreditCard,
    color: 'text-teal-400',
    bg: 'bg-teal-950/30 border-teal-900/50',
    title: 'お見合い料の入金について',
    timing: 'お見合い3日前〜前々日までに入金必須',
    penalty: '前日17時までに未入金の場合は自動キャンセル',
    detail: 'お見合い料（無料プラン3,500円・AIおすすめプラン3,000円）はお見合いの3日前にご案内メールをお送りします。前々日までに入金リマインドをお送りします。前日17時までにご入金が確認できない場合、お見合いは自動的にキャンセルとなります。入金完了後は原則キャンセル不可となりますのでご注意ください。',
  },
  {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-950/30 border-red-900/50',
    title: '当日キャンセル・ドタキャン',
    timing: 'お見合い当日のキャンセル・無断キャンセル',
    penalty: 'キャンセルした本人のみ違約金・相手側は全額返金',
    detail: 'お見合い当日にキャンセルされた場合、キャンセルした本人のみ違約金が発生します。相手側（キャンセルされた方）には費用は一切かかりません。入金済みの相手側には全額返金いたします。違約金はStripe決済にてお支払いいただきます。事前連絡なしのキャンセルは「ドタキャン」として扱われ、アカウント停止となる場合があります。',
  },
  {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-950/30 border-amber-900/50',
    title: '遅刻について',
    timing: '15分以上の遅刻でGoogle Meet強制終了',
    penalty: '遅刻した側に違約金・待った側は全額返金',
    detail: '15分以上の遅刻が発生した場合、Google Meetお見合いは強制終了となります。【片方が遅刻の場合】遅刻した側のみ違約金が発生し、待っていた側には全額返金いたします。【両者が遅刻の場合】両者ともに違約金が発生し、返金はありません。',
  },
  {
    icon: RefreshCw,
    color: 'text-blue-400',
    bg: 'bg-blue-950/30 border-blue-900/50',
    title: '延期（日程変更）',
    timing: '予定日の前日17時までにご連絡いただいた場合（原則1回まで）',
    penalty: '違約金なし（原則1回まで）',
    detail: 'キャンセルではなく延期をご希望の場合、マイページの「延期を申請する」ボタンからお手続きいただけます。お見合い予定日の前日17時までにお申し出いただく必要があります。前日17時を過ぎるとボタンは押せなくなり、通常のキャンセルポリシーが適用されます。延期は原則1回までとさせていただきます。',
  },
  {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-950/30 border-orange-900/50',
    title: '急病・不可抗力について',
    timing: '天災・大規模停電・広域通信障害・急病など',
    penalty: '状況により全額返金または管理者判断で対応',
    detail: '【天災・大規模停電・広域通信障害】Google Meetへの接続が不可能な事象が発生した場合は全額返金いたします。【急病の場合】診断書をご提出いただいた場合、管理者判断で返金対応いたします。診断書がない場合はキャンセル扱いとなります。いずれの場合も必ずお問い合わせページからご連絡ください。',
  },
];

export default function CancelPolicyPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-900 border border-red-800 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">キャンセルポリシー</h1>
          <p className="text-xs text-zinc-400">Google Meetお見合いのキャンセル・返金に関するルール</p>
        </div>
      </div>

      {/* 重要バナー */}
      <div className="flex items-start gap-3 bg-amber-950/50 border border-amber-800 rounded-2xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 font-medium text-sm mb-1">必ずご確認ください</p>
          <p className="text-amber-200/70 text-xs leading-relaxed">
            入金完了後は原則キャンセル不可となります。日程が確定した時点でキャンセルポリシーが適用されます。やむを得ない場合は必ずお問い合わせページからご連絡ください。
          </p>
        </div>
      </div>

      {/* 違約金の対象者 */}
      <div className="flex items-start gap-3 bg-teal-950/30 border border-teal-800/60 rounded-2xl p-4">
        <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-teal-300 font-medium text-sm mb-1">違約金はキャンセルした側のみ</p>
          <p className="text-teal-200/70 text-xs leading-relaxed">
            違約金はキャンセルした本人にのみ発生します。相手側には費用は一切かかりません。キャンセル料は申請料と同額（無料プラン¥3,500・AIおすすめプラン¥3,000）となります。なお、キャンセルが多い場合には退会をお願いする場合があります。
          </p>
        </div>
      </div>

      {/* 返金処理期間 */}
      <div className="flex items-start gap-3 bg-blue-950/30 border border-blue-800/60 rounded-2xl p-4">
        <RefreshCw className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 font-medium text-sm mb-1">返金についてのお知らせ</p>
          <p className="text-blue-200/70 text-xs leading-relaxed">
            返金が発生する場合、キャンセル確定から5営業日以内にStripe決済にて返金処理いたします。
          </p>
        </div>
      </div>

      {/* ポリシー一覧 */}
      <div className="space-y-4">
        {POLICIES.map((policy, i) => {
          const Icon = policy.icon;
          const isOpen = expanded === i;
          return (
            <div key={i} className={`border rounded-2xl overflow-hidden ${policy.bg}`}>
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-start gap-3 p-4 text-left"
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${policy.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm leading-snug mb-0.5">{policy.title}</p>
                  <p className="text-zinc-400 text-xs mb-1">{policy.timing}</p>
                  <span className={`text-xs font-medium ${policy.color}`}>{policy.penalty}</span>
                </div>
                <div className="flex-shrink-0 mt-0.5">
                  {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <div className="border-t border-zinc-700/50 pt-4">
                    <p className="text-zinc-300 text-xs leading-relaxed">{policy.detail}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 通知スケジュール */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-400" />
          お見合い前の通知スケジュール
        </h2>
        <div className="space-y-3">
          {[
            { timing: '3日前', content: 'お見合い料（無料プラン3,500円・AIおすすめプラン3,000円）入金案内メール送信', color: 'bg-teal-500' },
            { timing: '前々日', content: '入金リマインドメール送信', color: 'bg-amber-500' },
            { timing: '前日17時', content: '未入金の場合、お見合いを自動キャンセル・相手側へ通知', color: 'bg-red-500' },
            { timing: '前日', content: '入金確認済みの方へ準備完了確認リマインダー送信', color: 'bg-blue-500' },
            { timing: '当日2時間前', content: 'Google Meetお見合いリマインダー・注意事項の再確認', color: 'bg-purple-500' },
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-white font-bold mb-2 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400" />
          キャンセル・ドタキャンの報告
        </h2>
        <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
          お見合いがキャンセルされた場合や、相手からドタキャンされた場合はこちらからご報告ください。運営が確認し、適切に対応いたします。
        </p>
        <button
          onClick={() => router.push('/cancel-report')}
          className="w-full py-3 border border-red-800 text-red-400 rounded-xl text-sm font-medium hover:bg-red-900/30 transition-all"
        >
          ドタキャン・キャンセルを報告する
        </button>
      </div>

      {/* お問い合わせ */}
      <p className="text-center text-zinc-500 text-xs">
        ご不明な点は
        <button onClick={() => router.push('/contact')} className="text-teal-500 hover:underline mx-1">
          お問い合わせページ
        </button>
        からご連絡ください
      </p>
    </div>
  );
}
