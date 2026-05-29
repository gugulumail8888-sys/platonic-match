'use client';

import { useState } from 'react';
import { Smartphone, Download, CheckCircle, AlertCircle, Wifi, Mic, Camera, Video } from 'lucide-react';

const IPHONE_STEPS = [
  {
    step: 1,
    title: 'App Storeを開く',
    desc: 'ホーム画面またはホーム画面下部の検索からApp Storeを開いてください。',
    icon: '📱',
    tip: 'App Storeは青いアイコンです',
  },
  {
    step: 2,
    title: '「Zoom」を検索してインストール',
    desc: '検索バーに「Zoom」と入力し、「ZOOM Cloud Meetings」をインストールしてください。',
    icon: '🔍',
    tip: '開発元が「Zoom Video Communications」であることを確認してください',
  },
  {
    step: 3,
    title: 'ZOOMを起動する',
    desc: 'インストール完了後、ZOOMアプリを起動してください。アカウント登録は不要です。',
    icon: '🚀',
    tip: '「サインイン」ではなく「ミーティングに参加」を選んでください',
  },
  {
    step: 4,
    title: 'カメラ・マイクの許可',
    desc: 'ZOOMを初めて起動すると、カメラとマイクの使用許可を求められます。必ず「許可」を選んでください。',
    icon: '🎙️',
    tip: '許可しないとお相手に声や映像が届きません',
  },
  {
    step: 5,
    title: 'URLをタップしてミーティングに参加',
    desc: 'amistaから送られたZOOMのURLをタップするだけで自動的にミーティングに参加できます。',
    icon: '🔗',
    tip: 'URLはメールまたはサイト内の「ZOOMに参加」ボタンから開けます',
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
    title: 'Google Playを開く',
    desc: 'ホーム画面またはアプリ一覧からGoogle Playストアを開いてください。',
    icon: '📱',
    tip: 'Google Playは三角形のカラフルなアイコンです',
  },
  {
    step: 2,
    title: '「Zoom」を検索してインストール',
    desc: '検索バーに「Zoom」と入力し、「ZOOM Cloud Meetings」をインストールしてください。',
    icon: '🔍',
    tip: '開発元が「Zoom Video Communications」であることを確認してください',
  },
  {
    step: 3,
    title: 'ZOOMを起動する',
    desc: 'インストール完了後、ZOOMアプリを起動してください。アカウント登録は不要です。',
    icon: '🚀',
    tip: '「サインイン」ではなく「ミーティングに参加」を選んでください',
  },
  {
    step: 4,
    title: 'カメラ・マイクの許可',
    desc: 'ZOOMを初めて起動すると、カメラとマイクの使用許可を求められます。必ず「許可」を選んでください。',
    icon: '🎙️',
    tip: 'Androidは設定→アプリ→ZOOMからも許可できます',
  },
  {
    step: 5,
    title: 'URLをタップしてミーティングに参加',
    desc: 'amistaから送られたZOOMのURLをタップするだけで自動的にミーティングに参加できます。',
    icon: '🔗',
    tip: 'URLはメールまたはサイト内の「ZOOMに参加」ボタンから開けます',
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
  { icon: Wifi, text: 'Wi-Fiまたは4G/5G回線が安定している', color: 'text-blue-400' },
  { icon: Camera, text: 'カメラが正常に動作している', color: 'text-teal-400' },
  { icon: Mic, text: 'マイク・スピーカーが正常に動作している', color: 'text-purple-400' },
  { icon: Smartphone, text: 'バッテリーが十分にある（30%以上推奨）', color: 'text-amber-400' },
  { icon: CheckCircle, text: 'ZOOMアプリがインストール済みである', color: 'text-green-400' },
  { icon: AlertCircle, text: '静かで明るい場所にいる', color: 'text-orange-400' },
];

export default function ZoomGuidePage() {
  const [tab, setTab] = useState<'iphone' | 'android'>('iphone');
  const steps = tab === 'iphone' ? IPHONE_STEPS : ANDROID_STEPS;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-900 border border-blue-800 rounded-xl flex items-center justify-center">
          <Video className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">ZOOMお見合い 準備ガイド</h1>
          <p className="text-xs text-zinc-400">スマートフォンでのZOOM参加手順</p>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-2 mb-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
        <button
          onClick={() => setTab('iphone')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'iphone'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🍎 iPhone（iOS）
        </button>
        <button
          onClick={() => setTab('android')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'android'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🤖 Android
        </button>
      </div>

      {/* ステップ */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">
          {tab === 'iphone' ? '🍎 iPhone' : '🤖 Android'} セットアップ手順
        </h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.step} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex gap-4">
              {/* ステップ番号 */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-teal-900 border border-teal-800 rounded-full flex items-center justify-center">
                  <span className="text-teal-400 font-bold text-sm">{s.step}</span>
                </div>
              </div>
              {/* 内容 */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{s.icon}</span>
                  <h3 className="text-white font-semibold text-sm">{s.title}</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed mb-2">{s.desc}</p>
                <div className="flex items-start gap-1.5 bg-teal-950/30 border border-teal-900/50 rounded-lg px-3 py-2">
                  <span className="text-teal-400 text-xs mt-0.5">💡</span>
                  <p className="text-teal-400 text-xs leading-relaxed">{s.tip}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 参加前チェックリスト */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-400" />
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
      <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-5 mb-6">
        <h2 className="text-amber-300 font-bold mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          困ったときは
        </h2>
        <div className="space-y-2 text-sm text-amber-400/80">
          <p>• 映像が映らない → カメラのアプリ許可を確認してください</p>
          <p>• 声が聞こえない → マイクのアプリ許可を確認してください</p>
          <p>• URLが開かない → ZOOMアプリをインストール後に再度タップしてください</p>
          <p>• それでも解決しない → お問い合わせページからご連絡ください</p>
        </div>
      </div>

      {/* PDFダウンロードボタン（将来実装） */}
      <button
        onClick={() => alert('PDF機能は準備中です。しばらくお待ちください。')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all text-sm"
      >
        <Download className="w-4 h-4" />
        この手順書をPDFでダウンロード（準備中）
      </button>
    </div>
  );
}
