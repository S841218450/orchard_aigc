import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cssChunking: true,
  },
  async rewrites() {
    return [
      // 更精确的路由放最前面，优先匹配
      {
        source: "/ai-api/v1/:path*",
        destination: "http://localhost:8000/ai-api/v1/:path*",
      },
      {
        source: "/admin-api/:path*",
        destination: "http://localhost:48080/admin-api/:path*",
      },
    ];
  },
};

export default nextConfig;
