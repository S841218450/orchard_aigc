import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

export const formatDate = (
  dateTemplate: Date | string | number,
  type: string = "Auto",
) => {
  if (!dateTemplate) return "";
  let dateNum = Number(dateTemplate);
  if (isNaN(dateNum)) return "";
  if (dateNum.toString().length === 10) {
    dateNum = dateNum * 1000;
  }

  if (type === "Auto") {
    const now = dayjs();
    const targetDate = dayjs(dateNum);
    const diffMs = now.diff(targetDate);
    const absDiffMs = Math.abs(diffMs);
    const diffSeconds = Math.floor(absDiffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs === 0) {
      return "刚刚";
    }
    if (diffMs < 0) {
      return targetDate.format("HH:mm");
    }

    if (diffSeconds < 60) {
      return "刚刚";
    }

    if (diffMinutes < 10) {
      return `${diffMinutes}分钟前`;
    }

    // 仅同一天才显示时分，跨天（即使 24 小时内）也要带上日期
    if (now.isSame(targetDate, "day")) {
      return targetDate.format("HH:mm");
    }

    if (diffDays < 365) {
      return targetDate.format("MM-DD HH:mm");
    }

    return targetDate.format("YYYY-MM-DD HH:mm");
  }

  const dateMap: Record<string, string> = {
    ALL: "YYYY/MM/DD HH:mm:ss",
    YMD: "YYYY/MM/DD",
    MD: "MM/DD",
    MDM: "MM/DD HH:mm",
    MDS: "MM/DD HH:mm:ss",
    HMS: "HH:mm:ss",
    HM: "HH:mm",
  };
  return dayjs(dateNum).format(dateMap[type] || "YYYY/MM/DD");
};
