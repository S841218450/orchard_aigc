import { useRef, useEffect, type RefObject, type CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./backGround.scss";

// 确定性伪随机（种子固定，SSR / CSR 输出一致，避免 hydration mismatch）
function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 预生成光点数据（模块级，只执行一次）
const _rand = seededRandom(20240801);
const dotList = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: +(_rand() * 100).toFixed(4),
  top: +(_rand() * 100).toFixed(4),
  size: +(2 + _rand() * 3).toFixed(3),
  delay: +(_rand() * 8).toFixed(3),
  duration: +(6 + _rand() * 7).toFixed(3),
  tone: i % 4,
}));
export const BackGround = ({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement>;
}) => {
  const bgRef = useRef<HTMLDivElement>(null);
  const glowLayerRef = useRef<HTMLDivElement>(null);
  const dotsLayerRef = useRef<HTMLDivElement>(null);
  const decorationRef = useRef<HTMLDivElement>(null);
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);
  const glow3Ref = useRef<HTMLDivElement>(null);
  const glow4Ref = useRef<HTMLDivElement>(null);

  // GSAP 动效：入场分层渐显 + 柔光团缓慢漂移呼吸
  useGSAP(
    () => {
      if (!bgRef.current) return;

      const entranceTl = gsap.timeline();
      entranceTl
        .fromTo(
          glowLayerRef.current,
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.1, ease: "power3.out" },
        )
        .fromTo(
          dotsLayerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1.5, ease: "power2.out" },
          0.25,
        )
        .fromTo(
          decorationRef.current,
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
          0.4,
        );

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // 柔光团缓慢漂移 + 呼吸缩放
      const glowTl = gsap.timeline({ repeat: -1, yoyo: true });
      glowTl
        .to(glow1Ref.current, {
          xPercent: 9,
          yPercent: -7,
          scale: 1.1,
          duration: 13,
          ease: "sine.inOut",
        })
        .to(
          glow2Ref.current,
          {
            xPercent: -11,
            yPercent: 9,
            scale: 1.13,
            duration: 16,
            ease: "sine.inOut",
          },
          "<",
        )
        .to(
          glow3Ref.current,
          {
            xPercent: 7,
            yPercent: 11,
            scale: 0.9,
            duration: 12,
            ease: "sine.inOut",
          },
          "<",
        )
        .to(
          glow4Ref.current,
          {
            xPercent: -8,
            yPercent: 6,
            scale: 1.06,
            duration: 15,
            ease: "sine.inOut",
          },
          "<",
        );
    },
    { scope: bgRef },
  );

  // 鼠标视差：柔光层与光点层轻微错位，营造空间纵深
  useEffect(() => {
    if (!bgRef.current || !glowLayerRef.current || !dotsLayerRef.current)
      return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const glowX = gsap.quickTo(glowLayerRef.current, "x", {
      duration: 1.2,
      ease: "power3.out",
    });
    const glowY = gsap.quickTo(glowLayerRef.current, "y", {
      duration: 1.2,
      ease: "power3.out",
    });
    const dotsX = gsap.quickTo(dotsLayerRef.current, "x", {
      duration: 1.6,
      ease: "power3.out",
    });
    const dotsY = gsap.quickTo(dotsLayerRef.current, "y", {
      duration: 1.6,
      ease: "power3.out",
    });

    const onPointerMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      glowX(nx * 18);
      glowY(ny * 18);
      dotsX(nx * 34);
      dotsY(ny * 34);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      glowX.tween?.kill();
      glowY.tween?.kill();
      dotsX.tween?.kill();
      dotsY.tween?.kill();
    };
  }, [containerRef]);

  // 背景高度跟随滚动容器内容：父容器高度固定（100vh），用 scrollHeight 撑满整个可滚动内容，
  // 避免内容超出首屏后背景只覆盖 100vh 而滚动后露白
  useEffect(() => {
    const bg = bgRef.current;
    const container = containerRef.current;
    if (!bg || !container) return;

    let lastHeight = -1;
    const syncHeight = () => {
      const h = container.scrollHeight;
      if (h !== lastHeight) {
        lastHeight = h;
        bg.style.height = `${h}px`;
      }
    };

    syncHeight();

    // 内容增删（加载更多、搜索切换等）触发 DOM 变化时重新测量
    const mo = new MutationObserver(syncHeight);
    mo.observe(container, { childList: true, subtree: true });

    // 容器尺寸变化（窗口缩放等）时重新测量
    const ro = new ResizeObserver(syncHeight);
    ro.observe(container);

    // 图片等异步资源加载导致的高度变化，滚动时兜底同步
    container.addEventListener("scroll", syncHeight, { passive: true });

    return () => {
      mo.disconnect();
      ro.disconnect();
      container.removeEventListener("scroll", syncHeight);
    };
  }, [containerRef]);

  return (
    <div ref={bgRef} id="background-container">
      {/* 第一层：基底噪点 + 轻透色洗 */}
      <div className="bg-base-layer">
        <div className="bg-noise" />
        <div className="bg-base-radial" />
      </div>

      {/* 第二层：柔光团 */}
      <div ref={glowLayerRef} className="bg-glow-layer">
        <div ref={glow1Ref} className="bg-glow bg-glow-1" />
        <div ref={glow2Ref} className="bg-glow bg-glow-2" />
        <div ref={glow3Ref} className="bg-glow bg-glow-3" />
        <div ref={glow4Ref} className="bg-glow bg-glow-4" />
      </div>

      {/* 第三层：浮动光点 */}
      <div ref={dotsLayerRef} className="bg-dots-layer">
        {dotList.map((dot) => (
          <span
            key={dot.id}
            className={`bg-dot bg-dot--tone-${dot.tone}`}
            style={
              {
                left: `${dot.left}%`,
                top: `${dot.top}%`,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                "--dur": `${dot.duration}s`,
                "--delay": `${dot.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* 第四层：装饰环（左上、右下各一组同心环） */}
      <div ref={decorationRef} className="bg-decoration">
        <div className="bg-ring bg-ring-1" />
        <div className="bg-ring bg-ring-3" />
        <div className="bg-ring bg-ring-2" />
        <div className="bg-ring bg-ring-4" />
      </div>

      {/* 第五层：明暗遮罩，保证内容可读 */}
      <div className="bg-vignette" />
    </div>
  );
};
