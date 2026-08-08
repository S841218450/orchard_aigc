import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
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
} from "antd";
import Loading from "@/components/core/loadding/loading";
import { useState, useCallback } from "react";
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
  ChevronDown,
} from "lucide-react";
import type {
  SelectListItem,
  SelectAnswer,
  WorkMessage,
  WorkStep,
} from "@/actions/types";
import { WORK_STATUS_MAP } from "@/actions/types";
import messageManager from "@/utils/messageManager";

/** 补充问题选项 */
export type { SelectListItem, SelectAnswer, WorkMessage };

const errImg =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYc8L3RleHQ+PC9zdmc+";

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

// ===========步骤流进度组件============
interface StepProgressProps {
  steps: WorkStep[];
  status: WorkMessage["status"];
}

const StepProgress = ({ steps, status }: StepProgressProps) => {
  const [expanded, setExpanded] = useState(true);

  // 没有步骤数据时不渲染
  if (!steps || steps.length === 0) return null;

  const isRunning = status === 1;
  const latestStep = steps[steps.length - 1];
  const prevSteps = steps.slice(0, -1);

  // SSE 结束（成功/失败/待操作）时收起，只显示最新一条
  const shouldCollapse = !isRunning;

  return (
    <div className="step-progress">
      {/* 展开/收起切换按钮 */}
      <button
        className="step-progress-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="toggle-label">
          {isRunning ? "执行中" : shouldCollapse ? "执行详情" : "执行详情"}
        </span>
        <ChevronDown
          size={14}
          className={`toggle-icon ${expanded ? "open" : ""}`}
        />
      </button>

      {/* 历史步骤（已完成/已失败 — 划线灰显） */}
      {expanded && prevSteps.length > 0 && (
        <div className="step-list step-list-history">
          {prevSteps.map((step) => (
            <div key={step.seqId} className={`step-item step-${step.state}`}>
              <div className="step-icon">
                {step.state === "done" && <Check size={12} />}
                {step.state === "error" && <X size={12} />}
                {step.state === "running" && <Loader2 size={12} />}
              </div>
              <div className="step-content">
                <div className="step-title">{step.status}</div>
                {step.detail && step.detail !== step.status && (
                  <div className="step-detail">{step.detail}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 当前/最新步骤 */}
      <div className={`step-list step-list-current`}>
        <div
          className={`step-item step-${latestStep.state} ${
            isRunning ? "step-active" : ""
          }`}
        >
          <div className="step-icon">
            {latestStep.state === "running" && (
              <Loader2 size={12} className="spin" />
            )}
            {latestStep.state === "done" && <Check size={12} />}
            {latestStep.state === "error" && <X size={12} />}
          </div>
          <div className="step-content">
            <div className="step-title">{latestStep.status}</div>
            {latestStep.detail && latestStep.detail !== latestStep.status && (
              <div className="step-detail">{latestStep.detail}</div>
            )}
          </div>
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
    operationData,
    steps,
  } = message;

  const selectList = operationData?.selectList || [];
  // 删除动画状态
  const [removing, setRemoving] = useState(false);

  // 处理删除（先播放淡出动画，再调用回调）
  const handleDelete = useCallback(() => {
    setRemoving(true);
    setTimeout(() => {
      onDelete?.(message);
    }, 400);
  }, [message, onDelete]);

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
  const downloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop() || "image.jpg";
    a.click();
  };
  const copyPrompt = (prompt: string) => {
    messageManager.success("已复制到剪贴板");
    navigator.clipboard?.writeText(prompt);
  };
  // 处理补充问题提交
  const handleSelectSubmit = (answers: SelectAnswer[]) => {
    onSelectSubmit?.(message, answers);
  };

  // 状态对应的类名
  const statusClass = `status-${status}`;

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
            <span className="message-status-badge">
              {status === 1 && (
                <Spin indicator={<LoadingOutlined />} size="small" />
              )}
              <span className="status-text">
                {sseStatus || statusInfo.label}
              </span>
            </span>
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
        <div className="message-content-wrap">
          <span className="prompt-quote">&quot;</span>
          <p className="message-content">{prompt}</p>
        </div>

        {/* 参数 chip 标签 */}
        <div className="message-chips">
          {model && (
            <div className="chip">
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
            <div className="chip">
              <Maximize2 size={12} />
              <span>{params.imageProportion}</span>
            </div>
          )}
        </div>

        {/* 执行步骤流 */}
        {steps && steps.length > 0 && (
          <StepProgress steps={steps} status={status} />
        )}

        {/* 补充问题选择 UI（human_in_the_loop） */}
        {message.status === 4 && selectList.length > 0 && (
          <SelectList
            selectList={selectList}
            onSelectSubmit={handleSelectSubmit}
          />
        )}

        {/* 生成结果图片 */}
        {resultUrl && (
          <div className="image-list">
            <div className="message-image-wrap">
              <Image
                className="message-image"
                src={resultUrl}
                alt="生成素材"
                fallback={errImg}
                preview={{
                  mask: { blur: true },
                  cover: (
                    <div className="flex-column-gap-5">
                      <Button onClick={() => window.open(resultUrl)}>
                        预览
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => downloadImage(resultUrl)}
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
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== 历史记录组件 ====================

export const HistoryContent = ({
  activeKey,
  onSwitchTab,
  messageList,
  loading,
  error,
  onRetry,
  onRegenerate,
  onSelectSubmit,
  onDelete,
  onRetryHistory,
}: {
  activeKey: string;
  onSwitchTab: () => void;
  messageList: WorkMessage[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: (message: WorkMessage) => void;
  onRegenerate?: (message: WorkMessage) => void;
  onSelectSubmit?: (message: WorkMessage, answers: SelectAnswer[]) => void;
  onDelete?: (message: WorkMessage) => void;
  onRetryHistory?: () => void;
}) => {
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
        <div className="message-list">
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
