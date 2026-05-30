export function useToast() {
  return {
    success: (_content: string) => {},
    error: (_content: string) => {},
    warning: (_content: string) => {},
    info: (_content: string) => {},
  };
}
