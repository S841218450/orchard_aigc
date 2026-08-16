import API from "@/api";
export const getPublicKey = async () => {
  // 拦截器已处理非 200 响应（reject），这里直接返回公钥字符串
  const res = await API.getPublicKey();
  // 兜底：后端若把换行转义成字面量 \n（两个字符），还原成真实换行，否则 jsencrypt 无法解析
  return String(res.data ?? "").replace(/\\n/g, "\n");
};
