'use client';

import { useState } from 'react';
import { Smartphone, Wifi, Mic, Camera, Video, CheckCircle, AlertCircle, Download, FileText } from 'lucide-react';
import { RULES } from '@/lib/zoom-check-rules';

const IPHONE_STEPS = [
  {
    step: 1,
    title: 'Safariまたはブラウザを開く',
    desc: 'Google Meetアプリを事前にインストールしておくと、より安定してご利用いただけます。App Storeで「Google Meet」と検索し、インストールをおすすめします(端末によってはインストールなしでSafariから直接参加できる場合もあります)。',
    icon: '🌐',
    tip: 'iPhoneの場合はSafariの使用を推奨します',
  },
  {
    step: 2,
    title: 'amistaから届いたURLをタップ',
    desc: 'メールまたはサイト内の「Google Meetに参加」ボタンからURLを開いてください。',
    icon: '🔗',
    tip: 'URLをタップすると自動的にGoogle Meetが開きます',
  },
  {
    step: 3,
    title: 'カメラ・マイクの許可',
    desc: '初回アクセス時にカメラとマイクの使用許可を求められます。必ず「許可」を選んでください。',
    icon: '🎙️',
    tip: '許可しないとお相手に声や映像が届きません',
  },
  {
    step: 4,
    title: 'Googleアカウントでログイン（任意）',
    desc: 'Googleアカウントをお持ちの場合はログインすると名前が表示されます。Googleアカウントがなくても参加できます。',
    icon: '👤',
    tip: 'Googleアカウントにログインしない場合は名前の入力を求められます。名前はニックネームで大丈夫です',
  },
  {
    step: 5,
    title: '「今すぐ参加」をタップ',
    desc: 'カメラ・マイクの確認画面で問題なければ「今すぐ参加」をタップしてください。',
    icon: '✅',
    tip: '参加前にカメラ映りとマイクの音量を確認しましょう',
  },
  {
    step: 6,
    title: '明るい場所・静かな環境で参加',
    desc: '顔がよく見える明るい場所、周囲の音が入らない静かな環境でご参加ください。',
    icon: '💡',
    tip: 'イヤホン使用推奨。Wi-Fi環境が安定した場所が最適です',
  },
];

const ANDROID_STEPS = [
  {
    step: 1,
    title: 'ChromeまたはブラウザでURLを開く',
    desc: 'Google Meetアプリを事前にインストールしておくと、より安定してご利用いただけます。Google Playで「Google Meet」と検索し、インストールをおすすめします(端末によってはインストールなしでChromeから直接参加できる場合もあります)。',
    icon: '🌐',
    tip: 'AndroidはChromeブラウザの使用を推奨します',
  },
  {
    step: 2,
    title: 'amistaから届いたURLをタップ',
    desc: 'メールまたはサイト内の「Google Meetに参加」ボタンからURLを開いてください。',
    icon: '🔗',
    tip: 'URLをタップすると自動的にGoogle Meetが開きます',
  },
  {
    step: 3,
    title: 'カメラ・マイクの許可',
    desc: '初回アクセス時にカメラとマイクの使用許可を求められます。必ず「許可」を選んでください。',
    icon: '🎙️',
    tip: 'Androidは設定→アプリ→Chromeからも許可できます',
  },
  {
    step: 4,
    title: 'Googleアカウントでログイン（任意）',
    desc: 'Googleアカウントをお持ちの場合はログインすると名前が表示されます。Googleアカウントがなくても参加できます。',
    icon: '👤',
    tip: 'Googleアカウントにログインしない場合は名前の入力を求められます。名前はニックネームで大丈夫です',
  },
  {
    step: 5,
    title: '「今すぐ参加」をタップ',
    desc: 'カメラ・マイクの確認画面で問題なければ「今すぐ参加」をタップしてください。',
    icon: '✅',
    tip: '参加前にカメラ映りとマイクの音量を確認しましょう',
  },
  {
    step: 6,
    title: '明るい場所・静かな環境で参加',
    desc: '顔がよく見える明るい場所、周囲の音が入らない静かな環境でご参加ください。',
    icon: '💡',
    tip: 'イヤホン使用推奨。Wi-Fi環境が安定した場所が最適です',
  },
];

