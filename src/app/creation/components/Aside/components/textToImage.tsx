import { Popover, Image, Select } from "antd";
import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Palette, Box, Images, Sparkles, Scaling } from "lucide-react";
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

//风格选项
type StyleItem = { value: string; label: string; url: string };

//风格内容
const StyleSelect = ({
  style,
  styleList,
  changeStyle,
}: {
  style: string;
  styleList: StyleItem[];
  changeStyle: (item: StyleItem) => void;
}) => {
  // style 状态存的是风格名称（label），按 label 匹配当前选中项
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
// 文生图
export const TextToImage = forwardRef<
  FormSubmitHandle,
  {
    generateImage: (data: TextToImageFormData) => void;
    // 上报提交能力（驱动布局层底部按钮禁用/加载态）
    onStateChange?: (state: FormSubmitState) => void;
  }
>(({ generateImage, onStateChange }, ref) => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [model, setModel] = useState(DEFAULT_CREATION_MODEL.value);
  // 固定比例（如 "1:1"），具体分辨率由后端换算
  const [imageProportion, setImageProportion] = useState("1:1");
  // 进入页面时按当前（默认）模型选中第一个画面质量
  const [imageQuality, setImageQuality] = useState(
    DEFAULT_CREATION_MODEL.defaultQuality ||
      DEFAULT_CREATION_MODEL.QualityList[0] ||
      "2k",
  );
  const [imageCount, setImageCount] = useState("1");
  const [imageQualityList, setImageQualityList] = useState(
    DEFAULT_CREATION_MODEL.QualityList,
  );

  const handleSetModel = (value: string) => {
    const target = CREATION_MODEL_LIST.find((item) => item.value === value);
    setModel(value);
    setImageQualityList(target?.QualityList || []);
    setImageQuality(target?.defaultQuality || target?.QualityList?.[0] || "2k");
  };
  //画面风格
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

  // 暴露提交方法给布局层底部按钮
  useImperativeHandle(ref, () => ({ submit: handleSubmit }), [handleSubmit]);

  // 上报提交能力（文生图无必填前置条件，始终可提交）
  useEffect(() => {
    onStateChange?.({ canSubmit: true, submitting: false });
  }, [onStateChange]);

  return (
    <>
      <div className="aside-content">
        <div className="aside-title">
          <Sparkles size={16} />
          <span>创作描述</span>
        </div>

        <PromptInput
          prompt={imagePrompt}
          setPrompt={setImagePrompt}
          size="medium"
          style={style}
        />
      </div>
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
    </>
  );
});
TextToImage.displayName = "TextToImage";
