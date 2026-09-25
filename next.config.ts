import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 旧ログイン URL
  async redirects() {
    return [{ source: "/admin/login", destination: "/login", permanent: false }];
  },
  experimental: {
    // 管理表 CSV のアップロード用（Vercel の上限 4.5MB 未満）
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
