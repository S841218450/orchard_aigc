interface DataType {
  type: "img" | "video";
  url: string;
  createTime: number;
  param: {
    title?: string;
    model: string;
    proportion: string;
    quality: string;
    style: string;
  };
}

interface WorkListProps {
  workList: DataType[];
}

const WorkList = ({ workList }: WorkListProps) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <div className="work-list">
      {workList.map((item, index) => (
        <div key={index} className="work-item">
          <div className="work-item-header">
            <div className="work-item-title">
              {item.param.title || "未命名"}
            </div>
            <div className="work-item-time">{formatDate(item.createTime)}</div>
          </div>
          {item.url && (
            <img
              src={item.url}
              alt={item.param.title || ""}
              className="work-item-image"
            />
          )}
        </div>
      ))}
    </div>
  );
};
export default WorkList;
