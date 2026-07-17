import { createClient } from "@/lib/supabase/server";

async function getIncidentBanner(): Promise<{ show: boolean; message: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["incident_banner_enabled", "incident_banner_message"]);

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  const message = map.incident_banner_message ?? "";

  return { show: map.incident_banner_enabled === "true" && message.trim() !== "", message };
}

export async function IncidentBanner() {
  const { show, message } = await getIncidentBanner();
  if (!show) return null;

  return (
    <div className="h-10 flex items-center justify-center bg-red-900 text-white text-sm font-medium px-4 text-center">
      {message}
    </div>
  );
}
