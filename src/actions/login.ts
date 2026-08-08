import API from "@/api";
export const getPublicKey = async () => {
  try {
    const res = await API.getPublicKey();
    if (res.success) {
      return res.data;
    } else {
      throw new Error(res.msg || "获取公钥失败");
    }
  } catch (e) {
    return {
      success: false,
      error: "获取公钥失败",
    };
  }
};
