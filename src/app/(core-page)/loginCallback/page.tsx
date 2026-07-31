"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "@/components/core/loadding/loading";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && window.opener) {
      // 将 OAuth 回调参数传递给父窗口
      window.opener.postMessage(
        { type: "oauth_callback", code, state },
        window.location.origin,
      );
      // 关闭弹窗
      window.close();
    } else {
      // 无参数或无父窗口，直接跳转首页
      router.replace("/");
    }
  }, [router, searchParams]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        height: "100vh",
        gap: 20,
        color: "#000000",
        fontSize: 14,
      }}
    >
      <Loading />
      登录处理中，请稍候...
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            justifyContent: "center",
            height: "100vh",
            color: "#000000",
            fontSize: 14,
          }}
        >
          <Loading />
          加载中...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
