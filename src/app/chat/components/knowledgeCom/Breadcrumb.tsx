"use client";

import { ChevronRight } from "lucide-react";

// ==================== Props 定义 ====================
export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onSelect: (id: string | null, name: string) => void;
}

// ==================== 组件 ====================
const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onSelect }) => {
  if (items.length === 0) return null;

  return (
    <div className="breadcrumb">
      {items.map((item, idx) => (
        <div key={item.id ?? `root-${idx}`} className="breadcrumb-item-wrap">
          <span
            className={`breadcrumb-item ${
              idx === items.length - 1 ? "active" : ""
            }`}
            onClick={() => {
              if (idx !== items.length - 1) {
                onSelect(item.id, item.name);
              }
            }}
          >
            {item.name}
          </span>
          {idx < items.length - 1 && (
            <ChevronRight size={14} className="breadcrumb-sep" />
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
