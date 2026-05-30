import { ConfigProvider, App } from 'antd';
import type { ReactNode } from 'react';
import { antdTheme } from '@/constants/theme';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
