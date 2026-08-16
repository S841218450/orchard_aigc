"use client";

import { BaseUpload } from "@/components/baseCom/upload/baseUpload";

// ==================== Props 定义 ====================
export interface UploadFileProps {
  selectedFolderId: string | null;
  selectedFolderName: string;
  onUploadComplete: () => void;
}

// ==================== 组件 ====================
// 知识库文件上传：统一复用 BaseUpload（文件模式），批量暂存 + 点击"开始上传"
const UploadFile: React.FC<UploadFileProps> = ({
  selectedFolderId,
  selectedFolderName,
  onUploadComplete,
}) => {
  return (
    <BaseUpload
      type="file"
      hint={`将上传到「${selectedFolderName}」，支持批量上传PDF、Word、Excel文件`}
      extraData={{ folderId: selectedFolderId || "" }}
      onUploadComplete={onUploadComplete}
    />
  );
};

export default UploadFile;
