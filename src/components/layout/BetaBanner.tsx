import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function isBetaBannerEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "beta_banner_enabled")
    .maybeSingle();
  return data?.value === "true";
}

export async function BetaBanner() {
  const enabled = await isBetaBannerEnabled();
  if (!enabled) return null;
  return (
    <div className="h-10 flex items-center justify-center bg-orange-500 text-white text-sm">
      amista はただいまベータ版です。皆さんと一緒に育てていきたいと思っています。ご意見・ご要望は
      <Link href="/contact" className="text-white underline">
        こちら
      </Link>
    </div>
  );
}
