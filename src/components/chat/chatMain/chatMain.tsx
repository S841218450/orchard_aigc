"use client";

import {
  ArrowUpRight,
  Bot,
  Code,
  FileText,
  Lightbulb,
  MessageSquareText,
  Search,
  Zap,
  Image as ImageIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./chatMain.scss";

interface OperationItem {
  type: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

interface Template {
  id: string;
  title: string;
  content: string;
}

interface ChatMainProps {
  chatType?: string;
  onSelectType?: (type: string) => void;
  onSelectTemplate?: (template: Template) => void;
}

const templates: Record<string, Template[]> = {
  text: [
    { id: "1", title: "写一篇文章", content: "帮我写一篇关于" },
    { id: "2", title: "产品介绍", content: "帮我写一段产品介绍文案，产品是" },
    { id: "3", title: "营销文案", content: "帮我写一段营销文案，目标受众是" },
    { id: "4", title: "邮件撰写", content: "帮我写一封邮件，主题是" },
  ],
  image: [
    { id: "1", title: "插画设计", content: "帮我生成一张插画，主题是" },
    { id: "2", title: "Logo 设计", content: "帮我设计一个 Logo，风格是" },
    { id: "3", title: "海报设计", content: "帮我设计一张海报，内容是" },
    { id: "4", title: "头像生成", content: "帮我生成一个头像，风格是" },
  ],
  code: [
    { id: "1", title: "React 组件", content: "帮我写一个 React 组件，功能是" },
    { id: "2", title: "API 接口", content: "帮我写一个 API 接口，功能是" },
    { id: "3", title: "工具函数", content: "帮我写一个工具函数，功能是" },
    { id: "4", title: "页面布局", content: "帮我写一个页面布局，需求是" },
  ],
};

export const ChatMain = ({
  chatType = "default",
  onSelectType,
  onSelectTemplate,
}: ChatMainProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // 欢迎区入场动画：品牌标 → 标题 → 副标题 → 引导卡片 stagger
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        ".chat-main-logo",
        { opacity: 0, y: -14, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55 },
      )
        .fromTo(
          ".chat-main-header h2",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.3",
        )
        .fromTo(
          ".chat-main-header p",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.45 },
          "-=0.4",
        )
        .fromTo(
          ".chat-main-operation-item",
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 },
          "-=0.3",
        );
    },
    { scope: mainRef },
  );

  const operations: OperationItem[] = [
    {
      type: "text",
      title: "文本创作",
      desc: "用文字描述你的创意",
      icon: <Zap size={24} />,
    },
    {
      type: "image",
      title: "图片生成",
      desc: "从图片开始设计",
      icon: <ImageIcon size={24} />,
    },
    {
      type: "code",
      title: "代码编写",
      desc: "生成代码片段",
      icon: <Code size={24} />,
    },
    {
      type: "random",
      title: "随机灵感",
      desc: "获取随机创意灵感",
      icon: <Search size={24} />,
    },
  ];

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    onSelectType?.(type);
  };

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate?.(template);
  };

  // 无会话时的知识库问答引导卡片：点击后直接向助手提问
  const knowledgeTemplates: OperationItem[] = [
    {
      type: "knowledge-summary",
      title: "总结知识库",
      desc: "梳理全库脉络，掌握核心要点",
      icon: <FileText size={20} />,
    },
    {
      type: "knowledge-search",
      title: "查找资料",
      desc: "按需检索，精准定位资料",
      icon: <Search size={20} />,
    },
    {
      type: "knowledge-advice",
      title: "方案建议",
      desc: "结合资料，给出可行建议",
      icon: <Lightbulb size={20} />,
    },
    {
      type: "knowledge-qa",
      title: "快速问答",
      desc: "基于知识库，即刻为你解答",
      icon: <MessageSquareText size={20} />,
    },
  ];
  // 引导卡片对应的预设提问
  const presetQuestions: Record<string, string> = {
    "knowledge-summary": "请帮我总结一下知识库中的主要内容和核心要点",
    "knowledge-search": "请帮我检索知识库中关于项目背景与目标的信息",
    "knowledge-advice": "请结合知识库中的内容，给我提出几条可行的建议",
    "knowledge-qa": "请基于知识库内容回答我的问题",
  };

  const renderTemplates = () => {
    if (!selectedType || !templates[selectedType]) return null;

    return (
      <div className="template-list">
        <h4 className="template-title">选择模板</h4>
        <div className="template-grid">
          {templates[selectedType].map((template) => (
            <div
              key={template.id}
              className="template-item"
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="template-icon">
                {selectedType === "text" && <FileText size={18} />}
                {selectedType === "image" && <ImageIcon size={18} />}
                {selectedType === "code" && <Code size={18} />}
              </div>
              <span className="template-name">{template.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (chatType === "creation") {
    return (
      <div className="chat-main" ref={mainRef}>
        <div className="chat-main-logo" aria-hidden="true">
          <Bot size={30} strokeWidth={1.8} />
        </div>
        <div className="chat-main-header">
          <h2>你想从哪里开始设计</h2>
          <p>选择一种创作方式开始</p>
        </div>
        <div className="chat-main-operation">
          {operations.map((item) => (
            <div
              onClick={() => handleSelectType(item.type)}
              className={`chat-main-operation-item ${selectedType === item.type ? "active" : ""}`}
              key={item.type}
            >
              <div className="operation-icon">{item.icon}</div>
              <div className="operation-info">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {renderTemplates()}
      </div>
    );
  }

  return (
    <div className="chat-main flex-center" ref={mainRef}>
      <div className="chat-main-logo" aria-hidden="true">
        <Bot size={32} strokeWidth={1.8} />
      </div>
      <div className="chat-main-header">
        <h2>你好，我是你的 AI 智能助手</h2>
        <p>我可以基于知识库中的信息，回答你的问题</p>
      </div>
      <div className="chat-main-operation">
        {knowledgeTemplates.map((item) => (
          <div
            key={item.type}
            className="chat-main-operation-item"
            onClick={() =>
              onSelectTemplate?.({
                id: item.type,
                title: item.title,
                content: presetQuestions[item.type],
              })
            }
          >
            <div className="operation-icon">{item.icon}</div>
            <div className="operation-info">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
            <ArrowUpRight size={14} className="card-arrow" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatMain;
