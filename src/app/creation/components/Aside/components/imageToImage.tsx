"use client";
import { useState } from "react";
import { Button, Upload, Image, Popconfirm, Popover, Segmented } from "antd";
import type { UploadProps } from "antd";
import RadioGraph from "@/components/baseCom/radio/radioGraph";
import { ImageIcon, Loader2, Sparkles, Plus, X, Square } from "lucide-react";
import API from "@/api";
import messageManager from "@/utils/messageManager";
import type { ImageToImageFormData } from "@/actions/creationSchemas";
import TextArea from "antd/es/input/TextArea";
import { ImageEdit } from "@/components/baseCom/imageEdit/imageEdit";
import type { SelectionBox } from "@/components/baseCom/imageEdit/imageEdit";

// 最多允许上传的图片数量
const MAX_IMAGES = 4;

// 图生图
export const ImageToImage = ({
  activeKey,
  generateImage,
}: {
  activeKey: string;
  generateImage: (data: ImageToImageFormData) => void;
}) => {
  const { Dragger } = Upload;
  const [imagePrompt, setImagePrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<
    { id: number; url: string }[]
  >([
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1510001618818-4b4e3d86bf0f",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1507513319174-e556268bb244",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2",
    },
  ]); // 参考图片URL列表
  const [uploading, setUploading] = useState(false);
  const [referenceStrength, setReferenceStrength] = useState(2); // 图片参考强度
  const [imageQty, setImageQty] = useState(1); // 生成张数
  // 每张图片独立维护自己的选框集合（key 是图片 URL，value 是选框数组）
  const [boxesMap, setBoxesMap] = useState<Record<string, SelectionBox[]>>({});
  // 当前在 Popover 中打开的图片索引
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  // ================ 上传图片配置 ================
  const uploadProps: UploadProps = {
    name: "file",
    accept: "image/*",
    multiple: true,
    showUploadList: false,
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await API.uploadFile(formData);
        const fileUrl = res.data.fileUrl;
        setReferenceImages((prev) => {
          if (prev.length >= MAX_IMAGES) {
            messageManager.warning(`最多只能上传 ${MAX_IMAGES} 张图片`);
            return prev;
          }
          return [...prev, { id: Date.now(), url: fileUrl }];
        });
        onSuccess?.(res);
        messageManager.success("图片上传成功");
      } catch (e) {
        console.error("上传失败:", e);
        onError?.(e as Error);
        messageManager.error("图片上传失败，请重试");
      } finally {
        setUploading(false);
      }
    },
  };

  // 删除指定索引的图片（同时清理对应的选框数据）
  const handleRemoveImage = (index: number) => {
    const imgUrl = referenceImages[index];
    setBoxesMap((prev) => {
      const next = { ...prev };
      delete next[imgUrl.url];
      return next;
    });
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 子组件（ImageEdit）选框变化时同步保存，供缩略图角标统计
  const handleBoxesChange = (imgUrl: string, boxes: SelectionBox[]) => {
    setBoxesMap((prev) => ({ ...prev, [imgUrl]: boxes }));
  };

  // ================ 动态布局计算 ================
  // 当前总项数（图片张数 + 未达上限时追加 1 个"+"卡片）
  const itemsCount =
    referenceImages.length + (referenceImages.length < MAX_IMAGES ? 1 : 0);
  // 4 项及以上启用堆叠效果，否则平铺等宽铺满
  const isStacked = itemsCount >= 4;

  const handleSubmit = () => {
    if (referenceImages.length === 0) {
      messageManager.warning("请先上传参考图片");
      return;
    }
    generateImage({
      type: "image",
      prompt: imagePrompt,
      params: {
        imageQty,
        referenceIntensity: Number(referenceStrength),
      },
      originImageList: referenceImages,
    });
  };

  return (
    <>
      {/* 参考图片（独立区块，不再嵌套） */}
      <div className="aside-content">
        <div className="aside-title">
          <ImageIcon size={16} />
          <span>参考图片</span>
          <span className="image-count-hint">
            （{referenceImages.length}/{MAX_IMAGES}）
          </span>
        </div>
        <div className="upload-area">
          {referenceImages.length > 0 ? (
            <div
              className={`stacked-images ${
                isStacked ? "stacked-mode" : "linear-mode"
              } count-${itemsCount}`}
            >
              {referenceImages.map((img, index) => (
                <div
                  key={`${img.url}-${index}`}
                  className="stacked-image-item"
                  style={{
                    zIndex: isStacked ? index + 1 : 1,
                  }}
                >
                  {/* 用 Popover 包裹缩略图，点击弹出图片编辑组件 */}
                  <Popover
                    open={openPopoverIndex === index}
                    onOpenChange={(open) => {
                      setOpenPopoverIndex(open ? index : null);
                    }}
                    trigger="click"
                    placement="rightTop"
                    style={{ padding: 0 }}
                    className="image-edit-popover-wrapper"
                    content={
                      <div className="image-edit-close-wrap">
                        <ImageEdit
                          key={img.url}
                          imageUrl={img.url}
                          initialBoxes={boxesMap[img.url] ?? []}
                          onBoxesChange={(boxes) =>
                            handleBoxesChange(img.url, boxes)
                          }
                        />
                        {/* 右上角关闭按钮 */}
                        <button
                          type="button"
                          className="image-edit-close-btn"
                          onClick={() => setOpenPopoverIndex(null)}
                          aria-label="关闭编辑面板"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    }
                  >
                    <div className="thumbnail-wrapper">
                      <Image
                        src={img.url}
                        alt={`参考图 ${index + 1}`}
                        className="stacked-preview-img"
                        preview={{ open: false }}
                      />
                      {/* 已选框数量角标 */}
                      {(boxesMap[img.url]?.length ?? 0) > 0 && (
                        <span className="thumbnail-box-badge">
                          <Square size={10} />
                          {boxesMap[img.url]!.length}
                        </span>
                      )}
                    </div>
                  </Popover>

                  <Popconfirm
                    title="确认删除该参考图？"
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleRemoveImage(index)}
                  >
                    <Button
                      type="text"
                      danger
                      shape="circle"
                      size="small"
                      icon={<X size={12} />}
                      className="stacked-remove-btn"
                    />
                  </Popconfirm>
                </div>
              ))}

              {/* 追加上传卡片：Dragger 支持拖拽上传，未达到上限时显示 */}
              {referenceImages.length < MAX_IMAGES && (
                <div
                  className="stacked-image-item stacked-add-item"
                  style={{
                    zIndex: isStacked ? referenceImages.length + 1 : 1,
                  }}
                >
                  <Dragger {...uploadProps} className="stacked-add-dragger">
                    {uploading ? (
                      <div className="uploading-state">
                        <Loader2 size={20} className="spin" />
                        <span>上传中...</span>
                      </div>
                    ) : (
                      <Plus size={28} />
                    )}
                  </Dragger>
                </div>
              )}
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
                  <p className="upload-hint">
                    支持 JPG、PNG 格式，最多 {MAX_IMAGES} 张
                  </p>
                </>
              )}
            </Dragger>
          )}
        </div>
      </div>

      {/* 参考强度（独立区块，与参考图平级） */}
      <div className="aside-content">
        <div className="aside-title">
          <Sparkles size={16} />
          <span>参考强度</span>
        </div>
        <RadioGraph
          name="referenceStrength"
          options={[
            { value: 1, label: "弱" },
            { value: 2, label: "中" },
            { value: 3, label: "强" },
          ]}
          value={referenceStrength}
          onChange={(v) => setReferenceStrength(Number(v))}
        />
      </div>
      <div className="aside-content">
        <div className="aside-title">
          <Sparkles size={16} />
          <span>生成张数</span>
        </div>
        <RadioGraph
          name="imageQty"
          options={[
            { value: 1, label: "1张" },
            { value: 2, label: "2张" },
            { value: 3, label: "3张" },
            { value: 4, label: "4张" },
          ]}
          value={imageQty}
          onChange={(v) => setImageQty(Number(v))}
        />
      </div>
      {/* 创作描述（独立区块） */}
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
