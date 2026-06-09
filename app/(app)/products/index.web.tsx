import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Avatar, Button, Tag, Typography, theme } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCan } from "@/stores/authStore";
import i18n from "@/locale/i18n";
import EntityListView from "@/components/modules/views/EntityListView";
import type { ColumnOverride } from "@/hooks/core/useEntityColumns";
import ProductFormDrawer from "@/components/modules/products/ProductFormDrawer";
import { PRODUCTS_URL, initials, taxRatePercent, type ProductRow } from "@/components/modules/products/shared";

export default function ProductsPage() {
  const router = useRouter();
  const canCreate = useCan("inventory_products", "create");
  const { token } = theme.useToken();
  const [formOpen, setFormOpen] = useState(false);

  // Domain cells: square thumbnail name, short unit code tag, percent tax rate,
  // active/inactive tag. Everything else falls back to the schema's by-type renderer.
  const columnOverrides = useMemo<Record<string, ColumnOverride>>(
    () => ({
      name: {
        render: (v) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Avatar
              size={24}
              shape="square"
              style={{ background: token.colorPrimary, flexShrink: 0, fontSize: 11, borderRadius: 6 }}
            >
              {initials(String(v ?? ""))}
            </Avatar>
            <Typography.Text strong ellipsis={{ tooltip: String(v ?? "") }}>
              {String(v ?? "")}
            </Typography.Text>
          </div>
        ),
      },
      base_unit: {
        render: (v) => (v ? <Tag>{String(v)}</Tag> : <Typography.Text type="secondary">—</Typography.Text>),
      },
      default_tax_rate: { render: (v) => taxRatePercent(v as string) },
      is_active: {
        render: (v) =>
          v ? (
            <Tag color="green">{i18n.t("products.active", { defaultValue: "启用" })}</Tag>
          ) : (
            <Tag color="default">{i18n.t("products.inactive", { defaultValue: "已停用" })}</Tag>
          ),
      },
    }),
    [token],
  );

  return (
    <EntityListView
      entity="product"
      endpoint={PRODUCTS_URL}
      moduleKey="inventory_products"
      columnOverrides={columnOverrides}
      searchPlaceholder={i18n.t("products.searchPlaceholder", { defaultValue: "搜索名称、代码或分类" })}
      onRowClick={(r) => router.push(`/(app)/products/${(r as ProductRow).id}` as Href)}
      renderSummary={(total) => (
        <span>
          {i18n.t("products.total", { defaultValue: "产品总数" })} · <b style={{ color: token.colorText }}>{total}</b>
        </span>
      )}
      actions={() =>
        canCreate ? (
          <Button
            icon={<PlusOutlined />}
            onClick={() => setFormOpen(true)}
            style={{
              height: 32,
              border: 0,
              borderRadius: 18,
              paddingInline: 18,
              background: token.colorPrimary,
              color: "#fff",
              fontWeight: 700,
              boxShadow: "none",
            }}
          >
            {i18n.t("products.new", { defaultValue: "新建产品" })}
          </Button>
        ) : null
      }
      extras={({ refetch }) => (
        <ProductFormDrawer open={formOpen} product={null} onClose={() => setFormOpen(false)} onSaved={refetch} />
      )}
    />
  );
}
