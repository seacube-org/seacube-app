import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Space, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAuthStore, useIsActiveAdmin } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import i18n from "@/locale/i18n";
import BasicTable from "@/components/modules/base/BasicTable";
import TagListCell from "@/components/modules/base/TagListCell";
import { SettingsSection } from "@/components/modules/settings/SettingsSection";
import { rows, ACCESS_PAGINATION, FETCH_ALL } from "@/components/modules/settings/access/shared";
import { ConfirmDeleteButton } from "@/components/modules/settings/access/ConfirmDeleteButton";
import { invalidateProductAttributes } from "@/components/modules/products/shared";
import {
  dataTypeLabel,
  useProductAttributeViewSet,
  type ProductAttribute,
} from "@/components/modules/settings/product-attribute/shared";
import ProductAttributeDrawer from "@/components/modules/settings/product-attribute/ProductAttributeDrawer";

export default function ProductAttributesSettings() {
  const locale = useLocaleStore((s) => s.locale);
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const isAdmin = useIsActiveAdmin();
  const { message } = App.useApp();
  const vs = useProductAttributeViewSet();

  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductAttribute | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setAttributes(rows<ProductAttribute>(await vs.list({ params: FETCH_ALL })));
    } catch {
      message.error(i18n.t("productAttribute.loadFailed", { defaultValue: "加载失败" }));
    } finally {
      setLoading(false);
    }
  }, [message, vs]);

  useEffect(() => {
    reload();
  }, [reload, activeOrgId]);

  // Drop the product form's cached catalog so its picker reflects the change.
  const afterMutation = useCallback(() => {
    invalidateProductAttributes();
    reload();
  }, [reload]);

  const remove = useCallback(
    async (id: number) => {
      try {
        await vs.delete({ id });
        message.success(i18n.t("productAttribute.deleted", { defaultValue: "已删除" }));
        afterMutation();
      } catch {
        message.error(i18n.t("productAttribute.deleteFailed", { defaultValue: "删除失败" }));
      }
    },
    [message, vs, afterMutation],
  );

  const columns = useMemo(
    () => [
      {
        title: i18n.t("productAttribute.name", { defaultValue: "名称" }),
        key: "name",
        width: 220,
        // Single line: the name truncates (tooltip recovers it) and the system
        // tag stays beside it, so a long name can't wrap to three lines.
        render: (_: unknown, r: ProductAttribute) => (
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <Typography.Text strong ellipsis={{ tooltip: r.name }} style={{ minWidth: 0 }}>
              {r.name}
            </Typography.Text>
            {r.is_system && (
              <Tag style={{ flexShrink: 0, marginInlineEnd: 0 }}>
                {i18n.t("productAttribute.system", { defaultValue: "系统" })}
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: i18n.t("productAttribute.code", { defaultValue: "代码" }),
        dataIndex: "code",
        key: "code",
        width: 190,
        // Codes are unbroken identifiers (e.g. gross_weight_per_carton) — ellipsis
        // them on one line instead of breaking mid-word; tooltip shows the full code.
        render: (v: string) => (
          <Typography.Text
            type="secondary"
            ellipsis={{ tooltip: v }}
            style={{ display: "block", fontFamily: "monospace", fontSize: 12 }}
          >
            {v}
          </Typography.Text>
        ),
      },
      {
        title: i18n.t("productAttribute.dataType", { defaultValue: "数据类型" }),
        key: "data_type",
        width: 140,
        render: (_: unknown, r: ProductAttribute) => <Tag>{dataTypeLabel(r.data_type)}</Tag>,
      },
      {
        title: i18n.t("productAttribute.choices", { defaultValue: "可选项" }),
        key: "choices",
        render: (_: unknown, r: ProductAttribute) => <TagListCell items={r.choices ?? []} />,
      },
      {
        title: i18n.t("productAttribute.unit", { defaultValue: "单位/提示" }),
        dataIndex: "unit",
        key: "unit",
        width: 100,
        render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text>,
      },
      ...(isAdmin
        ? [
            {
              title: i18n.t("access.actions", { defaultValue: "操作" }),
              key: "actions",
              width: 150,
              render: (_: unknown, r: ProductAttribute) => (
                <Space size="small">
                  <Button
                    type="link"
                    style={{ padding: 0 }}
                    onClick={() => {
                      setEditing(r);
                      setDrawerOpen(true);
                    }}
                  >
                    {i18n.t("common.edit", { defaultValue: "编辑" })}
                  </Button>
                  {/* System attributes can't be deleted (the backend rejects it too). */}
                  {!r.is_system && (
                    <ConfirmDeleteButton
                      link
                      title={i18n.t("productAttribute.deleteConfirm", {
                        defaultValue: "删除该属性会同时移除其在所有产品上的绑定，确认删除？",
                      })}
                      onConfirm={() => remove(r.id)}
                      label={i18n.t("common.delete", { defaultValue: "删除" })}
                    />
                  )}
                </Space>
              ),
            },
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, isAdmin, remove],
  );

  return (
    <SettingsSection title={i18n.t("settings.productAttributes", { defaultValue: "规格属性" })}>
      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            {i18n.t("productAttribute.new", { defaultValue: "新建规格属性" })}
          </Button>
        </div>
      )}
      <BasicTable
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={attributes}
        pagination={ACCESS_PAGINATION}
      />
      <ProductAttributeDrawer
        open={drawerOpen}
        attribute={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={afterMutation}
      />
    </SettingsSection>
  );
}
