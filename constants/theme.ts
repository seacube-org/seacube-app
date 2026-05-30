export const colors = {
  primary: '#1A73E8',
  surface: '#FFFFFF',
  background: '#F4F5F7',
  border: '#E5E7EB',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    muted: '#9CA3AF',
  },
} as const;

export const antdTheme = {
  token: {
    colorPrimary: colors.primary,
    colorBgBase: colors.surface,
    colorBgLayout: colors.background,
    colorBorder: colors.border,
    colorText: colors.text.primary,
    colorTextSecondary: colors.text.secondary,
    borderRadius: 6,
  },
} as const;
