"use client";

import "./mywork.scss";
import { useState } from "react";
import { Image, Button, Input, Select, Dropdown, App, Empty, Spin } from "antd";
import {
  Search,
  FolderOpen,
  Image as ImageIcon,
  FileText,
  Video,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  Grid3X3,
  List,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

interface WorkItem {
  id: string;
  title: string;
  type: "image" | "text" | "video";
  thumbnail: string;
  createdAt: string;
  status: "completed" | "processing" | "failed";
}

const MyWorkPage = () => {
  const { message } = App.useApp();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  // 模拟数据
  const workList: WorkItem[] = [
    {
      id: "1",
      title: "AI 生成插画 - 科技未来城市",
      type: "image",
      thumbnail: "https://images.unsplash.com/photo-1510001618818-4b4e3d86bf0f",
      createdAt: "2024-01-15 14:30",
      status: "completed",
    },
    {
      id: "2",
      title: "产品营销文案 - 智能手表",
      type: "text",
      thumbnail: "",
      createdAt: "2024-01-14 10:20",
      status: "completed",
    },
    {
      id: "3",
      title: "AI 生成视频 - 城市夜景",
      type: "video",
      thumbnail: "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2",
      createdAt: "2024-01-13 16:45",
      status: "processing",
    },
    {
      id: "4",
      title: "AI 生成插画 - 山水风景",
      type: "image",
      thumbnail: "https://images.unsplash.com/photo-1507513319174-e556268bb244",
      createdAt: "2024-01-12 09:15",
      status: "completed",
    },
    {
      id: "5",
      title: "社交媒体文案 - 新年祝福",
      type: "text",
      thumbnail: "",
      createdAt: "2024-01-11 11:30",
      status: "completed",
    },
    {
      id: "6",
      title: "AI 生成插画 - 抽象艺术",
      type: "image",
      thumbnail: "https://images.unsplash.com/photo-1492778297155-7be4c83960c7",
      createdAt: "2024-01-10 08:00",
      status: "failed",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={16} />;
      case "text":
        return <FileText size={16} />;
      case "video":
        return <Video size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "image":
        return "图片";
      case "text":
        return "文案";
      case "video":
        return "视频";
      default:
        return "其他";
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="status-tag completed">已完成</span>;
      case "processing":
        return <span className="status-tag processing">生成中</span>;
      case "failed":
        return <span className="status-tag failed">失败</span>;
      default:
        return null;
    }
  };

  const handleDownload = (item: WorkItem) => {
    message.success(`开始下载: ${item.title}`);
  };

  const handleDelete = (item: WorkItem) => {
    message.success(`已删除: ${item.title}`);
  };

  const handlePreview = (item: WorkItem) => {
    message.info(`预览功能开发中`);
  };

  const filteredList = workList.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getDropdownItems = (item: WorkItem) => ({
    items: [
      {
        key: "preview",
        label: "预览",
        icon: <Eye size={14} />,
        onClick: () => handlePreview(item),
      },
      {
        key: "download",
        label: "下载",
        icon: <Download size={14} />,
        onClick: () => handleDownload(item),
      },
      {
        type: "divider" as const,
      },
      {
        key: "delete",
        label: "删除",
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => handleDelete(item),
      },
    ],
  });

  const renderGridView = () => (
    <div className="work-grid">
      {filteredList.map((item) => (
        <div key={item.id} className="work-card">
          <div className="card-thumbnail">
            {item.type === "image" || item.type === "video" ? (
              <Image
                src={item.thumbnail}
                alt={item.title}
                preview={false}
                fallback="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png"
              />
            ) : (
              <div className="text-thumbnail">
                <FileText size={32} />
              </div>
            )}
            <div className="card-overlay">
              <Button
                type="primary"
                shape="circle"
                icon={<Eye size={16} />}
                onClick={() => handlePreview(item)}
              />
            </div>
            {getStatusTag(item.status)}
          </div>
          <div className="card-content">
            <div className="card-header">
              <div className="card-type">
                {getTypeIcon(item.type)}
                <span>{getTypeLabel(item.type)}</span>
              </div>
              <Dropdown menu={getDropdownItems(item)} trigger={["click"]}>
                <Button
                  type="text"
                  size="small"
                  icon={<MoreHorizontal size={16} />}
                />
              </Dropdown>
            </div>
            <h4 className="card-title">{item.title}</h4>
            <p className="card-time">{item.createdAt}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="work-list">
      {filteredList.map((item) => (
        <div key={item.id} className="work-list-item">
          <div className="item-thumbnail">
            {item.type === "image" || item.type === "video" ? (
              <Image
                src={item.thumbnail}
                alt={item.title}
                preview={false}
                width={60}
                height={60}
                style={{ borderRadius: 8, objectFit: "cover" }}
                fallback="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png"
              />
            ) : (
              <div className="text-icon">
                <FileText size={24} />
              </div>
            )}
          </div>
          <div className="item-info">
            <div className="item-header">
              <h4 className="item-title">{item.title}</h4>
              {getStatusTag(item.status)}
            </div>
            <div className="item-meta">
              <span className="item-type">
                {getTypeIcon(item.type)}
                {getTypeLabel(item.type)}
              </span>
              <span className="item-time">{item.createdAt}</span>
            </div>
          </div>
          <div className="item-actions">
            <Button
              type="text"
              icon={<Eye size={16} />}
              onClick={() => handlePreview(item)}
            />
            <Button
              type="text"
              icon={<Download size={16} />}
              onClick={() => handleDownload(item)}
            />
            <Dropdown menu={getDropdownItems(item)} trigger={["click"]}>
              <Button type="text" icon={<MoreHorizontal size={16} />} />
            </Dropdown>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mywork-page">
      <div className="mywork-header">
        <div className="header-left">
          <h1>
            <FolderOpen size={24} />
            我的资产
          </h1>
          <span className="work-count">{filteredList.length} 个项目</span>
        </div>
        <Button type="primary" icon={<Plus size={16} />}>
          新建项目
        </Button>
      </div>

      <div className="mywork-toolbar">
        <div className="toolbar-left">
          <Input
            prefix={<Search size={16} />}
            placeholder="搜索项目..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 120 }}
            options={[
              { label: "全部类型", value: "all" },
              { label: "图片", value: "image" },
              { label: "文案", value: "text" },
              { label: "视频", value: "video" },
            ]}
          />
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <Button
              type={viewMode === "grid" ? "primary" : "text"}
              icon={<Grid3X3 size={16} />}
              onClick={() => setViewMode("grid")}
            />
            <Button
              type={viewMode === "list" ? "primary" : "text"}
              icon={<List size={16} />}
              onClick={() => setViewMode("list")}
            />
          </div>
          <Button icon={<SlidersHorizontal size={16} />}>筛选</Button>
        </div>
      </div>

      <div className="mywork-content">
        {loading ? (
          <div className="loading-state">
            <Spin size="large" />
          </div>
        ) : filteredList.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无项目">
            <Button type="primary">开始创作</Button>
          </Empty>
        ) : viewMode === "grid" ? (
          renderGridView()
        ) : (
          renderListView()
        )}
      </div>
    </div>
  );
};

export default MyWorkPage;
