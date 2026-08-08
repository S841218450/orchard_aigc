"use client";

import "./invite.scss";
import { Card, Button, Tag, Spin, Empty, Avatar, App } from "antd";
import {
  Gift,
  Copy,
  Users,
  Wallet,
  PartyPopper,
  UserCheck2,
} from "lucide-react";
import { useRequest } from "ahooks";
import { getInviteInfo, getInviteRecords } from "@/actions/userCenter";
import type { InviteInfo, InviteRecord } from "@/actions/userCenter";
import { formatDate } from "@/utils/timeUtils";
import UserCenterBackground from "@/components/userCenter/pageBackground/pageBackground";

const InvitePage = () => {
  const { message } = App.useApp();
  const { data: inviteInfoRes, loading: infoLoading } = useRequest(getInviteInfo);
  const { data: recordsRes, loading: recordsLoading } = useRequest(
    getInviteRecords,
  );

  const inviteInfo: InviteInfo | null =
    inviteInfoRes && inviteInfoRes.success ? inviteInfoRes.data : null;
  const records: InviteRecord[] =
    recordsRes && recordsRes.success ? recordsRes.data : [];

  const loading = infoLoading || recordsLoading;

  const handleCopy = async () => {
    if (!inviteInfo) return;
    const text = `${inviteInfo.inviteLink}（邀请码：${inviteInfo.inviteCode}）`;
    try {
      await navigator.clipboard.writeText(text);
      message.success("邀请链接已复制");
    } catch {
      message.error("复制失败，请手动复制");
    }
  };

  return (
    <div className="invite-page">
      <UserCenterBackground tone="cyan" />
      <div className="invite-header">
        <div className="header-left">
          <h1>
            <Gift size={24} />
            邀请记录
          </h1>
          <span className="header-desc">邀请好友加入，双方均可获得奖励</span>
        </div>
      </div>

      <div className="invite-content">
        {loading ? (
          <div className="loading-state">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* 邀请统计 */}
            <div className="stats-grid">
              <Card className="stat-card">
                <div className="stat-icon">
                  <Users size={20} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{inviteInfo?.totalInvited ?? 0}</div>
                  <div className="stat-label">累计邀请（人）</div>
                </div>
                <span className="stat-deco stat-deco-1" aria-hidden="true" />
              </Card>
              <Card className="stat-card">
                <div className="stat-icon stat-icon--reward">
                  <Wallet size={20} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">
                    {inviteInfo?.totalReward ?? 0}
                  </div>
                  <div className="stat-label">累计奖励（积分）</div>
                </div>
                <span className="stat-deco stat-deco-2" aria-hidden="true" />
              </Card>
            </div>

            {/* 邀请链接 */}
            {inviteInfo && (
              <Card className="invite-link-card">
                <div className="link-card-deco" aria-hidden="true">
                  <span className="link-deco-gift">
                    <PartyPopper size={110} strokeWidth={0.8} />
                  </span>
                  <span className="link-deco-ring" />
                </div>
                <div className="link-head">
                  <div className="link-title">
                    <span className="link-title-icon">
                      <Gift size={18} />
                    </span>
                    我的专属邀请链接
                  </div>
                  <Tag color="gold" className="link-code">
                    邀请码 {inviteInfo.inviteCode}
                  </Tag>
                </div>
                <div className="link-row">
                  <div className="link-box">
                    <span className="link-value">{inviteInfo.inviteLink}</span>
                  </div>
                  <Button
                    type="primary"
                    icon={<Copy size={16} />}
                    onClick={handleCopy}
                  >
                    复制链接
                  </Button>
                </div>
                <div className="link-tip">
                  <UserCheck2 size={14} />
                  好友通过你的链接注册并完成首次创作，你与好友各得 100 积分
                </div>
              </Card>
            )}

            {/* 邀请记录列表 */}
            <div className="records-section">
              <div className="section-head">
                <h2 className="section-title">邀请记录</h2>
                <span className="section-sub">
                  共 {records.length} 位好友
                </span>
              </div>
              {records.length === 0 ? (
                <Empty description="暂无邀请记录" />
              ) : (
                <Card className="records-card">
                  {records.map((record) => (
                    <div key={record.id} className="record-item">
                      <Avatar
                        size={40}
                        src={record.inviteeAvatar || undefined}
                        icon={<Gift size={18} />}
                      />
                      <div className="record-info">
                        <div className="record-name">{record.inviteeName}</div>
                        <div className="record-time">
                          {formatDate(record.createTime, "Auto")}
                        </div>
                      </div>
                      <div className="record-reward">+{record.reward} 积分</div>
                      <Tag
                        color={record.status === "success" ? "success" : "warning"}
                      >
                        {record.status === "success" ? "已生效" : "待完成"}
                      </Tag>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
