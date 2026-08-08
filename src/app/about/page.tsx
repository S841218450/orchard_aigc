"use client";

import "./about.scss";
import { useRef, type CSSProperties } from "react";
import { Card, Tag } from "antd";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Headphones,
  Rocket,
  Mail,
  MessageCircle,
  Code2,
} from "lucide-react";
import NextImage from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI 智能创作",
    desc: "基于前沿大模型，支持文生图、图生图与营销图等多场景创作",
  },
  {
    icon: Zap,
    title: "极速生成",
    desc: "分布式算力调度，秒级响应创作需求，灵感不等待",
  },
  {
    icon: ShieldCheck,
    title: "数据安全",
    desc: "创作资产云端加密存储，多重防护保障你的数据安全",
  },
  {
    icon: Headphones,
    title: "贴心服务",
    desc: "专属 AI 客服 7×24 在线，随时解答创作过程中的问题",
  },
  {
    icon: Rocket,
    title: "持续进化",
    desc: "模型与能力持续迭代升级，创作体验不断突破",
  },
];

// 半圆弧线排列参数：卡片右对齐，中间卡片向左凸出（相对卡片自身宽度百分比）
const ARC_OFFSET_MAX = 46; // 中间卡片最大左移量（%）

// 预计算每张卡片的弧线偏移量（确定性，SSR/CSR 一致）
const positionedFeatures = FEATURES.map((feature, i) => {
  const angle = -90 + (i * 180) / (FEATURES.length - 1); // 角度：-90°(顶) → 90°(底)
  const rad = (angle * Math.PI) / 180;
  return {
    ...feature,
    arcOffset: Math.cos(rad) * ARC_OFFSET_MAX, // 端点 0%，中间最大
  };
});

const CONTACTS = [
  { icon: Code2, label: "开源社区", value: "github.com/orchard-aigc" },
  { icon: Mail, label: "合作邮箱", value: "841218450@qq.com" },
  { icon: MessageCircle, label: "微信", value: "S841218450" },
];

const AboutPage = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);
  const glow3Ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // 品牌卡入场
      gsap.fromTo(
        brandRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          clearProps: "transform",
        },
      );

      // 特色卡片沿弧线依次入场（只动画 opacity，避免覆盖 transform 变量）
      gsap.fromTo(
        cardsRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: "power2.out",
          delay: 0.25,
        },
      );

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // 背景柔光团缓慢漂移 + 呼吸
      const glowTl = gsap.timeline({ repeat: -1, yoyo: true });
      glowTl
        .to(glow1Ref.current, {
          xPercent: 12,
          yPercent: -8,
          scale: 1.15,
          duration: 14,
          ease: "sine.inOut",
        })
        .to(
          glow2Ref.current,
          {
            xPercent: -14,
            yPercent: 10,
            scale: 0.9,
            duration: 17,
            ease: "sine.inOut",
          },
          "<",
        )
        .to(
          glow3Ref.current,
          {
            xPercent: 9,
            yPercent: 12,
            scale: 1.1,
            duration: 15,
            ease: "sine.inOut",
          },
          "<",
        );
    },
    { scope: pageRef },
  );

  return (
    <div ref={pageRef} className="about-page">
      {/* 背景动画层 */}
      <div className="about-bg">
        <div ref={glow1Ref} className="about-glow about-glow-1" />
        <div ref={glow2Ref} className="about-glow about-glow-2" />
        <div ref={glow3Ref} className="about-glow about-glow-3" />
        <div className="about-dots" />
        <div className="about-vignette" />
      </div>

      <div className="about-content">
        {/* 品牌介绍（稍微往中间靠） */}
        <Card ref={brandRef} className="about-brand-card">
          <div className="brand-logo">
            <span className="brand-logo-ring" aria-hidden="true" />
            <span className="brand-logo-orb" aria-hidden="true" />
            <NextImage
              src="/logo_opcity.png"
              alt="巧思-AI智能创作平台"
              width={72}
              height={72}
              loading="eager"
            />
          </div>
          <h2 className="brand-name">巧思</h2>
          <Tag color="default" className="brand-tag">
            AI 智能创作平台
          </Tag>
          <p className="brand-intro">
            巧思是一个面向个人与团队的 AI
            智能创作平台，以「让创作更简单」为使命，
            汇聚文生图、图生图、营销素材等多维度创作能力，帮助每一位创作者将灵感快速落地为作品。
          </p>
          <div className="brand-meta">
            <span>当前版本：v1.0.0</span>
            <span>上线时间：2025</span>
          </div>
          <span className="brand-card-shine" aria-hidden="true" />
        </Card>

        {/* 平台特色 */}
        <div className="about-section">
          <div className="features-grid">
            {positionedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="feature-card"
                  style={
                    {
                      "--arc-offset": `${feature.arcOffset}%`,
                      "--translate-x": `${(index - 2) * 28}px`,
                    } as CSSProperties
                  }
                  ref={(el) => {
                    if (el) cardsRef.current[index] = el;
                  }}
                >
                  <div className="flex-gap-10">
                    <div className="feature-icon">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="feature-title">{feature.title}</h3>
                      <p className="feature-desc">{feature.desc}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* 联系我们 */}
      <div className="about-footer">
        <div className="contact-card">
          {CONTACTS.map((contact) => {
            const Icon = contact.icon;
            return (
              <div key={contact.value} className="contact-item">
                <div className="contact-icon">
                  <Icon size={18} />
                </div>
                <span className="contact-value">
                  <span className="contact-label">{contact.label}</span>
                  {contact.value}
                </span>
              </div>
            );
          })}
        </div>
        <p className="copyright">© 2026 巧思 · AI 智能创作平台 保留所有权利</p>
      </div>
    </div>
  );
};

export default AboutPage;
