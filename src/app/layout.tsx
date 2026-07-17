import type { Metadata } from "next";
import "@/app/globals.css";
import "@/style/basePage/layout.scss";
import Aside from "@/components/layout/Aside/aside";
import PageTransition from "@/components/layout/PageTransition/pageTransition";

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
    <html lang="zh-CN">
      <body>
        <div className="root-layout">
          <Aside />
          <div className="main-content">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </body>
    </html>
  );
}
