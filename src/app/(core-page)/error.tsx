"use client";

import "@/style/basePage/error.scss";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-page animate__animated animate__fadeIn">
      <h2>出错了</h2>
      <p>{error?.message || "发生未知错误"}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  );
}
