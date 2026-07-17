'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Settings, Wallet, Bot, AlertTriangle,
} from 'lucide-react';

// ============================================================
// Shared styles
// ============================================================

const inputCls =
  'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm ' +
  'placeholder-zinc-500 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors w-full';

const selectCls =
  'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm ' +
  'focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors w-full';

// ============================================================
// Shared sub-components
// ============================================================

function FieldRow({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1">{children}</div>
        {unit && <span className="text-xs text-zinc-500 flex-shrink-0">{unit}</span>}
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function ToggleSwitch({ checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
      <div>
        <p className="text-sm text-zinc-200 font-medium">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
          checked ? 'bg-teal-600' : 'bg-zinc-600'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SettingsSection({
  icon: Icon, title, onSave, children,
}: {
  icon: React.ElementType;
  title: string;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
      <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
      <div className="pt-1 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
}

// 変更不可・確認専用のセクション(保存ボタンなし)。
// 実際の値は環境変数・Stripe Price ID・コード内の固定値など別の場所で管理されており、
// この画面はあくまで現在値の確認用。誤解防止のため保存ボタンは表示しない。
function InfoSection({
  icon: Icon, title, note, children,
}: {
  icon: React.ElementType;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
      <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h3>
      {note && (
        <p className="text-xs text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
          {note}
        </p>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ReadOnlyRow({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <p className="flex-1 text-white text-sm">{value}</p>
        {unit && <span className="text-xs text-zinc-500 flex-shrink-0">{unit}</span>}
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function AdminSettingsPage() {
  const [toast, setToast] = useState('');

  // 1. 基本設定
  // 連絡先メールアドレスは、お見合い新規申請・キャンセル・支払いリマインド等の
  // 管理者通知の送信先として使用される(src/app/api/admin/notify/route.ts・
  // src/app/api/contact/route.tsのgetAdminEmail()が参照。未入力時は環境変数
  // ADMIN_EMAILにフォールバック)。サイト名・運営者名はどこからも参照されて
  // いなかったため撤去した(2026/7/10)。
  const [contactEmail, setContactEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceNoticeEnabled, setMaintenanceNoticeEnabled] = useState(false);
  const [maintenanceScheduledStart, setMaintenanceScheduledStart] = useState('');
  const [maintenanceScheduledEnd, setMaintenanceScheduledEnd] = useState('');

  // 2. 料金設定
  // 変数名は旧仕様(ライト/スタンダード2プラン)の名残だったが、実際には
  // AIおすすめオプションは1プランのみのため名称を実態に合わせて変更(2026/7/14)
  const [aiOptionPrice, setAiOptionPrice] = useState(1078);
  const [matchingFeeNormal, setMatchingFeeNormal] = useState(3500);
  const [matchingFeePremium, setMatchingFeePremium] = useState(3000);

  // 機能ON/OFF設定で使用
  const [omiaiOpen, setOmiaiOpen] = useState(false);
  // 基本設定で使用
  const [likeLimit, setLikeLimit] = useState(0);

  // 5. マッチング設定(zoom_expiry_days・matching_auto_cancel_daysは確認専用。
  // 実際はGoogle Meet連携コード・pg_cronのSQLに固定値がハードコードされている)
  const [zoomExpiryDays, setZoomExpiryDays] = useState(0);
  const [matchingAutoCancelDays, setMatchingAutoCancelDays] = useState(0);

  // 6. ベータ版設定
  const [aiOptionEnabled, setAiOptionEnabled] = useState(true);
  // AIおすすめオプションOFF中はStripe請求を一時停止する(2026/7/14対応)。
  // 一時停止中かどうかの表示用(空文字なら停止していない)
  const [aiOptionPausedAt, setAiOptionPausedAt] = useState('');
  // 保存ボタンが「ベータ版・キャンペーン設定」セクション内の3トグル共通のため、
  // 「今回のセーブで実際にAIオプションをON→OFFに切り替えたか」を判定するための
  // 直近保存済み値の記録(2026/7/17対応。従来はAIオプションが既にOFFの状態で
  // 他のトグル(ベータ版バナー等)だけを保存しようとしても、無関係な確認モーダルが
  // 毎回出てしまう不具合があった)
  const aiOptionEnabledSavedRef = useRef(true);

  // OFF確認モーダル(2026/7/15対応。テスト等の一時的なOFFで契約者の請求期間が
  // 意図せず延長されないよう、請求停止の要否を都度選べるようにする)
  const [showOffConfirmModal, setShowOffConfirmModal] = useState(false);
  const [pauseBillingOnOff, setPauseBillingOnOff] = useState(true);

  // ベータ版バナー設定(2026/7/17対応。従来は管理画面UIがなくDB直接操作でしか
  // ON/OFFできなかった問題を解消。表示期限機能は今回のスコープ外)
  const [betaBannerEnabled, setBetaBannerEnabled] = useState(false);

  // 7. キャンペーン設定
  const [campaignBannerEnabled, setCampaignBannerEnabled] = useState(false);
  // 汎用お知らせバナー設定(2026/7/17対応。「メンテナンス中」でも「AIオプション停止中」
  // でもない、システム全体や決済処理のトラブル等を任意の文言で告知するための機能)
  const [incidentBannerEnabled, setIncidentBannerEnabled] = useState(false);
  const [incidentBannerMessage, setIncidentBannerMessage] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // 現在の設定値を取得してstateに反映
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data: Record<string, string>) => {
        if (data.contact_email !== undefined) setContactEmail(data.contact_email);
        if (data.maintenance_mode !== undefined) setMaintenanceMode(data.maintenance_mode === 'true');
        if (data.maintenance_notice_enabled !== undefined) setMaintenanceNoticeEnabled(data.maintenance_notice_enabled === 'true');
        if (data.maintenance_scheduled_start !== undefined) setMaintenanceScheduledStart(data.maintenance_scheduled_start);
        if (data.maintenance_scheduled_end !== undefined) setMaintenanceScheduledEnd(data.maintenance_scheduled_end);
        if (data.light_plan_price !== undefined) setAiOptionPrice(Number(data.light_plan_price));
        if (data.matching_fee_normal !== undefined) setMatchingFeeNormal(Number(data.matching_fee_normal));
        if (data.matching_fee_premium !== undefined) setMatchingFeePremium(Number(data.matching_fee_premium));
        if (data.ai_option_enabled !== undefined) {
          const enabled = data.ai_option_enabled !== 'false';
          setAiOptionEnabled(enabled);
          aiOptionEnabledSavedRef.current = enabled;
        }
        if (data.ai_option_paused_at !== undefined) setAiOptionPausedAt(data.ai_option_paused_at);
        if (data.omiai_open !== undefined) setOmiaiOpen(data.omiai_open === 'true');
        if (data.daily_like_limit !== undefined) setLikeLimit(Number(data.daily_like_limit));
        if (data.beta_banner_enabled !== undefined) setBetaBannerEnabled(data.beta_banner_enabled === 'true');
        if (data.campaign_banner_enabled !== undefined) setCampaignBannerEnabled(data.campaign_banner_enabled === 'true');
        if (data.incident_banner_enabled !== undefined) setIncidentBannerEnabled(data.incident_banner_enabled === 'true');
        if (data.incident_banner_message !== undefined) setIncidentBannerMessage(data.incident_banner_message);
        if (data.zoom_expiry_days !== undefined) setZoomExpiryDays(Number(data.zoom_expiry_days));
        if (data.matching_auto_cancel_days !== undefined) setMatchingAutoCancelDays(Number(data.matching_auto_cancel_days));
      })
      .catch((err) => console.error('settings fetch error:', err));
  }, []);

  const saveSettings = async (payload: Record<string, string>) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json().catch(() => null) as { billingResult?: { paused?: number; resumed?: number; failed?: number } } | null;
      const br = data?.billingResult;
      if (br?.paused !== undefined) {
        showToast(`保存しました(契約者${br.paused}名の請求を一時停止${br.failed ? `・${br.failed}件失敗` : ''})`);
        setAiOptionPausedAt(new Date().toISOString());
      } else if (br?.resumed !== undefined) {
        showToast(`保存しました(契約者${br.resumed}名の請求を再開${br.failed ? `・${br.failed}件失敗` : ''})`);
        setAiOptionPausedAt('');
      } else {
        showToast('保存しました');
      }
    } catch {
      showToast('保存に失敗しました');
    }
  };

  const handleSaveBasic = () => saveSettings({
    contact_email: contactEmail,
    daily_like_limit: String(likeLimit),
  });

  const handleSaveMaintenanceMode = () => saveSettings({
    maintenance_mode: String(maintenanceMode),
  });

  const handleSaveBanners = () => saveSettings({
    beta_banner_enabled: String(betaBannerEnabled),
    maintenance_notice_enabled: String(maintenanceNoticeEnabled),
    maintenance_scheduled_start: maintenanceScheduledStart,
    maintenance_scheduled_end: maintenanceScheduledEnd,
    incident_banner_enabled: String(incidentBannerEnabled),
    incident_banner_message: incidentBannerMessage,
    campaign_banner_enabled: String(campaignBannerEnabled),
  });

  const handleSaveFeatures = () => {
    if (aiOptionEnabledSavedRef.current && !aiOptionEnabled) {
      setPauseBillingOnOff(true);
      setShowOffConfirmModal(true);
      return;
    }
    saveSettings({
      ai_option_enabled: String(aiOptionEnabled),
      omiai_open: String(omiaiOpen),
    });
    aiOptionEnabledSavedRef.current = aiOptionEnabled;
  };

  const handleConfirmOff = () => {
    setShowOffConfirmModal(false);
    saveSettings({
      ai_option_enabled: 'false',
      omiai_open: String(omiaiOpen),
      pause_billing: String(pauseBillingOnOff),
    });
    aiOptionEnabledSavedRef.current = false;
  };


  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">設定</h1>
        <p className="text-sm text-zinc-400 mt-0.5">amista 管理者設定</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. 基本設定 */}
        <SettingsSection icon={Settings} title="基本設定" onSave={handleSaveBasic}>
          <FieldRow label="連絡先メールアドレス">
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className={inputCls}
              placeholder="contact@example.com"
            />
          </FieldRow>
          <p className="text-xs text-zinc-500 -mt-2">
            お見合いの新規申請・キャンセル・支払いリマインドなどの管理者通知は、このアドレス宛に送信されます。未入力の場合は既定のアドレスが使われます。
          </p>
          <FieldRow label="いいね上限数" unit="件/日">
            <input
              type="number"
              value={likeLimit}
              onChange={(e) => setLikeLimit(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
        </SettingsSection>

        {/* メンテナンスモード */}
        <SettingsSection icon={Settings} title="メンテナンスモード" onSave={handleSaveMaintenanceMode}>
          <ToggleSwitch
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
            label="メンテナンスモード"
            description="有効にするとサイト全体をメンテナンス画面に切り替えます(下記の「お知らせバナー設定」とは別の機能です)"
          />
        </SettingsSection>

        {/* お知らせバナー設定(2026/7/17整理。すべてON=表示・OFF=非表示で統一) */}
        <SettingsSection icon={AlertTriangle} title="お知らせバナー設定" onSave={handleSaveBanners}>
          <p className="text-[11px] text-zinc-500 -mt-1">
            以下はすべて「ONにすると該当のバナーがサイト上部に表示される」で統一されています。
          </p>
          <ToggleSwitch
            checked={betaBannerEnabled}
            onChange={setBetaBannerEnabled}
            label="ベータ版バナーを表示"
            description="「amistaはただいまベータ版です」というオレンジ色のバナーを表示します"
          />
          <ToggleSwitch
            checked={maintenanceNoticeEnabled}
            onChange={setMaintenanceNoticeEnabled}
            label="メンテナンス予告バナーを表示"
            description="下記の予定日時をバナーで告知します"
          />
          <FieldRow label="メンテナンス開始予定日時">
            <input
              type="datetime-local"
              value={maintenanceScheduledStart}
              onChange={(e) => setMaintenanceScheduledStart(e.target.value)}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="メンテナンス終了予定日時">
            <input
              type="datetime-local"
              value={maintenanceScheduledEnd}
              onChange={(e) => setMaintenanceScheduledEnd(e.target.value)}
              className={inputCls}
            />
          </FieldRow>
          <ToggleSwitch
            checked={incidentBannerEnabled}
            onChange={setIncidentBannerEnabled}
            label="障害・緊急のお知らせバナーを表示"
            description="「メンテナンス中」「AIオプション停止中」以外の、システム全体・決済処理等のトラブル発生時に、下記の文言でバナーを表示します"
          />
          <FieldRow label="お知らせ文言">
            <input
              type="text"
              value={incidentBannerMessage}
              onChange={(e) => setIncidentBannerMessage(e.target.value)}
              className={inputCls}
              placeholder="例：現在、一部決済処理に不具合が発生しております。復旧までしばらくお待ちください。"
            />
          </FieldRow>
          <ToggleSwitch
            checked={campaignBannerEnabled}
            onChange={setCampaignBannerEnabled}
            label="オープン記念・初期限定キャンペーンバナーを表示"
            description="7月〜9月限定｜AIおすすめ機能 申込日から3ヶ月無料キャンペーンのバナーをトップページに表示します"
          />
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-400">
              AIオプション停止中のお知らせバナー：
              <span className={aiOptionPausedAt ? 'text-amber-500 font-medium' : 'text-zinc-500'}>
                {aiOptionPausedAt ? `現在表示中(${new Date(aiOptionPausedAt).toLocaleString('ja-JP')}〜)` : '現在は表示されていません'}
              </span>
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              このバナーはここでは手動ON/OFFできません。右下「機能ON/OFF設定」の「AIおすすめオプション」と自動連動しています。
            </p>
          </div>
        </SettingsSection>

        {/* 2. 確認専用設定(実際の値は別の場所で管理されており、ここでは変更できません) */}
        <InfoSection
          icon={Wallet}
          title="設定値の確認(変更不可)"
          note="以下はいずれも現在の設定値の確認用の表示です。ここを変更しても実際の動作には反映されません。料金はStripeダッシュボード、期限はコード側の固定値がそれぞれの正となっています。"
        >
          <p className="text-xs text-teal-400 font-medium">料金(Stripe Price IDが正)</p>
          <ReadOnlyRow label="AIおすすめプラン月額（税込）" value={aiOptionPrice.toLocaleString()} unit="円" />
          <ReadOnlyRow label="お見合い申請料金（無料プラン・税込）" value={matchingFeeNormal.toLocaleString()} unit="円" />
          <ReadOnlyRow label="お見合い申請料金（AIプラン・税込）" value={matchingFeePremium.toLocaleString()} unit="円" />
          <p className="text-xs text-teal-400 font-medium pt-2 border-t border-zinc-800">マッチング期限(コード側の固定値が正)</p>
          <ReadOnlyRow label="Google Meet面談有効期限" value={zoomExpiryDays} unit="日" />
          <ReadOnlyRow label="お見合い申請の自動キャンセル期限" value={matchingAutoCancelDays} unit="日" />
        </InfoSection>

        {/* 機能ON/OFF設定(2026/7/17整理。バナー表示専用トグルとは別枠。ONが「機能が使える状態」を意味し、OFFにした結果として関連のお知らせが表示される場合があります) */}
        <SettingsSection icon={Bot} title="機能ON/OFF設定" onSave={handleSaveFeatures}>
          <ToggleSwitch
            checked={aiOptionEnabled}
            onChange={setAiOptionEnabled}
            label="AIおすすめオプション"
            description="ONの間、AIによるマッチングおすすめ機能が利用できます。OFFにすると契約者含め全員が利用不可になり、Stripe請求も自動的に一時停止され「AIオプション停止中」のお知らせバナーが自動表示されます"
          />
          {aiOptionPausedAt && (
            <p className="text-[10px] text-amber-500 -mt-2">
              ⚠ 現在、契約者全員の請求を一時停止中です({new Date(aiOptionPausedAt).toLocaleString('ja-JP')}〜)
            </p>
          )}
          <ToggleSwitch
            checked={omiaiOpen}
            onChange={setOmiaiOpen}
            label="お見合い申請受付"
            description="ONの間、お見合い申請を受け付けます。OFFにすると会員には「お見合い申請は近日開始予定」と案内表示されます"
          />
        </SettingsSection>
      </div>

      {/* AIおすすめオプションOFF確認モーダル */}
      {showOffConfirmModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-bold text-zinc-200 mb-3">AIおすすめオプションをOFFにします</h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              OFFにすると、契約者含め全会員がAIおすすめ機能を利用できなくなります。
            </p>
            <label className="flex items-start gap-2.5 bg-zinc-900 border border-zinc-700 rounded-xl p-3.5 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={pauseBillingOnOff}
                onChange={(e) => setPauseBillingOnOff(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-zinc-300 leading-relaxed">
                契約者の請求も自動的に一時停止する<br />
                <span className="text-zinc-500">(現金返金ではなく、再開時に停止していた日数分は課金されません。実際のサービス停止・障害の場合はONのままにしてください。動作確認などの一時的なOFFではOFFにしてください)</span>
              </span>
            </label>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowOffConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-700 text-zinc-300 text-sm hover:bg-zinc-600 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmOff}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-colors"
              >
                OFFにする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
