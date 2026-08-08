import { Masonry, Image, Button } from "antd";
import { formatDate } from "@/utils/timeUtils";
import { useState, useEffect, useCallback } from "react";
// ==================== 优秀案例组件 ====================
import "./example.scss";

const WorkList = ({ workList }: { workList: DataType[] }) => (
  <Masonry
    columns={4}
    gutter={10}
    items={workList?.map((item, index) => ({
      key: "item" + item.url + index,
      data: item,
    }))}
    itemRender={({ data }) => (
      <div className="material-card">
        <Image
          src={data.url}
          alt={data.param?.title || ""}
          className="card-image"
        />
        <div className="card-content">
          <div className="card-title">{data.param?.title || ""}</div>
          <div className="card-time">{formatDate(data.createTime) || ""}</div>
        </div>
      </div>
    )}
  />
);

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

export const ExampleContent = ({ activeKey }: { activeKey: string }) => {
  const [workList, setWorkList] = useState<DataType[]>([]);
  const generateAllData = (keyword: string = "") => {
    const imageList = [
      "https://images.unsplash.com/photo-1510001618818-4b4e3d86bf0f",
      "https://images.unsplash.com/photo-1507513319174-e556268bb244",
      "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2",
      "https://images.unsplash.com/photo-1492778297155-7be4c83960c7",
      "https://images.unsplash.com/photo-1508062878650-88b52897f298",
      "https://images.unsplash.com/photo-1506158278516-d720e72406fc",
      "https://images.unsplash.com/photo-1552203274-e3c7bd771d26",
      "https://images.unsplash.com/photo-1528163186890-de9b86b54b51",
      "https://images.unsplash.com/photo-1727423304224-6d2fd99b864c",
      "https://images.unsplash.com/photo-1675090391405-432434e23595",
      "https://images.unsplash.com/photo-1554196967-97a8602084d9",
      "https://images.unsplash.com/photo-1491961865842-98f7befd1a60",
      "https://images.unsplash.com/photo-1721728613411-d56d2ddda959",
      "https://images.unsplash.com/photo-1731901245099-20ac7f85dbaa",
      "https://images.unsplash.com/photo-1617694455303-59af55af7e58",
      "https://images.unsplash.com/photo-1709198165282-1dab551df890",
    ];

    const allImages = [];
    for (let i = 0; i < 5; i++) {
      allImages.push(...imageList);
    }

    return allImages
      .map((image, index) => ({
        type: "img" as const,
        url: image,
        createTime: new Date(
          `2023-08-${String((index % 28) + 1).padStart(2, "0")} 10:00`,
        ).getTime(),
        param: {
          title: `AI 生成插画 - 科技未来城市${(index % 16) + 1}`,
          model: "default",
          proportion: "1:1",
          quality: "1080p",
          style: "modern",
        },
      }))
      .filter((item) =>
        item.param.title?.toLowerCase().includes(keyword.toLowerCase()),
      );
  };

  const pageObj = { currentPage: 1, pageSize: 10 };
  const getWorkList = useCallback(async () => {
    const res = await generateAllData();
    setWorkList(res);
  }, []);

  useEffect(() => {
    getWorkList();
  }, [activeKey, pageObj.currentPage, getWorkList]);

  return (
    <div className="example-content">
      <div className="example-option"></div>
      <div className="example-list">
        {workList.length > 0 ? (
          <WorkList workList={workList} />
        ) : (
          <div className="empty-message">
            <span className="empty-title">还没有优秀案例哦</span>
            <span className="empty-desc">快来创作你的第一幅作品吧</span>
          </div>
        )}
      </div>
    </div>
  );
};
