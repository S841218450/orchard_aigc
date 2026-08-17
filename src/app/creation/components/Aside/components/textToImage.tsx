import { Popover, Image, Select } from "antd";
import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  type ReactNode,
} from "react";
import {
  Palette,
  Sparkles,
  Scaling,
  Box,
  Images,
} from "lucide-react";
import { RightOutlined } from "@ant-design/icons";
import RadioGraph from "@/components/baseCom/radio/radioGraph";
import type { TextToImageFormData } from "@/actions/creationSchemas";
import type {
  FormSubmitHandle,
  FormSubmitState,
} from "@/app/creation/components/Aside/aside";
import PromptInput from "@/components/creation/promptInput/promptInput";
import {
  CREATION_MODEL_LIST,
  DEFAULT_CREATION_MODEL,
  PROPORTION_LIST,
  getRatioIcon,
  getRatioDesc,
} from "@/constants/creationModel";

// ==================== 分区标题（编辑排印式） ====================
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

// ==================== 画面风格 ====================
type StyleItem = { value: string; label: string; url: string };

const StyleSelect = ({
  style,
  styleList,
  changeStyle,
}: {
  style: string;
  styleList: StyleItem[];
  changeStyle: (item: StyleItem) => void;
}) => {
  const currentStyle = styleList.find((item) => item.label === style);
  const styleContent = (
    <div className="style-popover">
      <div className="style-grid">
        {styleList.map((item) => (
          <div
            key={item.value}
            className={`style-item ${item.label === style ? "active" : ""}`}
            onClick={() => changeStyle(item)}
          >
            {item.url ? (
              <div className="style-item-img">
                <Image src={item.url} alt={item.label} preview={false} />
              </div>
            ) : (
              <div className="style-item-placeholder">
                <Palette size={20} />
              </div>
            )}
            <span className="style-item-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <Popover
      placement="rightTop"
      title="画面风格"
      trigger="click"
      content={styleContent}
      // 渲染到 body，避免被 aside 内部 overflow hidden/auto 容器裁剪并导致方向翻转
      getPopupContainer={() => document.body}
    >
      <div className="style-select-card">
        {currentStyle?.url ? (
          <div className="style-select-img">
            <Image
              src={currentStyle.url}
              alt={currentStyle.label}
              preview={false}
            />
          </div>
        ) : (
          <div className="style-select-placeholder">
            <Palette size={24} />
          </div>
        )}
        <div className="style-select-info flex-1">
          <span className="style-select-label">
            {currentStyle?.label || "智能匹配"}
          </span>
          <span className="style-select-hint">点击选择风格</span>
        </div>
        <div>
          <RightOutlined className="fs-12" />
        </div>
      </div>
    </Popover>
  );
};

// ==================== 文生图 ====================
export const TextToImage = forwardRef<
  FormSubmitHandle,
  {
    generateImage: (data: TextToImageFormData) => void;
    onStateChange?: (state: FormSubmitState) => void;
    /** 首页输入框携带的描述文字（挂载时预填） */
    initialPrompt?: string;
  }
>(({ generateImage, onStateChange, initialPrompt }, ref) => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [model, setModel] = useState(DEFAULT_CREATION_MODEL.value);
  const [imageProportion, setImageProportion] = useState("1:1");
  const [imageQuality, setImageQuality] = useState(
    DEFAULT_CREATION_MODEL.defaultQuality ||
      DEFAULT_CREATION_MODEL.QualityList[0] ||
      "2k",
  );
  const [imageCount, setImageCount] = useState("1");
  const [imageQualityList, setImageQualityList] = useState(
    DEFAULT_CREATION_MODEL.QualityList,
  );

  // 首页输入框带入的描述：挂载后预填一次
  useEffect(() => {
    if (!initialPrompt) return;
    setImagePrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSetModel = (value: string) => {
    const target = CREATION_MODEL_LIST.find((item) => item.value === value);
    setModel(value);
    setImageQualityList(target?.QualityList || []);
    setImageQuality(target?.defaultQuality || target?.QualityList?.[0] || "2k");
  };
  const [style, setStyle] = useState("智能匹配");
  const styleList = [
    { value: "default", label: "智能匹配", url: "" },
    { value: "1", label: "商业写实", url: "" },
    { value: "2", label: "轻奢大片", url: "" },
    { value: "3", label: "INS 清新", url: "" },
    { value: "4", label: "国潮插画", url: "" },
    { value: "5", label: "扁平简约", url: "" },
    { value: "6", label: "3D 渲染", url: "" },
    { value: "7", label: "电影广告", url: "" },
    { value: "8", label: "复古美式", url: "" },
  ];
  const handleSubmit = useCallback(() => {
    const data: TextToImageFormData = {
      type: "image",
      prompt: imagePrompt,
      model,
      params: {
        style: style || "智能匹配",
        imageProportion,
        imageQuality,
        imageCount: Number(imageCount),
      },
    };
    generateImage(data);
  }, [
    imagePrompt,
    model,
    style,
    imageProportion,
    imageQuality,
    imageCount,
    generateImage,
  ]);

  useImperativeHandle(ref, () => ({ submit: handleSubmit }), [handleSubmit]);

  useEffect(() => {
    onStateChange?.({ canSubmit: true, submitting: false });
  }, [onStateChange]);

  return (
    <>
      {/* 第一节：灵感描述（表单主角，放大） */}
      <div className="aside-section">
        <SectionHead index="01" label="灵感描述" hint="Prompt" />
        <div className="aside-content">
          <div className="aside-title">
            <span className="aside-title-icon">
              <Sparkles />
            </span>
            <span>创作描述</span>
          </div>
          <PromptInput
            prompt={imagePrompt}
            setPrompt={setImagePrompt}
            size="medium"
            style={style}
          />
        </div>
      </div>

      {/* 第二节：画面与输出（保留原样：antd Select + 风格画廊 + RadioGraph） */}
      <div className="aside-section">
        <SectionHead index="02" label="画面与输出" hint="参数" />

        <div className="aside-content">
          <div className="aside-title">
            <Palette size={16} />
            <span>画面风格</span>
          </div>
          <StyleSelect
            style={style}
            styleList={styleList}
            changeStyle={(value) => setStyle(value.label)}
          />
        </div>

        <div className="aside-content">
          <div className="aside-title">
            <Box size={16} />
            <span>生图模型</span>
          </div>
          <Select
            value={model}
            size="large"
            onChange={(value) => handleSetModel(value)}
            options={CREATION_MODEL_LIST}
          />
        </div>

        <div className="aside-content">
          <div className="aside-title">
            <Palette size={16} />
            <span>画面质量</span>
          </div>
          <Select
            value={imageQuality}
            size="large"
            onChange={setImageQuality}
            options={imageQualityList.map((item) => ({
              value: item,
              label: item,
            }))}
          />
        </div>

        <div className="aside-content">
          <div className="aside-title">
            <Scaling size={16} />
            <span>图片比例</span>
          </div>
          <Select
            value={imageProportion}
            size="large"
            onChange={setImageProportion}
            options={PROPORTION_LIST.map((item) => {
              const Icon = getRatioIcon(item.label);
              return {
                value: item.value,
                label: (
                  <span className="ratio-option">
                    <Icon size={14} />
                    {item.label} {getRatioDesc(item.label)}
                  </span>
                ),
              };
            })}
          />
        </div>

        <div className="aside-content">
          <div className="aside-title">
            <Images size={16} />
            <span>生图张数</span>
          </div>
          <RadioGraph
            name="textImageCount"
            options={[
              { value: "1", label: "1 张" },
              { value: "2", label: "2 张" },
              { value: "3", label: "3 张" },
              { value: "4", label: "4 张" },
            ]}
            value={imageCount}
            onChange={(v) => setImageCount(String(v))}
          />
        </div>
      </div>
    </>
  );
});
TextToImage.displayName = "TextToImage";
