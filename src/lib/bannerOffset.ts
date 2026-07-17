import { createClient } from "@/lib/supabase/server";

export async function getBannerOffset(): Promise<{
  offset: number;
  showBeta: boolean;
  showMaintenanceNotice: boolean;
  showAiOptionPaused: boolean;
  showIncident: boolean;
  showPrerelease: boolean;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "beta_banner_enabled",
      "maintenance_notice_enabled",
      "maintenance_scheduled_start",
      "maintenance_scheduled_end",
      "ai_option_paused_at",
      "incident_banner_enabled",
      "incident_banner_message",
      "omiai_open",
    ]);

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));

  const showBeta = map.beta_banner_enabled === "true";

  let showMaintenanceNotice = false;
  const noticeEnabled = map.maintenance_notice_enabled === "true";
  const start = map.maintenance_scheduled_start ?? '';
  const end = map.maintenance_scheduled_end ?? '';
  if (noticeEnabled && start && end) {
    const now = Date.now();
    const startTime = new Date(start).getTime();
    if (!isNaN(startTime) && now < startTime) {
      showMaintenanceNotice = true;
    }
  }

  const showAiOptionPaused = !!map.ai_option_paused_at;

  const incidentMessage = map.incident_banner_message ?? '';
  const showIncident = map.incident_banner_enabled === "true" && incidentMessage.trim() !== '';

  const showPrerelease = map.omiai_open !== "true";

  const offset = (showBeta ? 40 : 0) + (showMaintenanceNotice ? 40 : 0) + (showAiOptionPaused ? 40 : 0) + (showIncident ? 40 : 0) + (showPrerelease ? 40 : 0);

  return { offset, showBeta, showMaintenanceNotice, showAiOptionPaused, showIncident, showPrerelease };
}
