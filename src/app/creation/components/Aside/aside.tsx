"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, ImageIcon, Megaphone } from "lucide-react";
import { Button } from "antd";
import "./aside.scss";
import { createWork } from "@/actions/creation";
import type {
  CreateWorkInput,
  GenerateWorkData,
} from "@/actions/creationSchemas";
import type { WorkMessage } from "@/actions/types";
import messageManager from "@/utils/messageManager";
import { useCreationEditStore } from "@/store/creation";
import type { CreationMenuKey, CarryImage } from "@/store/creation";
import { TextToImage } from "@/app/creation/components/Aside/components/textToImage";
import { ImageToImage } from "@/app/creation/components/Aside/components/imageToImage";
import { MarketingImage } from "@/app/creation/components/Aside/components/marketingImage";

// 表单组件向布局层上报的提交能力状态（驱动底部按钮禁用/加载态）
export interface FormSubmitState {
  canSubmit: boolean;
  submitting: boolean;
}

// 表单组件通过 forwardRef 暴露的提交句柄（底部按钮点击时调用）
export interface FormSubmitHandle {
  submit: () => void;
}

/** 首页输入框跳转携带的创作数据（消费后收敛进本地 state，供子表单挂载时预填） */
interface CarryData {
  menu: CreationMenuKey;
  prompt: string;
  images: CarryImage[];
}

const menuItems = [
  { key: "textToImage", label: "文生图", icon: Sparkles },
  { key: "imageToImage", label: "图生图", icon: ImageIcon },
  { key: "marketingImage", label: "视频生成", icon: Megaphone },
];

