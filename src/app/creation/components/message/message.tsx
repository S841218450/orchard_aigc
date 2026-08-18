import {
  LoadingOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { formatDate } from "@/utils/timeUtils";
import {
  Image,
  Popconfirm,
  Button,
  Spin,
  Result,
  Radio,
  Checkbox,
  Flex,
  Tooltip,
  Input,
  Tag,
} from "antd";
import Loading from "@/components/core/loadding/loading";
import { useState, useCallback, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import { useScroll } from "ahooks";
import {
  Copy,
  Trash2,
  RotateCcw,
  Palette,
  Image as ImageIcon,
  Maximize2,
  Sparkles,
  Check,
  Loader2,
  X,
  Images,
  MoveRight,
  Timer,
} from "lucide-react";
import ThinkBlock from "@/components/chat/chatContent/thinkBlock/thinkBlock";
import type {
  SelectListItem,
  SelectAnswer,
  WorkMessage,
} from "@/actions/types";
import { WORK_STATUS_MAP } from "@/actions/types";
import { DEFAULT_IMAGES } from "@/constants/assets";
import messageManager from "@/utils/messageManager";
import { useCreationEditStore } from "@/store/creation";
import { createAsset } from "@/actions/asset";

/** 补充问题选项 */
export type { SelectListItem, SelectAnswer, WorkMessage };

// ==================== 消息列表项组件 ====================
interface MessageItemProps {
  message: WorkMessage;
  onRetry?: (message: WorkMessage) => void;
  onSelectSubmit?: (message: WorkMessage, answers: SelectAnswer[]) => void;
  onDelete?: (message: WorkMessage) => void;
  onRegenerate?: (message: WorkMessage) => void;
}

// ========== 问题选择相关 =========
const SelectList = ({
  selectList,
  onSelectSubmit,
}: {
  selectList: SelectListItem[];
  onSelectSubmit?: (answers: SelectAnswer[]) => void;
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const CUSTOM_VALUE = "__custom__";

  const handleSelectChange = (question: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  // 提交补充问题答案
  const handleSubmitSelect = () => {
    if (!selectList || !onSelectSubmit) return;
    const formatted: SelectAnswer[] = selectList.map((item) => {
      const selected = answers[item.question] || "";
      const customVal = customInputs[item.question] || "";

      // 单选：直接替换
      if (selected === CUSTOM_VALUE) {
        return { question: item.question, options: customVal };
      }

      // 多选：替换列表中的 __custom__
      if (selected.includes(CUSTOM_VALUE)) {
        const replaced = selected
          .split(",")
          .map((v) => (v === CUSTOM_VALUE ? customVal : v))
          .filter(Boolean)
          .join(",");
        return { question: item.question, options: replaced };
      }

      return { question: item.question, options: selected };
    });
    onSelectSubmit(formatted);
  };

  const currentItem = selectList[currentIndex];
  const isLast = currentIndex === selectList.length - 1;
  const isCustomSelected = answers[currentItem?.question] === CUSTOM_VALUE;
  const currentAnswered =
    !!answers[currentItem?.question] &&
    (isCustomSelected ? !!customInputs[currentItem?.question] : true);

  return (
    <div className="supplementary-section">
      {/* 步骤条指示器 */}
      <div className="step-indicator">
        {selectList.map((item, index) => (
          <div
            key={index}
            className={`step-dot ${index === currentIndex ? "active" : ""} ${
              answers[item.question] ? "completed" : ""
            }`}
          />
        ))}
      </div>

      {/* 当前问题 */}
      <div className="supplementary-item">
        <div className="step-header">
          <span className="step-number">{currentIndex + 1}</span>
          <span className="step-total">/{selectList.length}</span>
        </div>

        <p className="supplementary-question">{`${currentItem.question} (${currentItem.select_type})`}</p>
        {currentItem.select_type === "单选" ? (
          <Radio.Group
            vertical
            onChange={(e) =>
              handleSelectChange(currentItem.question, e.target.value)
            }
            value={answers[currentItem.question]}
            options={currentItem.options.map((opt) =>
              opt.includes("自定义")
                ? {
                    value: CUSTOM_VALUE,
                    label: (
                      <>
                        <span>{opt}</span>
                        {isCustomSelected && (
                          <Input
                            value={customInputs[currentItem.question] || ""}
                            onChange={(e) => {
                              e.stopPropagation();
                              setCustomInputs((prev) => ({
                                ...prev,
                                [currentItem.question]: e.target.value,
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            variant="filled"
                            placeholder="请输入自定义内容"
                            style={{ width: 200, marginInlineStart: 12 }}
                          />
                        )}
                      </>
                    ),
                  }
                : {
                    label: opt,
                    value: opt,
                  },
            )}
            className="option-group"
          />
        ) : (
          <Checkbox.Group
            className="option-group"
            onChange={(checkedValues) => {
              handleSelectChange(currentItem.question, checkedValues.join(","));
            }}
            value={answers[currentItem.question]?.split(",") || []}
          >
            <Flex vertical gap={8}>
              {currentItem.options.map((opt) =>
                opt.includes("自定义") ? (
                  <Checkbox key={opt} value={CUSTOM_VALUE}>
                    <span>{opt}</span>
                    {answers[currentItem.question]?.includes(CUSTOM_VALUE) && (
                      <Input
                        value={customInputs[currentItem.question] || ""}
                        onChange={(e) => {
                          e.stopPropagation();
                          setCustomInputs((prev) => ({
                            ...prev,
                            [currentItem.question]: e.target.value,
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        variant="filled"
                        placeholder="请输入自定义内容"
                        style={{ width: 200, marginLeft: 12 }}
                      />
                    )}
                  </Checkbox>
                ) : (
                  <Checkbox key={opt} value={opt}>
                    {opt}
                  </Checkbox>
                ),
              )}
            </Flex>
          </Checkbox.Group>
        )}
        {/* 导航按钮 */}
        <div className="step-actions">
          <Button
            type="text"
            size="small"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
          >
            上一个
          </Button>
          {isLast ? (
            <Button
              size="small"
              type="primary"
              disabled={!currentAnswered}
              onClick={handleSubmitSelect}
            >
              确认提交
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              disabled={!currentAnswered}
              onClick={() => setCurrentIndex((prev) => prev + 1)}
            >
              下一个
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ===========消息列表项组件============
const MessageItem = ({
  message,
  onSelectSubmit,
  onDelete,
  onRegenerate,
  onRetry,
}: MessageItemProps) => {
  const {
    prompt,
    params,
    model,
    createTime,
    status,
    sseStatus,
    resultUrl,
    dataList,
    operationData,
    originImageList,
    steps,
  } = message;

  const selectList = operationData?.selectList || [];
  // 删除动画状态
  const [removing, setRemoving] = useState(false);

  // 结果图列表：优先 SSE 多图结果（resultImageList）→ 历史多图（dataList）→ 单张 resultUrl
  const resultImages =
    message.resultImageList && message.resultImageList.length > 0
      ? message.resultImageList
      : dataList && dataList.length > 0
        ? dataList
        : resultUrl
          ? [{ id: "", url: resultUrl }]
          : [];

  // 处理删除（先播放淡出动画，再调用回调）
  const handleDelete = useCallback(() => {
    setRemoving(true);
  }, []);

  // 淡出动画结束后再调用父级删除回调；
  useEffect(() => {
    if (!removing) return;
    const timer = setTimeout(() => {
      onDelete?.(message);
    }, 400);
    return () => clearTimeout(timer);
  }, [removing, message, onDelete]);

  // 计算图片比例
  const getImgSize = (proportion: string) => {
    const sizeMap: Record<string, { width: number; height: number }> = {
      "1:1": { width: 300, height: 300 },
      "4:5": { width: 300, height: 375 },
      "3:4": { width: 300, height: 400 },
      "9:16": { width: 300, height: 533 },
      "16:9": { width: 300, height: 169 },
      "3:2": { width: 300, height: 200 },
      "4:3": { width: 300, height: 225 },
      "21:9": { width: 300, height: 129 },
    };
    return sizeMap[proportion] || { width: 300, height: 300 };
  };
  const statusInfo = WORK_STATUS_MAP[status] || WORK_STATUS_MAP[0];
  const imgSize = getImgSize(params?.imageProportion || "1:1");
  const downloadImage = async (url: string) => {
    const fileName = url.split("/").pop() || "image.jpg";
    try {
      // 先 fetch 转 blob 再下载：避免 a.download 对跨域图片失效（被浏览器直接打开）
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
    }
  };
  //上传素材
  const handleCreateAsset = async (imageId: string) => {
    await createAsset({ workId: message.id, imageId, tags: [] });
  };
  const copyPrompt = (prompt: string) => {
    messageManager.success("已复制到剪贴板");
    navigator.clipboard?.writeText(prompt);
  };
  // 处理补充问题提交
  const handleSelectSubmit = (answers: SelectAnswer[]) => {
    onSelectSubmit?.(message, answers);
  };

  // 执行步骤流：最新步骤单独高亮展示
  const latestStep =
    steps && steps.length > 0 ? steps[steps.length - 1] : undefined;

  // 生图进行中：最新步骤为运行中的 step_generate 且尚无结果图 → 展示占位图
  const isGenerating =
    status === 1 &&
    latestStep?.type === "step_generate" &&
    latestStep.state === "running" &&
    resultImages.length === 0;
  // 占位图数量与用户选择的出图数量一致
  const placeholderCount = Math.max(1, Number(params?.imageCount) || 1);

  // ---- 生图耗时计时器：生图进行中每秒 +1，结束后清除定时器并保留最终耗时用于展示 ----
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!isGenerating) return;
    // 新一轮生图开始：重置耗时
    setElapsedSeconds(0);
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    // isGenerating 变为 false（生图完成）时清除定时器，耗时停留在最终值
    return () => clearInterval(timer);
  }, [isGenerating]);
  // 耗时格式化：mm:ss
  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 最新步骤元素 ref：流式执行追加新步骤时自动滚动跟随到最新步骤
  const latestStepRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status !== 1 || !steps?.length) return;
    const raf = requestAnimationFrame(() => {
      const el = latestStepRef.current;
      if (!el) return;
      // 仅滚动列表容器（.message-list），避免 scrollIntoView 连带滚动外层页面
      const container = el.closest<HTMLElement>(".message-list");
      if (!container) return;
      // 将最新步骤底部对齐到容器底部：新增步骤或详情变长时持续跟随
      const elBottom = el.getBoundingClientRect().bottom;
      const boxBottom = container.getBoundingClientRect().bottom;
      container.scrollTop += elBottom - boxBottom;
    });
    return () => cancelAnimationFrame(raf);
  }, [steps, status]);

  // 状态对应的类名
  const statusClass = `status-${status}`;
  // 处理修改图片：切换到图生图并把该图片传入参考图列表
  const handleEditImage = (url: string) => {
    useCreationEditStore.getState().requestEditImage(url);
  };
  return (
    <div
      className={`message-item ${statusClass} ${
        removing ? "message-item-removing" : ""
      }`}
    >
      <div className="message-body">
        {/* 头部：时间 + 操作按钮 */}
        <div className="message-header">
          <div className="message-time-wrap">
            <span className="message-time">{formatDate(createTime)}</span>
            <Tag
              className="message-status-tag"
              color={statusInfo.color}
              icon={
                status === 1 ? (
                  <Spin indicator={<LoadingOutlined />} size="small" />
                ) : undefined
              }
            >
              {statusInfo.label}
            </Tag>
          </div>

          <div className="message-actions">
            <Tooltip title="复制提示词">
              <Button
                size="small"
                type="text"
                icon={<Copy size={16} />}
                onClick={() => copyPrompt(prompt)}
                className="action-btn"
              />
            </Tooltip>
            {status === 3 ? (
              <Tooltip title="重试">
                <Button
                  size="small"
                  type="text"
                  icon={<RotateCcw size={16} />}
                  onClick={() => onRetry?.(message)}
                  className="action-btn"
                />
              </Tooltip>
            ) : (
              <Tooltip title="重新生成">
                <Button
                  size="small"
                  type="text"
                  icon={<RotateCcw size={16} />}
                  onClick={() => onRegenerate?.(message)}
                  className="action-btn"
                />
              </Tooltip>
            )}
            <Popconfirm
              title="删除记录"
              description="确认删除这条记录吗？"
              onConfirm={handleDelete}
              onCancel={() => {}}
              okText="确认"
              cancelText="取消"
            >
              <Button
                size="small"
                type="text"
                icon={<Trash2 size={16} />}
                className="action-btn action-btn-danger"
              />
            </Popconfirm>
          </div>
        </div>

        {/* 提示词内容 */}
        <div className="message-info-wrap">
          <div className="message-content-wrap">
            <span className="prompt-quote">&quot;</span>
            <p className="message-content">
              {prompt.length > 400 ? prompt.slice(0, 400) + "..." : prompt}
            </p>
          </div>
        </div>

        {/* 参数 chip 标签（模型/比例为主关键参数，挂 chip-key 强调） */}
        <div className="message-chips">
          {model && (
            <div className="chip chip-key">
              <Sparkles size={12} />
              <span>{model === "default" ? "默认模型" : model}</span>
            </div>
          )}
          {params?.style && (
            <div className="chip">
              <Palette size={12} />
              <span>{params.style}</span>
            </div>
          )}
          {params?.imageQuality && (
            <div className="chip">
              <ImageIcon size={12} />
              <span>{params.imageQuality}</span>
            </div>
          )}
          {params?.imageProportion && (
            <div className="chip chip-key">
              <Maximize2 size={12} />
              <span>{params.imageProportion}</span>
            </div>
          )}
        </div>

        {/* 执行步骤流（统一使用 ThinkBlock 折叠块） */}
        {steps && steps.length > 0 && latestStep && (
          <ThinkBlock
            title={status === 1 ? "执行中" : "执行详情"}
            done={status !== 1}
          >
            <div className="think-steps">
              {/* 历史步骤（已完成/已失败 — 划线灰显） */}
              {steps.slice(0, -1).map((step) => (
                <div
                  key={step.seqId}
                  className={`think-step think-step-${step.state}`}
                >
                  <div className="think-step-icon">
                    {step.state === "done" && <Check size={12} />}
                    {step.state === "error" && <X size={12} />}
                    {step.state === "running" && <Loader2 size={12} />}
                  </div>
                  <div className="think-step-content">
                    <div className="think-step-title">
                      {step.name || step.status}
                    </div>
                    {step.detail && step.detail !== step.status && (
                      <div className="think-step-detail">{step.detail}</div>
                    )}
                  </div>
                </div>
              ))}
              {/* 当前/最新步骤 */}
              <div
                ref={latestStepRef}
                className={`think-step think-step-${latestStep.state} ${
                  status === 1 ? "think-step-active" : ""
                }`}
              >
                <div className="think-step-icon">
                  {latestStep.state === "running" && (
                    <Loader2 size={12} className="spin" />
                  )}
                  {latestStep.state === "done" && <Check size={12} />}
                  {latestStep.state === "error" && <X size={12} />}
                </div>
                <div className="think-step-content">
                  <div className="think-step-title">
                    {latestStep.name || latestStep.status}
                  </div>
                  {latestStep.detail &&
                    latestStep.detail !== latestStep.status && (
                      <div className="think-step-detail">
                        {latestStep.detail}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </ThinkBlock>
        )}

        {/* 补充问题选择 UI（human_in_the_loop） */}
        {message.status === 4 && selectList.length > 0 && (
          <SelectList
            selectList={selectList}
            onSelectSubmit={handleSelectSubmit}
          />
        )}

        {/* 生成产出区：参考图 → 结果图（仅图生图展示参考图，无参考图时退化为普通结果图） */}
        {(originImageList?.length || 0) > 0 ||
        resultImages.length > 0 ||
        isGenerating ? (
          <div className="generation-result">
            {/* 参考图缩略图 */}
            {originImageList && originImageList.length > 0 && (
              <div className="ref-block">
                <span className="ref-label">
                  <Images size={14} />
                  参考图
                </span>
                <div
                  className="ref-list"
                  style={{ "--n": originImageList.length } as CSSProperties}
                >
                  {originImageList.map((item, index) => (
                    <div
                      key={item.id + index}
                      className="ref-image-item"
                      style={{ "--i": index } as CSSProperties}
                    >
                      <Image
                        className="ref-image"
                        src={item.url}
                        alt={`参考图${index + 1}`}
                        fallback={DEFAULT_IMAGES.fallback}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 箭头：参考图 → 结果图/占位图 */}
            {(resultImages.length > 0 || isGenerating) &&
              originImageList &&
              originImageList.length > 0 && (
                <MoveRight className="result-arrow" size={20} />
              )}

            {/* 生成结果图片（支持多张，预览可切换）；生图节点开始时先展示占位图 */}
            {(isGenerating || resultImages.length > 0) && (
              <>
                <Image.PreviewGroup>
                  <div className="image-list mt10">
                    {isGenerating
                      ? Array.from({ length: placeholderCount }).map(
                          (_, index) => (
                            <div
                              className="message-image-wrap message-image-wrap-placeholder"
                              key={`placeholder-${index}`}
                            >
                              <Image
                                className="message-image"
                                src=""
                                alt={`生成中 ${index + 1}`}
                                placeholder={{ progress: true }}
                                style={{
                                  width: imgSize.width,
                                  height: imgSize.height,
                                }}
                              />
                            </div>
                          ),
                        )
                      : resultImages.map((img, index) => (
                          <div
                            className="message-image-wrap"
                            key={`${img.id}-${index}`}
                          >
                            <Image
                              className="message-image"
                              src={img.url}
                              alt={`生成素材${index + 1}`}
                              fallback={DEFAULT_IMAGES.fallback}
                              preview={{
                                mask: { blur: true },
                                // 注意：cover 内的按钮必须阻止冒泡，否则会触发图片自身的 preview 打开
                                cover: (
                                  <div className="message-image-cover">
                                    <Button
                                      className="W80"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditImage(img.url);
                                      }}
                                    >
                                      修改图片
                                    </Button>
                                    <Button
                                      icon={<DownloadOutlined size={14} />}
                                      type="primary"
                                      className="W80"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadImage(img.url);
                                        handleCreateAsset(img.id);
                                      }}
                                    >
                                      下载图片
                                    </Button>
                                  </div>
                                ),
                              }}
                              style={{
                                width: imgSize.width,
                                height: imgSize.height,
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        ))}
                  </div>
                </Image.PreviewGroup>
                {/* 生图耗时：进行中显示实时计时，完成后展示最终耗时 */}
                {elapsedSeconds > 0 && (
                  <div className="generation-timer">
                    <Timer size={14} />
                    <span>
                      {isGenerating
                        ? `已耗时 ${formatElapsed(elapsedSeconds)}`
                        : `本次生成耗时 ${formatElapsed(elapsedSeconds)}`}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ==================== 历史记录组件 ====================

export const HistoryContent = ({
  onSwitchTab,
  messageList,
  loading,
  loadingMore,
  hasMore,
  loadMoreError,
  error,
  onRetry,
  onRegenerate,
  onSelectSubmit,
  onDelete,
  onRetryHistory,
  onLoadMore,
  onRetryLoadMore,
}: {
  onSwitchTab: () => void;
  messageList: WorkMessage[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  loadMoreError?: boolean;
  error?: Error | null;
  onRetry?: (message: WorkMessage) => void;
  onRegenerate?: (message: WorkMessage) => void;
  onSelectSubmit?: (message: WorkMessage, answers: SelectAnswer[]) => void;
  onDelete?: (message: WorkMessage) => void;
  onRetryHistory?: () => void;
  onLoadMore?: () => void;
  onRetryLoadMore?: () => void;
}) => {
  // 滚动容器（.message-list 为实际可滚动区域）
  const messageListRef = useRef<HTMLDivElement>(null);

  // 滚动到底部自动触发加载下一页（hooks 需在条件 return 之前声明）
  const scrollPosition = useScroll(messageListRef);
  useEffect(() => {
    if (!scrollPosition || !messageListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      onLoadMore?.();
    }
  }, [scrollPosition, onLoadMore]);

  // 加载中
  if (loading) {
    return (
      <div className="history-content">
        <div className="history-loading">
          <Loading />
        </div>
      </div>
    );
  }

  // 请求失败
  if (error) {
    return (
      <div className="history-content">
        <Result
          className="W100 H100"
          status="error"
          title="获取历史记录失败"
          subTitle={error.message}
          extra={
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={onRetryHistory}
            >
              重新加载
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="history-content">
      {messageList.length > 0 ? (
        <div className="message-list" ref={messageListRef}>
          {messageList.map((item) => (
            <MessageItem
              key={item.id}
              message={item}
              onRetry={onRetry}
              onRegenerate={onRegenerate}
              onSelectSubmit={onSelectSubmit}
              onDelete={onDelete}
            />
          ))}
          {/* 底部加载更多状态 */}
          {loadingMore && (
            <div className="history-load-more">
              <Spin size="small" />
              <span>加载中...</span>
            </div>
          )}
          {loadMoreError && !loadingMore && (
            <div className="history-load-more">
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                onClick={onRetryLoadMore}
              >
                加载失败，点击重试
              </Button>
            </div>
          )}
          {!hasMore && !loadingMore && !loadMoreError && (
            <div className="history-load-more">
              <span>没有更多了</span>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-message">
          <p className="empty-title">还没有生成作品哦</p>
          <p className="empty-desc">快来创作你的第一幅作品吧</p>
          <Button color="default" variant="solid" onClick={onSwitchTab}>
            去看看优秀案例
          </Button>
        </div>
      )}
    </div>
  );
};
