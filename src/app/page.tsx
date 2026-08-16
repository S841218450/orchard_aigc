"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Input, Segmented } from "antd";
import { Search, Lightbulb, Images, Video, MessageCircle } from "lucide-react";
import { BackGround } from "@/components/home/backGround/backGround";
import { getAssetDataList } from "@/actions/asset";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { messageManager } from "@/utils/messageManager";

import MaterialList from "@/components/home/materialList/materialList";
import ChatInput from "@/components/chat/chatInput/chatInput";
import { type MaterialItem, type MaterialListResponse } from "@/actions/home";

import "./page.scss";

const segmentedOptions = [
  { label: "发现", value: 1 },
  { label: "图片", value: 2 },
  { label: "短片", value: 3 },
  { label: "活动", value: 4 },
];

// 素材每页数量（与服务端分页保持一致）
const PAGE_SIZE = 12;

// 首页素材列表适配：调用素材接口（asset），返回结果适配为首页 MaterialItem 列表
const fetchAssetList = async (
  keyword: string = "",
  pageNum: number = 1,
): Promise<MaterialListResponse> => {
  const result = await getAssetDataList({
    type: null,
    tag: null,
    query: keyword || null,
    pageNum,
    pageSize: PAGE_SIZE,
  });
  if (!result.success) {
    if (!result.canceled) {
      messageManager.error(result.error ?? "获取素材列表失败");
    }
    // success 为 false 或请求被取消：无数据返回空列表
    return { list: [], hasMore: false };
  }
  const list = (result.data ?? []).map((item) => ({
    id: item.id,
    authorName: item.authorName,
    authorAvatar: item.authorAvatar ?? "",
    url: item.url,
    userId: item.userId,
    image: item.url,
    title: item.prompt,
    prompt: item.prompt,
    createTime: item.createTime,
    likeCount: item.likeCount,
    liked: item.liked,
    params: {
      style: item.params?.style ?? "",
      imageQuality: item.params?.imageQuality ?? "",
      imageProportion: item.params?.imageProportion ?? "1:1",
    },
  }));
  return {
    list,
    // 返回条数满一页视为还有更多，否则视为末页
    hasMore: list.length >= PAGE_SIZE,
  };
};

// 标题
const TitleText = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      if (!titleRef.current) return;

      const chars = titleRef.current.querySelectorAll(".title-char");

      gsap.set(chars, {
        display: "inline-block",
        transformOrigin: "center bottom",
        y: 40,
        opacity: 0,
        rotate: 4,
      });

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // 入场：逐字错落自下而上 + 回正，营造编辑部式的排印张力
      const entranceTl = gsap.timeline({ delay: 0.25 });
      entranceTl.to(chars, {
        y: 0,
        rotate: 0,
        opacity: 1,
        duration: 0.85,
        ease: "power3.out",
        stagger: { each: 0.06, from: "start" },
      });

      // 柔和副标：紧随标题落定后淡入
      const sub =
        titleRef.current.parentElement?.querySelector<HTMLElement>(
          ".title-eyebrow",
        );
      if (sub) {
        gsap.fromTo(
          sub,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", delay: 0.7 },
        );
      }

      if (reduced) return;

      // 周期性的「呼吸波浪」：保留原有灵动感，但只在落定后轻微起伏
      const waveTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 7,
        delay: 5.4,
      });

      waveTl.to(chars, {
        y: -6,
        scale: 1.02,
        color: "#ffac79",
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.08,
      });

      waveTl.to(
        chars,
        {
          y: 0,
          scale: 1,
          color: "#111111",
          duration: 0.5,
          ease: "elastic.out(1, 0.5)",
          stagger: 0.08,
        },
        "+=0.1",
      );

      return () => {
        entranceTl.kill();
        waveTl.kill();
      };
    },
    { scope: titleRef },
  );
  return (
    <div className="chat-main">
      <span className="title-eyebrow">
        <em className="title-eyebrow-lat">巧&nbsp;思</em>
        <span className="title-eyebrow-cn">创作的另一种可能</span>
      </span>
      <h1 ref={titleRef}>
        <span className="title-char">开</span>
        <span className="title-char">始</span>
        <span className="title-char">你</span>
        <span className="title-char">的</span>
        {/* <span className="title-char logo-char">
          <NextImage
            width={100}
            height={50}
            src={DEFAULT_IMAGES.logo}
            alt="logo"
          />
        </span> */}
        <span className="title-char">创</span>
        <span className="title-char">作</span>
        <span className="title-char">之</span>
        <span className="title-char">旅</span>
      </h1>
    </div>
  );
};