const WINDOWS_STEPS = [
  {
    step: 1,
    title: 'ChromeまたはEdgeを開く',
    desc: 'Google MeetはアプリなしでブラウザのみでOKです。インストール作業は一切不要です。',
    icon: '🌐',
    tip: 'ChromeまたはEdgeを推奨します。Internet Explorerは非対応です',
  },
  {
    step: 2,
    title: 'amistaから届いたURLをクリック',
    desc: 'メールまたはサイト内の「Google Meetに参加」ボタンからURLを開いてください。',
    icon: '🔗',
    tip: 'URLをクリックするとブラウザでGoogle Meetが開きます',
  },
  {
    step: 3,
    title: 'カメラ・マイクの許可',
    desc: '初回アクセス時にブラウザがカメラとマイクの使用許可を求めます。必ず「許可」を選んでください。',
    icon: '🎙️',
    tip: 'アドレスバー左のカメラアイコンからも許可設定を変更できます',
  },
  {
    step: 4,
    title: 'Googleアカウントでログイン（任意）',
    desc: 'Googleアカウントをお持ちの場合はログインすると名前が表示されます。Googleアカウントがなくても参加できます。',
    icon: '👤',
    tip: 'Googleアカウントにログインしない場合は名前の入力を求められます。名前はニックネームで大丈夫です',
  },
  {
    step: 5,
    title: '「今すぐ参加」をクリック',
    desc: 'カメラ・マイクの確認画面で問題なければ「今すぐ参加」をクリックしてください。',
    icon: '✅',
    tip: '参加前にカメラ映りとマイクの音量を確認しましょう',
  },
  {
    step: 6,
    title: '明るい場所・静かな環境で参加',
    desc: '顔がよく見える明るい場所、周囲の音が入らない静かな環境でご参加ください。',
    icon: '💡',
    tip: 'イヤホン使用推奨。Wi-Fi環境が安定した場所が最適です',
  },
];

const MAC_STEPS = [
  {
    step: 1,
    title: 'ChromeまたはSafariを開く',
    desc: 'Google MeetはアプリなしでブラウザのみでOKです。インストール作業は一切不要です。',
    icon: '🌐',
    tip: 'ChromeまたはSafariを推奨します',
  },
  {
    step: 2,
    title: 'amistaから届いたURLをクリック',
    desc: 'メールまたはサイト内の「Google Meetに参加」ボタンからURLを開いてください。',
    icon: '🔗',
    tip: 'URLをクリックするとブラウザでGoogle Meetが開きます',
  },
  {
    step: 3,
    title: 'カメラ・マイクの許可',
    desc: '初回アクセス時にブラウザがカメラとマイクの使用許可を求めます。必ず「許可」を選んでください。',
    icon: '🎙️',
    tip: 'システム環境設定→セキュリティとプライバシーからも許可できます',
  },
  {
    step: 4,
    title: 'Googleアカウントでログイン（任意）',
    desc: 'Googleアカウントをお持ちの場合はログインすると名前が表示されます。Googleアカウントがなくても参加できます。',
    icon: '👤',
    tip: 'Googleアカウントにログインしない場合は名前の入力を求められます。名前はニックネームで大丈夫です',
  },
  {
    step: 5,
    title: '「今すぐ参加」をクリック',
    desc: 'カメラ・マイクの確認画面で問題なければ「今すぐ参加」をクリックしてください。',
    icon: '✅',
    tip: '参加前にカメラ映りとマイクの音量を確認しましょう',
  },
  {
    step: 6,
    title: '明るい場所・静かな環境で参加',
    desc: '顔がよく見える明るい場所、周囲の音が入らない静かな環境でご参加ください。',
    icon: '💡',
    tip: 'イヤホン使用推奨。Wi-Fi環境が安定した場所が最適です',
  },
];

const CHECKLIST = [
  { icon: Wifi, text: 'Wi-Fiまたは安定したモバイル通信に接続している', color: 'text-blue-400' },
  { icon: Camera, text: 'カメラが正常に動作している', color: 'text-teal-400' },
  { icon: Mic, text: 'マイク・スピーカーが正常に動作している', color: 'text-purple-400' },
  { icon: Smartphone, text: 'バッテリーが十分にある（30%以上推奨）', color: 'text-amber-400' },
  { icon: CheckCircle, text: 'ChromeまたはSafariなど対応ブラウザを使用している', color: 'text-green-400' },
  { icon: AlertCircle, text: '静かで明るい場所にいる', color: 'text-orange-400' },
  { icon: FileText, text: 'お見合いの前にお相手のプロフィールを確認し、必要であればメモを準備している', color: 'text-pink-400' },
];

type TabKey = 'iphone' | 'android' | 'windows' | 'mac';

