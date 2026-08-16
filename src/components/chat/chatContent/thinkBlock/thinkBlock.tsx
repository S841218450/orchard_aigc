"use client";

import { memo, useEffect, useState, type ReactNode } from "react";
import { Think } from "@ant-design/x";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import "./thinkBlock.scss";

/** 思考/执行过程折叠块（基于 antd X Think 统一封装）：
 * - 流式生成中展开并实时显示内容，完成后自动折叠；
 * - 不传 children 时以 markdown 渲染 text（如聊天思考链）；
 * - 传入 children 时渲染自定义内容（如创作执行步骤流列表）。 */
export interface ThinkBlockProps {
  /** markdown 文本内容（children 为空时生效） */
  text?: string;
  /** 是否已完成（完成前展开 + loading，完成后自动收起） */
  done: boolean;
  /** 折叠块标题 */
  title: ReactNode;
  /** markdown 自定义渲染组件（text 模式生效） */
  components?: Components;
  /** 自定义内容插槽（优先于 text 渲染） */
  children?: ReactNode;
}

const ThinkBlock = memo(function ThinkBlock({
  text = "",
  done,
  title,
  components,
  children,
}: ThinkBlockProps) {
  const [expanded, setExpanded] = useState(() => !done);
  useEffect(() => {
    if (done) setExpanded(false);
  }, [done]);
  return (
    <Think
      className="think-block"
      title={title}
      loading={!done}
      expanded={expanded}
      onExpand={setExpanded}
    >
      {children ?? (
        <div className="markdown-body think-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {text}
          </ReactMarkdown>
        </div>
      )}
    </Think>
  );
});
ThinkBlock.displayName = "ThinkBlock";

export { ThinkBlock };
export default ThinkBlock;
