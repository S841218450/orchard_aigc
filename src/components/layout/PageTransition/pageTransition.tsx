"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import "./pageTransition.scss";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<
    "fade-in" | "fade-out"
  >("fade-in");
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      // 路由变化，开始淡出
      setTransitionStage("fade-out");
      prevPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if (transitionStage === "fade-out") {
      // 淡出完成后更新内容并淡入
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage("fade-in");
      }, 300); // 动画持续时间

      return () => clearTimeout(timer);
    }
  }, [transitionStage, children]);

  return (
    <div className={`page-transition ${transitionStage}`}>
      {displayChildren}
    </div>
  );
}
