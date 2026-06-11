import { type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Button, Empty, Spin, theme } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useDocumentDetail } from "@/components/modules/sales/shared/useDocumentDetail";
import QuoteFormPage from "@/components/modules/sales/quote/QuoteFormPage";
import { QUOTES_URL, type QuoteDetail } from "@/components/modules/sales/quote/shared";
import i18n from "@/locale/i18n";

/** Full-height centered container for the loading / load-failed states. */
function CenteredFill({ children }: { children: ReactNode }) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: token.colorBgContainer,
      }}
    >
      {children}
    </div>
  );
}

export default function EditQuoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const quoteId = id ? Number(id) : null;
  const router = useRouter();
  const { data, loading } = useDocumentDetail<QuoteDetail>(QUOTES_URL, quoteId);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(sales)/quotes" as Href);
  };

  if (loading) {
    return (
      <CenteredFill>
        <Spin />
      </CenteredFill>
    );
  }

  if (!data) {
    return (
      <CenteredFill>
        <Empty description={i18n.t("sales.loadFailed", { defaultValue: "加载失败" })}>
          <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
            {i18n.t("common.back", { defaultValue: "返回" })}
          </Button>
        </Empty>
      </CenteredFill>
    );
  }

  return <QuoteFormPage quote={data} />;
}
