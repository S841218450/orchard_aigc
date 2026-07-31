import Link from "next/link";
import "@/style/basePage/not-found.scss";

export default function NotFound() {
  return (
    <div className="not-found-page animate__animated animate__fadeIn">
      <h2>404</h2>
      <p>页面不存在</p>
      <Link href="/">返回首页</Link>
    </div>
  );
}
