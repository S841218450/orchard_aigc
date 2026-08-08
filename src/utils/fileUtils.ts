// 文件大小格式化
export const formatFileSize = (bytes: string | number): string => {
  const n = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (!n || isNaN(n)) return "0 B";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  return (n / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

// 文件类型 → Tag 颜色（字典映射，一个颜色对应多种后缀）
export const FILE_TYPE_COLOR_MAP: Record<string, string[]> = {
  magenta: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"],
  volcano: ["mp4", "mov", "avi", "mkv", "webm"],
  orange: ["mp3", "wav", "flac", "aac"],
  purple: ["zip", "rar", "7z", "tar", "gz"],
  blue: ["doc", "docx"],
  red: ["pdf"],
  geekblue: ["txt", "md"],
  green: ["xls", "xlsx", "csv"],
  gold: ["ppt", "pptx"],
};

// 后缀 → color 的反向缓存（构建一次）
export const EXT_COLOR_CACHE: Record<string, string> = Object.keys(
  FILE_TYPE_COLOR_MAP,
).reduce<Record<string, string>>((acc, color) => {
  FILE_TYPE_COLOR_MAP[color].forEach((ext) => {
    acc[ext] = color;
  });
  return acc;
}, {});
