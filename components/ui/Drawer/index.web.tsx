import { Drawer as AntDrawer, type DrawerProps } from 'antd';

export type { DrawerProps };

export default function Drawer({ width = 520, ...props }: DrawerProps) {
  return <AntDrawer width={width} {...props} />;
}
