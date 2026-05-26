/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境での最適化
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  // 画像最適化設定
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },

  // 実験的機能
  experimental: {
    // Server Actionsを有効化
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
