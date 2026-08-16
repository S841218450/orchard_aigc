import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Select } from "antd";
import { Megaphone, Palette } from "lucide-react";
import ChatInput from "@/components/chat/chatInput/chatInput";
import type { MarketingImageFormData } from "@/actions/creationSchemas";
import type {
  FormSubmitHandle,
  FormSubmitState,
} from "@/app/creation/components/Aside/aside";

// 营销图
export const MarketingImage = forwardRef<
  FormSubmitHandle,
  {
    generateImage: (data: MarketingImageFormData) => void;
    // 上报提交能力（驱动布局层底部按钮禁用/加载态）
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
    </>
  );
});
MarketingImage.displayName = "MarketingImage";
