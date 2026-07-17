import { createClient } from "@/lib/supabase/server";

async function getAiOptionPausedNotice(): Promise<{ show: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "ai_option_paused_at")
    .maybeSingle();

  return { show: !!data?.value };
}

export async function AiOptionPausedBanner() {
  const { show } = await getAiOptionPausedNotice();
  if (!show) return null;

  return (
    <div className="h-10 flex items-center justify-center bg-red-600 text-white text-sm font-medium px-4 text-center">
      現在、システム障害によりAIおすすめオプションをご利用いただけません。利用できなかった期間分は自動的に無償延長されますので、特別なお手続きは不要です。
    </div>
  );
}
