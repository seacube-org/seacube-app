import { App } from "antd";

export function useToast() {
  const { message } = App.useApp();
  return {
    success: (content: string) => {
      void message.success(content);
    },
    error: (content: string) => {
      void message.error(content);
    },
    warning: (content: string) => {
      void message.warning(content);
    },
    info: (content: string) => {
      void message.info(content);
    },
  };
}
