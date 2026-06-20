import Stripe from 'stripe';

// ==========================================
// Stripe クライアント（サーバーサイド用）
// ==========================================
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, {
    apiVersion: '2026-05-27.dahlia',
  });
}

// 後方互換性のためのエイリアス
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});
