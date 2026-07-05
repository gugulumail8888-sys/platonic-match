import { cookies } from "next/headers";
import RecommendClient from "./_client";

export default function RecommendPage() {
  const authCookie = cookies().get("auth")?.value;
  let hasAiOption = false;
  if (authCookie) {
    try {
      const auth = JSON.parse(decodeURIComponent(authCookie)) as { hasAiOption?: boolean };
      hasAiOption = auth.hasAiOption === true;
    } catch {
      // 不正な cookie は無視
    }
  }

  return <RecommendClient hasAiOption={hasAiOption} />;
}
