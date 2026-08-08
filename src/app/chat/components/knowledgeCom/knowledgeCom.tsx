"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRequest } from "ahooks";
import type { FolderTreeVo, FileDetailVo, PageResult } from "@/actions/file";
import { getFileListTree, getFileFolderFiles } from "@/actions/file";
import FolderTree from "./FolderTree";
import type { BreadcrumbItem } from "./Breadcrumb";
import Breadcrumb from "./Breadcrumb";
import UploadFile from "./UploadFile";
import FileTable from "./FileTable";
import "./knowledgeCom.scss";
import messageManager from "@/utils/messageManager";

// 默认每页条数（与后端默认 size 保持一致）
const DEFAULT_PAGE_SIZE = 20;

// ==================== 容器组件 ====================
const KnowledgeCom = () => {
  // ---------- 状态 ----------
  const [folderTree, setFolderTree] = useState<FolderTreeVo[]>([]);
  const [fileList, setFileList] = useState<FileDetailVo[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  // ---------- 分页状态 ----------
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  // ---------- 面包屑构建 ----------
  const buildBreadcrumb = useCallback(
    (tree: FolderTreeVo[], targetId: string | null): BreadcrumbItem[] => {
      if (!targetId) return [];
      const path: BreadcrumbItem[] = [];
      const find = (nodes: FolderTreeVo[]): FolderTreeVo[] | null => {
        for (const n of nodes) {
          if (n.id === targetId) return [n];
          if (n.children && n.children.length) {
            const sub = find(n.children);
            if (sub) return [n, ...sub];
          }
        }
        return null;
      };
      const found = find(tree);
      if (found) {
        found.forEach((n) => path.push({ id: n.id, name: n.folderName }));
      }
      return path;
    },
    [],
  );

  // ---------- 请求：加载文件夹树 ----------
  const treeReq = useRequest(getFileListTree, {
    onSuccess: (res) => {
      if (res.success) {
        const data = res.data;
        setFolderTree(data);
        if (data.length > 0 && !selectedFolderId) {
          setSelectedFolderId(data[0].id);
          setSelectedFolderName(data[0].folderName);
        }
      } else {
        messageManager.error(res.error);
      }
    },
  });
  const { refresh: refreshFolderTree } = treeReq;

  // ---------- 请求：加载文件夹下的文件（服务端分页） ----------
  const filesReq = useRequest(
    async (
      folderId: string | null,
      current: number,
      size: number,
    ): Promise<PageResult<FileDetailVo> | null> => {
      if (!folderId) return null;
      const res = await getFileFolderFiles(folderId, { current, size });
      if (!res.success) {
        messageManager.error(res.error);
        return null;
      }
      return res.data;
    },
    {
      manual: true,
      onBefore: (folderId) => {
        if (!folderId) {
          setFileList([]);
          setTotal(0);
        }
      },
      onSuccess: (data) => {
        if (!data) return;
        setFileList(data.list);
        setTotal(data.total ?? data.list.length);
      },
    },
  );
  const { run: runLoadFiles, refresh: refreshFileList } = filesReq;

  // ---------- 加载指定页（切换文件夹 / 分页变化共用） ----------
  const loadPage = useCallback(
    (folderId: string | null, current: number, size: number) => {
      runLoadFiles(folderId, current, size);
    },
    [runLoadFiles],
  );

  // ---------- 分页变化 ----------
  const handlePageChange = useCallback(
    (nextPage: number, nextSize: number) => {
      setPage(nextPage);
      setPageSize(nextSize);
      loadPage(selectedFolderId, nextPage, nextSize);
    },
    [selectedFolderId, loadPage],
  );

  // ---------- id → folderName 映射 ----------
  const folderNameMap = useMemo(() => {
    const m = new Map<string, string>();
    const walk = (nodes: FolderTreeVo[]) => {
      nodes.forEach((n) => {
        m.set(n.id, n.folderName);
        if (n.children) walk(n.children);
      });
    };
    walk(folderTree);
    return m;
  }, [folderTree]);

  // ---------- 选中目录变化：重置到第 1 页并加载文件 ----------
  // 说明：pageSize 变化由 handlePageChange 触发加载，此处不监听，避免重复请求
  useEffect(() => {
    setPage(1);
    loadPage(selectedFolderId, 1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId, loadPage]);

  // ---------- folderTree / selectedFolderId 变化：刷新面包屑 + 展开到该目录 ----------
  useEffect(() => {
    setBreadcrumb(buildBreadcrumb(folderTree, selectedFolderId));
    if (selectedFolderId) {
      const pathIds: string[] = [];
      const walk = (nodes: FolderTreeVo[], trail: string[]): boolean => {
        for (const n of nodes) {
          if (n.id === selectedFolderId) {
            pathIds.push(...trail);
            return true;
          }
          if (n.children && walk(n.children, [...trail, n.id])) return true;
        }
        return false;
      };
      walk(folderTree, []);
      if (pathIds.length) {
        setExpandedKeys((prev) => {
          const s = new Set(prev);
          pathIds.forEach((id) => s.add(id));
          return Array.from(s);
        });
      }
    }
  }, [selectedFolderId, folderTree, buildBreadcrumb]);

  // ---------- 选择文件夹（FolderTree & Breadcrumb 共同回调） ----------
  const handleSelectFolder = useCallback((id: string | null, name: string) => {
    setSelectedFolderId(id);
    setSelectedFolderName(name);
  }, []);

  // ---------- 上传完成刷新 ----------
  const handleUploadComplete = useCallback(() => {
    refreshFileList();
  }, [refreshFileList]);

  // ---------- 局部更新某个文件（用于重试后单条状态实时刷新，避免整列表重拉闪烁） ----------
  const updateFileById = useCallback(
    (id: string, patch: Partial<FileDetailVo>) => {
      setFileList((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      );
    },
    [],
  );

  return (
    <div className="knowledge-com">
      {/* 左侧：树形目录 */}
      <FolderTree
        folderTree={folderTree}
        selectedFolderId={selectedFolderId}
        expandedKeys={expandedKeys}
        loading={treeReq.loading}
        folderNameMap={folderNameMap}
        onSelectFolder={handleSelectFolder}
        onExpandedKeysChange={setExpandedKeys}
        onRefreshTree={refreshFolderTree}
      />

      {/* 右侧：面包屑 + 上传 + 文件列表 */}
      <div className="knowledge-right">
        <div className="right-header">
          <Breadcrumb items={breadcrumb} onSelect={handleSelectFolder} />
        </div>

        <UploadFile
          selectedFolderId={selectedFolderId}
          selectedFolderName={selectedFolderName}
          onUploadComplete={handleUploadComplete}
        />

        <FileTable
          fileList={fileList}
          loading={filesReq.loading}
          onRefresh={refreshFileList}
          onUpdateFile={updateFileById}
          pagination={{ current: page, pageSize, total }}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default KnowledgeCom;
