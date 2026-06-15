import { type CSSProperties, type ReactNode } from "react";
import { View } from "react-native";

export type SectionProps = {
  title: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  extra?: ReactNode;
  first?: boolean;
  size?: "sm" | "md";
  style?: CSSProperties;
};

// The forms / detail panes that use Section are web-only; native is a stub.
export default function Section(_props: SectionProps) {
  return <View />;
}