// 输入类型（受控组件：active 由父级 Home 统一持有，消除多处 state 不同步）
const InputType = ({
  active,
  onTabChange,
}: {
  active: number;
  onTabChange: (value: number) => void;
}) => {
  const inputTypeRef = useRef<HTMLDivElement>(null);

  // 选中时播放渐变扫光动画
  // 用 scope + CSS 选择器定位，避开 ref 时序 + ref 规则双问题
  useGSAP(
    () => {
      if (!inputTypeRef.current) return;
      const shimmer = inputTypeRef.current.querySelector<HTMLDivElement>(
        `.input-type-item.active .shimmer-layer`,
      );
      if (!shimmer) return;

      gsap.killTweensOf(shimmer);
      gsap.set(shimmer, { opacity: 0, backgroundPosition: "160% 0" });
      gsap.fromTo(
        shimmer,
        { opacity: 0 },
        {
          opacity: 1,
          backgroundPosition: "-60% 0",
          duration: 1.0,
          ease: "power3.out",
          onComplete: () => {
            gsap.to(shimmer, {
              opacity: 0,
              duration: 0.3,
              ease: "power1.out",
            });
          },
        },
      );
    },
    { dependencies: [active], scope: inputTypeRef },
  );

  const inputTypeList = [
    {
      title: "巧思实现",
      desc: "根据你的描述生成你的创意",
      icon: <Lightbulb />,
      value: 1,
    },
    {
      title: "创意联想",
      desc: "上传一张图片，生成相关创意",
      icon: <Images />,
      value: 2,
    },
    { title: "视频生成", desc: "上传短片", icon: <Video />, value: 3 },
    {
      title: "智能客服",
      desc: "开始你的AI智能客服",
      icon: <MessageCircle />,
      value: 4,
    },
  ];
  return (
    <div className="input-type" ref={inputTypeRef}>
      {inputTypeList.map((item) => (
        <div
          data-value={item.value}
          className={`input-type-item ${active === item.value ? "active" : ""}`}
          key={item.value}
          onClick={() => onTabChange(item.value)}
        >
          <div className="shimmer-layer" />
          <div className="input-type-icon">{item.icon}</div>
          <div className="input-type-content">
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeTab, setActiveTab] = useState(1);
  const inputRef = useRef(input);
  const containerRef = useRef<HTMLDivElement>(null);

  const { setInitialMessage } = useChatStore();

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // 素材列表滚动分页：首屏自动加载，滚动到底部加载下一页，关键词变化自动重置
  const fetchByPage = useCallback(
    (pageNum: number) => fetchAssetList(searchKeyword, pageNum),
    [searchKeyword],
  );
  const {
    list: materialList,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMore,
    retry,
  } = useInfiniteList<MaterialItem>({
    fetcher: fetchByPage,
    refreshDeps: [searchKeyword],
    containerRef,
  });

  // 切换输入类型 / 素材分类（activeTab 单一数据源，驱动输入卡 + 工具栏 Segmented + 路由）
  const handleTabChange = (value: number) => {
    setActiveTab(value);
  };

  // 发送消息
  const handleSend = () => {
    const currentInput = inputRef.current.trim();
    if (!currentInput || isLoading) return;
    setInitialMessage(currentInput);
    setInput("");
    if (activeTab === 4) {
      // 智能客服
      router.push("/chat");
    } else {
      // 其他输入类型（巧思实现、创意联想、上传短片）
      router.push("/creation");
    }
  };

  return (
    <div className="home-page" ref={containerRef}>
      <BackGround className="H100 W100" containerRef={containerRef} />
      <div className="home-title">
        <TitleText />
        {/* 输入框 */}
        <ChatInput
          sendMessage={handleSend}
          leftOpration={null}
          rightOpration={null}
        />
        {/* 输入类型 */}
        <InputType active={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* 编辑条：分类 Tab + 搜索 + 结果计数（与输入类型共用同一 activeTab 状态） */}
      <div className="search-bar-wrapper">
        <div className="search-toolbar">
          <Segmented<string>
            options={segmentedOptions.map((item) => item.label)}
            value={activeTab.toString()}
            onChange={(value) => setActiveTab(Number(value))}
          />
          <span className="search-toolbar-divider" aria-hidden="true" />
          <Input
            prefix={<Search size={16} />}
            onInput={(e) =>
              setSearchKeyword((e.target as HTMLInputElement).value)
            }
            placeholder="搜索素材..."
          />
          <span className="search-toolbar-count">
            {searchKeyword ? (
              <>
                “{searchKeyword}” · {materialList.length} 件
              </>
            ) : (
              <>灵感图库 · {materialList.length} 件</>
            )}
          </span>
        </div>
      </div>

      <div className="data-list">
        <MaterialList
          list={materialList}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={loadMore}
          onRetry={retry}
          scrollerRef={containerRef}
        />
      </div>
    </div>
  );
}
