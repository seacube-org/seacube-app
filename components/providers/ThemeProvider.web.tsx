import { ConfigProvider, App } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { useEffect, type ReactNode } from "react";
import { antdTheme } from "@/constants/theme";
import { useLocaleStore } from "@/stores/localeStore";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const isZh = locale === "zh-Hans";

  // DatePicker month/weekday names come from dayjs, not the antd locale pack.
  useEffect(() => {
    dayjs.locale(isZh ? "zh-cn" : "en");
  }, [isZh]);

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={antdTheme} locale={isZh ? zhCN : enUS}>
        <App style={{ display: "flex", height: "100%" }}>{children}</App>
      </ConfigProvider>
    </StyleProvider>
  );
}
