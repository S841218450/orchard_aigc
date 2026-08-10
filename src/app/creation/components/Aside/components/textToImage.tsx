import { Input, Button, Popover, Image, Select } from "antd";
import { useState } from "react";
import { Palette, Box, Diamond, Images, Sparkles } from "lucide-react";
import { RightOutlined } from "@ant-design/icons";
import RadioGraph from "@/components/baseCom/radio/radioGraph";
import type { TextToImageFormData } from "@/actions/creationSchemas";

//风格内容
const StyleSelect = ({
  style,
  styleList,
  changeStyle,
}: {
  style: string;
  styleList: { value: string; label: string; url: string }[];
  changeStyle: (style: string) => void;
}) => {
  const currentStyle = styleList.find((item) => item.value === style);
  const styleContent = (
    <div className="style-popover">
      <div className="style-grid">
        {styleList.map((item) => (
          <div
            key={item.value}
            className={`style-item ${item.value === style ? "active" : ""}`}
            onClick={() => changeStyle(item.value)}
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
      getPopupContainer={(trigger) => trigger.parentElement || document.body}
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
export const TextToImage = ({
  generateImage,
}: {
  generateImage: (data: TextToImageFormData) => void;
}) => {
  const { TextArea } = Input;
  const [imagePrompt, setImagePrompt] = useState("");
  const [model, setModel] = useState("default");
  const [imageProportion, setImageProportion] = useState("1:1");
  const [imageQuality, setImageQuality] = useState("1080p");
  const [imageCount, setImageCount] = useState("1");
  const [imageQualityList, setImageQualityList] = useState([
    "1080p",
    "2k",
    "4k",
  ]);

  //模型选择(不同模型显示的画面质量不同,根据模型选择画面质量)
  const modelList = [
    {
      value: "default",
      label: "DouBao-Seedream-5.0-Lite 最新模型",
      QualityList: ["2k", "4k"],
    },
    {
      value: "DouBao-Seedream-5.0-Pro",
      label: "DouBao-Seedream-5.0-Pro",
      QualityList: ["1080p", "2k", "4k"],
    },
  ];
  const handleSetModel = (value: string) => {
    setModel(value);
    setImageQualityList(
      modelList.find((item) => item.value === value)?.QualityList || [],
    );
    setImageQuality(
      modelList.find((item) => item.value === value)?.QualityList?.[0] ||
        "1080p",
    );
  };
  //画面质量
  //画面风格
  const [style, setStyle] = useState("default");
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
  const handleSubmit = () => {
    const currentStyle = styleList.find((item) => item.value === style);
    const data: TextToImageFormData = {
      type: "image",
      prompt: imagePrompt,
      model,
      params: {
        style: currentStyle?.label || "智能匹配",
        imageProportion,
        imageQuality,
        imageCount: Number(imageCount),
      },
    };
    generateImage(data);
  };

  return (
    <>
      <div className="aside-content">
        <div className="aside-title">
          <Sparkles size={16} />
          <span>创作描述</span>
        </div>
        <TextArea
          value={imagePrompt}
          autoSize={{ minRows: 4, maxRows: 8 }}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="描述你想要生成的图片..."
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
          changeStyle={setStyle}
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
          options={modelList}
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
          <Diamond size={16} />
          <span>图片比例</span>
        </div>
        <Select
          value={imageProportion}
          size="large"
          onChange={setImageProportion}
          options={[
            { value: "1:1", label: "1:1 正方形" },
            { value: "4:3", label: "4:3 横版" },
            { value: "3:4", label: "3:4 竖版" },
            { value: "16:9", label: "16:9 宽屏" },
            { value: "9:16", label: "9:16 竖屏" },
          ]}
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
          onChange={(v) => setImageCount(v)}
        />
      </div>

      <Button
        type="primary"
        size="large"
        block
        onClick={handleSubmit}
        icon={<Sparkles size={16} />}
        className="generate-btn"
      >
        开始生成
      </Button>
    </>
  );
};
