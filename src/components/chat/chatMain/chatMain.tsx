"use client";

import {
  Code,
  FileText,
  Search,
  Palette,
  Zap,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import NextImage from "next/image";
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
      <div className="chat-main animate__animated animate__fadeIn">
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
    <div className="chat-main animate__animated animate__fadeIn flex-center">
      <p className="chat-main-desc">
        我是你的 AI 智能助手，可以根据知识库中的信息，回答你的问题哦
      </p>
    </div>
  );
};

export default ChatMain;
