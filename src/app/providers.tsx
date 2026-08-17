"use client";

import { ConfigProvider, App } from "antd";
import { useEffect } from "react";
import { messageManager } from "@/utils/messageManager";

const theme = {
  token: {
    // ---- 主色：黑色 ----
    colorPrimary: "#111111",
    colorPrimaryBg: "#F7F7F7",
    colorPrimaryBgHover: "#EAEAEA",
    colorPrimaryBorder: "#EAEAEA",
    colorPrimaryBorderHover: "#2A2A2A",
    colorPrimaryHover: "#2A2A2A",
    colorPrimaryActive: "#000000",
    colorPrimaryTextHover: "#2A2A2A",
    colorPrimaryText: "#111111",
    colorPrimaryTextActive: "#000000",

    // ---- 语义色 ----
    colorSuccess: "#52B788",
    colorSuccessBg: "#E8F5EE",
    colorSuccessBorder: "#52B788",
    colorWarning: "#F0A030",
    colorWarningBg: "#FFF8E8",
    colorWarningBorder: "#F0A030",
    colorError: "#E54D4D",
    colorErrorBg: "#FDE8E8",
    colorErrorBorder: "#E54D4D",
    colorInfo: "#111111",
    colorInfoBg: "#F7F7F7",
    colorInfoBorder: "#EAEAEA",

    // ---- 文字 ----
    colorText: "#111111",
    colorTextSecondary: "#4A4A4A",
    colorTextTertiary: "#8A8A8A",
    colorTextQuaternary: "#D1D1D1",
    colorTextDisabled: "#D1D1D1",

    // ---- 背景 ----
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorBgLayout: "#FFFFFF",
    colorBgSpotlight: "#F7F7F7",
    colorBgMask: "rgba(0, 0, 0, 0.45)",

    // ---- 边框 ----
    colorBorder: "#EAEAEA",
    colorBorderSecondary: "#F7F7F7",
    colorBorderBg: "#FFFFFF",

    // ---- 填充 ----
    colorFill: "rgba(17, 17, 17, 0.06)",
    colorFillSecondary: "rgba(17, 17, 17, 0.04)",
    colorFillTertiary: "rgba(17, 17, 17, 0.02)",
    colorFillQuaternary: "rgba(17, 17, 17, 0.01)",

    // ---- 圆角 ----
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    borderRadiusOuter: 4,

    // ---- 字体 ----
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,
    fontSizeHeading1: 28,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    lineHeight: 1.5714,
    lineHeightLG: 1.5,
    lineHeightSM: 1.6667,

    // ---- 阴影 ----
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)",
    boxShadowSecondary:
      "0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)",
    boxShadowTertiary:
      "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",

    // ---- 控件 ----
    controlHeight: 36,
    controlHeightLG: 44,
    controlHeightSM: 28,
    controlHeightXS: 24,

    // ---- 链接 ----
    colorLink: "#111111",
    colorLinkHover: "#2A2A2A",
    colorLinkActive: "#000000",

    // ---- 动效 ----
    motionDurationFast: "0.15s",
    motionDurationMid: "0.2s",
    motionDurationSlow: "0.3s",
    motionEaseInOut: "cubic-bezier(0.645, 0.045, 0.355, 1)",
    motionEaseOut: "cubic-bezier(0.215, 0.61, 0.355, 1)",
  },
  components: {
    // ---- 按钮 ----
    Button: {
      primaryShadow: "none",
      defaultShadow: "none",
      defaultBg: "#FFFFFF",
      defaultBorderColor: "#EAEAEA",
      defaultColor: "#2A2A2A",
      defaultHoverBg: "#FFFFFF",
      defaultHoverBorderColor: "#111111",
      defaultHoverColor: "#111111",
      defaultActiveBg: "#F7F7F7",
      defaultActiveBorderColor: "#111111",
      defaultActiveColor: "#111111",
      primaryColor: "#FFFFFF",
      dangerColor: "#FFFFFF",
      borderRadius: 8,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },

    // ---- 输入框 ----
    Input: {
      activeBorderColor: "#111111",
      hoverBorderColor: "#2A2A2A",
      activeShadow: "0 0 0 2px rgba(17, 17, 17, 0.06)",
      addonBg: "#F7F7F7",
    },

    // ---- 选择器 ----
    Select: {
      optionSelectedBg: "#F7F7F7",
      optionSelectedColor: "#111111",
      optionActiveBg: "#F7F7F7",
      optionSelectedFontWeight: 600,
    },

    // ---- 菜单 ----
    Menu: {
      itemSelectedBg: "#F7F7F7",
      itemSelectedColor: "#111111",
      itemHoverBg: "#F7F7F7",
      itemHoverColor: "#111111",
      itemActiveBg: "#EAEAEA",
      subMenuItemBg: "#FFFFFF",
      itemColor: "#4A4A4A",
      itemHeight: 40,
      iconSize: 16,
      collapsedIconSize: 18,
    },

    // ---- 卡片 ----
    Card: {
      colorBgContainer: "#FFFFFF",
      headerFontSize: 16,
      headerFontSizeSM: 14,
      headerHeight: 56,
      headerHeightSM: 44,
      paddingLG: 24,
    },

    // ---- 弹窗 ----
    Modal: {
      contentBg: "#FFFFFF",
      headerBg: "transparent",
      titleColor: "#111111",
      titleFontSize: 16,
      paddingLG: 24,
      borderRadiusLG: 12,
    },

    // ---- 表格 ----
    Table: {
      headerBg: "#F7F7F7",
      headerColor: "#111111",
      headerSortActiveBg: "#EAEAEA",
      rowHoverBg: "#F7F7F7",
      rowSelectedBg: "#F7F7F7",
      rowSelectedHoverBg: "#EAEAEA",
      borderColor: "#EAEAEA",
      headerBorderRadius: 8,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },

    // ---- 标签页 ----
    Tabs: {
      inkBarColor: "#111111",
      itemActiveColor: "#111111",
      itemHoverColor: "#2A2A2A",
      itemColor: "#8A8A8A",
      itemSelectedColor: "#111111",
      cardBg: "#FFFFFF",
      cardHeight: 40,
      cardPadding: "8px 16px",
    },

    // ---- 标签 ----
    Tag: {
      defaultBg: "#F7F7F7",
      defaultColor: "#4A4A4A",
      borderRadiusSM: 4,
    },

    // ---- 头像 ----
    Avatar: {
      colorBgContainer: "#F7F7F7",
      colorTextPlaceholder: "#8A8A8A",
      groupOverlapping: -8,
    },

    // ---- 徽标 ----
    Badge: {
      dotSize: 6,
      textFontSize: 12,
      textFontSizeSM: 10,
    },

    // ---- 开关 ----
    Switch: {
      colorPrimary: "#111111",
      colorPrimaryHover: "#2A2A2A",
    },

    // ---- 复选框 ----
    Checkbox: {
      colorPrimary: "#111111",
      colorPrimaryHover: "#2A2A2A",
    },

    // ---- 单选框 ----
    Radio: {
      colorPrimary: "#111111",
      colorPrimaryHover: "#2A2A2A",
      buttonSolidCheckedBg: "#111111",
      buttonColor: "#4A4A4A",
      buttonBg: "#FFFFFF",
      buttonCheckedBg: "#111111",
      buttonCheckedColor: "#FFFFFF",
    },

    // ---- 表单 ----
    Form: {
      labelColor: "#2A2A2A",
      labelRequiredMarkColor: "#E54D4D",
      labelFontSize: 14,
      verticalLabelPadding: "0 0 8px",
    },

    // ---- 分页 ----
    Pagination: {
      itemActiveBg: "#111111",
      itemActiveColorDisabled: "#FFFFFF",
      itemBg: "#FFFFFF",
      itemSize: 36,
      itemSizeSM: 28,
    },

    // ---- 下拉菜单 ----
    Dropdown: {
      colorBgElevated: "#FFFFFF",
      controlItemBgActive: "#F7F7F7",
      controlItemBgActiveHover: "#EAEAEA",
      controlItemBgHover: "#F7F7F7",
    },

    // ---- 上传 ----
    Upload: {
      actionsColor: "#4A4A4A",
    },

    // ---- 进度条 ----
    Progress: {
      colorSuccess: "#111111",
      remainingColor: "#F7F7F7",
    },

    // ---- 气泡卡片 ----
    Popover: {
      colorBgElevated: "#FFFFFF",
    },

    // ---- 文字提示 ----
    Tooltip: {
      colorBgSpotlight: "#111111",
      colorTextLightSolid: "#FFFFFF",
    },

    // ---- 消息 ----
    Message: {
      contentBg: "#FFFFFF",
    },

    // ---- 通知 ----
    Notification: {
      colorBgElevated: "#FFFFFF",
    },

    // ---- 抽屉 ----
    Drawer: {
      colorBgElevated: "#FFFFFF",
    },

    // ---- 加载 ----
    Spin: {
      colorPrimary: "#111111",
    },
  },
  algorithm: undefined, // 使用默认算法，不使用暗色算法
  // 零运行时 CSS 变量模式：主题 token 以 CSS 变量注入，减少运行时 JS 样式计算
  cssVar: { prefix: "ant" },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      <App>
        <MessageProvider>{children}</MessageProvider>
      </App>
    </ConfigProvider>
  );
}

function MessageProvider({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp();

  useEffect(() => {
    messageManager.setMessageApi(message);
  }, [message]);

  return <>{children}</>;
}
