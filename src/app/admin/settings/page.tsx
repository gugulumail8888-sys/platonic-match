'use client';

import { useEffect, useState } from 'react';
import {
  Settings, Wallet, Users, Bell, Heart, Bot, Megaphone,
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

// ============================================================
// Page
// ============================================================

export default function AdminSettingsPage() {
  const [toast, setToast] = useState('');

  // 1. 基本設定
  const [siteName, setSiteName] = useState('amista');
  const [operatorName, setOperatorName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // 2. 料金設定
  const [lightPlanPrice, setLightPlanPrice] = useState(1078);
  const [matchingFeeNormal, setMatchingFeeNormal] = useState(3500);
  const [matchingFeePremium, setMatchingFeePremium] = useState(3000);

  // 3. 会員設定
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [reviewMode, setReviewMode] = useState<'auto' | 'manual'>('manual');
  const [likeLimit, setLikeLimit] = useState(0);

  // 4. 通知設定
  const [adminNotifyEmail, setAdminNotifyEmail] = useState('');
  const [notifyNewMember, setNotifyNewMember] = useState(true);
  const [notifyMatchingApply, setNotifyMatchingApply] = useState(true);

  // 5. マッチング設定
  const [zoomExpiryDays, setZoomExpiryDays] = useState(0);
  const [matchingAutoCancelDays, setMatchingAutoCancelDays] = useState(0);
  const [datingWishExpiryDays, setDatingWishExpiryDays] = useState(0);

  // 6. ベータ版設定
  const [aiOptionEnabled, setAiOptionEnabled] = useState(true);

  // 7. キャンペーン設定
  const [campaignBannerEnabled, setCampaignBannerEnabled] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // 現在の設定値を取得してstateに反映
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data: Record<string, string>) => {
        if (data.site_name !== undefined) setSiteName(data.site_name);
        if (data.maintenance_mode !== undefined) setMaintenanceMode(data.maintenance_mode === 'true');
        if (data.light_plan_price !== undefined) setLightPlanPrice(Number(data.light_plan_price));
        if (data.matching_fee_normal !== undefined) setMatchingFeeNormal(Number(data.matching_fee_normal));
        if (data.matching_fee_premium !== undefined) setMatchingFeePremium(Number(data.matching_fee_premium));
        if (data.ai_option_enabled !== undefined) setAiOptionEnabled(data.ai_option_enabled !== 'false');
        if (data.review_mode !== undefined) setReviewMode(data.review_mode === 'auto' ? 'auto' : 'manual');
        if (data.registration_open !== undefined) setRegistrationOpen(data.registration_open !== 'false');
        if (data.daily_like_limit !== undefined) setLikeLimit(Number(data.daily_like_limit));
        if (data.campaign_banner_enabled !== undefined) setCampaignBannerEnabled(data.campaign_banner_enabled === 'true');
        if (data.admin_notify_email !== undefined) setAdminNotifyEmail(data.admin_notify_email);
        if (data.notify_new_member !== undefined) setNotifyNewMember(data.notify_new_member !== 'false');
        if (data.notify_matching_apply !== undefined) setNotifyMatchingApply(data.notify_matching_apply !== 'false');
        if (data.zoom_expiry_days !== undefined) setZoomExpiryDays(Number(data.zoom_expiry_days));
        if (data.matching_auto_cancel_days !== undefined) setMatchingAutoCancelDays(Number(data.matching_auto_cancel_days));
        if (data.dating_wish_expiry_days !== undefined) setDatingWishExpiryDays(Number(data.dating_wish_expiry_days));
      })
      .catch((err) => console.error('settings fetch error:', err));
  }, []);

  const handleSave = () => showToast('この機能は現在準備中です');

  const saveSettings = async (payload: Record<string, string>) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('failed');
      showToast('保存しました');
    } catch {
      showToast('保存に失敗しました');
    }
  };

  const handleSaveBasic = () => saveSettings({
    site_name: siteName,
    maintenance_mode: String(maintenanceMode),
  });

  const handleSavePricing = () => saveSettings({
    light_plan_price: String(lightPlanPrice),
    matching_fee_normal: String(matchingFeeNormal),
    matching_fee_premium: String(matchingFeePremium),
  });

  const handleSaveBeta = () => saveSettings({
    ai_option_enabled: String(aiOptionEnabled),
  });

  const handleSaveMembers = () => saveSettings({
    review_mode: reviewMode,
    registration_open: String(registrationOpen),
    daily_like_limit: String(likeLimit),
  });

  const handleSaveNotification = () => saveSettings({
    admin_notify_email: adminNotifyEmail,
    notify_new_member: String(notifyNewMember),
    notify_matching_apply: String(notifyMatchingApply),
  });

  const handleSaveMatching = () => saveSettings({
    zoom_expiry_days: String(zoomExpiryDays),
    matching_auto_cancel_days: String(matchingAutoCancelDays),
    dating_wish_expiry_days: String(datingWishExpiryDays),
  });

  const handleSaveCampaign = () => saveSettings({
    campaign_banner_enabled: String(campaignBannerEnabled),
  });

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
          <FieldRow label="サイト名">
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className={inputCls}
              placeholder="サイト名を入力"
            />
          </FieldRow>
          <FieldRow label="運営者名">
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className={inputCls}
              placeholder="運営者名を入力"
            />
          </FieldRow>
          <FieldRow label="連絡先メールアドレス">
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className={inputCls}
              placeholder="contact@example.com"
            />
          </FieldRow>
          <ToggleSwitch
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
            label="メンテナンスモード"
            description="有効にするとサイトをメンテナンス画面に切り替えます"
          />
        </SettingsSection>

        {/* 2. 料金設定 */}
        <SettingsSection icon={Wallet} title="料金設定" onSave={handleSavePricing}>
          <FieldRow label="AIおすすめプラン月額（税込）" unit="円">
            <input
              type="number"
              value={lightPlanPrice}
              onChange={(e) => setLightPlanPrice(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="お見合い申請料金（無料プラン・税込）" unit="円">
            <input
              type="number"
              value={matchingFeeNormal}
              onChange={(e) => setMatchingFeeNormal(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="お見合い申請料金（AIプラン・税込）" unit="円">
            <input
              type="number"
              value={matchingFeePremium}
              onChange={(e) => setMatchingFeePremium(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
        </SettingsSection>

        {/* ベータ版設定 */}
        <SettingsSection icon={Bot} title="ベータ版設定" onSave={handleSaveBeta}>
          <ToggleSwitch
            checked={aiOptionEnabled}
            onChange={setAiOptionEnabled}
            label="AIおすすめオプション"
            description="AIによるマッチングおすすめ機能を有効にします"
          />
        </SettingsSection>

        {/* 3. 会員設定 */}
        <SettingsSection icon={Users} title="会員設定" onSave={handleSaveMembers}>
          <ToggleSwitch
            checked={registrationOpen}
            onChange={setRegistrationOpen}
            label="新規登録受付"
            description="無効にすると新規会員登録を停止します"
          />
          <FieldRow label="審査モード">
            <select
              value={reviewMode}
              onChange={(e) => setReviewMode(e.target.value as 'auto' | 'manual')}
              className={selectCls}
            >
              <option value="auto">自動</option>
              <option value="manual">手動</option>
            </select>
          </FieldRow>
          <FieldRow label="いいね上限数" unit="件/日">
            <input
              type="number"
              value={likeLimit}
              onChange={(e) => setLikeLimit(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
        </SettingsSection>

        {/* 4. 通知設定 */}
        <SettingsSection icon={Bell} title="通知設定" onSave={handleSaveNotification}>
          <FieldRow label="管理者通知メールアドレス">
            <input
              type="email"
              value={adminNotifyEmail}
              onChange={(e) => setAdminNotifyEmail(e.target.value)}
              className={inputCls}
              placeholder="admin@example.com"
            />
          </FieldRow>
          <ToggleSwitch
            checked={notifyNewMember}
            onChange={setNotifyNewMember}
            label="新規登録通知"
            description="新規会員が登録したときに通知します"
          />
          <ToggleSwitch
            checked={notifyMatchingApply}
            onChange={setNotifyMatchingApply}
            label="お見合い申請通知"
            description="お見合い申請があったときに通知します"
          />
        </SettingsSection>

        {/* 5. マッチング設定 */}
        <SettingsSection icon={Heart} title="マッチング設定" onSave={handleSaveMatching}>
          <FieldRow label="Google Meet面談有効期限" unit="日">
            <input
              type="number"
              value={zoomExpiryDays}
              onChange={(e) => setZoomExpiryDays(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="お見合い申請の自動キャンセル期限" unit="日">
            <input
              type="number"
              value={matchingAutoCancelDays}
              onChange={(e) => setMatchingAutoCancelDays(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="交際希望の有効期限" unit="日">
            <input
              type="number"
              value={datingWishExpiryDays}
              onChange={(e) => setDatingWishExpiryDays(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
        </SettingsSection>

        {/* 7. キャンペーン設定 */}
        <SettingsSection icon={Megaphone} title="キャンペーン設定" onSave={handleSaveCampaign}>
          <ToggleSwitch
            checked={campaignBannerEnabled}
            onChange={setCampaignBannerEnabled}
            label="夏のキャンペーンバナーを表示"
            description="7月〜9月限定｜AIおすすめ機能 申込日から3ヶ月無料キャンペーンのバナーをトップページに表示します"
          />
        </SettingsSection>
      </div>

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
