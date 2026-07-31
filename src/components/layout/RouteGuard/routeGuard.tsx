"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cancelAllRequests } from "@/api/config/request";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // 路由真正变化时才取消请求（跳过首次渲染）
    if (prevPathnameRef.current !== pathname) {
      cancelAllRequests();
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  return <>{children}</>;
}
