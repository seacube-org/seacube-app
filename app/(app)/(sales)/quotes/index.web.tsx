import { useMemo } from "react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Button, theme } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCan } from "@/stores/authStore";
import { useRefetchOnRefocus } from "@/hooks/core/useRefetchOnRefocus";
import i18n from "@/locale/i18n";
import EntityListView from "@/components/modules/views/EntityListView";
import type { ColumnOverride } from "@/hooks/core/useEntityColumns";
import StatusTag from "@/components/ui/StatusTag";
import { amount } from "@/components/modules/sales/shared/format";
import { QUOTES_URL, type QuoteRow } from "@/components/modules/sales/quote/shared";

/** Keeps the list fresh when returning from the full-page create/edit forms. */
function RefetchOnRefocus({ refetch }: { refetch: () => void }) {
  useRefetchOnRefocus(refetch);
  return null;
}

export default function QuotesPage() {
  const router = useRouter();
  const canCreate = useCan("sales_quotes", "create");
  const { token } = theme.useToken();

  // Domain cells: a status tag (EXPIRED-aware via display_status) and a
  // right-aligned formatted total. Everything else falls back to the schema's
  // by-type renderer. See useEntityColumns.
  const columnOverrides = useMemo<Record<string, ColumnOverride>>(
    () => ({
      status: {
        render: (v, r) => <StatusTag status={String((r as QuoteRow).display_status ?? v)} />,
      },
      total_amount: { align: "right", render: (v) => amount(v) },
    }),
    [],
  );

  return (
    <EntityListView
      entity="quote"
      endpoint={QUOTES_URL}
      moduleKey="sales_quotes"
      columnOverrides={columnOverrides}
      searchPlaceholder={i18n.t("sales.quoteSearchPlaceholder", { defaultValue: "搜索报价单号或客户" })}
      onRowClick={(r) => router.push(`/(app)/(sales)/quotes/${r.id}` as Href)}
      renderSummary={(total) => (
        <span>
          {i18n.t("sales.quoteTotal", { defaultValue: "报价单总数" })} ·{" "}
          <b style={{ color: token.colorText }}>{total}</b>
        </span>
      )}
      actions={() =>
        canCreate ? (
          <Button
            icon={<PlusOutlined />}
            onClick={() => router.push("/(app)/(sales)/quotes/new" as Href)}
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
            {i18n.t("sales.newQuote", { defaultValue: "新建报价单" })}
          </Button>
        ) : null
      }
      extras={({ refetch }) => <RefetchOnRefocus refetch={refetch} />}
    />
  );
}
