import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 旧ログイン URL
  async redirects() {
    return [{ source: "/admin/login", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
