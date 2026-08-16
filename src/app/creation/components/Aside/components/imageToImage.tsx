"use client";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Image, Popover, Select } from "antd";
import RadioGraph from "@/components/baseCom/radio/radioGraph";
import {
  ImageIcon,
  Sparkles,
  X,
  Square,
  Box,
  Images,
  Scaling,
  Gauge,
} from "lucide-react";
import API from "@/api";
import messageManager from "@/utils/messageManager";
import { useCreationEditStore } from "@/store/creation";
import type { ImageToImageFormData } from "@/actions/creationSchemas";
import type {
  FormSubmitHandle,
  FormSubmitState,
} from "@/app/creation/components/Aside/aside";
import TextArea from "antd/es/input/TextArea";
import { ImageEdit } from "@/components/baseCom/imageEdit/imageEdit";
import type { SelectionBox } from "@/components/baseCom/imageEdit/imageEdit";
import { bakeBoxesToImage } from "@/utils/imageBake";
import { BaseUpload } from "@/components/baseCom/upload/baseUpload";
import type { UploadImageItem } from "@/components/baseCom/upload/baseUpload";
import {
  CREATION_MODEL_LIST,
  DEFAULT_CREATION_MODEL,
  PROPORTION_LIST,
  getRatioIcon,
  getRatioDesc,
} from "@/constants/creationModel";

// 最多允许上传的图片数量
const MAX_IMAGES = 4;

// ==================== 分区标题（编辑排印式） ====================
const SectionHead = ({
  index,
  label,
  hint,
}: {
  index: string;
  label: string;
  hint?: string;
}) => (
  <div className="aside-section-head">
    <span className="aside-section-index">{index}</span>
    <span className="aside-section-label">{label}</span>
    {hint && <span className="aside-section-hint">{hint}</span>}
  </div>
);

// 图生图
export const ImageToImage = forwardRef<
  FormSubmitHandle,
  {
    generateImage: (data: ImageToImageFormData) => void;
    // 历史记录"修改图片"传入的图片 URL（消费后自动清除）
    editImageUrl?: string | null;
    // 上报提交能力（驱动布局层底部按钮禁用/加载态）
    onStateChange?: (state: FormSubmitState) => void;
  }
