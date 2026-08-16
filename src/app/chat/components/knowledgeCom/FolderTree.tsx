"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Trash2,
  X,
  Folder as FolderIcon,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { App, Input, Spin, Tree, Button } from "antd";
import type { TreeDataNode } from "antd";
import type { FolderTreeVo } from "@/actions/file";
import { createFileFolder, deleteFileFolder } from "@/actions/file";
import messageManager from "@/utils/messageManager";

// ==================== Props 定义 ====================
export interface FolderTreeProps {
  folderTree: FolderTreeVo[];
  selectedFolderId: string | null;
  expandedKeys: string[];
  loading: boolean;
  folderNameMap: Map<string, string>;
  onSelectFolder: (id: string | null, name: string) => void;
  onExpandedKeysChange: (keys: string[]) => void;
  onRefreshTree: () => void;
}

// ==================== 组件 ====================
const FolderTree: React.FC<FolderTreeProps> = ({
  folderTree,
  selectedFolderId,
  expandedKeys,
  loading,
  folderNameMap,
  onSelectFolder,
  onExpandedKeysChange,
  onRefreshTree,
}) => {
  const { modal } = App.useApp();
  const [searchKeyword, setSearchKeyword] = useState("");

  // ---------- 搜索过滤 ----------
  const filterTree = useCallback(
    (nodes: FolderTreeVo[], keyword: string): FolderTreeVo[] => {
      if (!keyword) return nodes;
      const kw = keyword.toLowerCase();
      const result: FolderTreeVo[] = [];
      for (const n of nodes) {
        const children = n.children ? filterTree(n.children, keyword) : [];
        if (n.folderName.toLowerCase().includes(kw) || children.length > 0) {
          result.push({ ...n, children });
        }
      }
      return result;
    },
    [],
  );

  const filteredTree = useMemo(
    () => (searchKeyword ? filterTree(folderTree, searchKeyword) : folderTree),
    [folderTree, searchKeyword, filterTree],
  );

  // 搜索时自动展开所有匹配节点
  useEffect(() => {
    if (searchKeyword) {
      const allIds: string[] = [];
      const walk = (nodes: FolderTreeVo[]) => {
        nodes.forEach((n) => {
          allIds.push(n.id);
          if (n.children) walk(n.children);
        });
      };
      walk(filteredTree);
      onExpandedKeysChange(allIds);
    }
  }, [searchKeyword, filteredTree, onExpandedKeysChange]);

  // ---------- 新建文件夹 ----------
  const handleCreateFolder = useCallback(
    (parentId: string | null) => {
      modal.confirm({
        title: parentId ? "新建子文件夹" : "新建文件夹",
        content: (
          <Input
            id="new-folder-input"
            placeholder="请输入文件夹名称"
            maxLength={50}
          />
        ),
        okText: "确定",
        cancelText: "取消",
        onOk: async () => {
          const input = document.getElementById(
            "new-folder-input",
          ) as HTMLInputElement | null;
          const name = input?.value?.trim();
          if (!name) {
            messageManager.warning("文件夹名称不能为空");
            return Promise.reject();
          }
          const res = await createFileFolder({
            folderName: name,
            parentId: parentId || undefined,
          });
          if (res.success) {
            messageManager.success("创建成功");
            if (parentId) {
              onExpandedKeysChange(
                Array.from(new Set([...expandedKeys, parentId])),
              );
            }
            onRefreshTree();
          } else {
            messageManager.error(res.error);
            return Promise.reject();
          }
        },
      });
    },
    [modal, expandedKeys, onExpandedKeysChange, onRefreshTree],
  );

  // ---------- 删除文件夹 ----------
  const handleDeleteFolder = useCallback(
    (id: string, name: string) => {
      modal.confirm({
        title: "删除文件夹",
        content: `确定要删除文件夹「${name}」吗？此操作不可恢复。`,
        okText: "删除",
        okButtonProps: { danger: true },
        cancelText: "取消",
        onOk: async () => {
          const res = await deleteFileFolder(id);
          if (res.success) {
            messageManager.success("删除成功");
            if (selectedFolderId === id) {
              const firstRoot = folderTree.find((n) => n.id !== id);
              if (firstRoot) {
                onSelectFolder(firstRoot.id, firstRoot.folderName);
              } else {
                onSelectFolder(null, "");
              }
            }
            onRefreshTree();
          } else {
            messageManager.error(res.error);
          }
        },
      });
    },
    [modal, selectedFolderId, folderTree, onSelectFolder, onRefreshTree],
  );

  // ---------- 树形数据转换 ----------
  const treeData = useMemo<TreeDataNode[]>(() => {
    const transform = (nodes: FolderTreeVo[]): TreeDataNode[] =>
      nodes.map((n) => ({
        key: n.id,
        title: (
          <div className="tree-node-title">
            <FolderIcon size={16} className="tree-folder-icon" />
            <span className="tree-node-label" title={n.folderName}>
              {n.folderName}
            </span>
            <span className="fs-12 text-gray">
              {n.docCount > 0 ? n.docCount : ""}
            </span>
            <div
              className="tree-node-actions"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="tree-action-btn"
                title="新建子文件夹"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateFolder(n.id);
                }}
              >
                <Plus size={13} />
              </button>
              <button
                className="tree-action-btn danger"
                title="删除"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(n.id, n.folderName);
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ),
        children: n.children ? transform(n.children) : [],
      }));
    return transform(filteredTree);
  }, [filteredTree, handleCreateFolder, handleDeleteFolder]);

  return (
    <div className="knowledge-left">
      <div className="left-header">
        <Input
          placeholder="搜索文件夹"
          suffix={
            <Button
              onClick={() => setSearchKeyword(searchKeyword)}
              disabled={!searchKeyword}
              type="link"
              size="small"
              title="搜索"
            >
              <Search size={14} />
            </Button>
          }
          maxLength={20}
          allowClear
          className="W100"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
      </div>

      <div className="tree-scroll">
        {loading ? (
          <div className="tree-loading">
            <Spin size="small" />
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="tree-empty">
            {searchKeyword ? "未匹配到文件夹" : "暂无文件夹，点击上方按钮新建"}
          </div>
        ) : (
          <Tree
            className="knowledge-tree"
            blockNode
            treeData={treeData}
            expandedKeys={expandedKeys}
            selectedKeys={selectedFolderId ? [selectedFolderId] : []}
            autoExpandParent={true}
            switcherIcon={({ isLeaf, expanded }) =>
              isLeaf ? null : expanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )
            }
            onExpand={(keys) =>
              onExpandedKeysChange(keys.map((k) => String(k)))
            }
            onSelect={(keys) => {
              const id = keys[0];
              if (id !== undefined) {
                const idStr = String(id);
                onSelectFolder(idStr, folderNameMap.get(idStr) || "");
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FolderTree;
