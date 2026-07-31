"use client";

import { Image, Skeleton, Input, Masonry, Segmented, Spin } from "antd";
import { Search, FolderOpen } from "lucide-react";
import { useRequest, useScroll } from "ahooks";
import { useState, useEffect, useRef, useCallback } from "react";
import Loading from "@/components/core/loadding/loading";

import "./materialList.scss";

interface MaterialItem {
  id: string;
  image: string;
  title: string;
  time: string;
}

const MaterialList = () => {
  const [currentTab, setCurrentTab] = useState(1);
  const [materialList, setMaterialList] = useState<MaterialItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageSize = 16;

  const segmentedOptions = [
    { label: "发现", value: 1 },
    { label: "图片", value: 2 },
    { label: "短片", value: 3 },
    { label: "活动", value: 4 },
  ];

  const defaultImg =
    "https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png";

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

    // 模拟更多数据：重复数据但使用不同的 id
    const allImages = [];
    for (let i = 0; i < 5; i++) {
      allImages.push(...imageList);
    }

    return allImages
      .map((image, index) => ({
        id: `${index + 1}`,
        image,
        title: `AI 生成插画 - 科技未来城市${(index % 16) + 1}`,
        time: `2023-08-${String((index % 28) + 1).padStart(2, "0")} 10:00`,
      }))
      .filter((item) =>
        item.title.toLowerCase().includes(keyword.toLowerCase()),
      );
  };

  //加载素材数据
  const fetchMaterialList = async (
    keyword: string = "",
    pageNum: number = 1,
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const allData = generateAllData(keyword);
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;
    const pageData = allData.slice(start, end);
    return {
      list: pageData,
      hasMore: end < allData.length,
    };
  };

  //防抖
  const { loading, error, run } = useRequest(
    (keyword: string = "") => fetchMaterialList(keyword, 1),
    {
      debounceWait: 700,
      manual: true,
      defaultParams: [""],
      onSuccess: (result) => {
        setMaterialList(result.list);
        setHasMore(result.hasMore);
        setPage(1);
      },
      onError: () => {},
    },
  );

  //向下滚动时触发接口加载更多
  const loadMore = useCallback(async () => {
    console.log("loadMore", "加载更多");

    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchMaterialList("", nextPage);
      setMaterialList((prev) => [...prev, ...result.list]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (e) {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore]);

  const scrollPosition = useScroll(containerRef); //监听容器滚动位置
  useEffect(() => {
    console.log("scrollPosition", scrollPosition);
    if (!scrollPosition || !containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    console.log("scrollTop", scrollTop);
    console.log("scrollHeight", scrollHeight);
    console.log("clientHeight", clientHeight);
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMore();
    }
  }, [scrollPosition, loadMore]);

  //渲染骨架屏
  const renderSkeleton = () => (
    <div className="material-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="material-card skeleton-card">
          <div className="skeleton-img">
            <Skeleton.Avatar
              shape="square"
              size="large"
              active
              className="skeleton-avatar"
            />
          </div>
          <div className="skeleton-content">
            <Skeleton.Input size="small" active />
            <Skeleton.Input size="small" active style={{ width: "60%" }} />
          </div>
        </div>
      ))}
    </div>
  );

  //渲染空状态
  const renderEmpty = () => (
    <div className="empty-state">
      <div className="empty-icon">
        <FolderOpen size={48} />
      </div>
      <h3 className="empty-title">暂无素材</h3>
      <p className="empty-desc">快去创作你的第一个作品吧</p>
      <button className="empty-action">开始创作</button>
    </div>
  );

  //渲染错误状态
  const renderError = () => (
    <div className="error-state">
      <div className="error-icon">
        <Search size={48} />
      </div>
      <h3 className="error-title">加载失败</h3>
      <p className="error-desc">{error?.message || "加载失败，请稍后重试"}</p>
      <button className="error-action" onClick={() => run("")}>
        重新加载
      </button>
    </div>
  );

  //渲染内容
  const renderContent = () => (
    <>
      <Masonry
        columns={4}
        gutter={10}
        items={materialList?.map((item) => ({
          key: item.id,
          data: item,
        }))}
        itemRender={({ data }) => (
          <div className="material-card">
            <Image
              src={data.image || defaultImg}
              alt={data.title}
              className="card-image"
              fallback={defaultImg}
            />
            <div className="card-content">
              <div className="card-title">{data.title}</div>
              <div className="card-time">{data.time}</div>
            </div>
          </div>
        )}
      />
      {loadingMore && (
        <div className="loading-more flex-1">
          <Loading />
        </div>
      )}
      {!hasMore && materialList.length > 0 && (
        <div className="no-more">没有更多了</div>
      )}
    </>
  );

  return (
    <div className="material-list-wrapper" ref={containerRef}>
      <div className="search-box">
        <Input
          prefix={<Search size={16} className="search-icon" />}
          onInput={(e) => run((e.target as HTMLInputElement).value)}
          placeholder="搜索素材..."
          className="search-input w-300"
        />
        <Segmented<string>
          options={segmentedOptions.map((item) => item.label)}
          value={currentTab.toString()}
          onChange={(value) => {
            setCurrentTab(Number(value));
            setMaterialList([]);
            run("");
          }}
        />
      </div>

      <div className="material-content">
        {loading
          ? renderSkeleton()
          : error
            ? renderError()
            : materialList.length > 0
              ? renderContent()
              : renderEmpty()}
      </div>
    </div>
  );
};

export default MaterialList;
