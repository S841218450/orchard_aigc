import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactNode,
} from "react";
import { Select } from "antd";
import { Megaphone, Palette } from "lucide-react";
import ChatInput from "@/components/chat/chatInput/chatInput";
import type { MarketingImageFormData } from "@/actions/creationSchemas";
import type {
  FormSubmitHandle,
  FormSubmitState,
} from "@/app/creation/components/Aside/aside";

const SectionHead = ({
  index,
  label,
  hint,
}: {
  index: string;
  label: string;
  hint?: ReactNode;
}) => (
  <div className="aside-section-head">
    <span className="aside-section-index">{index}</span>
    <span className="aside-section-label">{label}</span>
    {hint && <span className="aside-section-hint">{hint}</span>}
  </div>
);

// 营销图
export const MarketingImage = forwardRef<
  FormSubmitHandle,
  {
    generateImage: (data: MarketingImageFormData) => void;
    onStateChange?: (state: FormSubmitState) => void;
  }
>(({ generateImage, onStateChange }, ref) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [style, setStyle] = useState("modern");

  const handleSubmit = useCallback(() => {
    generateImage({ title, subtitle, style });
  }, [title, subtitle, style, generateImage]);

  // 暴露提交方法给布局层底部按钮
  useImperativeHandle(ref, () => ({ submit: handleSubmit }), [handleSubmit]);

  // 上报提交能力（营销图无必填前置条件，始终可提交）
  useEffect(() => {
    onStateChange?.({ canSubmit: true, submitting: false });
  }, [onStateChange]);

  return (
    <>
      {/* 第一节：文案 */}
      {/* <div className="aside-section">
        <SectionHead index="01" label="文案" hint="Copy" />

        <div className="aside-content">
          <div className="aside-title">
            <Megaphone size={16} />
            <span>主标题</span>
          </div>
          <ChatInput
            value={title}
            onChange={setTitle}
            sendMessage={handleSubmit}
            placeholder="输入营销主标题..."
          />
        </div>

        <div className="aside-content">
          <div className="aside-title">
            <span>副标题</span>
          </div>
          <ChatInput
            value={subtitle}
            onChange={setSubtitle}
            sendMessage={handleSubmit}
            placeholder="输入副标题..."
          />
        </div>
      </div> */}

      {/* 第二节：风格（保留原样：antd Select） */}
      {/* <div className="aside-section">
        <SectionHead index="02" label="视觉风格" hint="Style" />

        <div className="aside-content">
          <div className="aside-title">
            <Palette size={16} />
            <span>营销风格</span>
          </div>
          <Select
            value={style}
            size="large"
            onChange={setStyle}
            options={[
              { value: "modern", label: "现代简约" },
              { value: "luxury", label: "高端奢华" },
              { value: "playful", label: "活泼趣味" },
              { value: "professional", label: "商务专业" },
            ]}
          />
        </div>
      </div> */}
      <div className="flex-center H100">视频生成功能正在开发中，敬请期待！</div>
    </>
  );
});
MarketingImage.displayName = "MarketingImage";
