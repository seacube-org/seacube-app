import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="zh-Hans">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        {/* Tailwind preflight is disabled, so clear the browser's default body margin. */}
        <style dangerouslySetInnerHTML={{ __html: 'body { margin: 0; }' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