const TABS: { key: TabKey; buttonLabel: string; headingLabel: string; steps: typeof IPHONE_STEPS }[] = [
  { key: 'iphone', buttonLabel: '🍎 iPhone', headingLabel: 'iPhoneでの参加手順', steps: IPHONE_STEPS },
  { key: 'android', buttonLabel: '🤖 Android', headingLabel: 'Androidでの参加手順', steps: ANDROID_STEPS },
  { key: 'windows', buttonLabel: '🪟 Windows', headingLabel: 'Windowsでの参加手順', steps: WINDOWS_STEPS },
  { key: 'mac', buttonLabel: '🍏 Mac', headingLabel: 'Macでの参加手順', steps: MAC_STEPS },
];

export default function ZoomGuidePage() {
  const [tab, setTab] = useState<TabKey>('iphone');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* 印刷用CSS */}
      <style jsx global>{`
        @media print {
          aside, nav.fixed {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding-bottom: 0 !important;
          }
          body {
            background: #fff !important;
            color: #000 !important;
          }
          [class*="bg-"] {
            background-color: #fff !important;
            background-image: none !important;
          }
          [class*="text-"] {
            color: #000 !important;
          }
          [class*="border-"] {
            border-color: #ccc !important;
          }
        }
      `}</style>

      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-900 border border-blue-800 rounded-xl flex items-center justify-center">
          <Video className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Google Meetお見合い準備ガイド</h1>
          <p className="text-xs text-zinc-400">スマートフォン・パソコンでのGoogle Meet参加手順</p>
        </div>
      </div>

      {/* ブラウザのみでOKバナー */}
      <div className="flex items-start gap-3 bg-teal-950/50 border border-teal-800 rounded-2xl p-4">
        <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-teal-300 font-medium text-sm mb-1">アプリのインストール不要！</p>
          <p className="text-teal-200/70 text-xs leading-relaxed">
            Google MeetはChromeやSafariなどのブラウザだけで参加できます。アプリのダウンロードは一切不要です。
          </p>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="grid grid-cols-4 gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 print:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-2 text-xs font-medium rounded-xl transition-all ${
              tab === t.key
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.buttonLabel}
          </button>
        ))}
      </div>

      {/* ステップ（印刷時は全デバイスの内容を表示） */}
      <div>
        {TABS.map((t) => (
          <div key={t.key} className={tab === t.key ? 'block' : 'hidden print:block'}>
            <h2 className="text-lg font-bold text-white mb-4 print:mt-8">{t.headingLabel}</h2>
            <div className="space-y-3">
              {t.steps.map((s) => (
                <div key={s.step} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-teal-950 border border-teal-800 rounded-full flex items-center justify-center">
                      <span className="text-teal-400 font-bold text-sm">{s.step}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base flex-shrink-0">{s.icon}</span>
                      <h3 className="text-white font-bold text-xs sm:text-sm leading-snug">{s.title}</h3>
                    </div>
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-2">{s.desc}</p>
                    <div className="flex items-start gap-1.5 bg-teal-950/30 border border-teal-900/50 rounded-xl p-2">
                      <span className="text-teal-400 text-xs flex-shrink-0">💡</span>
                      <p className="text-teal-300/80 text-[11px] sm:text-xs leading-relaxed">{s.tip}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 参加前チェックリスト */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-400" />
          参加前チェックリスト
        </h2>
        <div className="space-y-3">
          {CHECKLIST.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <Icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                <span className="text-zinc-300 text-sm">{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 困ったときは */}
      <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-5">
        <h2 className="text-amber-300 font-bold mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          困ったときは
        </h2>
        <div className="space-y-2 text-sm text-amber-400/80">
          <p>• 映像が映らない → ブラウザのカメラ許可を確認してください</p>
          <p>• 声が聞こえない → マイクのブラウザ許可を確認してください</p>
          <p>• URLが開かない → ChromeまたはSafariで開き直してください</p>
          <p>• それでも解決しない → お問い合わせページからご連絡ください</p>
        </div>
      </div>

      {/* お見合い中の注意事項（閲覧専用） */}
      <div className="bg-teal-950/30 border border-teal-800/50 rounded-2xl p-5">
        <h2 className="text-teal-300 font-bold mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          お見合い中の注意事項
        </h2>
        <p className="text-sm text-teal-400/80 mb-3">
          amistaでは会員の安全を守るため、Google Meet中の直接連絡先交換を禁止しています。以下の事項を必ずご確認ください。
        </p>
        <ul className="space-y-2 text-sm text-teal-200">
          {RULES.map((rule) => (
            <li key={rule.id} className="flex items-start gap-2">
              <span className="text-teal-500 mt-0.5">・</span>
              <span>{rule.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* PDFダウンロード */}
      <button
        onClick={handlePrint}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-700 text-zinc-500 hover:text-zinc-200 transition-all text-sm print:hidden"
      >
        <Download className="w-4 h-4" />
        この手順書をPDFでダウンロード
      </button>
    </div>
  );
}