export const Aside = ({
  onMenuChange,
  setChatMessage,
}: {
  onMenuChange?: (menu: string) => void;
  setChatMessage: (data: WorkMessage) => void;
}) => {
  const [menu, setMenu] = useState("textToImage");
  // 历史记录点击"修改图片"时携带的待处理图片 URL
  const editImageUrl = useCreationEditStore((s) => s.editImageUrl);
  // 首页输入框跳转携带的目标菜单 / 描述 / 参考图
  const initialMenu = useCreationEditStore((s) => s.initialMenu);
  const initialPrompt = useCreationEditStore((s) => s.initialPrompt);
  const initialImages = useCreationEditStore((s) => s.initialImages);
  const clearInitialData = useCreationEditStore((s) => s.clearInitialData);
  // 携带数据的一次性收敛结果（消费后清空 store，避免刷新/返回后残留）
  const [carryData, setCarryData] = useState<CarryData | null>(null);
  // 当前表单的提交句柄（点击底部按钮时调用）
  const formRef = useRef<FormSubmitHandle>(null);
  // 当前表单上报的提交能力，切换菜单时重置，由新挂载的表单重新上报
  const [submitState, setSubmitState] = useState<FormSubmitState>({
    canSubmit: false,
    submitting: false,
  });

  // ---- 滑动高亮指示器：测量选中项位置，平滑过渡 ----
  const toolbarRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    ready: false,
  });

  // 测量当前选中项在 toolbar 内的偏移与宽度，驱动指示器滑动
  const updateIndicator = useCallback(() => {
    const idx = menuItems.findIndex((item) => item.key === menu);
    const el = itemRefs.current[idx];
    const toolbar = toolbarRef.current;
    if (!el || !toolbar) return;
    setIndicator({
      left: el.offsetLeft,
      width: el.offsetWidth,
      ready: true,
    });
  }, [menu]);

  // 选中项变化时重测；挂载/容器尺寸变化时也重测，避免窗口缩放后指示器错位
  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);
  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  // 切换菜单
  const handleMenuChange = (key: string) => {
    setMenu(key);
    onMenuChange?.(key);
    setSubmitState({ canSubmit: false, submitting: false });
  };

  // 历史记录点击"修改图片"时自动切换到图生图
  useEffect(() => {
    if (!editImageUrl) return;
    // 同步 setState 用 queueMicrotask 包裹，避免 React19 级联渲染告警
    queueMicrotask(() => {
      setMenu("imageToImage");
      onMenuChange?.("imageToImage");
      setSubmitState({ canSubmit: false, submitting: false });
    });
  }, [editImageUrl, onMenuChange]);

  // 首页输入框携带的数据：一次性收敛进本地 state 并清空 store
  useEffect(() => {
    if (!initialMenu || carryData) return;
    // 同步 setState 用 queueMicrotask 包裹，避免 React19 级联渲染告警
    queueMicrotask(() => {
      setCarryData({
        menu: initialMenu,
        prompt: initialPrompt ?? "",
        images: initialImages ?? [],
      });
      clearInitialData();
    });
  }, [initialMenu, initialPrompt, initialImages, carryData, clearInitialData]);

  // 携带的菜单生效（覆盖默认文生图，切换时重置提交能力状态）
  useEffect(() => {
    if (!carryData) return;
    // 同步 setState 用 queueMicrotask 包裹，避免 React19 级联渲染告警
    queueMicrotask(() => {
      setMenu(carryData.menu);
      onMenuChange?.(carryData.menu);
      setSubmitState({ canSubmit: false, submitting: false });
    });
  }, [carryData, onMenuChange]);

  // 提交创作描述
  const generateImage = async (data: GenerateWorkData) => {
    try {
      // 图生图/营销图表单数据尚未与 createWorkSchema 完全对齐，先收敛为 schema 入参类型
      const result = await createWork(data as CreateWorkInput);
      if (result.success) {
        //保存消息到历史记录中
        setChatMessage(result.data);
      } else {
        messageManager.error(result.error ?? "生成失败");
      }
    } catch (error) {
      messageManager.error("生成失败");
      console.error("createWork失败:", error);
    }
  };

  const getPage = () => {
    // 仅携带目标为文生图时，才对文生图表单预填描述
    const carryTextPrompt =
      carryData?.menu === "textToImage" ? carryData.prompt : undefined;
    switch (menu) {
      case "textToImage":
        return (
          <TextToImage
            ref={formRef}
            generateImage={generateImage}
            onStateChange={setSubmitState}
            initialPrompt={carryTextPrompt}
          />
        );
      case "imageToImage":
        return (
          <ImageToImage
            ref={formRef}
            generateImage={generateImage}
            editImageUrl={editImageUrl}
            onStateChange={setSubmitState}
            initialImages={
              carryData?.menu === "imageToImage" ? carryData.images : undefined
            }
            initialPrompt={
              carryData?.menu === "imageToImage" ? carryData.prompt : undefined
            }
          />
        );
      case "marketingImage":
        return (
          <MarketingImage
            ref={formRef}
            generateImage={generateImage}
            onStateChange={setSubmitState}
          />
        );
      default:
        return (
          <TextToImage
            ref={formRef}
            generateImage={generateImage}
            onStateChange={setSubmitState}
            initialPrompt={carryTextPrompt}
          />
        );
    }
  };

  return (
    <div className="creation-aside">
      {/* 顶部悬浮胶囊：功能切换（与生图输入区错位隔离） */}
      <div className="aside-toolbar" ref={toolbarRef}>
        {/* 滑动高亮指示器：跟随选中项平滑滑动（背景圆角 + 底部暖琥珀短线） */}
        <div
          className="toolbar-indicator"
          aria-hidden="true"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
            opacity: indicator.ready ? 1 : 0,
          }}
        />
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.key}
              type="text"
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className={`toolbar-item ${menu === item.key ? "active" : ""}`}
              onClick={() => handleMenuChange(item.key)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </div>
      {/* 右侧主区：可滚动表单 + 固定底部提交按钮 */}
      <div className="aside-main">
        <div className="aside-body">{getPage()}</div>
        <div className="aside-footer">
          <Button
            type="primary"
            size="large"
            block
            disabled={!submitState.canSubmit || menu === "marketingImage"}
            loading={submitState.submitting}
            onClick={() => formRef.current?.submit()}
            icon={<Sparkles size={16} />}
            className="generate-btn"
          >
            开始生成
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Aside;
