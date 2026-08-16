import type { LucideIcon } from "lucide-react";
import {
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Tv,
  Smartphone,
} from "lucide-react";

// 图片比例（固定比例，具体分辨率由后端换算）
export const PROPORTION_LIST = [
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

// 固定比例字符串 -> 宽高比数值（宽 / 高），供图片占位/骨架屏计算宽高比
export const PROPORTION_RATIO: Record<string, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "24:3": 24 / 3,
};

// 比例字符串 -> 宽高比数值（宽 / 高），无法识别时回退 1:1
export const getRatioValue = (proportion?: string): number =>
  (proportion && PROPORTION_RATIO[proportion]) || 1;

// 骨架屏占位卡片循环使用的比例
export const SKELETON_PROPORTIONS = ["1:1", "9:16", "16:9", "24:3"];

// 生图模型（不同模型支持的画面质量不同，切换模型时联动刷新质量列表）
export const CREATION_MODEL_LIST = [
  {
    value: "qwen-image-2.0-pro",
    label: "千问-2.0-pro",
    QualityList: ["2k"],
    defaultQuality: "2k",
  },
  {
    value: "Wan2.7",
    label: "万相2.7 image专业版",
    QualityList: ["2k"],
    defaultQuality: "2k",
  },
  {
    value: "qwen-image-3.0-pro",
    label: "千问-3.0-Pro",
    QualityList: ["1k", "2k"],
  },
  {
    value: "qwen-image-3.0",
    label: "千问-3.0",
    QualityList: ["1k", "2k"],
  },

  {
    value: "DouBao-Seedream-5.0-Lite",
    label: "DouBao-Seedream-5.0-Lite",
    QualityList: ["2k", "4k"],
  },
  {
    value: "DouBao-Seedream-5.0-Pro",
    label: "DouBao-Seedream-5.0-Pro",
    QualityList: ["1k", "2k", "4k"],
    disabled: false,
  },
];

// 默认模型（进入页面时按该模型的第一个画面质量初始化）
export const DEFAULT_CREATION_MODEL = CREATION_MODEL_LIST[0];

// 比例字符串（如 "16:9"）-> 方向图标组件
export const getRatioIcon = (ratio: string): LucideIcon => {
  const [w, h] = ratio.split(":").map(Number);
  if (w === h) return Square;
  if (w > h) return w / h >= 2 ? Tv : RectangleHorizontal;
  return h / w >= 2 ? Smartphone : RectangleVertical;
};

// 比例字符串（如 "16:9"）-> 中文描述
export const getRatioDesc = (ratio: string): string => {
  const [w, h] = ratio.split(":").map(Number);
  if (w === h) return "正方形";
  if (w > h) return w / h >= 2 ? "宽屏" : "横版";
  return h / w >= 2 ? "竖屏" : "竖版";
};
