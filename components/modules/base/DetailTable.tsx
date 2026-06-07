import { Table } from "antd";
import type { TableProps } from "antd";
import { tableSkinCss } from "./tableSkin";

/**
 * A simple client-side table sharing the list {@link DataTable}'s Bigin/CRM skin
 * (header tint, row height, thin grid borders, hover — see {@link tableSkinCss}).
 * For detail-page sub-tables that don't need server fetch / pagination / resize —
 * pass `columns` + `dataSource` like a plain antd Table.
 */
export default function DetailTable<T extends object = Record<string, unknown>>(props: TableProps<T>) {
  return (
    <div className="seacube-detail-table">
      <style>{`
        .seacube-detail-table .ant-table { background: transparent; }
        ${tableSkinCss("seacube-detail-table")}
      `}</style>
      <Table size="small" pagination={false} {...props} />
    </div>
  );
}
