import { Table } from "antd";
import type { TableProps } from "antd";
import { tableSkinCss } from "./tableSkin";

/**
 * A simple client-side table sharing the list {@link DataTable}'s Bigin/CRM skin
 * (header tint, row height, thin grid borders, hover — see {@link tableSkinCss}).
 * For tables that don't need server fetch / pagination / resize — pass `columns`
 * + `dataSource` like a plain antd Table (used in detail pages, drawers, etc.).
 */
export default function BasicTable<T extends object = Record<string, unknown>>(props: TableProps<T>) {
  return (
    <div className="seacube-basic-table">
      <style>{`
        .seacube-basic-table .ant-table { background: transparent; }
        ${tableSkinCss("seacube-basic-table")}
      `}</style>
      <Table size="small" pagination={false} {...props} />
    </div>
  );
}
