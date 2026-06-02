import { ConfigProvider, App } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import type { ReactNode } from 'react';
import { antdTheme } from '@/constants/theme';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={antdTheme}>
        <App style={{ display: 'flex', height: '100%' }}>{children}</App>
      </ConfigProvider>
    </StyleProvider>
  );
}
