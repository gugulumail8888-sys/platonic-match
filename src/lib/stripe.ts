import Stripe from 'stripe';

// ==========================================
// Stripe クライアント（サーバーサイド用）
// ==========================================
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});
