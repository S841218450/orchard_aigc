import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/app/globals.css";
import "@/style/basePage/layout.scss";
import "nprogress/nprogress.css";
import Providers from "@/app/providers";
import Aside from "@/components/layout/Aside/aside";
import PageTransition from "@/components/layout/PageTransition/pageTransition";
import RouteGuard from "@/components/layout/RouteGuard/routeGuard";

export const metadata: Metadata = {
  title: "巧思 - AI 智能创作平台",
  description: "AI 驱动的智能创作平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <Providers>
            <div className="root-layout">
              <Aside />
              <div className="main-content">
                <RouteGuard>
                  <PageTransition>{children}</PageTransition>
                </RouteGuard>
              </div>
            </div>
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
