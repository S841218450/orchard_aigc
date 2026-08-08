import API from "@/api";

// ==================== 类型定义 ====================

/** 个人信息 */
export interface UserProfile {
  username: string;
  nickname: string;
  avatar?: string;
  phone?: string | null;
  email?: string;
}

/** 会员信息 */
export interface VipInfo {
  level: number;
  levelName: string;
  isVip: boolean;
  expireTime: number | null;
  benefits: string[];
}

/** 会员套餐 */
export interface VipPlan {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  duration: string;
  benefits: string[];
  hot?: boolean;
}

/** 订单类型 */
export type OrderType = "vip" | "recharge";
/** 订单状态 */
export type OrderStatus = "pending" | "paid" | "cancelled";

/** 订单 */
export interface OrderItem {
  id: string;
  orderNo: string;
  title: string;
  type: OrderType;
  amount: number;
  status: OrderStatus;
  createTime: number;
  payTime?: number | null;
}

/** 邀请信息 */
export interface InviteInfo {
  inviteCode: string;
  inviteLink: string;
  totalInvited: number;
  totalReward: number;
}

/** 邀请记录 */
export interface InviteRecord {
  id: string;
  inviteeName: string;
  inviteeAvatar?: string;
  reward: number;
  status: "success" | "pending";
  createTime: number;
}

// ==================== 结果类型 ====================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ==================== 个人信息 ====================

/** 获取个人信息 */
export async function getUserProfile(): Promise<ActionResult<UserProfile>> {
  try {
    const res = await API.getUserDetail();
    return { success: true, data: res.data };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || "获取个人信息失败",
    };
  }
}

/** 更新个人信息 */
export async function updateUserProfile(
  params: Partial<UserProfile>,
): Promise<ActionResult<UserProfile>> {
  try {
    const res = await API.updateUser(params);
    return { success: true, data: res.data };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || "更新个人信息失败",
    };
  }
}

// ==================== 会员中心 ====================

/** 获取会员信息 */
export async function getVipInfo(): Promise<ActionResult<VipInfo>> {
  try {
    const res = await API.getVipInfo();
    return { success: true, data: res.data };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || "获取会员信息失败",
    };
  }
}

/** 获取会员套餐列表 */
export async function getVipPlans(): Promise<ActionResult<VipPlan[]>> {
  try {
    const res = await API.getVipPlans();
    return { success: true, data: res.data || [] };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || "获取会员套餐失败",
    };
  }
}

// ==================== 我的订单 ====================

/** 获取订单列表 */
export async function getOrderList(): Promise<ActionResult<OrderItem[]>> {
  try {
    const res = await API.getOrderList();
    return { success: true, data: res.data || [] };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || "获取订单列表失败",
    };
  }
}

// ==================== 邀请记录 ====================

/** 获取邀请信息 */
export async function getInviteInfo(): Promise<ActionResult<InviteInfo>> {
  try {
    const res = await API.getInviteInfo();
    return { success: true, data: res.data };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || "获取邀请信息失败",
    };
  }
}

/** 获取邀请记录列表 */
export async function getInviteRecords(): Promise<
  ActionResult<InviteRecord[]>
> {
  try {
    const res = await API.getInviteRecords();
    return { success: true, data: res.data || [] };
  } catch (e: any) {
    return {
      success: false,
      error: e?.msg || "获取邀请记录失败",
    };
  }
}
