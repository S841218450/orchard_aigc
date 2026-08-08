"use client";

import "./vip.scss";
import { Button, Card, Tag, Empty, Spin } from "antd";
import {
  Crown,
  Check,
  Zap,
  ShieldCheck,
  Headphones,
  Rocket,
  Infinity as InfinityIcon,
} from "lucide-react";
import { useRequest } from "ahooks";
import { getVipInfo, getVipPlans } from "@/actions/userCenter";
import type { VipInfo, VipPlan } from "@/actions/userCenter";
import messageManager from "@/utils/messageManager";
import { formatDate } from "@/utils/timeUtils";
import UserCenterBackground from "@/components/userCenter/pageBackground/pageBackground";

const BENEFIT_ICONS = [Zap, ShieldCheck, Headphones, Rocket];

const VipPage = () => {
  const { data: vipInfoRes, loading: vipLoading } = useRequest(getVipInfo);
  const { data: plansRes, loading: plansLoading } = useRequest(getVipPlans);

  const vipInfo: VipInfo | null =
    vipInfoRes && vipInfoRes.success ? vipInfoRes.data : null;
  const plans: VipPlan[] =
    plansRes && plansRes.success ? plansRes.data : [];

  const loading = vipLoading || plansLoading;

  const handleBuy = (plan: VipPlan) => {
    // 开通流程后续接入支付接口
    messageManager.info(`即将开通「${plan.name}」`);
  };

  return (
    <div className="vip-page">
      <UserCenterBackground tone="gold" />
      <div className="vip-header">
        <div className="header-left">
          <h1>
            <Crown size={24} />
            会员中心
          </h1>
          <span className="header-desc">开通会员，解锁全部 AI 创作能力</span>
        </div>
      </div>

      <div className="vip-content">
        {loading ? (
          <div className="loading-state">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* 会员状态卡片 */}
            <div className={`vip-status-card ${vipInfo?.isVip ? "is-vip" : ""}`}>
              <div className="status-card-deco" aria-hidden="true">
                <span className="deco-crown">
                  <Crown size={120} strokeWidth={0.6} />
                </span>
                <span className="deco-ring" />
              </div>
              <div className="status-left">
                <div className="status-icon">
                  <Crown size={28} />
                </div>
                <div className="status-info">
                  <div className="status-title">
                    {vipInfo?.isVip
                      ? `${vipInfo.levelName} · 尊贵会员`
                      : "尚未开通会员"}
                    {vipInfo?.isVip && <Tag color="gold">VIP</Tag>}
                  </div>
                  <div className="status-desc">
                    {vipInfo?.isVip
                      ? `有效期至 ${
                          vipInfo.expireTime
                            ? formatDate(vipInfo.expireTime, "YMD")
                            : "长期"
                        }`
                      : "开通后享受专属权益与更高生成额度"}
                  </div>
                </div>
              </div>
              <Button type="primary" onClick={() => messageManager.info("权益说明")}>
                查看权益
              </Button>
            </div>

            {/* 套餐列表 */}
            <div className="vip-plans-section">
              <div className="section-head">
                <h2 className="section-title">选择套餐</h2>
                <span className="section-sub">尊享以下全部权益</span>
              </div>
              {plans.length === 0 ? (
                <Empty description="套餐信息筹备中，敬请期待" />
              ) : (
                <div className="plans-grid">
                  {plans.map((plan, index) => {
                    const PlanIcon = BENEFIT_ICONS[index % BENEFIT_ICONS.length];
                    return (
                      <Card
                        key={plan.id}
                        className={`plan-card ${plan.hot ? "plan-card--hot" : ""}`}
                      >
                        <div className="plan-card-shine" aria-hidden="true" />
                        {plan.hot && <div className="hot-tag">最受欢迎</div>}
                        <div className="plan-icon">
                          <PlanIcon size={24} />
                        </div>
                        <h3 className="plan-name">{plan.name}</h3>
                        <div className="plan-price">
                          <span className="price-currency">¥</span>
                          <span className="price-value">{plan.price}</span>
                          {plan.originalPrice > plan.price && (
                            <span className="price-original">
                              ¥{plan.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="plan-duration">
                          {plan.duration === "永久"
                            ? (
                                <>
                                  <InfinityIcon size={13} /> {plan.duration}
                                </>
                              )
                            : plan.duration}
                        </div>
                        <ul className="plan-benefits">
                          {plan.benefits.map((benefit) => (
                            <li key={benefit}>
                              <Check size={14} />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                        <Button
                          type={plan.hot ? "primary" : "default"}
                          block
                          onClick={() => handleBuy(plan)}
                        >
                          立即开通
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VipPage;
