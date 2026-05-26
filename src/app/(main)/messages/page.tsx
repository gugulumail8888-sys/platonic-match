import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "メッセージ",
};

export default function MessagesPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary-500" />
          メッセージ
        </h1>
      </div>

      <div className="text-center py-20 bg-white rounded-3xl shadow-card">
        <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-400 font-medium">メッセージはまだありません</p>
        <p className="text-sm text-gray-300 mt-2">
          マッチングした相手にメッセージを送りましょう
        </p>
      </div>
    </div>
  );
}
