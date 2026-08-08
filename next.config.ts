import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 部署输出 standalone（自包含），配合 Dockerfile 使用
  output: "standalone",
  experimental: {
    cssChunking: true,
  },
  async rewrites() {
    // 后端目标地址由环境变量控制，本地开发读取 .env.local，服务器构建读取 .env.production
    const adminTarget = process.env.ADMIN_API_TARGET;
    const aiTarget = process.env.AI_API_TARGET;
    return [
      // 更精确的路由放最前面，优先匹配
      {
        source: "/ai-api/v1/:path*",
        destination: `${aiTarget}/:path*`,
      },
      {
        source: "/admin-api/:path*",
        destination: `${adminTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
