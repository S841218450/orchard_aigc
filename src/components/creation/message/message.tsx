import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { formatDate } from "@/utils/timeUtils";
import { Image, Button, Tag, Spin, Result } from "antd";
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
  status: WorkStatus;
  createTime: number;
  /** SSE 实时状态文本（前端维护） */
  sseStatus?: string;
}
/** 作品状态：0-待处理 1-处理中 2-已完成 3-失败 */
type WorkStatus = 0 | 1 | 2 | 3;
const WORK_STATUS_MAP: Record<WorkStatus, { label: string; color: string }> = {
  0: { label: "等待中", color: "#8c8c8c" },
  1: { label: "生成中", color: "#1677ff" },
  2: { label: "已完成", color: "#52c41a" },
  3: { label: "失败", color: "#ff4d4f" },
};

// ==================== 消息列表项组件 ====================
const MessageItem = ({ message }: { message: WorkMessage }) => {
  const { id, prompt, params, createTime, status, sseStatus, resultUrl } =
    message;

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

  const errImg =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg=="';

  const statusInfo = WORK_STATUS_MAP[status] || WORK_STATUS_MAP[0];
  const imgSize = getImgSize(params?.imageProportion || "1:1");

  return (
    <div className="message-item">
      <h2 className="message-time">{formatDate(createTime)}</h2>
      <p className="message-content">{prompt}</p>

      {/* 参数标签 */}
      <div className="message-tags">
        {params?.model && <Tag size="small">{params.model}</Tag>}
        {params?.style && <Tag size="small">{params.style}</Tag>}
        {params?.imageQuality && <Tag size="small">{params.imageQuality}</Tag>}
        {params?.imageProportion && (
          <Tag size="small">{params.imageProportion}</Tag>
        )}
      </div>

      {/* 状态展示 */}
      <div className="message-status">
        {status === 1 && <Spin indicator={<LoadingOutlined />} size="small" />}
        <span style={{ color: statusInfo.color, marginLeft: 4 }}>
          {sseStatus || statusInfo.label}
        </span>
      </div>

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
}: {
  activeKey: string;
  onSwitchTab: () => void;
  messageList: WorkMessage[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}) => {
  // 加载中
  if (loading) {
    return (
      <div className="history-content">
        <div className="history-loading">
          <Spin size="large" />
          <span>加载中...</span>
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
            <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
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
            <MessageItem key={item.id} message={item} />
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