>(({ generateImage, editImageUrl, onStateChange }, ref) => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<
    { id: number; url: string }[]
  >([]); // 参考图片URL列表
  // 提交处理中（烘焙选框并重新上传）
  const [submitting, setSubmitting] = useState(false);
  const [referenceStrength, setReferenceStrength] = useState(2); // 图片参考强度
  const [imageQty, setImageQty] = useState(1); // 生成张数
  const [model, setModel] = useState(DEFAULT_CREATION_MODEL.value); // 生图模型

  const [imageProportion, setImageProportion] = useState("1:1");
  // 每张图片独立维护自己的选框集合（key 是图片 URL，value 是选框数组）
  const [boxesMap, setBoxesMap] = useState<Record<string, SelectionBox[]>>({});
  // 当前在 Popover 中打开的图片索引
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  // 历史记录"修改图片"传入的图片：加入参考图列表并清除待处理标记
  useEffect(() => {
    if (!editImageUrl) return;
    setReferenceImages((prev) =>
      prev.some((img) => img.url === editImageUrl)
        ? prev
        : [...prev, { id: Date.now(), url: editImageUrl }],
    );
    useCreationEditStore.getState().clearEditImage();
  }, [editImageUrl]);

  // ================ 参考图交互回调 ================
  // 子组件（ImageEdit）选框变化时同步保存，供缩略图角标统计
  const handleBoxesChange = (imgUrl: string, boxes: SelectionBox[]) => {
    setBoxesMap((prev) => ({ ...prev, [imgUrl]: boxes }));
  };

  // 删除图片前清理对应的选框数据（列表移除由 BaseUpload 内部完成）
  const handleRemoveImage = (item: UploadImageItem) => {
    setBoxesMap((prev) => {
      const next = { ...prev };
      delete next[item.url];
      return next;
    });
  };

  // 缩略图渲染：点击弹出 ImageEdit 标注面板（含选框数量角标）
  const renderThumbnail = (item: UploadImageItem, index: number) => (
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
            key={item.url}
            imageUrl={item.url}
            initialBoxes={boxesMap[item.url] ?? []}
            onBoxesChange={(boxes) => handleBoxesChange(item.url, boxes)}
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
          src={item.url}
          alt={`参考图 ${index + 1}`}
          className="stacked-preview-img"
          preview={{ open: false }}
        />
        {/* 已选框数量角标 */}
        {(boxesMap[item.url]?.length ?? 0) > 0 && (
          <span className="thumbnail-box-badge">
            <Square size={10} />
            {boxesMap[item.url]!.length}
          </span>
        )}
      </div>
    </Popover>
  );

  const handleSubmit = useCallback(async () => {
    if (referenceImages.length === 0) {
      messageManager.warning("请先上传参考图片");
      return;
    }
    setSubmitting(true);
    try {
      // 有选框的图片：把选框烘焙进原图像素后重新上传，用烘焙图替换提交列表中的原图
      const originImageList: { id: number; url: string }[] = [];
      let fallbackCount = 0;
      for (const img of referenceImages) {
        const boxes = boxesMap[img.url];
        if (!boxes || boxes.length === 0) {
          originImageList.push(img);
          continue;
        }
        try {
          const blob = await bakeBoxesToImage(img.url, boxes);
          if (!blob) {
            fallbackCount += 1;
            originImageList.push(img);
            continue;
          }
          const formData = new FormData();
          formData.append("file", blob, `baked-${Date.now()}.png`);
          const res = await API.uploadFile(formData);
          originImageList.push({ id: img.id, url: res.data.fileUrl });
        } catch {
          fallbackCount += 1;
          originImageList.push(img);
        }
      }
      if (fallbackCount > 0) {
        messageManager.warning(
          `${fallbackCount} 张图片的选框未能写入原图，将按原图提交`,
        );
      }
      generateImage({
        type: "image",
        prompt: imagePrompt,
        model,
        params: {
          imageQty,
          imageProportion,
          referenceIntensity: Number(referenceStrength),
        },
        originImageList,
      });
    } catch (e) {
      console.error("提交失败:", e);
      messageManager.error("提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }, [
    referenceImages,
    boxesMap,
    imagePrompt,
    model,
    imageQty,
    imageProportion,
    referenceStrength,
    generateImage,
  ]);

  // 暴露提交方法给布局层底部按钮
  useImperativeHandle(ref, () => ({ submit: handleSubmit }), [handleSubmit]);

  // 上报提交能力：至少一张参考图才允许提交
  useEffect(() => {
    onStateChange?.({
      canSubmit: referenceImages.length > 0,
      submitting,
    });
  }, [referenceImages.length, submitting, onStateChange]);

  return (
    <>
      {/* 第一节：灵感与参考（素材输入为主角） */}
      <div className="aside-section">
        <SectionHead index="01" label="灵感与参考" hint="Reference" />

        <div className="aside-content">
          <div className="aside-title">
            <span className="aside-title-icon">
              <ImageIcon />
            </span>
            <span>参考图片</span>
            <span className="image-count-hint">
              （{referenceImages.length}/{MAX_IMAGES}）
            </span>
            <span className="image-annotate-hint">点击缩略图可进行标注</span>
          </div>
          <BaseUpload
            type="image"
            images={referenceImages}
            onChange={setReferenceImages}
            maxImages={MAX_IMAGES}
            renderThumbnail={renderThumbnail}
            onRemove={handleRemoveImage}
          />
        </div>

        <div className="aside-content">
          <div className="aside-title">
            <span className="aside-title-icon">
              <Sparkles />
            </span>
            <span>创作描述</span>
          </div>
          <TextArea
            value={imagePrompt}
            autoSize={{ minRows: 4, maxRows: 10 }}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder={
              !referenceImages.length
                ? "请先上传参考图"
                : "你可以说：" +
                  (referenceImages.length == 1
                    ? "将图中红色标注区域替换为xx"
                    : "将图1的xx替换成图二的图案")
            }
          />
        </div>

        <div className="aside-content">
          <div className="aside-title">
            <span className="aside-title-icon">
              <Gauge />
            </span>
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
      </div>

      {/* 第二节：画面与输出（保留原样：antd Select + RadioGraph） */}
      <div className="aside-section">
        <SectionHead index="02" label="画面与输出" hint="参数" />

        <div className="aside-content">
          <div className="aside-title">
            <Box size={16} />
            <span>生图模型</span>
          </div>
          <Select
            value={model}
            size="large"
            onChange={setModel}
            options={CREATION_MODEL_LIST}
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
      </div>
    </>
  );
});
ImageToImage.displayName = "ImageToImage";
