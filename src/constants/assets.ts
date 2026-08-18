import {
  FolderOpen,
  AlertCircle,
  User,
  Image as ImageIcon,
} from "lucide-react";

/**
 * 全局默认图片配置
 * 所有组件统一从这里引用，禁止在各组件内硬编码图片路径
 */
export const DEFAULT_IMAGES = {
  /** 品牌 logo（半透明底，用于浅色背景） */
  logo: "/logo.png",
  /** 品牌 logo 全图（用于 Header） */
  logoFull: "/logo_small.png",
  /** 默认用户头像（public/defaultUser.svg） */
  defaultAvatar: "/defaultUser.svg",
  /** 图片加载失败/无图时的兜底图 */
  fallback: "https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png",
} as const;

/**
 * 全局默认图标配置（lucide-react 组件）
 * 统一管理空状态、错误状态等场景图标
 */
export const DEFAULT_ICONS = {
  /** 空状态图标 */
  empty: FolderOpen,
  /** 错误状态图标 */
  error: AlertCircle,
  /** 用户图标 */
  user: User,
  /** 图片占位图标 */
  image: ImageIcon,
} as const;
