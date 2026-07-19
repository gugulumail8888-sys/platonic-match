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
    <div className="h-10 flex items-center justify-center bg-orange-500 text-white text-xs sm:text-sm px-2 overflow-hidden">
      <span className="hidden sm:inline">
        amista はただいまベータ版です。皆さんと一緒に育てていきたいと思っています。ご意見・ご要望は
      </span>
      <span className="sm:hidden">
        amista はベータ版です。ご意見・ご要望は
      </span>
      <Link href="/contact" className="text-white underline whitespace-nowrap">
        こちら
      </Link>
    </div>
  );
}
