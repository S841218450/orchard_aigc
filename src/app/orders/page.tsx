"use client";

import "./orders.scss";
import { Card, Table, Tag, Spin, Empty, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ShoppingCart, ReceiptText, RefreshCw, FileCheck2 } from "lucide-react";
import { useRequest } from "ahooks";
import { getOrderList } from "@/actions/userCenter";
import type { OrderItem, OrderStatus, OrderType } from "@/actions/userCenter";
import { formatDate } from "@/utils/timeUtils";
import messageManager from "@/utils/messageManager";
import UserCenterBackground from "@/components/userCenter/pageBackground/pageBackground";

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "待支付", color: "warning" },
  paid: { label: "已完成", color: "success" },
  cancelled: { label: "已取消", color: "default" },
};

const ORDER_TYPE_MAP: Record<OrderType, string> = {
  vip: "会员充值",
  recharge: "余额充值",
};

const OrdersPage = () => {
  const { data, loading, refresh } = useRequest(getOrderList);

  const orders: OrderItem[] = data && data.success ? data.data : [];

  const columns: ColumnsType<OrderItem> = [
    {
      title: "订单编号",
      dataIndex: "orderNo",
      key: "orderNo",
      render: (orderNo: string) => (
        <span className="order-no">{orderNo}</span>
      ),
    },
    {
      title: "订单内容",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: OrderType) => (
        <Tag color="default">{ORDER_TYPE_MAP[type] || type}</Tag>
      ),
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount: number) => (
        <span className="order-amount">¥{amount.toFixed(2)}</span>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: OrderStatus) => (
        <Tag color={ORDER_STATUS_MAP[status]?.color}>
          {ORDER_STATUS_MAP[status]?.label || status}
        </Tag>
      ),
    },
    {
      title: "下单时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 170,
      render: (time: number) => formatDate(time, "ALL"),
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => messageManager.info(`订单 ${record.orderNo} 详情开发中`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="orders-page">
      <UserCenterBackground tone="green" />
      <div className="orders-header">
        <div className="header-left">
          <h1>
            <ShoppingCart size={24} />
            我的订单
          </h1>
          <span className="header-desc">查看你的消费记录与订单状态</span>
        </div>
        <Button icon={<RefreshCw size={16} />} onClick={() => refresh()}>
          刷新
        </Button>
      </div>

      <div className="orders-content">
        <Card className="orders-card">
          <div className="orders-card-glow" aria-hidden="true" />
          <div className="orders-card-head">
            <div className="orders-card-title">
              <span className="title-icon">
                <ReceiptText size={18} />
              </span>
              消费记录
              {!loading && orders.length > 0 && (
                <span className="title-count">{orders.length} 笔</span>
              )}
            </div>
            <span className="orders-card-sub">
              <FileCheck2 size={14} />
              订单数据实时同步
            </span>
          </div>
          {loading ? (
            <div className="loading-state">
              <Spin size="large" />
            </div>
          ) : orders.length === 0 ? (
            <Empty description="暂无订单记录" />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={orders}
              pagination={false}
              scroll={{ x: 760 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default OrdersPage;
