import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { formatDate } from "@/utils/timeUtils";
import {
  Image,
  Popconfirm,
  Button,
  Tag,
  Spin,
  Result,
  Radio,
  Space,
  Checkbox,
  Flex,
  Tooltip,
  Input,
  App,
} from "antd";
import Loading from "@/components/core/loadding/loading";
import { useState, useCallback } from "react";
import API from "@/api";
import { Copy, Trash2, RotateCcw } from "lucide-react";
/** 补充问题选项 */
export interface SelectListItem {
  question: string; //问题
  select_type: string; //单选和多选
  options: string[]; //选项
}
/** 用户选择的答案 */
export interface SelectAnswer {
  question: string;
  options: string;
}

/** 后端 work 消息结构 */
export interface WorkMessage {
  id: number;
  type: string;
  prompt: string;
  model: string;
  params: {
    style: string;
    imageProportion: string;
    imageQuality: string;
    imageCount: string;
  };
  resultUrl: string | null;
  operationData: {
    selectList: SelectListItem[]; /** 补充问题列表 */
  } | null;
  status: WorkStatus;
  createTime: number;
  /** SSE 实时状态文本（前端维护） */
  sseStatus?: string;
  /** SSE 当前步骤类型 */
  sseStepType?: string;
}
/** 作品状态：0-待处理 1-处理中 2-已完成 3-失败 */
type WorkStatus = 0 | 1 | 2 | 3 | 4;
const WORK_STATUS_MAP: Record<WorkStatus, { label: string; color: string }> = {
  0: { label: "等待中", color: "#8c8c8c" },
  1: { label: "生成中", color: "#1677ff" },
  2: { label: "已完成", color: "#52c41a" },
  3: { label: "失败", color: "#ff4d4f" },
  4: { label: "待操作", color: "#ff9900" },
};

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
  } = message;

  const selectList = operationData?.selectList || [];
  const { message: messageApi } = App.useApp();
  // 删除动画状态
  const [removing, setRemoving] = useState(false);

  // 处理删除（先请求接口，成功后再播放淡出动画）
  const handleDelete = useCallback(async () => {
    try {
      await API.deleteWork(message.id);
      messageApi.success("删除成功");
      // 接口成功后播放淡出动画
      setRemoving(true);
      setTimeout(() => {
        onDelete?.(message);
      }, 400);
    } catch (error) {
      console.error("删除失败:", error);
    }
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

  const copyPrompt = (prompt: string) => {
    //操作按钮
    console.log(prompt);
  };
  // 处理补充问题提交
  const handleSelectSubmit = (answers: SelectAnswer[]) => {
    //提交问题
    onSelectSubmit?.(message, answers);
  };
  return (
    <div className={`message-item ${removing ? "message-item-removing" : ""}`}>
      <h2 className="message-time">{formatDate(createTime)}</h2>
      <p className="message-content">{prompt}</p>

      {/* 参数标签 */}
      <div className="flex ">
        <div className="message-tags flex-align-center">
          {model && <Tag>{model}</Tag>}
          {params?.style && <Tag>{params.style}</Tag>}
          {params?.imageQuality && (
            <Tag>{params.imageQuality}</Tag>
          )}
          {params?.imageProportion && (
            <Tag>{params.imageProportion}</Tag>
          )}
        </div>
        <div className="oprationBtn flex-gap-2 flex-align-center ml10">
          <Tooltip title="复制提示词">
            <Button
              size="small"
              type="text"
              icon={<Copy color="#707070" size={18} />}
              onClick={() => copyPrompt(prompt)}
            />
          </Tooltip>
          {status === 3 ? (
            <Tooltip title="重试">
              <Button
                size="small"
                type="text"
                icon={<RotateCcw color="#707070" size={18} />}
                onClick={() => onRetry?.(message)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="重新生成">
              <Button
                size="small"
                type="text"
                icon={<RotateCcw color="#707070" size={18} />}
                onClick={() => onRegenerate?.(message)}
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
              icon={<Trash2 color="#707070" size={18} />}
            />
          </Popconfirm>
        </div>
      </div>

      {/* 状态展示 */}
      <div className="message-status">
        {status === 1 && <Spin indicator={<LoadingOutlined />} size="small" />}
        <span style={{ color: statusInfo.color, marginLeft: 4 }}>
          {sseStatus || statusInfo.label}
        </span>
      </div>

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
          <div className="message-data">
            <Image
              className="message-image"
              src={resultUrl}
              alt="生成素材"
              fallback={errImg}
              style={{
                width: imgSize.width,
                height: imgSize.height,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          </div>
        </div>
      )}
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
