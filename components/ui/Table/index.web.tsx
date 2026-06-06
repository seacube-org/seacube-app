import { Table as AntTable, type TableProps } from "antd";

export type { TableProps };
export type { TableColumnsType as ColumnsType } from "antd";

export default function Table<T extends object>({ size = "middle", ...props }: TableProps<T>) {
  return <AntTable<T> size={size} {...props} />;
}
