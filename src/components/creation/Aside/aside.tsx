import { useState } from "react";
import { Button, Select, Upload, App, Image, Input, Popover } from "antd";
import { RightOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
  Wand2,
  Palette,
  Box,
  Diamond,
  Images,
  Sparkles,
  ImageIcon,
  Megaphone,
  Loader2,
} from "lucide-react";
import "./aside.scss";
import ChatInput from "@/components/chat/chatInput/chatInput";
import RadioGraph from "@/components/baseCom/radio/radioGraph";
import API from "@/api";

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
const TextToImage = ({
  activeKey,
  generateImage,
}: {
  activeKey: string;
  generateImage: (data: any) => void;
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
    const data = {
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
          options={[
            { value: "1", label: "1 张" },
            { value: "2", label: "2 张" },
            { value: "3", label: "3 张" },
            { value: "4", label: "4 张" },
          ]}
          value={imageCount}
          onChange={setImageCount}
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

// 图生图
const ImageToImage = ({
  activeKey,
  generateImage,
}: {
  activeKey: string;
  generateImage: (data: any) => void;
}) => {
  const { message } = App.useApp();
  const { Dragger } = Upload;
  const [imagePrompt, setImagePrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 上传图片配置
  const uploadProps: UploadProps = {
    name: "file",
    accept: "image/*",
    showUploadList: false,
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await API.uploadFile(formData);
        setReferenceImage(res.data.fileUrl);
        onSuccess?.(res);
        message.success("图片上传成功");
      } catch (e) {
        console.error("上传失败:", e);
        onError?.(e as Error);
        message.error("图片上传失败，请重试");
      } finally {
        setUploading(false);
      }
    },
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
  };

  const handleSubmit = () => {
    if (!referenceImage) {
      message.warning("请先上传参考图片");
      return;
    }
    generateImage({ activeKey, prompt: imagePrompt, referenceImage });
  };

  return (
    <>
      <div className="aside-content">
        <div className="aside-title">
          <ImageIcon size={16} />
          <span>参考图片</span>
        </div>
        <div className="upload-area">
          {referenceImage ? (
            <div className="preview-container">
              <Image
                src={referenceImage}
                alt="参考图"
                className="preview-img"
              />
              <button className="remove-btn" onClick={handleRemoveImage}>
                ×
              </button>
            </div>
          ) : (
            <Dragger {...uploadProps} className="upload-placeholder">
              {uploading ? (
                <div className="uploading-state">
                  <Loader2 size={24} className="spin" />
                  <span>上传中...</span>
                </div>
              ) : (
                <>
                  <ImageIcon size={24} />
                  <p>点击或拖拽上传图片</p>
                  <p className="upload-hint">支持 JPG、PNG 格式</p>
                </>
              )}
            </Dragger>
          )}
        </div>
      </div>
      <div className="aside-content">
        <div className="aside-title">
          <Sparkles size={16} />
          <span>创作描述</span>
        </div>
        <ChatInput
          value={imagePrompt}
          onChange={setImagePrompt}
          sendMessage={handleSubmit}
          placeholder="描述你想要的效果..."
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

// 营销图
const MarketingImage = ({
  activeKey,
  generateImage,
}: {
  activeKey: string;
  generateImage: (data: any) => void;
}) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [style, setStyle] = useState("modern");

  const handleSubmit = () => {
    generateImage({ activeKey, title, subtitle, style });
  };

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

const menuItems = [
  { key: "textToImage", label: "文生图", icon: Sparkles },
  { key: "imageToImage", label: "图生图", icon: ImageIcon },
  { key: "marketingImage", label: "营销图", icon: Megaphone },
];

export const Aside = ({
  onMenuChange,
  setChatMessage,
}: {
  onMenuChange?: (menu: string) => void;
  setChatMessage: (data: any) => void;
}) => {
  const { message } = App.useApp();
  const [menu, setMenu] = useState("textToImage");

  // 切换菜单
  const handleMenuChange = (key: string) => {
    setMenu(key);
    onMenuChange?.(key);
  };

  // 提交创作描述
  const generateImage = async (data: any) => {
    try {
      const res = await API.createWork(data);
      //保存消息到历史记录中
      setChatMessage(res.data);
    } catch (error) {
      message.error("生成失败");
      console.error("createWork失败:", error);
    }
  };

  const getPage = () => {
    switch (menu) {
      case "textToImage":
        return <TextToImage activeKey={menu} generateImage={generateImage} />;
      case "imageToImage":
        return <ImageToImage activeKey={menu} generateImage={generateImage} />;
      case "marketingImage":
        return (
          <MarketingImage activeKey={menu} generateImage={generateImage} />
        );
      default:
        return <TextToImage activeKey={menu} generateImage={generateImage} />;
    }
  };

  return (
    <div className="creation-aside">
      <div className="aside-header">
        <Wand2 size={20} />
        <span>创作助手</span>
      </div>
      <div className="aside-toolbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`toolbar-item ${menu === item.key ? "active" : ""}`}
              onClick={() => handleMenuChange(item.key)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="aside-body">{getPage()}</div>
    </div>
  );
};

export default Aside;
