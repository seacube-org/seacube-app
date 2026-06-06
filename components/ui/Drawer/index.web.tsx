import { Drawer as AntDrawer, type DrawerProps } from "antd";

export type { DrawerProps };

// antd v6 deprecated the `width` prop; map it onto the wrapper style instead.
export default function Drawer({ width = 520, styles, ...props }: DrawerProps) {
  const merged: DrawerProps["styles"] =
    typeof styles === "function" ? styles : { ...styles, wrapper: { width, ...styles?.wrapper } };
  return <AntDrawer styles={merged} {...props} />;
}
