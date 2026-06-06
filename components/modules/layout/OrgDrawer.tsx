import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Divider, Drawer, Skeleton, Tag, Typography } from "antd";
import { BankOutlined, CheckOutlined, PlusOutlined } from "@ant-design/icons";
import { colors } from "@/constants/theme";
import { useDataService } from "@/hooks/core/useDataService";
import i18n from "@/locale/i18n";
import type { Membership } from "@/stores/authStore";
import { InfoRow } from "./InfoRow";
import type { Organization } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  memberships: Membership[];
  activeOrgId: number | null;
  onSwitch: (id: number) => void;
  onCreateOrg: () => void;
};

export function OrgDrawer({ open, onClose, memberships, activeOrgId, onSwitch, onCreateOrg }: Props) {
  const { getViewSet, endpoints } = useDataService();
  const orgViewSet = useMemo(() => getViewSet(endpoints.organizations), [getViewSet, endpoints]);
  const [detail, setDetail] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch the active org's full detail when the drawer opens — skip if already loaded for it.
  useEffect(() => {
    if (!open || activeOrgId == null || detail?.id === activeOrgId) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const data = (await orgViewSet.retrieve({ id: activeOrgId })) as Organization;
        if (active) setDetail(data);
      } catch {
        if (active) setDetail(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, activeOrgId, orgViewSet, detail?.id]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      styles={{
        wrapper: { width: 340 },
        // Divider lives in the header (its bottom border); header + body transparent.
        header: { borderBottom: `1px solid ${colors.border}`, background: "transparent" },
        body: { background: "transparent" },
      }}
      title={i18n.t("org.title", { defaultValue: "机构" })}
    >
      {/* Switcher */}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {i18n.t("org.myOrganizations", { defaultValue: "我的机构" })}
      </Typography.Text>
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        {memberships.map((m) => {
          const isActive = m.organization.id === activeOrgId;
          return (
            <div
              key={m.id}
              onClick={() => !isActive && onSwitch(m.organization.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${isActive ? colors.primary : "#f0f0f0"}`,
                background: "transparent",
                cursor: isActive ? "default" : "pointer",
              }}
            >
              <Avatar
                size={32}
                shape="square"
                style={{ background: colors.primary, color: "#fff", flexShrink: 0 }}
                icon={<BankOutlined />}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text strong style={{ fontSize: 13, display: "block" }}>
                  {m.organization.name}
                </Typography.Text>
                {m.role?.name && <Tag style={{ marginTop: 2 }}>{m.role.name}</Tag>}
              </div>
              {isActive && <CheckOutlined style={{ color: colors.primary }} />}
            </div>
          );
        })}
      </div>

      <Button type="link" icon={<PlusOutlined />} onClick={onCreateOrg} style={{ paddingLeft: 0, marginTop: 8 }}>
        {i18n.t("org.new", { defaultValue: "新建机构" })}
      </Button>

      <Divider style={{ margin: "16px 0" }} />

      {/* Active org detail */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : detail ? (
        <>
          {detail.legal_name && (
            <InfoRow label={i18n.t("org.legalName", { defaultValue: "法定名称" })} value={detail.legal_name} />
          )}
          <InfoRow label={i18n.t("org.taxNumber", { defaultValue: "税号" })} value={detail.tax_number} />
          <InfoRow label={i18n.t("org.contactEmail", { defaultValue: "联系邮箱" })} value={detail.contact_email} />
          <InfoRow label={i18n.t("org.phone", { defaultValue: "电话" })} value={detail.phone} />
          <InfoRow label={i18n.t("org.website", { defaultValue: "网站" })} value={detail.website} />
          <InfoRow label={i18n.t("org.currency", { defaultValue: "货币" })} value={detail.currency} />
          <InfoRow label={i18n.t("org.timezone", { defaultValue: "时区" })} value={detail.timezone} />
        </>
      ) : null}
    </Drawer>
  );
}
