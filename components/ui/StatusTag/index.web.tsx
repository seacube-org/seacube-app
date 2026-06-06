import { Tag } from "antd";
import type { PresetColorType } from "antd/es/_util/colors";
import i18n from "@/locale/i18n";

type Status = string;
type ColorSpec = { color: PresetColorType | string };

const STATUS_COLORS: Record<string, ColorSpec> = {
  DRAFT: { color: "default" },
  SENT: { color: "blue" },
  ACCEPTED: { color: "success" },
  DECLINED: { color: "error" },
  EXPIRED: { color: "warning" },
  VOIDED: { color: "default" },
  CONFIRMED: { color: "blue" },
  CLOSED: { color: "success" },
  CANCELLED: { color: "error" },
  OPEN: { color: "blue" },
  PARTIALLY_PAID: { color: "warning" },
  PAID: { color: "success" },
  OVERDUE: { color: "error" },
  APPLIED: { color: "success" },
  ISSUED: { color: "blue" },
  RECEIVED: { color: "success" },
  IN_PROGRESS: { color: "processing" },
  COMPLETED: { color: "success" },
  FAILED: { color: "error" },
  NORMAL: { color: "success" },
  PENDING: { color: "default" },
  IN_TRANSIT: { color: "blue" },
  SHIPPED: { color: "blue" },
  DELIVERED: { color: "success" },
};

type Props = { status: Status; style?: React.CSSProperties };

export default function StatusTag({ status, style }: Props) {
  const { color } = STATUS_COLORS[status] ?? { color: "default" };
  const label = i18n.t(`status.${status}`, { defaultValue: status });
  return (
    <Tag color={color} style={style}>
      {label}
    </Tag>
  );
}
